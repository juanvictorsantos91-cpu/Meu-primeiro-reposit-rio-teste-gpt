const ACTIONS_WITH_MOVEMENT = new Set([
  "retreat_to_safety", "move_away_from_environmental_hazard",
  "search_food_safely", "explore_environment", "travel_in_small_group",
  "travel_in_pair", "travel_in_large_group", "travel_with_species_group",
  "travel_with_mixed_earth_lava_group", "seek_group_members",
  "begin_long_migration", "follow_owner", "stay_near_owner",
  "approach_compatible_mate", "socialize_with_dragon", "coordinate_mixed_territory_patrol", "seek_shelter_during_storm"
]);


const ELEMENTAL_EFFECTS = Object.freeze({
  release_acid_jet: { damage: 7, radius: 8, effect: "slowness", duration: 60 },
  create_temporary_acid_pool: { damage: 2, radius: 4, effect: "slowness", duration: 80 },
  raise_sandstorm: { damage: 0, radius: 8, effect: "blindness", duration: 60 },
  release_blinding_light_pulse: { damage: 1, radius: 7, effect: "blindness", duration: 80 },
  release_radiation_pulse: { damage: 4, radius: 7, effect: "weakness", duration: 100 },
  activate_cumulative_exposure_field: { damage: 1, radius: 6, effect: "weakness", duration: 120 },
  release_fire_breath: { damage: 8, radius: 7, effect: "slowness", duration: 40, fireSeconds: 3 },
  create_flame_projectile: { damage: 9, radius: 10, effect: "slowness", duration: 40, fireSeconds: 4 },
  release_water_jet: { damage: 4, radius: 7, effect: "slowness", duration: 60, knockback: 0.7 },
  release_frost_breath: { damage: 5, radius: 6, effect: "slowness", duration: 120 },
  release_electric_discharge: { damage: 8, radius: 6, effect: "slowness", duration: 50, knockback: 0.45 },
  release_magma_wave: { damage: 10, radius: 5, effect: "slowness", duration: 60, fireSeconds: 4 },
  breathe_venom: { damage: 3, radius: 6, effect: "poison", duration: 120 },
  spit_venom: { damage: 5, radius: 9, effect: "poison", duration: 100 },
  release_camouflage_mist: { damage: 0, radius: 5, effect: "blindness", duration: 60 },
  release_plasma_breath: { damage: 9, radius: 7, effect: "weakness", duration: 80 },
  release_plasma_discharge: { damage: 11, radius: 6, effect: "slowness", duration: 80, knockback: 0.5 },
  fire_ionized_projectile: { damage: 7, radius: 10, effect: "weakness", duration: 80 },
  create_plasma_arc: { damage: 8, radius: 6, effect: "weakness", duration: 100, knockback: 0.4 },
  activate_plasma_overload: { damage: 12, radius: 5, effect: "weakness", duration: 100, knockback: 0.8 },
  perform_sonic_impact_wave: { damage: 3, radius: 6, effect: "slowness", duration: 40, knockback: 1.0 },
  perform_disorienting_roar: { damage: 1, radius: 7, effect: "slowness", duration: 100 }
});

function executeElementalEffect(entity, action, nearbyEntities, currentTick = 0) {
  const spec = ELEMENTAL_EFFECTS[action];
  if (!spec) return null;
  const targets = nearbyEntities.filter(target => target.id !== entity.id &&
    (target.hasTag?.("ds:hostile") || isHostileType(target.typeId)) &&
    Math.hypot(target.location.x - entity.location.x, target.location.y - entity.location.y,
      target.location.z - entity.location.z) <= spec.radius);
  let affected = 0;
  for (const target of targets) {
    try {
      if (spec.damage > 0) target.applyDamage?.(spec.damage);
      if (spec.effect) target.addEffect?.(spec.effect, spec.duration, { amplifier: 0, showParticles: false });
      if (spec.fireSeconds) target.setOnFire?.(spec.fireSeconds, true);
      if (spec.knockback) {
        const direction = normalizedDirection(entity.location, target.location);
        target.applyKnockback?.({ x: direction.x, z: direction.z }, spec.knockback);
      }
      if (action === "release_radiation_pulse" || action === "activate_cumulative_exposure_field") {
        const tags = target.getTags?.() ?? [];
        const previous = tags.find(tag => tag.startsWith("ds:exposure:"));
        const level = Math.min(3, (previous ? Number(previous.slice("ds:exposure:".length)) : 0) + 1);
        if (previous) target.removeTag(previous);
        target.addTag("ds:exposure:" + level);
        if (level >= 3) target.addEffect?.("slowness", 160, { amplifier: 1, showParticles: false });
      }
      affected++;
    } catch { /* Um alvo inválido não interrompe os demais. */ }
  }
  return { executed: true, action, affectedTargets: affected, radius: spec.radius };
}

function normalizedDirection(from, to) {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  return { x: dx / length, y: dy / length, z: dz / length };
}

function isHostileType(typeId = "") {
  return /minecraft:(zombie|husk|drowned|skeleton|stray|bogged|creeper|spider|cave_spider|witch|pillager|vindicator|ravager|phantom|warden|blaze|ghast|magma_cube|slime)$/.test(typeId);
}

function findById(entities, id) {
  return entities.find(entity => entity.id === id);
}

