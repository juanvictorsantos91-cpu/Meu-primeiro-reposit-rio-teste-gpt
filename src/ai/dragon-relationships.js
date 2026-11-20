/**
 * Relações sociais derivadas de dados percebidos pelo adaptador do jogo.
 * IDs são identificadores estáveis de entidades, não nomes visíveis.
 */

function asIdSet(value) {
  return new Set(Array.isArray(value) ? value.filter(id => typeof id === "string" && id.length > 0) : []);
}

function sharesParent(a, b) {
  const aParents = asIdSet(a.parentIds);
  const bParents = asIdSet(b.parentIds);
  return [...aParents].some(id => bParents.has(id));
}

export function classifyDragonRelationship(self, other) {
  if (!self || !other || typeof self !== "object" || typeof other !== "object") {
    throw new TypeError("Dois registros de dragões são necessários.");
  }
  if (self.id && other.id && self.id === other.id) return "self";
  if (self.partnerId && self.partnerId === other.id) return "partner";
  if (asIdSet(self.parentIds).has(other.id)) return "parent";
  if (asIdSet(other.parentIds).has(self.id)) return "child";
  if (sharesParent(self, other)) return "sibling";
  if (self.species === other.species) return "same_species";
  return "other";
}

export function isEligiblePair(self, candidate) {
  if (!self || !candidate) return false;
  const relation = classifyDragonRelationship(self, candidate);
  return self.species === candidate.species &&
    self.lifeStage === "adult" &&
    candidate.lifeStage === "adult" &&
    self.pairCompatible === true &&
    candidate.pairCompatible === true &&
    relation !== "parent" &&
    relation !== "child" &&
    relation !== "sibling" &&
    relation !== "partner" &&
    self.health > 40 &&
    candidate.health > 40 &&
    self.energy > 25 &&
    candidate.energy > 25 &&
    self.safeToPair === true &&
    candidate.safeToPair === true;
}

export function assessDragonRelationships(self, nearbyDragons = []) {
  if (!self || typeof self !== "object" || !Array.isArray(nearbyDragons)) {
    throw new TypeError("Estado próprio e lista de dragões próximos são necessários.");
  }

  const recognized = nearbyDragons
    .filter(other => other && other.id !== self.id)
    .map(other => ({
      id: other.id,
      species: other.species,
      relationship: classifyDragonRelationship(self, other)
    }));

  const mateCandidate = nearbyDragons.find(other => isEligiblePair(self, other)) ?? null;
  const youngNearby = nearbyDragons.filter(other =>
    other && other.lifeStage === "hatchling" &&
    (classifyDragonRelationship(self, other) === "child" ||
      (self.hasYoung === true && other.parentIds?.includes(self.id)))
  );

  let parentalAction = null;
  if (self.hasYoung === true && self.youngInDanger === true) {
    parentalAction = "protect_young";
  } else if (self.hasYoung === true && self.youngNeedsFood === true) {
    parentalAction = "feed_young";
  } else if (self.hasYoung === true && self.youngNeedsWarmth === true) {
    parentalAction = "warm_young";
  } else if (self.hasYoung === true && self.youngNeedsCare === true) {
    parentalAction = "care_for_young";
  }

  return {
    recognized,
    mateCandidateId: mateCandidate?.id ?? null,
    canFormPair: mateCandidate !== null,
    parentalAction,
    youngNearbyCount: youngNearby.length,
    knownPartner: self.partnerId ?? null
  };
}
