import { getDragonBalance } from "../balance.js";

const balance = getDragonBalance("water");

export const waterDragonProfile = {
  species: "water",
  restRecoveryPerMinute: balance.rest,
  environmentRecovery: { water: 4 },
  hungerPerMinute: balance.hunger,
  starvationGraceMinutes: 60,
  starvationDamagePerMinute: 0.1,
  lowHungerEnergyMultiplier: 0.5,
  emergencyReserve: 15,
  maxNutritionPerMeal: 100,
  maxEnergyFromMeal: 15,
  healthRecoveryPerMinute: 0.15,
  injuryRecoveryPerMinute: 1,
  activityCosts: { walk: 0, run: 1, swim: 0.5, fastSwim: 1, physicalAttack: 2, fly: 0.8, fastFly: 1.8, waterJet: 6, whirlpool: 12, quickDive: 4 },
  diet: ["fish", "aquatic_animals"],
  preferredFood: ["salmon", "cod", "tropical_fish"]
};
