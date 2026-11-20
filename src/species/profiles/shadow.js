import { getDragonBalance } from "../balance.js";

const balance = getDragonBalance("shadow");

export const shadowDragonProfile = {
  species: "shadow",
  restRecoveryPerMinute: balance.rest,
  environmentRecovery: { deepDarkness: 4, shadedCave: 3, night: 2.5 },
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
    walk: 0, run: 0.9, swim: 1.5, fastSwim: 2.5,
    physicalAttack: 2, fly: 1, glide: 0.7, fastFly: 1.9,
    shadowCloak: 6, shadowStep: 8, darknessVeil: 10, umbralStrike: 7
  },
  diet: ["meat", "small_animals", "cave_animals"],
  preferredFood: ["rabbit", "chicken", "spider"]
};
