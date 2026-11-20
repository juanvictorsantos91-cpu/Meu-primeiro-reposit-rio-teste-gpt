import { getBehaviorProfile } from "../../species/behavior-profiles.js";

const SPECIES_PREFIX = "ds:species:";
const NUMBER_PREFIXES = Object.freeze({
  energy: "ds:energy:",
  hunger: "ds:hunger:",
  aggression: "ds:aggression:",
  spawnTick: "ds:spawn_tick:"
});

export function readTaggedNumber(tags, prefix, fallback) {
  const tag = tags.find(value => value.startsWith(prefix));
  if (!tag) return fallback;
  const value = Number(tag.slice(prefix.length));
  return Number.isFinite(value) ? value : fallback;
}

export function readSpecies(tags) {
  const tag = tags.find(value => value.startsWith(SPECIES_PREFIX));
  return tag ? tag.slice(SPECIES_PREFIX.length) : null;
}

function clampPercent(value, fallback = 100) {
  const numeric = Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(100, numeric));
}

function readHealthPercent(entity, tags = []) {
  const component = entity.getComponent?.("minecraft:health");
  const current = component?.currentValue;
  if (!Number.isFinite(current)) return clampPercent(readTaggedNumber(tags, "ds:health:", 100));
  const maximum = Number.isFinite(component?.effectiveMax) && component.effectiveMax > 0
    ? component.effectiveMax
    : Number.isFinite(component?.defaultValue) && component.defaultValue > 0
      ? component.defaultValue : 100;
  return clampPercent((current / maximum) * 100);
}

function readTaggedId(tags, prefix) {
  const tag = tags.find(value => value.startsWith(prefix));
  if (!tag) return null;
  const value = tag.slice(prefix.length);
  try { return decodeURIComponent(value); } catch { return value; }
}

function readTrait(tags, name) {
  const value = readTaggedNumber(tags, `ds:trait:${name}:`, undefined);
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : undefined;
}

function readTemperatureCondition(tags, environmentContext) {
  if (tags.includes("ds:temperature:too_hot")) return "too_hot";
  if (tags.includes("ds:temperature:too_cold")) return "too_cold";
  return environmentContext.temperatureCondition ?? null;
}

function hasRelationshipTag(tags, prefix, id) {
  if (id == null) return false;
  const encoded = encodeURIComponent(String(id));
  return tags.includes(`${prefix}:${id}`) || tags.includes(`${prefix}:${encoded}`);
}

function readSocialMemory(tags) {
  const records = new Map();
  for (const tag of tags) {
    const match = tag.match(/^ds:known:(.+)$/);
    if (!match) continue;
    let id;
    try { id = decodeURIComponent(match[1]); } catch { id = match[1]; }
    if (id) records.set(id, { entityId: id, known: true, trust: 0, hostile: false });
  }
  for (const tag of tags) {
    const match = tag.match(/^ds:relation:(.+):trust:([0-3])$/);
    if (!match) continue;
    let id;
    try { id = decodeURIComponent(match[1]); } catch { id = match[1]; }
    const record = records.get(id) ?? { entityId: id, known: true, hostile: false };
    record.trust = Number(match[2]);
    records.set(id, record);
  }
  for (const tag of tags) {
    const match = tag.match(/^ds:seen:(.+):(\d+)$/);
    if (!match) continue;
    let id;
    try { id = decodeURIComponent(match[1]); } catch { id = match[1]; }
    const record = records.get(id) ?? { entityId: id, known: true, trust: 0, hostile: false };
    record.lastSeenTick = Number(match[2]);
    records.set(id, record);
  }
  for (const tag of tags) {
    const match = tag.match(/^ds:encounters:(.+):(\d+)$/);
    if (!match) continue;
    let id;
    try { id = decodeURIComponent(match[1]); } catch { id = match[1]; }
    const record = records.get(id) ?? { entityId: id, known: true, trust: 0, hostile: false };
    record.encounters = Number(match[2]);
    records.set(id, record);
  }
  for (const tag of tags) {
    const match = tag.match(/^ds:hostile:(.+)$/);
    if (!match) continue;
    let id;
    try { id = decodeURIComponent(match[1]); } catch { id = match[1]; }
    const record = records.get(id) ?? { entityId: id, known: true, trust: 0 };
    record.hostile = true;
    records.set(id, record);
  }
  return [...records.values()];
}

