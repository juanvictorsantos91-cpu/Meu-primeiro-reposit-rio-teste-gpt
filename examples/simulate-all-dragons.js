import { tickMetabolism } from "../src/survival/metabolism.js";
import { decideSurvivalAction } from "../src/ai/survival-decisions.js";
import { speciesProfiles } from "../src/species/profiles/index.js";

const environments = {
  electric: "thunderstorm",
  water: "water",
  ice: "frozen",
  fire: "hot",
  earth: "underground",
  lava: "volcanic",
  wind: "wind",
  sound: "quiet_cave",
  poison: "swamp",
  plasma: "high_altitude_storm",
  acid: "acidicCavern",
  sand: "desert",
  light: "clearDaylight",
  radioactive: "deepCrystalCave",
  shadow: "night"
};

for (const [species, profile] of Object.entries(speciesProfiles)) {
  let dragon = { energy: 35, hunger: 55, health: 90, injury: null, starvationMinutes: 0 };
  dragon = tickMetabolism(dragon, profile, {
    minutes: 2,
    activity: "idle",
    resting: true,
    safe: true,
    stationary: true,
    environment: environments[species]
  });
  const decision = decideSurvivalAction({ ...dragon, immediateDanger: false });
  console.log(species, {
    energy: dragon.energy,
    hunger: dragon.hunger,
    health: dragon.health,
    action: decision.action
  });
}
