import { getBehaviorProfile } from "../species/behavior-profiles.js";

export function distance3D(a, b) {
  if (!a || !b) return Infinity;
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Avalia uma tentativa de surgimento natural do Dragão de Plasma.
 * Os valores são parâmetros experimentais; o adaptador deve chamar esta
 * função somente no intervalo configurado e criar a entidade se elegível.
 */
export function assessNaturalSpawn(species, context = {}) {
  const profile = getBehaviorProfile(species);
  if (species !== "plasma") {
    return { eligible: false, reason: "no_special_spawn_rule" };
  }

  const rules = profile.spawnConditions;
  if (!rules || rules.weather !== "thunderstorm") {
    return { eligible: false, reason: "spawn_rules_missing" };
  }
  if (context.isThunderstorm !== true) {
    return { eligible: false, reason: "thunderstorm_required" };
  }
  if (context.scanDue !== true) {
    return { eligible: false, reason: "scan_interval_not_reached" };
  }
  if (!Number.isInteger(context.currentTick) || context.currentTick < 0) {
    return { eligible: false, reason: "invalid_world_time" };
  }
  const candidate = context.candidateLocation;
  if (!candidate || ![candidate.x, candidate.y, candidate.z].every(Number.isFinite)) {
    return { eligible: false, reason: "invalid_candidate_location" };
  }
  if (Number.isInteger(context.lastSpawnTick) &&
      context.currentTick - context.lastSpawnTick < rules.cooldownTicks) {
    return { eligible: false, reason: "global_spawn_cooldown" };
  }
  if (context.lastSpawnLocation &&
      distance3D(context.candidateLocation, context.lastSpawnLocation) < rules.minimumDistanceFromPreviousSpawn) {
    return { eligible: false, reason: "too_close_to_previous_spawn" };
  }
  const existing = Array.isArray(context.existingPlasmaLocations)
    ? context.existingPlasmaLocations : [];
  if (existing.some(location =>
    distance3D(context.candidateLocation, location) < rules.minimumDistanceFromExisting
  )) {
    return { eligible: false, reason: "another_plasma_too_close" };
  }
  const roll = context.spawnRoll;
  if (!Number.isInteger(roll) || roll < 0 || roll >= rules.chanceDenominator) {
    return { eligible: false, reason: "invalid_spawn_roll" };
  }
  if (roll !== 0) {
    return { eligible: false, reason: "rare_chance_not_met" };
  }
  return {
    eligible: true,
    reason: "rare_thunderstorm_spawn",
    cooldownTicks: rules.cooldownTicks,
    minimumDistance: rules.minimumDistanceFromPreviousSpawn
  };
}
