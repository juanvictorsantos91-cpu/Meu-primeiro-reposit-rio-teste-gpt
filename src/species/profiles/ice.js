import { getDragonBalance } from "../balance.js";

const balance = getDragonBalance("ice");

export const iceDragonProfile = {
  species: "ice",
  restRecoveryPerMinute: balance.rest,
  environmentRecovery: { frozen: 5 },
  hungerPerMinute: balance.hunger,
  starvationGraceMinutes: 60,
  starvationDamagePerMinute: 0.1,
  lowHungerEnergyMultiplier: 0.5,
  emergencyReserve: 15,
  maxNutritionPerMeal: 100,
  maxEnergyFromMeal: 15,
  healthRecoveryPerMinute: 0.15,
  injuryRecoveryPerMinute: 1,
  activityCosts: { walk: 0, run: 1.1, swim: 1, fastSwim: 1.8, physicalAttack: 2, fly: 1, fastFly: 1.8, frostBreath: 7, iceProjectile: 4, frozenArmor: 10, icePrison: 13 },
  diet: ["fish", "cold_biome_animals"],
  preferredFood: ["salmon", "cod", "rabbit"]
};
