// Evento raro: intervalo mínimo de sete dias Minecraft.
export const ELECTRIC_STORM_RITUAL_COOLDOWN_TICKS = 7 * 24_000;
export const ELECTRIC_STORM_RITUAL_MIN_ENERGY = 60;
export const ELECTRIC_STORM_RITUAL_MIN_HEALTH = 60;

/**
 * Avalia o ritual coletivo dos Elétricos. O adaptador fornece os dragões
 * detectados, a segurança do voo entre nuvens e o relógio do mundo.
 * A função apenas produz uma intenção; não altera o clima do Minecraft.
 */
export function assessElectricStormRitual(self, nearbyDragons = [], context = {}) {
  if (!self || typeof self !== "object" || !Array.isArray(nearbyDragons)) {
    throw new TypeError("Estado próprio e dragões próximos são necessários.");
  }

  if (self.species !== "electric") {
    return { eligible: false, action: null, participantIds: [], reason: "wrong_species" };
  }

  const participants = [
    self,
    ...nearbyDragons.filter(dragon =>
      dragon && dragon.species === "electric" &&
      dragon.id !== self.id &&
      (dragon.lifeStage === undefined || dragon.lifeStage === "adult")
    )
  ].filter(dragon =>
    (dragon.lifeStage === undefined || dragon.lifeStage === "adult") &&
    Number.isFinite(dragon.energy) && dragon.energy >= ELECTRIC_STORM_RITUAL_MIN_ENERGY &&
    Number.isFinite(dragon.health) && dragon.health >= ELECTRIC_STORM_RITUAL_MIN_HEALTH
  );

  if (participants.length < 3) {
    return { eligible: false, action: null, participantIds: [], reason: "fewer_than_three_ready_dragons" };
  }
  if (context.cloudLayerAvailable !== true || context.cloudFlightSafe !== true) {
    return { eligible: false, action: null, participantIds: [], reason: "unsafe_or_unavailable_cloud_layer" };
  }
  if (context.threatDetected === true || context.immediateDanger === true) {
    return { eligible: false, action: null, participantIds: [], reason: "danger_detected" };
  }
  if (!Number.isInteger(context.currentTick)) {
    return { eligible: false, action: null, participantIds: [], reason: "world_tick_unavailable" };
  }
  if (Number.isInteger(self.lastStormRitualTick) &&
      context.currentTick - self.lastStormRitualTick < ELECTRIC_STORM_RITUAL_COOLDOWN_TICKS) {
    return { eligible: false, action: null, participantIds: [], reason: "ritual_cooldown" };
  }

  return {
    eligible: true,
    action: "perform_electric_storm_communication_ritual",
    participantIds: participants.map(dragon => dragon.id).filter(Boolean),
    participantCount: participants.length,
    signal: {
      type: "collective_storm_call",
      style: "high_altitude_circling_and_electric_pulses",
      effect: "form_lightning_storm_above_clouds",
      purpose: "long_distance_species_communication"
    },
    cooldownTicks: ELECTRIC_STORM_RITUAL_COOLDOWN_TICKS,
    reason: "three_or_more_healthy_adult_electric_dragons_met_in_safe_clouds"
  };
}
