import { getDragonBalance } from "../balance.js";

const balance = getDragonBalance("sand");

export const sandDragonProfile = {
  species: "sand",
  restRecoveryPerMinute: balance.rest,
  environmentRecovery: { desert: 4, warmSand: 3 },
  hungerPerMinute: balance.hunger,
  starvationGraceMinutes: 60,
  starvationDamagePerMinute: 0.1,
  lowHungerEnergyMultiplier: 0.5,
  emergencyReserve: 15,
  maxNutritionPerMeal: 100,
  maxEnergyFromMeal: 15,
  healthRecoveryPerMinute: 0.15,
  injuryRecoveryPerMinute: 1,
  activityCosts: {
    walk: 0, run: 1.1, dig: 2, burrow: 3,
    swim: 2, fastSwim: 3, physicalAttack: 2.2,
    fly: 1.3, glide: 0.8, fastFly: 2.3,
    sandBlast: 5, sandstorm: 11, undergroundAmbush: 8
  },
  diet: ["meat", "small_animals", "desert_animals"],
  preferredFood: ["rabbit", "chicken", "mutton"]
};
