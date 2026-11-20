import { getBehaviorProfile } from "../species/behavior-profiles.js";

const habitatTags = {
  electric: ["mountain", "cold", "high_altitude", "windswept_plateau"],
  water: ["water", "river", "ocean", "waterfall", "mangrove"],
  ice: ["snow", "ice", "glacier", "cold", "snowy_plains", "frozen_peaks", "frozen_ocean"],
  fire: ["hot", "volcanic", "lava", "desert", "savanna", "badlands"],
  earth: ["forest", "plains", "jungle", "lush", "wooded_hills"],
  lava: ["volcanic", "lava", "basalt_deltas", "hot_cave"],
  wind: ["wind", "high_altitude", "open_plains", "coast", "savanna"],
  poison: ["swamp", "mangrove", "jungle", "dark_forest", "dense_forest"],
  sound: ["valley", "rocky_canyon", "forest", "cliffs", "cave"],
  plasma: ["storm_exposed", "open_plateau", "windswept_coast", "high_altitude"],
  acid: ["acidic_cavern", "humid_cave", "swamp", "dense_forest"],
  sand: ["desert", "badlands", "warm_sand", "dry_dunes"],
  light: ["sunlit_area", "open_plains", "flower_forest", "clear_daylight"],
  radioactive: ["irradiated_mineral_cavern", "deep_crystal_cave", "underground"],
  shadow: ["deep_darkness", "shaded_cave", "dark_forest", "night"]
};

const hazardKeys = ["lavaNearby", "fireNearby", "hostileMobsNearby", "unstableGround", "deepWater", "fallRisk"];

export function assessEnvironment(species, environment = {}) {
  const profile = getBehaviorProfile(species);
  const tags = new Set([
    ...(Array.isArray(environment.tags) ? environment.tags : []),
    ...(typeof environment.biome === "string" ? [environment.biome] : []),
    ...(typeof environment.terrain === "string" ? [environment.terrain] : []),
    ...(typeof environment.environment === "string" ? [environment.environment] : [])
  ]);
  const preferredTags = habitatTags[species] ?? profile.preferredEnvironment;
  const matchingTags = preferredTags.filter(tag => tags.has(tag));
  const habitatMatch = matchingTags.length > 0;
  const hazards = hazardKeys.filter(key => environment[key] === true);
  const immediateHazard = environment.immediateHazard === true ||
    (environment.lavaNearby === true && species !== "lava" && species !== "fire") ||
    environment.fallRisk === true;
  const resources = {
    water: environment.waterNearby === true || tags.has("water") || tags.has("river") || tags.has("ocean"),
    shelter: environment.caveNearby === true || environment.shelterNearby === true || tags.has("cave"),
    vegetation: environment.vegetationNearby === true || tags.has("forest") || tags.has("lush"),
    heat: environment.heatSourceNearby === true || tags.has("hot") || tags.has("lava") || tags.has("volcanic"),
    cold: environment.coldSourceNearby === true || tags.has("cold") || tags.has("snow") || tags.has("ice"),
    prey: environment.preyNearby === true
  };
  const safetyScore = Math.max(0, 100 - hazards.length * 18 - (immediateHazard ? 45 : 0));
  let recommendation = "explore_environment";
  if (immediateHazard) recommendation = "move_away_from_environmental_hazard";
  else if (safetyScore < 55) recommendation = "seek_safer_area";
  else if (habitatMatch) recommendation = "use_preferred_habitat";
  else recommendation = "explore_for_preferred_habitat";

  return {
    habitatMatch, matchingTags, preferredTags, hazards, immediateHazard,
    safetyScore, resources, recommendation,
    suitableForRest: safetyScore >= 70 && (resources.shelter || habitatMatch),
    suitableForNest: safetyScore >= 80 && (resources.shelter || resources.vegetation)
  };
}

export function scoreEnvironmentCandidate(species, candidate = {}) {
  const assessment = assessEnvironment(species, candidate);
  let score = assessment.safetyScore * 0.45;
  if (assessment.habitatMatch) score += 25;
  if (assessment.resources.shelter) score += 10;
  if (assessment.resources.water && species === "water") score += 10;
  if (assessment.resources.heat && species === "lava") score += 10;
  if (assessment.resources.cold && species === "ice") score += 10;
  if (assessment.immediateHazard) score = 0;
  return Math.min(100, Math.round(score));
}
