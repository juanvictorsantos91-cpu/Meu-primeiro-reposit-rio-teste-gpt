import { tickMetabolism } from "../src/survival/metabolism.js";
import { decideSurvivalAction } from "../src/ai/survival-decisions.js";
import { electricDragonProfile } from "../src/species/profiles/electric.js";

let dragon = {
  energy: 72,
  hunger: 48,
  health: 100,
  injury: null,
  starvationMinutes: 0
};

console.log("Simulação inicial — Dragão Elétrico");
for (let minute = 1; minute <= 5; minute += 1) {
  dragon = tickMetabolism(dragon, electricDragonProfile, {
    minutes: 1,
    activity: minute <= 2 ? "fastFly" : "idle",
    resting: minute >= 3,
    safe: true,
    stationary: true,
    environment: "night"
  });
  const decision = decideSurvivalAction({ ...dragon, immediateDanger: false });
  console.log(`Minuto ${minute}:`, dragon, "Ação:", decision.action);
}
