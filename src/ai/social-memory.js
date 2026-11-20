const MAX_RELATIONSHIPS = 32;
const MAX_TRUST = 3;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function validateId(id) {
  if (typeof id !== "string" || id.trim() === "") {
    throw new TypeError("O identificador do indivíduo é obrigatório.");
  }
}

/**
 * Atualiza memória social curta e limitada.
 * Guarda reconhecimento, confiança simples, hostilidade observada e último contato.
 * Não cria amizade/hostilidade por mera proximidade: exige evidência observada.
 */
export function updateSocialMemory(memory = [], observations = [], currentTick = 0) {
  if (!Array.isArray(memory) || !Array.isArray(observations)) {
    throw new TypeError("Memória e observações precisam ser listas.");
  }
  if (!Number.isInteger(currentTick) || currentTick < 0) {
    throw new RangeError("currentTick precisa ser inteiro não negativo.");
  }

  const records = new Map();
  for (const item of memory) {
    validateId(item?.entityId);
    records.set(item.entityId, { ...item });
  }

  for (const observation of observations) {
    validateId(observation?.entityId);
    const previous = records.get(observation.entityId);
    const lastSeenTick = previous?.lastSeenTick ?? -1;
    if (currentTick < lastSeenTick) throw new RangeError("O tempo da memória social não pode retroceder.");

    const record = {
      entityId: observation.entityId,
      species: observation.species ?? previous?.species ?? null,
      known: true,
      trust: clamp(Number.isFinite(previous?.trust) ? previous.trust : 0, 0, MAX_TRUST),
      hostile: previous?.hostile === true,
      lastSeenTick: currentTick,
      encounters: (previous?.encounters ?? 0) + (lastSeenTick === currentTick ? 0 : 1),
      lastInteraction: previous?.lastInteraction ?? null
    };

    if (observation.interaction === "peaceful") {
      record.trust = clamp(record.trust + 1, 0, MAX_TRUST);
      record.hostile = false;
      record.lastInteraction = "peaceful";
    } else if (observation.interaction === "hostile") {
      record.hostile = true;
      record.trust = clamp(record.trust - 1, 0, MAX_TRUST);
      record.lastInteraction = "hostile";
    } else if (observation.interaction === "protective") {
      record.trust = clamp(record.trust + 1, 0, MAX_TRUST);
      record.lastInteraction = "protective";
    }

    records.set(observation.entityId, record);
  }

  return [...records.values()]
    .sort((a, b) => b.lastSeenTick - a.lastSeenTick || a.entityId.localeCompare(b.entityId))
    .slice(0, MAX_RELATIONSHIPS);
}

export function findSocialRelationship(memory, entityId) {
  validateId(entityId);
  if (!Array.isArray(memory)) throw new TypeError("Memória social inválida.");
  return memory.find(item => item.entityId === entityId) ?? null;
}

export function socialMemoryTags(memory = []) {
  if (!Array.isArray(memory)) throw new TypeError("Memória social inválida.");
  return memory.map(item => {
    validateId(item.entityId);
    const safeId = encodeURIComponent(item.entityId);
    return [
      `ds:known:${safeId}`,
      `ds:relation:${safeId}:trust:${clamp(item.trust ?? 0, 0, MAX_TRUST)}`,
      ...(Number.isInteger(item.lastSeenTick) && item.lastSeenTick >= 0 ? [`ds:seen:${safeId}:${item.lastSeenTick}`] : []),
      ...(Number.isInteger(item.encounters) && item.encounters > 0 ? [`ds:encounters:${safeId}:${item.encounters}`] : []),
      ...(item.hostile ? [`ds:hostile:${safeId}`] : [])
    ];
  }).flat();
}

export const SOCIAL_MEMORY_LIMIT = MAX_RELATIONSHIPS;
