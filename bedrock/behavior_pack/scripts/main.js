import { system, world } from "@minecraft/server";
import { decideDragonBehavior } from "./core/ai/dragon-behavior.js";
import { buildDragonSnapshot, actionIntentTag } from "./core/adapters/bedrock/snapshot.js";
import { executeDragonAction } from "./core/adapters/bedrock/action-executor.js";
import { writeSocialMemory } from "./core/adapters/bedrock/social-memory-writer.js";
import { initializeDragonEntity } from "./core/adapters/bedrock/dragon-initializer.js";
import { tickMetabolism } from "./core/survival/metabolism.js";
import { getSpeciesProfile } from "./core/species/profiles/index.js";
import { writeDragonGroupMembership, writeDragonGroupLeadership } from "./core/adapters/bedrock/dragon-group-writer.js";
import { getDragonBalance } from "./core/species/balance.js";
import { createBedrockSocialWorldRuntime } from "./core/adapters/bedrock/social-world-runtime.js";

const TICK_INTERVAL = 40;
const QUERY_RADIUS = 32;
const DIMENSIONS = ["overworld", "nether", "the_end"];
const pendingSocialObservations = new Map();
let socialWorldRuntime = null;
try {
  socialWorldRuntime = createBedrockSocialWorldRuntime(world);
} catch {
  // O MIS segue funcionando com tags locais se a persistência do mundo não estiver disponível.
}

function isDragonEntity(entity) {
  if (!entity) return false;
  try {
    return entity.hasTag?.("ds:dragon") === true ||
      entity.typeId?.startsWith("dragon_survival:") === true;
  } catch {
    return false;
  }
}

function queueHostileSocialObservation(event) {
  const victim = event?.hurtEntity;
  const attacker = event?.damageSource?.damagingEntity;
  if (!isDragonEntity(victim) || !isDragonEntity(attacker) || victim.id === attacker.id) return;

  const observations = pendingSocialObservations.get(victim.id) ?? [];
  // Limita eventos acumulados entre ciclos e evita duplicar o mesmo agressor.
  const existing = observations.find(item => item.entityId === attacker.id);
  if (existing) existing.interaction = "hostile";
  else if (observations.length < 16) {
    observations.push({ entityId: attacker.id, interaction: "hostile" });
  }
  pendingSocialObservations.set(victim.id, observations);
}

try {
  world.afterEvents.entityHurt.subscribe(queueHostileSocialObservation);
} catch {
  // Se o evento não estiver disponível nesta versão, a memória ainda registra encontros.
}

function initializeSpawnedDragon(event) {
  const entity = event?.entity;
  if (!entity?.typeId?.startsWith("dragon_survival:")) return;
  try {
    initializeDragonEntity(entity, system.currentTick);
  } catch {
    // A inicialização será tentada novamente quando a entidade entrar no ciclo de IA.
  }
}

try {
  world.afterEvents.entitySpawn.subscribe(initializeSpawnedDragon);
} catch {
  // O primeiro ciclo de IA também inicializa dragões já existentes no mundo.
}

function inferEnvironment(dimension, location) {
  const context = { tags: [], immediateHazard: false };
  try {
    const biome = dimension.getBiome(location);
    const biomeId = typeof biome === "string" ? biome : biome?.id ?? "";
    context.biome = biomeId;
    if (location.y < 50) context.tags.push("cave","darkness");
    if (location.y >= 120) context.tags.push("high_altitude", "wind");
    else if (location.y >= 90) context.tags.push("wind");
    const normalized = biomeId.toLowerCase();
    if (location.y >= 100) context.tags.push("open");
    const timeOfDay = world.getTimeOfDay?.() ?? 0;
    if (timeOfDay >= 13000 || timeOfDay < 1000) context.tags.push("night","darkness");
    if (timeOfDay >= 1000 && timeOfDay < 12000) context.tags.push("daylight");
    try {
      const weather = String(world.getWeather?.() ?? "").toLowerCase();
      if (weather.includes("thunder")) context.tags.push("thunderstorm");
    } catch { /* API opcional entre versões. */ }
    if (/ocean|river|beach/.test(normalized)) context.tags.push("water");
    if (/swamp|mangrove/.test(normalized)) context.tags.push("swamp");
    if (/snow|frozen|ice|grove/.test(normalized)) context.tags.push("cold");
    if (/desert|badlands|savanna/.test(normalized)) context.tags.push("hot");
    if (/jungle|forest|taiga/.test(normalized)) context.tags.push("forest","cover");
    if (/mountain|peak|windswept/.test(normalized)) context.tags.push("mountain","cover");
    if (/nether|basalt|crimson|warped/.test(normalized)) context.tags.push("volcanic","cover");
  } catch {
    context.biome = "unavailable";
  }

  try {
    const below = dimension.getBlock({
      x: Math.floor(location.x),
      y: Math.floor(location.y) - 1,
      z: Math.floor(location.z)
    });
    const blockId = below?.typeId ?? "";
    if (blockId.includes("lava")) {
      context.lavaNearby = true;
      context.immediateHazard = true;
    }
  } catch {
    // Bloco em chunk descarregado: não interrompe a atualização do dragão.
  }
  return context;
}

