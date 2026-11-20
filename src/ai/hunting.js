import { getSpeciesDiet } from "../species/diets/species-diets.js";

const foodValues = {
  salmon: 15, cod: 15, tropical_fish: 12, rabbit: 12, chicken: 10,
  beef: 25, porkchop: 20, mutton: 20, cooked_beef: 25,
  small_animal: 8, aquatic_animal: 16, magma_cream: 12,
  spider: 8, cave_spider: 10, bee: 7
};

const HUNTING_STYLES = Object.freeze({
  electric: "fast_solo_pursuit",
  water: "aquatic_group_hunt",
  ice: "patient_pair_pursuit",
  fire: "direct_powerful_pursuit",
  earth: "ground_tracking_and_foraging",
  lava: "territory_based_ambush",
  wind: "aerial_opportunistic_dive",
  sound: "echo_tracking",
  poison: "stealth_and_venom_ambush",
  plasma: "concealed_stalk_and_short_burst",
  acid: "corrosive_ambush",
  sand: "subterranean_ambush",
  light: "precise_open_sky_pursuit",
  radioactive: "patient_energy_burst",
  shadow: "nocturnal_shadow_stalk"
});

function matchesDiet(species, prey) {
  const diet = getSpeciesDiet(species);
  const foodId = prey.foodId ?? prey.type;
  return diet.preferred.includes(foodId) ||
    diet.foods.includes(prey.dietCategory) ||
    diet.foods.includes(foodId);
}

function safePrey(prey) {
  return prey.isTamed !== true && prey.isOwned !== true &&
    prey.isFarmAnimal !== true && prey.protectedByPlayer !== true &&
    prey.isBaby !== true && prey.isWild !== false;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Planeja caça sem executar ataques. O adaptador deve confirmar a presa
 * novamente antes de qualquer ação física.
 */
export function assessHuntingPlan(self, nearbyPrey = [], context = {}) {
  if (!self || typeof self !== "object" || !Array.isArray(nearbyPrey)) {
    throw new TypeError("Estado do dragão e lista de presas são necessários.");
  }
  const hunger = clamp(Number.isFinite(self.hunger) ? self.hunger : 100, 0, 100);
  const energy = clamp(Number.isFinite(self.energy) ? self.energy : 100, 0, 100);
  const health = clamp(Number.isFinite(self.health) ? self.health : 100, 0, 100);
  const style = HUNTING_STYLES[self.species] ?? "opportunistic_pursuit";
  const threatened = context.threatDetected === true ||
    context.immediateDanger === true || context.huntRouteSafe === false;

  const candidates = nearbyPrey
    .filter(prey => prey && prey.id && matchesDiet(self.species, prey) && safePrey(prey))
    .map(prey => {
      const distance = Number.isFinite(prey.distance) ? Math.max(0, prey.distance) : Infinity;
      const risk = clamp(Number(prey.risk ?? 0), 0, 100);
      const nutrition = Number.isFinite(prey.nutrition)
        ? Math.max(0, prey.nutrition)
        : (foodValues[prey.foodId ?? prey.type] ?? 8);
      const groupBonus = context.compatibleHuntersNearby === true && risk < 55 ? 4 : 0;
      const score = nutrition * 2 + groupBonus - distance * 0.7 - risk * 1.2;
      return { prey, distance, risk, nutrition, score };
    })
    .filter(item => item.distance <= (context.huntRange ?? 32) && item.risk < 80)
    .sort((a, b) => b.score - a.score);

  const selected = candidates[0] ?? null;
  const canHunt = energy > 12 && health > 20 && !threatened;
  const cooperative = context.compatibleHuntersNearby === true &&
    energy > 35 && health > 50 && selected !== null && selected.risk < 55;
  let action = "continue_normal_behavior";
  if (threatened && hunger <= 70) action = "abandon_hunt_for_safety";
  else if (!canHunt && hunger <= 70) action = "search_food_safely";
  else if (hunger <= 20) action = selected ? "hunt_urgent_prey" : "search_food_safely";
  else if (hunger <= 50) action = selected ? "hunt_selected_prey" : "search_food_safely";
  else if (hunger <= 70 && selected) action = "consider_hunting_prey";

  if (selected && cooperative && hunger <= 65 && canHunt) action = "coordinate_cooperative_hunt";

  const strategy = style === "poison_ambush" || style === "stealth_and_venom_ambush"
    ? "ambush"
    : style === "echo_tracking" ? "track_then_approach"
    : style === "aquatic_group_hunt" ? "coordinate_near_water"
    : style === "ground_tracking_and_foraging" ? "track_ground_prey"
    : style === "aerial_opportunistic_dive" ? "dive_when_exposed"
    : "pursue";

  return {
    action,
    style,
    strategy,
    selectedPreyId: selected?.prey.id ?? null,
    distance: selected?.distance ?? null,
    estimatedNutrition: selected?.nutrition ?? 0,
    risk: selected?.risk ?? null,
    candidateCount: candidates.length,
    cooperative,
    shouldHunt: Boolean(selected && hunger <= 70 && canHunt),
    abandonForSafety: threatened,
    protectedPreyExcluded: true
  };
}

export function getHuntingStyle(species) {
  return HUNTING_STYLES[species] ?? "opportunistic_pursuit";
}
