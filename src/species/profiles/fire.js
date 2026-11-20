import { getDragonBalance } from "../balance.js";

const balance = getDragonBalance("fire");

export const fireDragonProfile = {
  species: "fire",
  restRecoveryPerMinute: balance.rest,
  environmentRecovery: { hot: 5 },
  hungerPerMinute: balance.hunger,
  starvationGraceMinutes: 60,
  starvationDamagePerMinute: 0.1,
  lowHungerEnergyMultiplier: 0.5,
  emergencyReserve: 15,
  maxNutritionPerMeal: 100,
  maxEnergyFromMeal: 15,
  healthRecoveryPerMinute: 0.15,
  injuryRecoveryPerMinute: 1,
  activityCosts: { walk: 0, run: 1.2, swim: 2, fastSwim: 3, physicalAttack: 2.5, fly: 1.2, fastFly: 2.2, fireBreath: 7, fireProjectile: 5, flameAscension: 12, areaFire: 16 },
  diet: ["meat", "land_animals"],
  preferredFood: ["beef", "porkchop", "mutton"]
};