function replaceNumberTag(entity, prefix, value) {
  for (const tag of entity.getTags()) if (tag.startsWith(prefix)) entity.removeTag(tag);
  entity.addTag(prefix + Number(value).toFixed(2));
}

function hashGroupKey(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(36);
}

function synchronizeNeeds(entity, state, decision, environmentContext) {
  const profile = getSpeciesProfile(state.species);
  const action = decision.action ?? "idle";
  const actionCosts = {
    perform_sonic_impact_wave: "sonicImpact", perform_disorienting_roar: "disorientingRoar",
    release_fire_breath: "fireBreath", create_flame_projectile: "fireProjectile",
    release_water_jet: "waterJet", release_frost_breath: "frostBreath",
    release_electric_discharge: "electricDischarge", release_magma_wave: "magmaWave",
    breathe_venom: "venomBreath", spit_venom: "venomSpit", release_camouflage_mist: "camouflageMist",
    release_plasma_breath: "plasmaBreath", release_plasma_discharge: "plasmaDischarge",
    fire_ionized_projectile: "ionizedProjectile", create_plasma_arc: "plasmaArc",
    activate_plasma_overload: "overload", release_acid_jet: "acidJet",
    create_temporary_acid_pool: "corrosivePool", raise_sandstorm: "sandstorm",
    release_blinding_light_pulse: "blindingPulse", release_radiation_pulse: "radiationPulse",
    activate_cumulative_exposure_field: "exposureField", activate_shadow_cloak: "shadowCloak",
    perform_shadow_step: "shadowStep", perform_wind_gust: "windGust",
    perform_aerial_push: "aerialPush", perform_electric_storm_communication_ritual: "electricBoost",
    burrow_under_sand: "burrow", dim_plasma_glow_and_conceal: "concealment",
    reposition_silently: "stealthMovement"
  };
  const activity = actionCosts[action] ?? (/fly|flight|glide/.test(action) ? "fly" :
    /attack|combat|confront|defend/.test(action) ? "physicalAttack" :
    /run|chase|pursue|retreat|move/.test(action) ? "run" : "idle");
  const time = world.getTimeOfDay?.() ?? 0;
  const tags = environmentContext.tags ?? [];
  const environment =
    state.species === "fire" && tags.includes("hot") ? "hot" :
    state.species === "lava" && tags.includes("volcanic") ? "volcanic" :
    state.species === "water" && tags.includes("water") ? "water" :
    state.species === "ice" && tags.includes("cold") ? "frozen" :
    state.species === "earth" && entity.location.y < 50 ? "underground" :
    state.species === "electric" && tags.includes("thunderstorm") ? "thunderstorm" :
    state.species === "electric" && tags.includes("night") ? "night" :
    state.species === "wind" && entity.location.y >= 120 ? "highAltitude" :
    state.species === "wind" && tags.includes("wind") ? "strongWind" :
    state.species === "sand" && tags.includes("hot") ? "desert" :
    state.species === "light" && tags.includes("daylight") ? "clearDaylight" :
    state.species === "light" && tags.includes("open") ? "openSunlitArea" :
    state.species === "shadow" && tags.includes("darkness") && entity.location.y < 50 ? "deepDarkness" :
    state.species === "shadow" && tags.includes("darkness") ? "night" :
    state.species === "sound" && entity.location.y < 50 ? "quietCave" :
    state.species === "poison" && tags.includes("swamp") ? "swamp" :
    state.species === "poison" && tags.includes("forest") ? "humidForest" :
    state.species === "plasma" && tags.includes("thunderstorm") && entity.location.y >= 100 ? "highAltitudeStorm" :
    state.species === "plasma" && entity.location.y < 50 ? "exposedMineralCavern" :
    state.species === "acid" && entity.location.y < 50 ? "acidicCavern" :
    state.species === "acid" && tags.includes("swamp") ? "humidCave" :
    state.species === "radioactive" && entity.location.y < 40 ? "deepCrystalCave" :
    state.species === "radioactive" ? "irradiatedMineralCavern" :
    state.species === "shadow" && tags.includes("forest") ? "shadedCave" :
    state.species === "light" && time < 12000 ? "clearDaylight" : "neutral";
  const restingAction = action === "rest_in_preferred_habitat" || action === "absorb_charge_from_storm";
  const next = tickMetabolism({
    energy: state.energy, hunger: state.hunger, health: state.health,
    injury: state.injury?.severity === "none" ? null : state.injury,
    starvationMinutes: state.starvationMinutes ?? 0
  }, profile, {
    minutes: TICK_INTERVAL / 1200,
    activity,
    resting: restingAction || entity.hasTag("ds:resting"),
    safe: environmentContext.immediateHazard !== true && state.threatDetected !== true,
    stationary: entity.hasTag("ds:resting") || restingAction,
    environment
  });
  replaceNumberTag(entity, "ds:energy:", next.energy);
  replaceNumberTag(entity, "ds:hunger:", next.hunger);
  replaceNumberTag(entity, "ds:health:", next.health);
  replaceNumberTag(entity, "ds:starvation_minutes:", next.starvationMinutes ?? 0);
  const health = entity.getComponent?.("minecraft:health");
  if (health && typeof health.setCurrentValue === "function" && Number.isFinite(health.effectiveMax)) {
    health.setCurrentValue(Math.max(0, health.effectiveMax * next.health / 100));
  }
  if (next.activityBlocked) entity.addTag("ds:activity_blocked");
  else entity.removeTag("ds:activity_blocked");
  return next;
}

