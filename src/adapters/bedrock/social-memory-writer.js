import { socialMemoryTags } from "../../ai/social-memory.js";

const MEMORY_PREFIXES = ["ds:known:", "ds:relation:", "ds:hostile:", "ds:seen:", "ds:encounters:"];

/**
 * Persiste a memória social compacta nas tags da própria entidade.
 * Usa apenas getTags/addTag/removeTag, métodos já usados pela ponte Bedrock.
 * Substitui somente as tags pertencentes ao subsistema de memória social.
 */
export function writeSocialMemory(entity, memory = []) {
  if (!entity || typeof entity.getTags !== "function" ||
      typeof entity.addTag !== "function" || typeof entity.removeTag !== "function") {
    throw new TypeError("Entidade Bedrock com getTags(), addTag() e removeTag() é necessária.");
  }
  const tags = entity.getTags();
  const nextTags = socialMemoryTags(memory);
  const nextSet = new Set(nextTags);
  const removed = [];
  const added = [];

  for (const tag of tags) {
    if (MEMORY_PREFIXES.some(prefix => tag.startsWith(prefix)) && !nextSet.has(tag)) {
      entity.removeTag(tag);
      removed.push(tag);
    }
  }

  const current = new Set(entity.getTags());
  for (const tag of nextTags) {
    if (!current.has(tag)) {
      entity.addTag(tag);
      added.push(tag);
    }
  }

  return { added, removed, tagCount: nextTags.length };
}

export const SOCIAL_MEMORY_TAG_PREFIXES = Object.freeze([...MEMORY_PREFIXES]);
