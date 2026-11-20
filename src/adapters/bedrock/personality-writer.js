import { generatePersonalityTraits, PERSONALITY_TRAITS } from "../../species/personality.js";

/**
 * Converte os traços gerados em tags estáveis para o adaptador Bedrock.
 * A função é chamada pelo fluxo de criação/nascimento depois que a espécie
 * e o identificador persistente da entidade estiverem disponíveis.
 */
export function buildPersonalityTags({ seed, species, variation = 0.2 }) {
  const traits = generatePersonalityTraits({ seed, species, variation });
  return Object.entries(traits).map(([name, value]) => `ds:trait:${name}:${value.toFixed(2)}`);
}

/**
 * Grava somente traços ausentes. Não sobrescreve a personalidade de um
 * indivíduo já existente ao recarregar ou reprocessar a entidade.
 *
 * Requer uma entidade Bedrock com getTags() e addTag().
 */
export function initializeDragonPersonality(entity, {
  species,
  seed = entity?.id,
  variation = 0.2
} = {}) {
  if (!entity || typeof entity.getTags !== "function" || typeof entity.addTag !== "function") {
    throw new TypeError("Entidade Bedrock com getTags() e addTag() é necessária.");
  }
  const tags = entity.getTags();
  const existing = new Set(tags);
  const generated = buildPersonalityTags({ seed, species, variation });
  const written = [];

  for (const tag of generated) {
    const name = PERSONALITY_TRAITS.find(trait => tag.startsWith(`ds:trait:${trait}:`));
    const prefix = `ds:trait:${name}:`;
    if (tags.some(value => value.startsWith(prefix))) continue;
    entity.addTag(tag);
    existing.add(tag);
    written.push(tag);
  }

  return {
    initialized: written.length > 0,
    traits: Object.fromEntries([...existing]
      .flatMap(tag => {
        const match = tag.match(/^ds:trait:(curiosity|sociability|independence|playfulness):([0-9]*\.?[0-9]+)$/);
        return match ? [[match[1], Number(match[2])]] : [];
      })),
    writtenTags: written
  };
}