function synchronizeSocialGroup(entity, state, decision) {
  const plan = decision.groupPlan;
  if (!plan || plan.pattern === "solitary" || plan.action !== "organize_territory_patrol_group") {
    if (entity.hasTag("ds:leader")) entity.removeTag("ds:leader");
    return;
  }
  const members = [entity.id, ...(state.nearbyDragons ?? [])
    .filter(other => other.species === state.species && other.distance <= QUERY_RADIUS)
    .map(other => other.id)].sort();
  if (members.length < plan.targetGroupSize) return;
  const groupId = state.species + ":" + hashGroupKey(members.join("|"));
  writeDragonGroupMembership(entity, groupId);
  writeDragonGroupLeadership(entity, entity.id === members[0]);
}

function enforceFlightLimits(entity, species) {
  const balance = getDragonBalance(species);
  if (entity.location.y > balance.maxFlightAltitude) {
    entity.applyImpulse({ x: 0, y: -0.18, z: 0 });
    entity.addTag("ds:flight_altitude_limited");
  } else if (entity.hasTag("ds:flight_altitude_limited")) {
    entity.removeTag("ds:flight_altitude_limited");
  }
  const originTag = entity.getTags().find(tag => tag.startsWith("ds:flight_origin:"));
  if (entity.isOnGround === true) {
    if (originTag) entity.removeTag(originTag);
    return;
  }
  if (!originTag) {
    const p = entity.location;
    entity.addTag(`ds:flight_origin:${p.x.toFixed(1)}:${p.y.toFixed(1)}:${p.z.toFixed(1)}`);
    return;
  }
  const parts = originTag.split(":");
  const origin = { x: Number(parts[2]), y: Number(parts[3]), z: Number(parts[4]) };
  if (!Number.isFinite(origin.x) || !Number.isFinite(origin.y) || !Number.isFinite(origin.z)) {
    entity.removeTag(originTag); return;
  }
  const dx=entity.location.x-origin.x, dy=entity.location.y-origin.y, dz=entity.location.z-origin.z;
  const distance=Math.hypot(dx,dy,dz);
  if (distance > balance.flightRange) {
    const length=distance||1;
    entity.applyImpulse({ x: -dx/length*0.16, y: -Math.max(0,dy)/length*0.08, z: -dz/length*0.16 });
    entity.addTag("ds:flight_range_limited");
  } else if (entity.hasTag("ds:flight_range_limited")) entity.removeTag("ds:flight_range_limited");
}

