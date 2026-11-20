export const speciesDiets = {
  electric: { foods: ["fish", "small_animals"], preferred: ["salmon", "cod"] },
  water: { foods: ["fish", "aquatic_animals"], preferred: ["salmon", "cod", "tropical_fish"] },
  ice: { foods: ["fish", "cold_biome_animals"], preferred: ["salmon", "cod", "rabbit"] },
  fire: { foods: ["meat", "land_animals"], preferred: ["beef", "porkchop", "mutton"] },
  earth: { foods: ["land_animals", "minerals"], preferred: ["beef", "mutton", "iron_nugget", "copper_ingot"] },
  lava: { foods: ["meat", "special_food"], preferred: ["beef", "cooked_beef", "magma_cream"] },
  wind: { foods: ["meat", "small_animals", "fish"], preferred: ["rabbit", "chicken", "salmon"] },
  poison: { foods: ["venomous_mobs", "plants"], preferred: ["spider", "cave_spider", "bee", "spider_eye", "poisonous_potato", "mushroom", "red_mushroom", "brown_mushroom"] },
  sound: { foods: ["small_animals", "fish", "meat"], preferred: ["rabbit", "chicken", "salmon"] },
  plasma: { foods: ["meat", "small_animals"], preferred: ["rabbit", "chicken", "salmon"] },
  acid: { foods: ["meat", "small_animals", "insects"], preferred: ["rabbit", "spider", "cave_spider", "chicken"] },
  sand: { foods: ["meat", "small_animals", "desert_animals"], preferred: ["rabbit", "chicken", "mutton"] },
  light: { foods: ["fish", "small_animals", "insects"], preferred: ["salmon", "rabbit", "chicken"] },
  radioactive: { foods: ["meat", "small_animals", "minerals"], preferred: ["beef", "rabbit", "iron_nugget", "redstone"] },
  shadow: { foods: ["meat", "small_animals", "cave_animals"], preferred: ["rabbit", "chicken", "spider"] }
};

export function getSpeciesDiet(species) {
  const diet = speciesDiets[species];
  if (!diet) throw new RangeError(`Espécie sem dieta cadastrada: ${species}`);
  return diet;
}

export function canEat(species, foodId) {
  const diet = getSpeciesDiet(species);
  return diet.preferred.includes(foodId) || diet.foods.includes(foodId);
}
