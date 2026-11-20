import { getDragonBalance } from "../balance.js";

const balance = getDragonBalance("light");

export const lightDragonProfile = {
  species: "light",
  restRecoveryPerMinute: balance.rest,
  environmentRecovery: { clearDaylight: 4, openSunlitArea: 3 },
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
    walk: 0, run: 1, swim: 1.5, fastSwim: 2.5,
    physicalAttack: 2, fly: 1.1, glide: 0.7, fastFly: 2,
    flashBurst: 5, focusedLightBeam: 8, flareDash: 9, blindingPulse: 7
  },
  diet: ["fish", "small_animals", "insects"],
  preferredFood: ["salmon", "rabbit", "chicken"]
};