function publishIntent(entity, action) {
  try {
    for (const tag of entity.getTags()) {
      if (tag.startsWith("ds:action:")) entity.removeTag(tag);
    }
    entity.addTag(actionIntentTag(action));
  } catch {
    // Entidade pode ter sido removida/descarregada durante a atualização.
  }
}

function updateDimension(dimension, currentTick) {
  let dragons = [];
  try {
    // Todas as espécies Dragon Survival declaram esta família no Behavior Pack.
    // A etiqueta ds:dragon é adicionada aqui, em vez de ser exigida antes da descoberta.
    dragons = dimension.getEntities({ families: ["dragon_survival"] });
  } catch {
    return;
  }

  for (const entity of dragons) {
    try {
      initializeDragonEntity(entity, currentTick);
      const nearby = dimension.getEntities({
        location: entity.location,
        maxDistance: QUERY_RADIUS
      });
      const environmentContext = inferEnvironment(dimension, entity.location);
      const state = buildDragonSnapshot(entity, nearby, environmentContext, currentTick);
      if (!state) continue;
      state.socialObservations = pendingSocialObservations.get(entity.id) ?? [];
      for (const tag of entity.getTags()) {
        if (!tag.startsWith("ds:positive_contact:")) continue;
        let entityId = tag.slice("ds:positive_contact:".length);
        try { entityId = decodeURIComponent(entityId); } catch { /* Mantém o ID original. */ }
        state.socialObservations.push({ entityId, interaction: "peaceful" });
        entity.removeTag(tag);
      }
      pendingSocialObservations.delete(entity.id);
      const decision = decideDragonBehavior(state);
      const needsAfterDecision = synchronizeNeeds(entity, state, decision, environmentContext);
      if (socialWorldRuntime) {
        try {
          const group = socialWorldRuntime.synchronizeGroup(entity, state, decision);
          socialWorldRuntime.ensureTerritory(entity, { ...state, groupId: group?.id ?? state.groupId });
        } catch {
          synchronizeSocialGroup(entity, state, decision);
        }
      } else synchronizeSocialGroup(entity, state, decision);
      enforceFlightLimits(entity, state.species);
      const effectiveDecision = needsAfterDecision.activityBlocked
        ? { ...decision, action: "conserve_energy", reason: "A reserva mínima de energia bloqueou a habilidade neste ciclo." }
        : decision;
      try {
        writeSocialMemory(entity, decision.socialMemory ?? []);
      } catch {
        // Uma falha de persistência não deve impedir a ação do dragão neste ciclo.
      }
      if (state.species === "earth" && decision.migrationStatus?.due === true) {
        if (!entity.hasTag("ds:migration_due")) entity.addTag("ds:migration_due");
      } else if (entity.hasTag("ds:migration_due")) {
        entity.removeTag("ds:migration_due");
      }
      publishIntent(entity, effectiveDecision.action);
      executeDragonAction(entity, effectiveDecision, nearby, {
        threatDetected: state.threatDetected,
        immediateDanger: environmentContext.immediateHazard === true,
        currentTick
      });
    } catch {
      // Uma entidade inválida não deve interromper a IA das demais.
    }
  }
}

system.runInterval(() => {
  for (const dimensionId of DIMENSIONS) {
    try {
      updateDimension(world.getDimension(dimensionId), system.currentTick);
    } catch {
      // Dimensão indisponível: será consultada no próximo ciclo.
    }
  }
}, TICK_INTERVAL);
