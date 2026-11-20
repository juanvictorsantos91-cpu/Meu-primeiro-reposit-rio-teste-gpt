/**
 * Personalidade, tendências sociais e comportamentais experimentais por espécie.
 * Valores de 0 a 1 representam tendências, não probabilidades aleatórias.
 */
export const behaviorProfiles = {
  electric: {
    temperament: "alert_territorial",
    aggression: 0.55, caution: 0.7, curiosity: 0.85, protectiveness: 0.75,
    sociability: 0.45, independence: 0.8,
    socialPattern: "solitary", preferredGroupSize: 1, groupRange: "individual",
    migrationPattern: "long_cycle", migrationInterval: "long",
    preferredActivities: ["scan_high_ground", "patrol_territory", "explore"],
    preferredEnvironment: ["mountain", "cold", "high_altitude", "windswept_plateau"],
    threatResponse: "charge_warning", electricCombat: true
  },
  water: {
    temperament: "cautious_guardian",
    aggression: 0.35, caution: 0.9, curiosity: 0.65, protectiveness: 0.8,
    sociability: 0.6, independence: 0.65,
    socialPattern: "territorial_groups", preferredGroupSize: 3, groupRange: "small",
    patrolStyle: "distributed_patrol", internalPairing: false,
    migrationPattern: "local_roaming",
    preferredActivities: ["swim_patrol", "dive_explore", "rest_near_water"],
    preferredEnvironment: ["water", "river", "ocean", "waterfall", "mangrove"],
    threatResponse: "retreat_to_water", waterCombat: true
  },
  ice: {
    temperament: "reserved_defensive",
    aggression: 0.45, caution: 0.85, curiosity: 0.4, protectiveness: 0.7,
    sociability: 0.35, independence: 0.85,
    socialPattern: "territorial_groups", preferredGroupSize: 2, groupRange: "pair",
    patrolStyle: "distributed_patrol", internalPairing: true,
    migrationPattern: "local_roaming",
    preferredActivities: ["observe_quietly", "patrol_snow", "rest_in_cold"],
    preferredEnvironment: ["snow", "ice", "glacier", "cold", "snowy_plains", "frozen_peaks", "frozen_ocean"],
    threatResponse: "frost_warning", iceCombat: true
  },
  fire: {
    temperament: "dominant_aggressive",
    aggression: 0.9, caution: 0.3, curiosity: 0.55, protectiveness: 0.65,
    sociability: 0.3, independence: 0.75,
    socialPattern: "territorial_groups", preferredGroupSize: 2, groupRange: "pair",
    patrolStyle: "distributed_patrol", internalPairing: true,
    migrationPattern: "local_roaming",
    preferredActivities: ["patrol_territory", "display_strength", "sun_warm"],
    preferredEnvironment: ["hot", "volcanic", "lava", "desert", "savanna", "badlands"],
    threatResponse: "roar_and_stand_ground", fireCombat: true
  },
  earth: {
    temperament: "calm_protector",
    aggression: 0.3, caution: 0.75, curiosity: 0.7, protectiveness: 0.95,
    sociability: 0.7, independence: 0.55,
    socialPattern: "territorial_groups", preferredGroupSize: 6, groupRange: "large",
    patrolStyle: "distributed_patrol", internalPairing: false,
    migrationPattern: "long_cycle_nomadic",
    territoryMode: "temporary", territoryCycleDays: 21,
    preferredActivities: ["dig_explore", "establish_temporary_territory", "tend_nest", "rest_underground", "travel_with_lava_group"],
    preferredEnvironment: ["forest", "plains", "jungle", "lush", "wooded_hills"],
    threatResponse: "guard_and_block"
  },
  lava: {
    temperament: "confident_territorial",
    aggression: 0.7, caution: 0.45, curiosity: 0.5, protectiveness: 0.65,
    sociability: 0.25, independence: 0.9,
    socialPattern: "territorial_groups", preferredGroupSize: 6, groupRange: "large",
    patrolStyle: "distributed_patrol", internalPairing: false,
    migrationPattern: "local_roaming",
    preferredActivities: ["patrol_hot_ground", "absorb_heat", "volcanic_roam"],
    preferredEnvironment: ["volcanic", "lava", "basalt_deltas", "hot_cave"],
    threatResponse: "heat_warning", lavaCombat: true
  }
  ,
  wind: {
    temperament: "independent_explorer",
    aggression: 0.35, caution: 0.65, curiosity: 0.95, protectiveness: 0.55,
    sociability: 0.55, independence: 0.85,
    socialPattern: "territorial_groups", preferredGroupSize: 6, groupRange: "large",
    patrolStyle: "distributed_patrol", internalPairing: false,
    migrationPattern: "local_roaming",
    preferredActivities: ["glide_with_wind", "scan_open_sky", "explore_high_altitude"],
    preferredEnvironment: ["wind", "open_plains", "coast", "savanna", "high_altitude"],
    threatResponse: "evade_with_wind", windCombat: true
  },
  poison: {
    temperament: "cautious_ambush_predator",
    aggression: 0.55, caution: 0.9, curiosity: 0.45, protectiveness: 0.45,
    sociability: 0.2, independence: 0.95,
    socialPattern: "solitary", preferredGroupSize: 1, groupRange: "individual",
    migrationPattern: "local_roaming",
    preferredActivities: ["hide_in_shadows", "stalk_prey", "ambush_from_cover", "avoid_bright_open_ground"],
    preferredEnvironment: ["swamp", "mangrove", "jungle", "dark_forest", "dense_forest"],
    threatResponse: "retreat_to_cover",
    poisonCombat: true, poisonCamouflage: true,
    bodyPlan: "long_serpentine_winged_two_legged",
    locomotionSupport: "two_legs"
  },
  plasma: {
    temperament: "elusive_stealth_predator",
    aggression: 0.35, caution: 0.98, curiosity: 0.55, protectiveness: 0.35,
    sociability: 0.2, independence: 0.98,
    socialPattern: "solitary", preferredGroupSize: 1, groupRange: "individual",
    migrationPattern: "nomadic_roaming",
    preferredActivities: ["remain_concealed", "observe_from_cover", "reposition_silently", "seek_shelter_between_storms"],
    preferredEnvironment: ["storm_exposed", "open_plateau", "windswept_coast", "high_altitude"],
    spawnConditions: { weather: "thunderstorm", cooldownTicks: 120000, minimumDistanceFromPreviousSpawn: 1500, minimumDistanceFromExisting: 1200, chanceDenominator: 100, scanIntervalTicks: 6000 },
    threatResponse: "evade_and_conceal",
    plasmaCombat: true, plasmaStealth: true,
    spawnRarity: "extremely_rare",
    nestRequired: false,
    bodyPlan: "standard_medium_four_legged_two_winged",
    locomotionSupport: "four_legs_and_two_wings",
    visualSignature: "dark_scales_blue_violet_white_plasma_fissures",
    luminosityControl: "dim_when_hidden_brighten_during_overload"
  },
  sound: {
    temperament: "observant_cautious",
    aggression: 0.45, caution: 0.85, curiosity: 0.9, protectiveness: 0.65,
    sociability: 0.6, independence: 0.7,
    socialPattern: "territorial_groups", preferredGroupSize: 3, groupRange: "small",
    patrolStyle: "distributed_patrol", internalPairing: false,
    migrationPattern: "local_roaming",
    preferredActivities: ["map_environment_with_echoes", "track_vibrations", "signal_group_with_echoes", "patrol_rocky_valley"],
    preferredEnvironment: ["valley", "rocky_canyon", "forest", "cliffs", "cave"],
    threatResponse: "disorient_and_reposition",
    soundSensing: true, soundCombat: true,
    bodyPlan: "standard_four_legged_two_winged",
    locomotionSupport: "four_legs_and_two_wings"
  },
  acid: {
    temperament: "patient_corrosive_hunter",
    aggression: 0.62, caution: 0.72, curiosity: 0.55, protectiveness: 0.5,
    sociability: 0.25, independence: 0.9,
    socialPattern: "solitary", preferredGroupSize: 1, groupRange: "individual",
    migrationPattern: "local_roaming",
    preferredActivities: ["stalk_prey", "corrode_obstacles", "create_temporary_acid_pool", "retreat_to_cover"],
    preferredEnvironment: ["acidic_cavern", "humid_cave", "swamp", "dense_forest"],
    threatResponse: "corrosive_warning",
    acidCombat: true, materialCorrosion: true,
    corrosionTargetPolicy: "hostile_entities_and_selected_soft_blocks_only"
  },
  sand: {
    temperament: "territorial_ambush_hunter",
    aggression: 0.58, caution: 0.72, curiosity: 0.65, protectiveness: 0.55,
    sociability: 0.5, independence: 0.7,
    socialPattern: "territorial_groups", preferredGroupSize: 4, groupRange: "small",
    patrolStyle: "distributed_patrol", internalPairing: false,
    migrationPattern: "seasonal_roaming",
    preferredActivities: ["burrow_under_sand", "track_vibrations", "ambush_from_below", "raise_sand_screen"],
    preferredEnvironment: ["desert", "badlands", "warm_sand", "dry_dunes"],
    threatResponse: "burrow_and_ambush",
    sandCombat: true, undergroundAmbush: true
  },
  light: {
    temperament: "alert_benevolent_sentinel",
    aggression: 0.25, caution: 0.72, curiosity: 0.8, protectiveness: 0.85,
    sociability: 0.7, independence: 0.55,
    socialPattern: "territorial_groups", preferredGroupSize: 4, groupRange: "small",
    patrolStyle: "distributed_patrol", internalPairing: false,
    migrationPattern: "local_roaming",
    preferredActivities: ["sunbathe", "scan_open_area", "illuminate_dark_passage", "dazzle_threat"],
    preferredEnvironment: ["sunlit_area", "open_plains", "flower_forest", "clear_daylight"],
    threatResponse: "dazzle_and_withdraw",
    lightCombat: true, restorativeDaylight: true,
    protectiveAura: false
  },
  radioactive: {
    temperament: "solitary_energy_guardian",
    aggression: 0.52, caution: 0.88, curiosity: 0.45, protectiveness: 0.6,
    sociability: 0.18, independence: 0.96,
    socialPattern: "solitary", preferredGroupSize: 1, groupRange: "individual",
    migrationPattern: "rare_long_roaming",
    preferredActivities: ["absorb_mineral_energy", "monitor_exposure_field", "withdraw_when_overloaded"],
    preferredEnvironment: ["irradiated_mineral_cavern", "deep_crystal_cave", "underground"],
    threatResponse: "release_warning_pulse",
    radioactiveCombat: true, cumulativeExposure: true,
    exposureAffectsEnvironment: true
  },
  shadow: {
    temperament: "elusive_nocturnal_stalker",
    aggression: 0.48, caution: 0.96, curiosity: 0.7, protectiveness: 0.4,
    sociability: 0.15, independence: 0.98,
    socialPattern: "solitary", preferredGroupSize: 1, groupRange: "individual",
    migrationPattern: "nocturnal_roaming",
    preferredActivities: ["hide_in_darkness", "move_between_shadows", "stalk_from_cover", "rest_in_deep_darkness"],
    preferredEnvironment: ["deep_darkness", "shaded_cave", "dark_forest", "night"],
    threatResponse: "vanish_into_shadow",
    shadowCombat: true, shadowCloak: true, shortShadowDisplacement: true
  }
};

export function getBehaviorProfile(species) {
  const profile = behaviorProfiles[species];
  if (!profile) throw new RangeError(`Personalidade não cadastrada: ${species}`);
  return profile;
}
