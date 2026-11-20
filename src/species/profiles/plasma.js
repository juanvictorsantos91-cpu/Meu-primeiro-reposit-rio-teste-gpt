import { getDragonBalance } from "../balance.js";

const balance = getDragonBalance("plasma");

export const plasmaDragonProfile = {
  species: "plasma",
  restRecoveryPerMinute: balance.rest,
  environmentRecovery: { highAltitudeStorm: 4, exposedMineralCavern: 3 },
  hungerPerMinute: balance.hunger,
  starvationGraceMinutes: 60,
  starvationDamagePerMinute: 0.1,
  lowHungerEnergyMultiplier: 0.5,
  emergencyReserve: 18,
  maxNutritionPerMeal: 100,
  maxEnergyFromMeal: 15,
  healthRecoveryPerMinute: 0.15,
  injuryRecoveryPerMinute: 1,
  activityCosts: {
    walk: 0, run: 0.8, swim: 1.5, fastSwim: 2.5,
    physicalAttack: 2, fly: 0.9, glide: 0.6, fastFly: 1.7,
    plasmaBreath: 10, plasmaDischarge: 12,
    ionizedProjectile: 6, overload: 16, plasmaArc: 14,
    stealthMovement: 0.3, concealment: 1
  },
  diet: ["meat", "small_animals"],
  preferredFood: ["rabbit", "chicken", "salmon"]
};