export function executeDragonAction(entity, decision, nearbyEntities = [], context = {}) {
  if (!entity || !decision || typeof decision.action !== "string") {
    return { executed: false, reason: "invalid_input" };
  }
  const action = decision.action;
  try {
    if (action === "land_safely" || action === "stay_in_place" ||
        action === "rest_in_preferred_habitat" || action === "observe_environment") {
      entity.clearVelocity?.();
      entity.addTag("ds:executor:stable");
      return { executed: true, action, mode: "stabilize" };
    }

    if (action === "hunt_selected_prey" || action === "hunt_urgent_prey" ||
        action === "coordinate_cooperative_hunt" || action === "search_food" ||
        action === "consider_food" || action === "search_food_safely") {
      const prey = findById(nearbyEntities, decision.huntingPlan?.selectedPreyId);
      const tags = prey?.getTags?.() ?? [];
      const energyTag = entity.getTags().find(tag => tag.startsWith("ds:energy:"));
      const currentEnergy = energyTag ? Number(energyTag.slice("ds:energy:".length)) : 100;
      if (!prey || tags.includes("ds:tamed") || tags.includes("ds:owned") ||
          tags.includes("ds:farm") || tags.includes("ds:baby") ||
          tags.includes("ds:protected") || !tags.includes("ds:wild")) {
        entity.addTag("ds:executor:target_unavailable");
        return { executed: false, action, reason: "prey_not_verified_as_safe_wild" };
      }
      if (context.threatDetected === true || context.immediateDanger === true ||
          (entity.getComponent?.("minecraft:health")?.currentValue ?? 100) <= 20 || currentEnergy <= 12) {
        return { executed: false, action, reason: "hunt_abandoned_for_safety" };
      }
      const distance = Math.sqrt(
        (entity.location.x-prey.location.x)**2 +
        (entity.location.y-prey.location.y)**2 +
        (entity.location.z-prey.location.z)**2
      );
      const direction = normalizedDirection(entity.location, prey.location);
      if (distance > 2.5) {
        entity.applyImpulse({ x: direction.x * 0.12, y: direction.y * 0.035, z: direction.z * 0.12 });
        if (energyTag) entity.removeTag(energyTag);
        entity.addTag("ds:energy:" + Math.max(0, currentEnergy - 2));
        entity.addTag("ds:hunt:approaching");
        return { executed: true, action, mode: "approach_and_pursue", targetId: prey.id };
      }
      entity.removeTag("ds:hunt:approaching");
      const beforeHealth = prey.getComponent?.("minecraft:health")?.currentValue;
      const hit = prey.applyDamage?.(6);
      if (energyTag) entity.removeTag(energyTag);
      entity.addTag("ds:energy:" + Math.max(0, currentEnergy - 5));
      const afterHealth = prey.getComponent?.("minecraft:health")?.currentValue;
      if (hit && ((Number.isFinite(afterHealth) && afterHealth <= 0) ||
          (Number.isFinite(beforeHealth) && beforeHealth <= 6))) {
        const hungerTag = entity.getTags().find(tag => tag.startsWith("ds:hunger:"));
        const hunger = hungerTag ? Number(hungerTag.slice("ds:hunger:".length)) : 100;
        if (hungerTag) entity.removeTag(hungerTag);
        entity.addTag("ds:hunger:" + Math.min(100, Math.max(0, hunger) + 30));
        entity.addTag("ds:hunt:fed");
        return { executed: true, action, mode: "feed_and_restore_hunger", targetId: prey.id, restoredHunger: 30 };
      }
      return { executed: Boolean(hit), action, mode: "attack_prey", targetId: prey.id,
        damage: hit ? 6 : 0, targetHealthBefore: beforeHealth };
    }

    if (action === "perform_wind_gust" || action === "perform_aerial_push") {
      const targets = nearbyEntities.filter(target =>
        target.id !== entity.id && (target.hasTag?.("ds:hostile") || isHostileType(target.typeId))
      );
      for (const target of targets) {
        const direction = normalizedDirection(entity.location, target.location);
        target.applyKnockback?.({ x: direction.x, z: direction.z }, 0.65);
      }
      return { executed: targets.length > 0, action, affectedTargets: targets.length };
    }

    if (ACTIONS_WITH_MOVEMENT.has(action)) {
      const target = context.targetEntity;
      if (target?.location) {
        const direction = normalizedDirection(entity.location, target.location);
        entity.applyImpulse({ x: direction.x * 0.08, y: direction.y * 0.025, z: direction.z * 0.08 });
        return { executed: true, action, mode: "move_toward_context_target" };
      }
      if (action === "retreat_to_safety" || action === "move_away_from_environmental_hazard") {
        const away = context.dangerLocation
          ? normalizedDirection(context.dangerLocation, entity.location)
          : { x: 0, y: 0, z: 1 };
        entity.applyImpulse({ x: away.x * 0.12, y: 0.04, z: away.z * 0.12 });
        return { executed: true, action, mode: "move_away" };
      }
    }

    // Ações complexas permanecem declaradas como intenção até que a entidade
    // tenha eventos/componentes específicos (ovo, ninho, voo animado, escavação).
    for (const tag of entity.getTags()) {
      if (tag.startsWith("ds:action:")) entity.removeTag(tag);
    }
    entity.addTag(`ds:action:${action}`);
    return { executed: false, action, reason: "requires_species_entity_event" };
  } catch (error) {
    return { executed: false, action, reason: "bedrock_api_error", message: String(error) };
  }
}
