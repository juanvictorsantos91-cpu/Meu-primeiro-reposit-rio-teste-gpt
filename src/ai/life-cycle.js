import { isEligiblePair } from "./dragon-relationships.js";

export const MINECRAFT_DAY_TICKS = 24_000;
export const LIFE_STAGE_TICKS = Object.freeze({
  egg: 3 * MINECRAFT_DAY_TICKS,
  hatchling: 3 * MINECRAFT_DAY_TICKS,
  juvenile: 7 * MINECRAFT_DAY_TICKS
});
export const ELDER_AFTER_TICKS = 180 * MINECRAFT_DAY_TICKS;

export function getLifeStage(ageTicks = 0, isEgg = false) {
  if (!Number.isFinite(ageTicks) || ageTicks < 0) {
    throw new RangeError("ageTicks deve ser um número não negativo.");
  }
  if (isEgg) return "egg";
  if (ageTicks < LIFE_STAGE_TICKS.hatchling) return "hatchling";
  if (ageTicks < LIFE_STAGE_TICKS.hatchling + LIFE_STAGE_TICKS.juvenile) return "juvenile";
  return "adult";
}

export function assessLifeCycle(dragon, nearbyDragons = [], context = {}) {
  if (!dragon || typeof dragon !== "object" || !Array.isArray(nearbyDragons)) {
    throw new TypeError("Estado do dragão e lista de indivíduos próximos são necessários.");
  }
  const ageTicks = Number.isFinite(dragon.ageTicks) ? dragon.ageTicks : null;
  const lifeStage = dragon.isEgg === true ? "egg"
    : dragon.lifeStage ?? (ageTicks === null ? "unknown" : getLifeStage(ageTicks));
  const elder = lifeStage === "adult" && ageTicks !== null && ageTicks >= ELDER_AFTER_TICKS;
  const needs = {
    food: lifeStage === "hatchling" && dragon.hunger < 75,
    warmth: lifeStage === "hatchling" && dragon.needsWarmth === true,
    protection: lifeStage !== "adult" && dragon.threatDetected === true,
    care: lifeStage === "hatchling" && (dragon.hunger < 75 || dragon.needsWarmth === true || dragon.needsCare === true)
  };
  const parent = nearbyDragons.find(other =>
    other && Array.isArray(dragon.parentIds) && dragon.parentIds.includes(other.id)
  );
  const parentCanCare = Boolean(parent && parent.health > 25 && parent.energy > 15);
  let parentalAction = null;
  if (needs.protection && parentCanCare) parentalAction = "protect_young";
  else if (needs.food && parentCanCare) parentalAction = "feed_young";
  else if (needs.warmth && parentCanCare) parentalAction = "warm_young";
  else if (needs.care && parentCanCare) parentalAction = "care_for_young";

  const breedingCandidate = { ...dragon, lifeStage };
  const candidate = nearbyDragons.find(other => isEligiblePair(breedingCandidate, other)) ?? null;
  const canAttemptBreeding = lifeStage === "adult" &&
    dragon.reproductionCooldownTicks <= 0 &&
    (dragon.reproductionRequiresNest === false || dragon.nestReady === true) &&
    dragon.energy > 45 && dragon.health > 60 &&
    candidate !== null &&
    context.environmentSafe === true;
  const eggReadyToHatch = dragon.isEgg === true &&
    dragon.incubationProgress >= 100 &&
    context.incubationConditionsValid === true;
  return {
    lifeStage,
    elder,
    ageTicks,
    growthProgress: ageTicks === null ? null : lifeStage === "hatchling"
      ? Math.min(1, ageTicks / LIFE_STAGE_TICKS.hatchling)
      : lifeStage === "juvenile"
        ? Math.min(1, (ageTicks - LIFE_STAGE_TICKS.hatchling) / LIFE_STAGE_TICKS.juvenile)
        : 1,
    needs,
    parentalAction,
    parentId: parent?.id ?? null,
    canAttemptBreeding,
    mateCandidateId: canAttemptBreeding ? candidate.id : null,
    eggReadyToHatch,
    recommendedAction: eggReadyToHatch ? "hatch_egg"
      : parentalAction ?? (canAttemptBreeding ? "begin_natural_pairing"
        : elder ? "prefer_safe_rest_and_reduced_risk" : "continue_life_stage")
  };
}
