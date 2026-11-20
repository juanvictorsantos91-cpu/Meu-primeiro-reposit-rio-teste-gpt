/**
 * Hábitos cotidianos simples. Produz intenções; não executa ações no Bedrock.
 * Necessidades vitais e ameaças devem ser resolvidas antes deste módulo.
 */
function trait(state, profile, name, fallback = 0.5) {
  const value = state.personality?.[name] ?? profile[name] ?? fallback;
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

export function assessNaturalBehavior(state, profile) {
  if (!state || typeof state !== "object" || !profile || typeof profile !== "object") {
    throw new TypeError("Estado e perfil comportamental são necessários.");
  }
  const unsafe = state.threatDetected === true ||
    state.immediateDanger === true ||
    state.environmentAssessment?.immediateHazard === true;
  const criticalNeed = (Number.isFinite(state.health) && state.health <= 30) ||
    (Number.isFinite(state.energy) && state.energy <= 15) ||
    (Number.isFinite(state.hunger) && state.hunger <= 15);
  if (unsafe || criticalNeed) {
    return { eligible: false, action: null, category: null, reason: "survival_or_safety_priority" };
  }

  const safeToRest = state.safeToRest === true;
  const safeToExplore = state.safeToExplore === true && !unsafe;

  if (state.sleepRequested === true && safeToRest) {
    return { eligible: true, action: "sleep_in_safe_shelter", category: "rest", reason: "sleep_cycle" };
  }
  if (state.temperatureCondition === "too_hot" && safeToRest) {
    return { eligible: true, action: "seek_shade_or_cool_area", category: "environment_adaptation", reason: "overheating" };
  }
  if (state.temperatureCondition === "too_cold" && safeToRest) {
    return { eligible: true, action: "seek_warm_shelter", category: "environment_adaptation", reason: "cold_exposure" };
  }
  const stage = state.lifeStage;
  const young = stage === "hatchling" || stage === "juvenile";
  const playfulness = trait(state, profile, "playfulness", young ? 0.65 : 0.3);
  if (young && state.playOpportunity === true && safeToExplore && playfulness >= 0.45 &&
      state.hunger > 20 && state.energy > 25) {
    return { eligible: true, action: "play_and_practice_movement", category: "play", reason: "young_play_instinct" };
  }

  const sociability = trait(state, profile, "sociability", 0.5);
  if (state.socialOpportunity === true && state.knownDragonNearby === true &&
      safeToExplore && sociability >= 0.6) {
    return { eligible: true, action: "approach_known_dragon_peacefully", category: "social", reason: "sociability" };
  }

  const independence = trait(state, profile, "independence", 0.5);
  if (state.soloExplorationOpportunity === true && safeToExplore && independence >= 0.7 &&
      state.hunger > 20 && state.energy > 25) {
    return { eligible: true, action: "explore_independently_nearby", category: "exploration", reason: "independence" };
  }

  const curiosity = trait(state, profile, "curiosity", 0.5);
  if (state.explorationOpportunity === true && safeToExplore && curiosity >= 0.6 &&
      state.hunger > 20 && state.energy > 25) {
    return { eligible: true, action: "investigate_surroundings", category: "exploration", reason: "curiosity" };
  }

  if (state.quietObservationOpportunity === true && safeToExplore) {
    return { eligible: true, action: "observe_surroundings_from_safe_spot", category: "routine", reason: "quiet_observation" };
  }
  return { eligible: false, action: null, category: null, reason: "no_safe_natural_activity" };
}
