import { getDragonBalance } from "../balance.js";

const balance = getDragonBalance("earth");

export const earthDragonProfile = {
  species: "earth",
  restRecoveryPerMinute: balance.rest,
  environmentRecovery: { underground: 4 },
  hungerPerMinute: balance.hunger,
  starvationGraceMinutes: 60,
  starvationDamagePerMinute: 0.1,
  lowHungerEnergyMultiplier: 0.5,
  emergencyReserve: 15,
  maxNutritionPerMeal: 100,
  maxEnergyFromMeal: 15,
  healthRecoveryPerMinute: 0.15,
  injuryRecoveryPerMinute: 1,
  activityCosts: { walk: 0, run: 1.5, swim: 1.8, fastSwim: 2.8, physicalAttack: 3, fly: 1.5, dig: 0.1, thermalFracture: 12, deepDig: 15, rockArmor: 10, rockPillars: 12 },
  diet: ["land_animals", "minerals"],
  preferredFood: ["beef", "mutton", "iron_nugget", "copper_ingot"]
};
