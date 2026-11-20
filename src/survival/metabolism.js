import { recoverEnergy, spendEnergy, canSpendEnergy } from "./energy.js";
import { reduceHunger, feedHunger } from "./hunger.js";
import { damageHealth, recoverHealth } from "./health.js";
import { progressInjury } from "./injuries.js";

export function tickMetabolism(state, profile, context = {}) {
  const minutes = context.minutes ?? 1;
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new RangeError("minutes deve ser maior que zero.");
  }

  const next = { ...state };
  const activity = context.activity ?? "idle";
  next.activityBlocked = false;
  const activityCost = (profile.activityCosts?.[activity] ?? 0) * minutes;
  const emergency = context.emergency === true;
  if (activityCost === 0 || canSpendEnergy(next.energy, activityCost, {
    reserve: profile.emergencyReserve ?? 15,
    emergency
  })) {
    next.energy = spendEnergy(next.energy, activityCost);
  } else if (activityCost > 0) {
    next.activityBlocked = true;
  }

  const hungerRate = profile.hungerPerMinute ?? 0.05;
  next.hunger = reduceHunger(next.hunger, hungerRate * minutes);

  if (context.resting && context.safe && context.stationary) {
    const specialRate = profile.environmentRecovery?.[context.environment] ?? null;
    let recoveryRate = specialRate ?? profile.restRecoveryPerMinute ?? 2;
    if (next.hunger <= 20) {
      recoveryRate *= profile.lowHungerEnergyMultiplier ?? 0.5;
    }
    next.energy = recoverEnergy(next.energy, recoveryRate * minutes);
    next.health = recoverHealth(next.health, (profile.healthRecoveryPerMinute ?? 0.15) * minutes);
    if (next.injury) {
      next.injury = progressInjury(next.injury, (profile.injuryRecoveryPerMinute ?? 1) * minutes);
    }
  }

  if (next.hunger === 0) {
    next.starvationMinutes = (state.starvationMinutes ?? 0) + minutes;
    const grace = profile.starvationGraceMinutes ?? 60;
    if (next.starvationMinutes > grace) {
      const damage = (profile.starvationDamagePerMinute ?? 0.1) *
        (next.starvationMinutes - Math.max(grace, state.starvationMinutes ?? 0));
      next.health = damageHealth(next.health, damage);
    }
  } else {
    next.starvationMinutes = 0;
  }

  return next;
}

export function feedDragon(state, profile, food) {
  if (!food || !Number.isFinite(food.nutrition) || food.nutrition <= 0) {
    throw new RangeError("O alimento precisa ter nutrição positiva.");
  }
  const next = { ...state };
  const nutrition = Math.min(food.nutrition, profile.maxNutritionPerMeal ?? 100);
  next.hunger = feedHunger(next.hunger, nutrition);
  const energyGain = Math.min(
    food.energy ?? 0,
    profile.maxEnergyFromMeal ?? 15
  );
  next.energy = recoverEnergy(next.energy, energyGain);
  next.starvationMinutes = next.hunger > 0 ? 0 : (next.starvationMinutes ?? 0);
  return next;
}