export function distanceBetween(a, b) {
  if (!a || !b) return Infinity;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function buildDragonSnapshot(entity, nearbyEntities = [], environmentContext = {}, currentTick = 0) {
  if (!entity || typeof entity.getTags !== "function") {
    throw new TypeError("Uma entidade Bedrock válida é necessária.");
  }
  const tags = entity.getTags();
  const species = readSpecies(tags);
  if (!species) return null;

  const profile = getBehaviorProfile(species);
  // O núcleo do MIS usa escalas percentuais de 0 a 100, independentemente
  // do máximo absoluto configurado na entidade Bedrock (por exemplo, 120 HP).
  const health = readHealthPercent(entity, tags);
  const energy = clampPercent(readTaggedNumber(tags, NUMBER_PREFIXES.energy, 100));
  const hunger = clampPercent(readTaggedNumber(tags, NUMBER_PREFIXES.hunger, 100));
  const aggression = Math.max(0, Math.min(1,
    readTaggedNumber(tags, NUMBER_PREFIXES.aggression, profile.aggression ?? 0)
  ));
  const spawnTick = readTaggedNumber(tags, NUMBER_PREFIXES.spawnTick, currentTick);
  const territoryId = readTaggedId(tags, "ds:territory:");
  const groupId = readTaggedId(tags, "ds:group:");
  const isGroupLeader = tags.includes("ds:leader");
  const isTamed = tags.includes("ds:tamed");
  const isOwned = tags.includes("ds:owned") || tags.some(tag => tag.startsWith("ds:owner:"));
  const injurySeverity = tags.includes("ds:injury:severe") ? "severe" :
    tags.includes("ds:injury:moderate") ? "moderate" :
    tags.includes("ds:injury:minor") ? "minor" : "none";

  const nearbyDragons = [];
  const nearbyPrey = [];
  const nearbyHostiles = [];
  for (const other of nearbyEntities) {
    if (!other || other.id === entity.id) continue;
    const distance = distanceBetween(entity.location, other.location);
    const otherTags = other.getTags?.() ?? [];
    const otherSpecies = readSpecies(otherTags);
    if (otherSpecies) {
      nearbyDragons.push({
        id: other.id,
        species: otherSpecies,
        distance,
        health: readHealthPercent(other, otherTags),
        energy: clampPercent(readTaggedNumber(otherTags, NUMBER_PREFIXES.energy, 100)),
        hunger: clampPercent(readTaggedNumber(otherTags, NUMBER_PREFIXES.hunger, 100)),
        isTamed: otherTags.includes("ds:tamed"),
        isOwned: otherTags.includes("ds:owned") || otherTags.some(tag => tag.startsWith("ds:owner:")),
        knownToSelf: hasRelationshipTag(tags, "ds:known", other.id),
        hostile: hasRelationshipTag(tags, "ds:hostile", other.id),
        nearNest: otherTags.includes("ds:near_nest"),
        lifeStage: otherTags.includes("ds:stage:hatchling") ? "hatchling" :
          otherTags.includes("ds:stage:juvenile") ? "juvenile" : "adult",
        temporaryTerritoryMigrationDue: otherTags.includes("ds:migration_due"),
        territoryId: readTaggedId(otherTags, "ds:territory:"),
        groupId: readTaggedId(otherTags, "ds:group:"),
        isGroupLeader: otherTags.includes("ds:leader"),
        parentIds: otherTags.filter(tag => tag.startsWith("ds:parent:")).map(tag => tag.slice("ds:parent:".length)),
        partnerId: readTaggedId(otherTags, "ds:partner:"),
        pairCompatible: otherTags.includes("ds:pair_compatible") || otherTags.includes("ds:stage:adult"),
        safeToPair: otherTags.includes("ds:safe_to_pair") ||
          (readHealthPercent(other, otherTags) > 40 &&
           readTaggedNumber(otherTags, NUMBER_PREFIXES.energy, 100) > 25 &&
           !otherTags.includes("ds:injury:severe"))
      });
      continue;
    }

    if (isHostileType(other.typeId)) {
      nearbyHostiles.push({ id: other.id, typeId: other.typeId, distance });
      continue;
    }
    const foodId = preyFoodId(other.typeId);
    if (!foodId) continue;
    // Só entidades marcadas explicitamente como selvagens podem ser caçadas.
    // Isso evita atacar animais de fazendas do jogador por engano.
    const explicitlyWild = otherTags.includes("ds:wild");
    nearbyPrey.push({
      id: other.id,
      type: foodId,
      foodId,
      distance,
      isTamed: otherTags.includes("ds:tamed"),
      isOwned: otherTags.includes("ds:owned"),
      isFarmAnimal: otherTags.includes("ds:farm"),
      protectedByPlayer: !explicitlyWild || otherTags.includes("ds:protected"),
      isBaby: otherTags.includes("ds:baby")
    });
  }

  return {
    id: entity.id,
    species,
    aggression,
    territoryId,
    groupId,
    isGroupLeader,
    isTamed,
    isOwned,
    hasYoung: tags.includes("ds:has_young"),
    youngInDanger: tags.includes("ds:young_in_danger"),
    youngNeedsFood: tags.includes("ds:young_needs_food"),
    youngNeedsWarmth: tags.includes("ds:young_needs_warmth"),
    youngNeedsCare: tags.includes("ds:young_needs_care"),
    nestThreatened: tags.includes("ds:nest_threatened"),
    ownerInDanger: tags.includes("ds:owner_in_danger"),
    trainingCommand: readTaggedId(tags, "ds:command:"),
    injury: { severity: injurySeverity },
    parentIds: tags.filter(tag => tag.startsWith("ds:parent:")).map(tag => tag.slice("ds:parent:".length)),
    partnerId: readTaggedId(tags, "ds:partner:"),
    pairCompatible: tags.includes("ds:pair_compatible") || tags.includes("ds:stage:adult"),
    safeToPair: tags.includes("ds:safe_to_pair") ||
      (health > 40 && energy > 25 && injurySeverity !== "severe" && environmentContext.immediateHazard !== true),
    starvationMinutes: readTaggedNumber(tags, "ds:starvation_minutes:", 0),
    attackedByDragon: tags.some(tag => tag.startsWith("ds:attacked_by:")),
    immediateDanger: environmentContext.immediateHazard === true || tags.includes("ds:immediate_danger"),
    energy,
    hunger,
    health,
    spawnTick,
    currentTick,
    nearbyDragons,
    socialMemory: readSocialMemory(tags),
    nearbyPrey,
    nearbyHostiles,
    threatDetected: nearbyHostiles.length > 0 || environmentContext.hostileMobsNearby === true,
    nearbySameSpeciesCount: nearbyDragons.filter(dragon => dragon.species === species).length,
    sameSpeciesGroupNearby: groupId != null && nearbyDragons.some(dragon => dragon.groupId === groupId),
    environmentContext,
    environment: environmentContext.environment ?? "unknown",
    safeToExplore: environmentContext.immediateHazard !== true,
    safeToRest: environmentContext.immediateHazard !== true,
    sleepRequested: tags.includes("ds:sleep_requested"),
    socialOpportunity: tags.includes("ds:social_opportunity"),
    socialTargetId: readTaggedId(tags, "ds:social_target:"),
    fireBreathRequested: tags.includes("ds:fire_breath_requested"),
    fireProjectileRequested: tags.includes("ds:fire_projectile_requested"),
    waterJetRequested: tags.includes("ds:water_jet_requested"),
    frostBreathRequested: tags.includes("ds:frost_breath_requested"),
    electricDischargeRequested: tags.includes("ds:electric_discharge_requested"),
    magmaWaveRequested: tags.includes("ds:magma_wave_requested"),
    poisonCamouflageRequested: tags.includes("ds:poison_camouflage_requested"),
    poisonBreathRequested: tags.includes("ds:poison_breath_requested"),
    poisonSpitRequested: tags.includes("ds:poison_spit_requested"),
    camouflageSuitable: environmentContext.tags?.some(tag => ["forest","darkness","swamp"].includes(tag)) === true,
    coverTargetAvailable: environmentContext.tags?.some(tag => ["forest","darkness","mountain"].includes(tag)) === true,
    coverAvailable: environmentContext.tags?.some(tag => ["forest","darkness","mountain","cold"].includes(tag)) === true,
    isExposed: environmentContext.tags?.includes("open") === true,
    stealthRequested: tags.includes("ds:stealth_requested"),
    repositionRequested: tags.includes("ds:reposition_requested"),
    overloadRequested: tags.includes("ds:overload_requested"),
    plasmaBreathRequested: tags.includes("ds:plasma_breath_requested"),
    plasmaDischargeRequested: tags.includes("ds:plasma_discharge_requested"),
    ionizedProjectileRequested: tags.includes("ds:ionized_projectile_requested"),
    plasmaArcRequested: tags.includes("ds:plasma_arc_requested"),
    ambushOpportunity: tags.includes("ds:ambush_opportunity"),
    preyNearby: nearbyPrey.length > 0,
    groupSignalRequested: tags.includes("ds:group_signal_requested"),
    unusualVibrationDetected: tags.includes("ds:unusual_vibration"),
    soundScanRequested: tags.includes("ds:sound_scan_requested"),
    vibrationDetected: tags.includes("ds:vibration_detected"),
    thunderstorm: environmentContext.tags?.includes("thunderstorm") === true,
    stormShelterAvailable: environmentContext.tags?.includes("cover") === true,
    isExposedToStorm: environmentContext.tags?.includes("open") === true,
    acidJetRequested: tags.includes("ds:acid_jet_requested"),
    acidPoolRequested: tags.includes("ds:acid_pool_requested"),
    burrowRequested: tags.includes("ds:burrow_requested"),
    sandstormRequested: tags.includes("ds:sandstorm_requested"),
    lightPulseRequested: tags.includes("ds:light_pulse_requested"),
    radiationPulseRequested: tags.includes("ds:radiation_pulse_requested"),
    exposureFieldRequested: tags.includes("ds:exposure_field_requested"),
    shadowCloakRequested: tags.includes("ds:shadow_cloak_requested"),
    shadowStepRequested: tags.includes("ds:shadow_step_requested"),
    darknessNearby: environmentContext.tags?.includes("darkness") === true || environmentContext.tags?.includes("night") === true,
    sandAvailable: environmentContext.tags?.includes("hot") === true || /desert|badlands/.test(environmentContext.biome ?? ""),
    playOpportunity: tags.includes("ds:play_opportunity") || environmentContext.playOpportunity === true,
    explorationOpportunity: tags.includes("ds:exploration_opportunity") || environmentContext.explorationOpportunity === true,
    quietObservationOpportunity: tags.includes("ds:quiet_observation") || environmentContext.quietObservationOpportunity === true,
    temperatureCondition: readTemperatureCondition(tags, environmentContext),
    personality: Object.fromEntries([
      ["curiosity", readTrait(tags, "curiosity")],
      ["sociability", readTrait(tags, "sociability")],
      ["independence", readTrait(tags, "independence")],
      ["playfulness", readTrait(tags, "playfulness")]
    ].filter(([, value]) => Number.isFinite(value))),
    ownerNearby: tags.includes("ds:owner_nearby"),
    windAbilityRequested: tags.includes("ds:wind_gust_requested"),
    bondLevel: readTaggedNumber(tags, "ds:bond:", 0),
    isEgg: tags.includes("ds:egg"),
    lifeStage: tags.includes("ds:stage:hatchling") ? "hatchling" :
      tags.includes("ds:stage:juvenile") ? "juvenile" :
      tags.includes("ds:stage:adult") ? "adult" : undefined
  };
}

function isHostileType(typeId = "") {
  return /minecraft:(zombie|husk|drowned|skeleton|stray|bogged|creeper|spider|cave_spider|witch|pillager|vindicator|ravager|phantom|warden|blaze|ghast|magma_cube|slime)$/.test(typeId);
}

function preyFoodId(typeId = "") {
  const id = typeId.replace(/^minecraft:/, "");
  const known = {
    salmon: "salmon", cod: "cod", tropical_fish: "tropical_fish",
    rabbit: "rabbit", chicken: "chicken", cow: "beef",
    pig: "porkchop", sheep: "mutton"
  };
  return known[id] ?? null;
}

export function actionIntentTag(action) {
  if (typeof action !== "string" || !/^[a-z0-9_]+$/.test(action)) {
    throw new TypeError("Ação inválida para registro no adaptador Bedrock.");
  }
  return `ds:action:${action}`;
}
