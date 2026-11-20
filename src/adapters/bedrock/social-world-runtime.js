import { createBedrockTerritoryWorldStorage } from "./territory-dynamic-property-storage.js";
import { createPersistentDragonGroupLifecycle } from "../../ai/persistent-dragon-groups.js";
import { createTerritory } from "../../ai/territory-state.js";
import { getTerritoryRadius } from "../../ai/territory.js";
import { getBehaviorProfile } from "../../species/behavior-profiles.js";
import { writeDragonGroupState, writeDragonGroupMembership, writeDragonGroupLeadership } from "./dragon-group-writer.js";

function hash(value) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index++) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return (result >>> 0).toString(36);
}
function tagValue(entity, prefix) {
  const tag = entity.getTags().find(value => value.startsWith(prefix));
  if (!tag) return null;
  try { return decodeURIComponent(tag.slice(prefix.length)); } catch { return tag.slice(prefix.length); }
}
function replaceTag(entity, prefix, value) {
  for (const tag of entity.getTags()) if (tag.startsWith(prefix)) entity.removeTag(tag);
  if (value != null) entity.addTag(prefix + encodeURIComponent(value));
}
function memberRecord(dragon) {
  return {
    id: dragon.id,
    species: dragon.species,
    leadership: dragon.leadership ?? 0.5,
    experience: dragon.experience ?? 0.2,
    healthRatio: Math.max(0, Math.min(1, (dragon.health ?? 100) / 100)),
    energyRatio: Math.max(0, Math.min(1, (dragon.energy ?? 100) / 100)),
    protectiveness: dragon.protectiveness ?? 0.5,
    aggression: dragon.aggression ?? 0.4,
    partnerId: dragon.partnerId ?? null,
    parentIds: dragon.parentIds ?? []
  };
}

/**
 * Runtime persistente para grupos e territórios. O armazenamento usa
 * propriedades dinâmicas do mundo e preserva territórios, domínios e grupos
 * no mesmo documento versionado.
 */
export function createBedrockSocialWorldRuntime(world) {
  const storage = createBedrockTerritoryWorldStorage({ world, key: "ds:social_world_v1" });
  const lifecycle = createPersistentDragonGroupLifecycle(storage);

  function synchronizeGroup(entity, state, decision) {
    const plan = decision?.groupPlan;
    const oldId = tagValue(entity, "ds:group:");
    if (!plan || plan.pattern === "solitary" || plan.action !== "organize_territory_patrol_group") {
      if (oldId) lifecycle.disband(oldId, Math.max(0, state.currentTick ?? 0));
      writeDragonGroupMembership(entity, null);
      writeDragonGroupLeadership(entity, false);
      return null;
    }
    const companions = (state.nearbyDragons ?? []).filter(other =>
      other && other.id && other.distance <= 32 &&
      (other.species === state.species ||
        (["earth","lava"].includes(other.species) && ["earth","lava"].includes(state.species)))
    );
    const members = [memberRecord(state), ...companions.map(memberRecord)]
      .filter((item, index, all) => all.findIndex(candidate => candidate.id === item.id) === index)
      .sort((a,b) => a.id.localeCompare(b.id));
    if (members.length < plan.targetGroupSize) {
      if (oldId) lifecycle.disband(oldId, Math.max(0, state.currentTick ?? 0));
      writeDragonGroupMembership(entity, null);
      writeDragonGroupLeadership(entity, false);
      return null;
    }
    const ids = members.map(item => item.id);
    const mixed = members.some(item => item.species !== state.species);
    const groupSpecies = mixed ? "earth" : state.species;
    const groupId = (mixed ? "earth-lava:" : state.species + ":") + hash(ids.join("|"));
    if (oldId && oldId !== groupId) lifecycle.disband(oldId, Math.max(0, state.currentTick ?? 0));
    let group = lifecycle.get(groupId);
    if (!group) {
      const pairBonds = [];
      if (getBehaviorProfile(groupSpecies).internalPairing === true) {
        for (const member of members) {
          const partner = companions.find(other => other.id === member.partnerId);
          if (partner && member.id < partner.id) pairBonds.push([member.id, partner.id]);
        }
      }
      group = lifecycle.form({
        id: groupId,
        species: groupSpecies,
        dragons: members,
        createdTick: Math.max(0, state.currentTick ?? 0),
        homeTerritoryId: state.territoryId ?? null,
        pairBonds
      });
    }
    writeDragonGroupState(entity, group);
    return group;
  }

  function ensureTerritory(entity, state) {
    if (!entity || !state || state.isTamed === true || state.isOwned === true || state.species === "plasma") return null;
    if (state.lifeStage && state.lifeStage !== "adult") return null;
    const radius = getTerritoryRadius(state.species);
    if (!Number.isFinite(radius) || radius <= 0) return null;
    const groupId = tagValue(entity, "ds:group:");
    const ownerGroupId = groupId ?? ("individual:" + entity.id);
    const territoryId = "territory:" + ownerGroupId;
    const current = storage.load() ?? {
      schemaVersion: 2, savedTick: Math.max(0, state.currentTick ?? 0),
      territories: [], domains: [], groups: []
    };
    const existing = current.territories.find(item =>
      item.ownerGroupId === ownerGroupId && item.status === "active"
    );
    if (existing) {
      replaceTag(entity, "ds:territory:", existing.id);
      return existing;
    }
    if (groupId && !entity.hasTag("ds:leader")) return null;
    const tick = Math.max(0, state.currentTick ?? 0);
    const temporary = state.species === "earth";
    const territory = createTerritory({
      id: territoryId,
      species: state.species,
      ownerGroupId,
      center: entity.location,
      radius,
      createdTick: tick,
      temporary,
      expiresTick: temporary ? tick + 504000 : null
    });
    storage.save({
      ...current,
      savedTick: Math.max(current.savedTick ?? 0, tick),
      territories: [...current.territories.filter(item => item.id !== territory.id), territory]
    });
    replaceTag(entity, "ds:territory:", territory.id);
    return territory;
  }

  return { storage, lifecycle, synchronizeGroup, ensureTerritory };
}
