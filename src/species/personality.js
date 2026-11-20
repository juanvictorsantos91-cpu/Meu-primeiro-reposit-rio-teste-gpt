import { getBehaviorProfile } from "./behavior-profiles.js";

const TRAITS = Object.freeze(["curiosity", "sociability", "independence", "playfulness"]);

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unitValue(seed) {
  return stableHash(seed) / 4294967296;
}

/**
 * Gera tendências individuais estáveis para um dragão.
 * O mesmo seed e espécie sempre produzem os mesmos valores.
 * O resultado deve ser persistido pelo adaptador de nascimento.
 */
export function generatePersonalityTraits({ seed, species, variation = 0.2 }) {
  if (typeof seed !== "string" && typeof seed !== "number") {
    throw new TypeError("seed precisa ser um identificador estável.");
  }
  if (String(seed).trim() === "") throw new TypeError("seed não pode ser vazio.");
  if (!Number.isFinite(variation) || variation < 0 || variation > 0.5) {
    throw new RangeError("variation precisa estar entre 0 e 0.5.");
  }

  const profile = getBehaviorProfile(species);
  const baseline = {
    curiosity: profile.curiosity ?? 0.5,
    sociability: profile.sociability ?? 0.5,
    independence: profile.independence ?? 0.5,
    playfulness: profile.playfulness ?? 0.45
  };

  return Object.fromEntries(TRAITS.map(name => {
    const offset = (unitValue(`${species}:${seed}:${name}`) * 2 - 1) * variation;
    const value = Math.max(0, Math.min(1, baseline[name] + offset));
    return [name, Math.round(value * 100) / 100];
  }));
}

export { TRAITS as PERSONALITY_TRAITS };
