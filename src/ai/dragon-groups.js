/**
 * Identidade e composição de grupos de dragões.
 * O módulo não inventa vínculos: membros só entram quando o ciclo de grupos
 * ou uma integração externa informa explicitamente a associação.
 */
const VALID_STATUSES = new Set(["active", "disbanded"]);
const VALID_SPECIES = new Set(["fire","water","electric","ice","earth","lava","wind","sound","poison","plasma","acid","sand","light","radioactive","shadow"]);

function text(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} precisa ser um texto não vazio.`);
  return value.trim();
}
function tick(value) {
  if (!Number.isInteger(value) || value < 0) throw new RangeError("tick precisa ser inteiro não negativo.");
  return value;
}
function uniqueMembers(members) {
  if (!Array.isArray(members) || members.length === 0) throw new TypeError("O grupo precisa ter pelo menos um membro.");
  const result = [...new Set(members.map(id => text(id, "memberId")))];
  if (result.length !== members.length) throw new Error("O grupo não pode conter membros duplicados.");
  return result;
}

export function createDragonGroup({ id, species, memberIds, leaderId = null, homeTerritoryId = null, createdTick }) {
  const groupId = text(id, "id");
  const kind = text(species, "species");
  if (!VALID_SPECIES.has(kind)) throw new RangeError(`Espécie sem registro: ${kind}`);
  const members = uniqueMembers(memberIds);
  const leader = leaderId == null ? members[0] : text(leaderId, "leaderId");
  if (!members.includes(leader)) throw new Error("O líder precisa fazer parte do grupo.");
  tick(createdTick);
  return {
    id: groupId, species: kind, memberIds: members, leaderId: leader,
    homeTerritoryId: homeTerritoryId == null ? null : text(homeTerritoryId, "homeTerritoryId"),
    status: "active", createdTick, updatedTick: createdTick, revision: 1,
    history: [{ type: "group_created", tick: createdTick, memberIds: [...members], leaderId: leader }]
  };
}

export function updateDragonGroup(group, { addMemberIds = [], removeMemberIds = [], leaderId, homeTerritoryId, tick: at }) {
  if (!group || group.status !== "active" || !Array.isArray(group.memberIds)) throw new TypeError("Grupo ativo inválido.");
  tick(at);
  if (at < group.updatedTick) throw new RangeError("tick não pode retroceder.");
  const additions = addMemberIds.map(id => text(id, "memberId"));
  const removals = new Set(removeMemberIds.map(id => text(id, "memberId")));
  if (additions.some(id => removals.has(id))) throw new Error("Um membro não pode entrar e sair no mesmo evento.");
  const members = group.memberIds.filter(id => !removals.has(id));
  for (const id of additions) if (!members.includes(id)) members.push(id);
  if (members.length === 0) {
    return { ...group, memberIds: [], leaderId: null, status: "disbanded", updatedTick: at,
      revision: group.revision + 1, history: [...group.history, { type: "group_disbanded", tick: at }] };
  }
  const nextLeader = leaderId === undefined
    ? (members.includes(group.leaderId) ? group.leaderId : members[0])
    : text(leaderId, "leaderId");
  if (!members.includes(nextLeader)) throw new Error("O líder precisa fazer parte do grupo atualizado.");
  return {
    ...group, memberIds: members, leaderId: nextLeader,
    homeTerritoryId: homeTerritoryId === undefined ? group.homeTerritoryId :
      (homeTerritoryId == null ? null : text(homeTerritoryId, "homeTerritoryId")),
    updatedTick: at, revision: group.revision + 1,
    history: [...group.history, { type: "group_membership_updated", tick: at,
      added: additions.filter(id => !group.memberIds.includes(id)),
      removed: group.memberIds.filter(id => removals.has(id)), leaderId: nextLeader }]
  };
}

export class InMemoryDragonGroupRepository {
  #groups = new Map();
  get(id) { const value = this.#groups.get(id); return value ? structuredClone(value) : null; }
  save(group) {
    if (!group || typeof group.id !== "string" || !VALID_STATUSES.has(group.status) || !Array.isArray(group.memberIds))
      throw new TypeError("Registro de grupo inválido.");
    const current = this.#groups.get(group.id);
    if (current && group.revision < current.revision) throw new Error("Não é possível sobrescrever uma revisão mais recente.");
    this.#groups.set(group.id, structuredClone(group));
    return this.get(group.id);
  }
  list({ status } = {}) {
    return [...this.#groups.values()].filter(group => status === undefined || group.status === status).map(group => structuredClone(group));
  }
}
