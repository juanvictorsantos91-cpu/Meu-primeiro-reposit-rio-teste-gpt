import { getBehaviorProfile } from "../species/behavior-profiles.js";

const mixedGroupSpecies = new Set(["earth", "lava"]);

/**
 * Calcula o estado da organização territorial. A patrulha é distribuída:
 * os membros não precisam caminhar juntos como manada.
 */
export function getSocialGroupPlan(species, nearbySameSpeciesCount = 0, nearbyDragons = []) {
  if (!Number.isInteger(nearbySameSpeciesCount) || nearbySameSpeciesCount < 0) {
    throw new RangeError("A quantidade de dragões próximos deve ser um inteiro não negativo.");
  }
  if (!Array.isArray(nearbyDragons)) {
    throw new TypeError("nearbyDragons precisa ser uma lista.");
  }

  const profile = getBehaviorProfile(species);
  const sameSpeciesCount = nearbySameSpeciesCount;
  const mixedCompanions = mixedGroupSpecies.has(species)
    ? nearbyDragons.filter(dragon =>
        dragon && dragon.species !== species && mixedGroupSpecies.has(dragon.species) &&
        dragon.lifeStage !== "hatchling"
      ).length
    : 0;
  const observedGroupSize = 1 + sameSpeciesCount + mixedCompanions;
  const targetGroupSize = profile.preferredGroupSize ?? 1;

  if (profile.socialPattern === "solitary") {
    return {
      pattern: "solitary", targetGroupSize: 1, observedGroupSize: 1 + sameSpeciesCount,
      mixedCompanions: 0, action: "remain_solo", seekingMembers: false, mixedGroup: false,
      patrolStyle: "individual"
    };
  }

  const enoughMembers = observedGroupSize >= targetGroupSize;
  const action = enoughMembers ? "organize_territory_patrol_group" : "seek_group_members";
  return {
    pattern: "territorial_patrol",
    targetGroupSize,
    observedGroupSize,
    mixedCompanions,
    action,
    seekingMembers: !enoughMembers,
    mixedGroup: mixedCompanions > 0,
    patrolStyle: profile.patrolStyle ?? "distributed_patrol",
    membersStayTogetherAsHerd: false,
    internalPairing: profile.internalPairing === true
  };
}
