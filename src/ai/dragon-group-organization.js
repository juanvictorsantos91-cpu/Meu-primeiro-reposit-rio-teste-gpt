import { createDragonGroup, updateDragonGroup } from "./dragon-groups.js";
import { getBehaviorProfile } from "../species/behavior-profiles.js";

const LARGE_GROUP_SPECIES = new Set(["earth", "lava"]);
const VALID_SPECIES = new Set(["fire", "water", "electric", "ice", "earth", "lava", "wind", "sound", "poison", "plasma", "acid", "sand", "light", "radioactive", "shadow"]);

function compatible(species, other) {
  return species === other || (LARGE_GROUP_SPECIES.has(species) && LARGE_GROUP_SPECIES.has(other));
}

function leaderScore(dragon) {
  const value = (key) => Number.isFinite(dragon[key]) ? Math.max(0, Math.min(1, dragon[key])) : 0;
  return value("leadership") * 0.35
    + value("experience") * 0.2
    + value("healthRatio") * 0.15
    + value("energyRatio") * 0.1
    + value("protectiveness") * 0.15
    + value("aggression") * 0.05;
}

export function selectDragonGroupLeader(dragons) {
  if (!Array.isArray(dragons) || dragons.length === 0) throw new TypeError("Informe os dragões candidatos à liderança.");
  for (const dragon of dragons) {
    if (!dragon || typeof dragon.id !== "string" || !dragon.id.trim()) throw new TypeError("Todo candidato precisa de ID.");
  }
  return [...dragons].sort((a, b) => leaderScore(b) - leaderScore(a) || a.id.localeCompare(b.id))[0].id;
}

function normalizePairBonds(pairBonds, memberIds, species) {
  if (pairBonds == null) return [];
  if (!Array.isArray(pairBonds)) throw new TypeError("pairBonds precisa ser uma lista.");
  if (!getBehaviorProfile(species).internalPairing && pairBonds.length) {
    throw new Error("Esta espécie não usa pares internos como estrutura social.");
  }
  const members = new Set(memberIds);
  const used = new Set();
  return pairBonds.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2 || pair[0] === pair[1]) throw new Error("Cada vínculo precisa conter exatamente dois indivíduos distintos.");
    const [a, b] = pair;
    if (!members.has(a) || !members.has(b)) throw new Error("Os dois indivíduos do par precisam pertencer ao grupo.");
    if (used.has(a) || used.has(b)) throw new Error("Um indivíduo não pode pertencer a dois pares internos.");
    used.add(a); used.add(b);
    return [a, b].sort();
  });
}

/**
 * Só deve ser chamado após o runtime confirmar a formação do grupo.
 * A quantidade mínima vem do perfil da espécie; grupos podem crescer acima do alvo.
 */
export function createOrganizedDragonGroup({
  id, species, dragons, createdTick, homeTerritoryId = null, pairBonds = []
}) {
  if (!VALID_SPECIES.has(species)) throw new RangeError("Espécie sem registro.");
  if (!Array.isArray(dragons)) throw new TypeError("dragons precisa ser uma lista.");
  const profile = getBehaviorProfile(species);
  if (profile.socialPattern === "solitary") throw new Error("Espécies solitárias não formam grupos permanentes.");
  if (dragons.length < profile.preferredGroupSize) {
    throw new RangeError(`O grupo precisa de pelo menos ${profile.preferredGroupSize} indivíduos.`);
  }
  const ids = dragons.map(dragon => dragon?.id);
  if (ids.some(id => typeof id !== "string" || !id.trim()) || new Set(ids).size !== ids.length) {
    throw new Error("Todos os membros precisam ter IDs únicos.");
  }
  if (dragons.some(dragon => !compatible(species, dragon.species))) {
    throw new Error("O grupo contém uma espécie incompatível.");
  }
  const leaderId = selectDragonGroupLeader(dragons);
  const group = createDragonGroup({ id, species, memberIds: ids, leaderId, homeTerritoryId, createdTick });
  return {
    ...group,
    socialStructure: profile.internalPairing ? "territorial_group_with_pair_bonds" : "territorial_patrol_group",
    patrolStyle: profile.patrolStyle ?? "distributed_patrol",
    pairBonds: normalizePairBonds(pairBonds, ids, species),
    leader: { id: leaderId, role: "territory_leader", displayMarker: "leader", selection: "highest_leadership_score" }
  };
}

export function updateOrganizedDragonGroup(group, {
  addDragons = [], removeMemberIds = [], remainingDragons = [], tick, pairBonds, homeTerritoryId
}) {
  const profile = getBehaviorProfile(group.species);
  const updated = updateDragonGroup(group, {
    addMemberIds: addDragons.map(dragon => dragon.id),
    removeMemberIds, tick, homeTerritoryId
  });
  if (updated.status === "disbanded") {
    return { ...updated, pairBonds: [], leader: null };
  }
  if (!Array.isArray(remainingDragons) ||
      remainingDragons.length !== updated.memberIds.length ||
      remainingDragons.some(dragon => !updated.memberIds.includes(dragon.id)) ||
      updated.memberIds.some(id => !remainingDragons.some(dragon => dragon.id === id))) {
    throw new Error("remainingDragons precisa conter os dados de todos os membros ativos após a atualização.");
  }
  const leaderId = updated.memberIds.includes(group.leaderId)
    ? group.leaderId
    : selectDragonGroupLeader(remainingDragons);
  const candidatePairs = pairBonds ?? (group.pairBonds ?? []);
  const nextPairs = normalizePairBonds(candidatePairs, updated.memberIds, group.species);
  return {
    ...updated,
    leaderId,
    pairBonds: nextPairs,
    leader: { id: leaderId, role: "territory_leader", displayMarker: "leader", selection: "highest_leadership_score" },
    socialStructure: profile.internalPairing ? "territorial_group_with_pair_bonds" : "territorial_patrol_group",
    patrolStyle: profile.patrolStyle ?? "distributed_patrol"
  };
}

/**
 * Divide membros em patrulhas dispersas por setores reais fornecidos pelo mundo.
 * Não calcula coordenadas nem inventa setores. Pares internos de Fogo/Gelo patrulham juntos.
 */
export function createTerritoryPatrolPlan(group, sectorIds) {
  if (!group || group.status !== "active" || !Array.isArray(group.memberIds) || !group.memberIds.length) {
    throw new TypeError("É necessário um grupo ativo.");
  }
  if (!Array.isArray(sectorIds) || !sectorIds.length || sectorIds.some(id => typeof id !== "string" || !id.trim())) {
    throw new TypeError("Informe pelo menos um identificador real de setor territorial.");
  }
  const sectors = [...new Set(sectorIds)];
  const paired = new Set();
  const units = [];
  for (const pair of group.pairBonds ?? []) {
    if (pair.every(id => group.memberIds.includes(id))) {
      units.push({ memberIds: [...pair], unitType: "bonded_pair" });
      pair.forEach(id => paired.add(id));
    }
  }
  for (const id of group.memberIds) {
    if (!paired.has(id)) units.push({ memberIds: [id], unitType: "individual_patrol" });
  }
  return {
    groupId: group.id,
    territoryId: group.homeTerritoryId,
    formation: "dispersed_patrol",
    membersStayTogetherAsHerd: false,
    leaderId: group.leaderId,
    leaderDuty: "coordinate_and_oversee_patrol_sectors",
    assignments: units.map((unit, index) => ({
      ...unit,
      sectorId: sectors[index % sectors.length],
      leaderSupervision: group.leaderId
    }))
  };
}
