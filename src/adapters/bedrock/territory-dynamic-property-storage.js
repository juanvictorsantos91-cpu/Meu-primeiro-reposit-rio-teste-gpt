import { createTerritoryWorldStorage, serializeTerritoryWorldState } from "./territory-storage.js";

const DEFAULT_CHUNK_BYTES = 7000;
const POINTER_SUFFIX = "active";
const SLOT_NAMES = ["a", "b"];

function forEachUtf8Byte(value, callback) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0x7f) callback(codePoint);
    else if (codePoint <= 0x7ff) {
      callback(0xc0 | (codePoint >> 6));
      callback(0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      callback(0xe0 | (codePoint >> 12));
      callback(0x80 | ((codePoint >> 6) & 0x3f));
      callback(0x80 | (codePoint & 0x3f));
    } else {
      callback(0xf0 | (codePoint >> 18));
      callback(0x80 | ((codePoint >> 12) & 0x3f));
      callback(0x80 | ((codePoint >> 6) & 0x3f));
      callback(0x80 | (codePoint & 0x3f));
    }
  }
}

function utf8Bytes(value) {
  let length = 0;
  forEachUtf8Byte(value, () => length++);
  return length;
}

function splitUtf8(value, maxBytes) {
  const chunks = [];
  let current = "";
  let currentBytes = 0;
  for (const character of value) {
    const size = utf8Bytes(character);
    if (size > maxBytes) throw new RangeError("Um caractere excede o limite de chunk configurado.");
    if (current && currentBytes + size > maxBytes) {
      chunks.push(current);
      current = "";
      currentBytes = 0;
    }
    current += character;
    currentBytes += size;
  }
  if (current || chunks.length === 0) chunks.push(current);
  return chunks;
}

function checksum(value) {
  let hash = 2166136261;
  forEachUtf8Byte(value, byte => {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  });
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function slotKey(base, slot, suffix) {
  return `${base}:${slot}:${suffix}`;
}

function readSlot(world, base, slot) {
  const manifestValue = world.getDynamicProperty(slotKey(base, slot, "manifest"));
  if (typeof manifestValue !== "string") return null;
  let manifest;
  try {
    manifest = JSON.parse(manifestValue);
  } catch {
    return null;
  }
  if (!manifest || manifest.version !== 1 ||
      !Number.isInteger(manifest.chunks) || manifest.chunks < 1 ||
      !Number.isInteger(manifest.generation) || manifest.generation < 1 ||
      typeof manifest.checksum !== "string" ||
      !Number.isInteger(manifest.byteLength) || manifest.byteLength < 0) return null;

  let serialized = "";
  for (let index = 0; index < manifest.chunks; index++) {
    const part = world.getDynamicProperty(slotKey(base, slot, String(index)));
    if (typeof part !== "string") return null;
    serialized += part;
  }
  if (utf8Bytes(serialized) !== manifest.byteLength ||
      checksum(serialized) !== manifest.checksum) return null;
  return { slot, generation: manifest.generation, serialized, chunks: manifest.chunks };
}

/**
 * Adaptador real para propriedades dinâmicas do mundo Bedrock.
 * Usa dois slots e troca o ponteiro somente após gravar e validar o novo slot,
 * reduzindo o risco de perder o último estado válido se uma gravação falhar.
 */
export function createBedrockTerritoryWorldStorage({
  world,
  key = "ds:territory_v1",
  maxChunkBytes = DEFAULT_CHUNK_BYTES
}) {
  if (!world || typeof world.getDynamicProperty !== "function" ||
      typeof world.setDynamicProperty !== "function") {
    throw new TypeError("world precisa oferecer getDynamicProperty e setDynamicProperty.");
  }
  if (typeof key !== "string" || !/^[a-z0-9_.:-]+$/i.test(key)) {
    throw new TypeError("key precisa ser um identificador válido de propriedade dinâmica.");
  }
  if (!Number.isInteger(maxChunkBytes) || maxChunkBytes < 256 || maxChunkBytes > 24000) {
    throw new RangeError("maxChunkBytes precisa estar entre 256 e 24000.");
  }

  const storage = createTerritoryWorldStorage({
    key,
    read: () => {
      const activeValue = world.getDynamicProperty(`${key}:${POINTER_SUFFIX}`);
      const active = SLOT_NAMES.includes(activeValue) ? activeValue : null;
      const preferred = active ? readSlot(world, key, active) : null;
      if (preferred) return preferred.serialized;

      const fallback = SLOT_NAMES
        .filter(slot => slot !== active)
        .map(slot => readSlot(world, key, slot))
        .filter(Boolean)
        .sort((a, b) => b.generation - a.generation)[0];
      return fallback?.serialized ?? null;
    },
    write: () => {
      // O commit é executado abaixo; este callback existe apenas para compor
      // a interface comum e não é chamado diretamente pelo método save.
    }
  });

  return {
    load: () => storage.load(),
    save(state) {
      // Reutiliza o validador e serializador do adaptador comum.
      const serialized = serializeTerritoryWorldState(state);
      const activeValue = world.getDynamicProperty(`${key}:${POINTER_SUFFIX}`);
      const active = SLOT_NAMES.includes(activeValue) ? activeValue : null;
      const validSlots = SLOT_NAMES.map(slot => readSlot(world, key, slot)).filter(Boolean);
      const current = (active && validSlots.find(item => item.slot === active)) ||
        validSlots.sort((a, b) => b.generation - a.generation)[0] || null;
      const generation = Math.max(0, ...validSlots.map(item => item.generation)) + 1;
      // Sempre grava no slot que não contém a última cópia válida.
      const target = current ? (current.slot === "a" ? "b" : "a") : (active === "b" ? "b" : "a");
      const chunks = splitUtf8(serialized, maxChunkBytes);

      // Escreve o conteúdo e o manifesto antes de atualizar o ponteiro ativo.
      for (let index = 0; index < chunks.length; index++) {
        world.setDynamicProperty(slotKey(key, target, String(index)), chunks[index]);
      }
      world.setDynamicProperty(slotKey(key, target, "manifest"), JSON.stringify({
        version: 1,
        generation,
        chunks: chunks.length,
        byteLength: utf8Bytes(serialized),
        checksum: checksum(serialized)
      }));
      const verified = readSlot(world, key, target);
      if (!verified || verified.serialized !== serialized) {
        throw new Error("A verificação do novo estado territorial falhou; o estado anterior foi preservado.");
      }
      world.setDynamicProperty(`${key}:${POINTER_SUFFIX}`, target);

      // O slot anterior é mantido como cópia de recuperação.
      return utf8Bytes(serialized);
    }
  };
}

