import { getDragonBalance } from "../balance.js";

const balance = getDragonBalance("radioactive");

export const radioactiveDragonProfile = {
  species: "radioactive",
  restRecoveryPerMinute: balance.rest,
  environmentRecovery: { irradiatedMineralCavern: 4, deepCrystalCave: 3 },
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
    walk: 0, run: 1.1, swim: 1.6, fastSwim: 2.6,
    physicalAttack: 2.4, fly: 1.2, glide: 0.8, fastFly: 2.2,
    radiationPulse: 7, energyRay: 9, exposureField: 12, overloadBurst: 15
  },
  diet: ["meat", "small_animals", "minerals"],
  preferredFood: ["beef", "rabbit", "iron_nugget", "redstone"]
};
