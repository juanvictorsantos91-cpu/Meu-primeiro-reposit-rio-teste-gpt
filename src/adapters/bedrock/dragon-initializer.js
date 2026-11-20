import { initializeDragonPersonality } from "./personality-writer.js";

const ENTITY_PREFIX = "dragon_survival:";

/**
 * Inicializa identidade persistente de um dragão ao nascer ou no primeiro tick.
 * Reprocessar uma entidade é seguro: traços existentes e spawn_tick não são sobrescritos.
 */
export function initializeDragonEntity(entity, currentTick = 0) {
  if (!entity || typeof entity.getTags !== "function" ||
      typeof entity.addTag !== "function" || typeof entity.typeId !== "string") {
    throw new TypeError("Entidade Bedrock válida é necessária para inicializar o dragão.");
  }
  if (!entity.typeId.startsWith(ENTITY_PREFIX)) return null;

  const species = entity.typeId.slice(ENTITY_PREFIX.length).replace(/_dragon$/, "");
  if (!/^(?:fire|water|electric|ice|earth|lava|wind|sound|poison|plasma|acid|sand|light|radioactive|shadow)$/.test(species)) {
    return null;
  }

  const personality = initializeDragonPersonality(entity, {
    species,
    seed: entity.id ?? entity.typeId
  });
  const tags = entity.getTags();
  const spawnTag = tags.find(tag => tag.startsWith("ds:spawn_tick:"));
  let spawnTickInitialized = false;
  if (!spawnTag) {
    const tick = Number.isInteger(currentTick) && currentTick >= 0 ? currentTick : 0;
    entity.addTag(`ds:spawn_tick:${tick}`);
    spawnTickInitialized = true;
  }
  if (!tags.includes("ds:dragon")) entity.addTag("ds:dragon");
  if (!tags.includes(`ds:species:${species}`)) entity.addTag(`ds:species:${species}`);
  if (!tags.some(tag => tag.startsWith("ds:energy:"))) entity.addTag("ds:energy:100");
  if (!tags.some(tag => tag.startsWith("ds:hunger:"))) entity.addTag("ds:hunger:100");
  if (!tags.some(tag => tag.startsWith("ds:stage:"))) entity.addTag("ds:stage:adult");

  return { species, personality, spawnTickInitialized };
}
