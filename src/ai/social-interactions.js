import { getBehaviorProfile } from "../species/behavior-profiles.js";

const peacefulPairs = {
  "earth|lava": ["tolerate_earth_migration", "cooperate_in_excavation", "share_shelter_when_safe", "observe_without_hostility"],
  "ice|water": ["play_near_water", "explore_under_ice"],
  "fire|lava": ["share_warm_ground", "display_strength"],
  "earth|water": ["share_water_source", "coexist_near_river"],
  "electric|earth": ["patrol_mountain_together", "inspect_mineral_caves"],
  "electric|fire": ["display_elemental_power", "keep_respectful_distance"],
  "electric|lava": ["observe_volcanic_storms", "patrol_high_ground"],
  "electric|ice": ["observe_storm", "patrol_mountain_together"],
  "electric|water": ["signal_during_storm", "keep_safe_distance_near_water"],
  "fire|earth": ["practice_strength_display", "share_sunlit_resting_area"],
  "ice|earth": ["explore_cool_caves", "share_sheltered_nest_area"],
  "ice|fire": ["exchange_warning_displays", "respect_temperature_boundaries"],
  "ice|lava": ["observe_steam_from_safe_distance", "avoid_thermal_clash"],
  "lava|water": ["create_steam_signal", "observe_from_safe_distance"]
};

function pairKey(a, b) {
  return [a, b].sort().join("|");
}

/** Interações pacíficas são tolerâncias e oportunidades, não comandos de grupo. */
export function assessSocialInteractions(self, nearbyDragons = [], context = {}) {
  if (!self || typeof self !== "object" || !Array.isArray(nearbyDragons)) {
    throw new TypeError("Estado próprio e dragões próximos são necessários.");
  }
  const profile = getBehaviorProfile(self.species);
  const others = nearbyDragons.filter(other => other && other.id !== self.id);
  const differentSpecies = others.filter(other => other.species !== self.species);
  const peaceful = differentSpecies.map(other => ({
    targetId: other.id ?? null,
    species: other.species,
    options: peacefulPairs[pairKey(self.species, other.species)] ?? ["observe_without_hostility"],
    kind: "peaceful"
  }));

  const migratingEarth = differentSpecies.filter(other =>
    other.species === "earth" && other.temporaryTerritoryMigrationDue === true
  );
  const earthMigrationPassage = self.species === "lava" && migratingEarth.length > 0;
  let action = null, targetId = null, kind = null;
  if (context.attackedByDragon === true) {
    action = self.health <= 40 || self.energy <= 25
      ? "retreat_from_dragon_attack" : "defend_against_dragon";
    kind = "aggressive_defense";
    targetId = context.attackerId ?? null;
  } else if ((context.territoryConflict === true || (migratingEarth.length > 0 && self.species !== "lava")) && !earthMigrationPassage) {
    action = profile.aggression >= 0.6 && self.health > 40 && self.energy > 30
      ? "challenge_intruding_dragon" : "observe_intruder_from_safety";
    kind = action === "challenge_intruding_dragon" ? "territorial_aggression" : "territorial_caution";
    targetId = context.conflictingDragonId ?? migratingEarth[0]?.id ?? null;
  } else if (earthMigrationPassage) {
    action = "tolerate_earth_migration_passage";
    kind = "peaceful_passage";
    targetId = differentSpecies.find(other => other.species === "earth" && other.temporaryTerritoryMigrationDue === true)?.id ?? null;
  } else if (context.socialOpportunity === true && peaceful.length > 0 && profile.sociability >= 0.3) {
    action = "perform_peaceful_cross_species_interaction";
    kind = "peaceful";
    targetId = peaceful[0].targetId;
  }

  return {
    nearbyDifferentSpeciesCount: differentSpecies.length,
    peacefulInteractions: peaceful,
    action, kind, targetId,
    mixedEarthLavaGroup: false,
    migrationRoles: null,
    toleratesEarthMigration: earthMigrationPassage,
    migratingEarthIntruderCount: earthMigrationPassage ? 0 : migratingEarth.length
  };
}
