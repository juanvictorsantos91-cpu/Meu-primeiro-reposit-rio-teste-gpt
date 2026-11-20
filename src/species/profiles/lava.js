import { getDragonBalance } from "../balance.js";

const balance = getDragonBalance("lava");

export const lavaDragonProfile = {
  species: "lava",
  restRecoveryPerMinute: balance.rest,
  environmentRecovery: { volcanic: 6 },
  hungerPerMinute: balance.hunger,
  starvationGraceMinutes: 60,
  starvationDamagePerMinute: 0.1,
  lowHungerEnergyMultiplier: 0.5,
  emergencyReserve: 15,
  maxNutritionPerMeal: 100,
  maxEnergyFromMeal: 15,
  healthRecoveryPerMinute: 0.15,
  injuryRecoveryPerMinute: 1,
  activityCosts: { walk: 0, run: 1.3, swim: 1.5, fastSwim: 2.5, physicalAttack: 3, fly: 1.3, fastFly: 2.3, magmaWave: 10, volcanicEruption: 20, obsidianArmor: 12, burningTrail: 8, magmaDivePerMinute: 2 },
  diet: ["meat", "special_food"],
  preferredFood: ["beef", "cooked_beef", "magma_cream"]
};
