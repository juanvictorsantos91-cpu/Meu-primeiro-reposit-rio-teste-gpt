import { getBehaviorProfile } from "../species/behavior-profiles.js";

const LARGE_GROUP_SPECIES = new Set(["earth", "lava"]);
const VALID_SPECIES = new Set(["fire", "water", "electric", "ice", "earth", "lava", "wind", "sound", "poison", "plasma", "acid", "sand", "light", "radioactive", "shadow"]);

function compatibleSpecies(species, otherSpecies) {
  if (species === otherSpecies) return true;
  return LARGE_GROUP_SPECIES.has(species) && LARGE_GROUP_SPECIES.has(otherSpecies);
}

/**
 * Avalia candidatos observados para um grupo natural.
 * Produz apenas uma proposta: não cria IDs, não altera entidades e não confirma
 * associação. A integração Bedrock deverá confirmar a formação explicitamente.
 */
export function assessSocialGroupFormation({
  dragon,
  candidates = [],
  maxDistance = 32
}) {
  if (!dragon || typeof dragon.id !== "string" || !dragon.id.trim()) {
    throw new TypeError("dragon.id precisa identificar o dragão avaliado.");
  }
  if (!VALID_SPECIES.has(dragon.species)) {
    throw new RangeError("Espécie do dragão não cadastrada.");
  }
  if (!Array.isArray(candidates)) {
    throw new TypeError("candidates precisa ser uma lista.");
  }
  if (!Number.isFinite(maxDistance) || maxDistance < 0) {
    throw new RangeError("maxDistance precisa ser um número não negativo.");
  }

  const profile = getBehaviorProfile(dragon.species);
  const targetGroupSize = profile.preferredGroupSize ?? 1;
  const base = {
    species: dragon.species,
    targetGroupSize,
    maxDistance,
    candidateIds: [],
    status: "not_eligible",
    shouldForm: false,
    action: "remain_solo"
  };

  if (profile.socialPattern === "solitary") {
    return { ...base, reason: "A espécie mantém comportamento solitário; rituais coletivos não criam grupos permanentes." };
  }

  if (dragon.groupId) {
    return {
      ...base,
      status: "already_grouped",
      action: "maintain_existing_group",
      groupId: dragon.groupId,
      reason: "O dragão já possui uma associação explícita; esta avaliação não a substitui."
    };
  }

  const seen = new Set([dragon.id]);
  const eligible = [];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate.id !== "string" || !candidate.id.trim()) continue;
    if (seen.has(candidate.id) || !VALID_SPECIES.has(candidate.species)) continue;
    if (!compatibleSpecies(dragon.species, candidate.species)) continue;
    if (!Number.isFinite(candidate.distance) || candidate.distance < 0 || candidate.distance > maxDistance) continue;
    if (candidate.groupId) continue;
    if (candidate.available === false) continue;
    seen.add(candidate.id);
    eligible.push(candidate);
  }

  const candidateIds = eligible.map(candidate => candidate.id);
  const observedGroupSize = 1 + candidateIds.length;
  const enoughMembers = observedGroupSize >= targetGroupSize;

  return {
    ...base,
    candidateIds,
    observedGroupSize,
    status: enoughMembers ? "formation_candidate" : "insufficient_candidates",
    shouldForm: enoughMembers,
    action: enoughMembers ? "request_group_formation_confirmation" : "seek_compatible_group_members",
    reason: enoughMembers
      ? "Há indivíduos compatíveis e próximos em quantidade suficiente; a formação ainda depende de confirmação explícita."
      : "Ainda não há indivíduos compatíveis e disponíveis em quantidade suficiente."
  };
}
