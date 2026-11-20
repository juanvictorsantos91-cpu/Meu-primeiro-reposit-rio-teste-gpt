import { chooseAction } from "./rule-engine.js";
import { decideSurvivalAction } from "./survival-decisions.js";
import { getBehaviorProfile } from "../species/behavior-profiles.js";
import { getSocialGroupPlan } from "./social-groups.js";
import { assessDragonRelationships } from "./dragon-relationships.js";
import { getMigrationStatus } from "./migration-cycle.js";
import { assessSocialInteractions } from "./social-interactions.js";
import { assessElectricStormRitual } from "./electric-storm-ritual.js";
import { assessEnvironment } from "./environment-awareness.js";
import { assessTerritory } from "./territory.js";
import { assessHuntingPlan } from "./hunting.js";
import { assessLifeCycle } from "./life-cycle.js";
import { assessNaturalBehavior } from "./natural-behavior.js";
import { updateSocialMemory, socialMemoryTags } from "./social-memory.js";

const commandActions = {
  follow: "follow_owner",
  stay: "stay_in_place",
  defend: "defend_owner",
  attack_target: "attack_designated_target",
  return_nest: "return_to_nest",
  land: "land_safely",
  fly_to: "travel_to_destination",
  explore: "explore_with_owner"
};

function behaviorRules(profile) {
  return [
    {
      name: "avoid-environmental-hazard", priority: 0.5,
      when: s => s.environmentAssessment?.immediateHazard === true,
      action: "move_away_from_environmental_hazard",
      reason: "O dragão evita perigos ambientais detectados antes de atividades de rotina."
    },
    {
      name: "obey-trained-command", priority: 5,
      when: s => Boolean(s.trainingCommand && commandActions[s.trainingCommand]),
      action: s => commandActions[s.trainingCommand],
      reason: "Executa um comando reconhecido do treinador."
    },
    {
      name: "protect-young", priority: 1,
      when: s => s.hasYoung === true && s.youngInDanger === true && profile.protectiveness >= 0.6,
      action: "protect_young",
      reason: "Protege os filhotes quando existe uma ameaça próxima."
    },
    {
      name: "protect-nest", priority: 2,
      when: s => profile.nestRequired !== false && s.nestThreatened === true,
      action: "guard_nest",
      reason: "A proteção do ninho é uma prioridade natural."
    },
    {
      name: "protect-owner", priority: 3,
      when: s => s.ownerInDanger === true && s.bondLevel >= 2 && profile.protectiveness >= 0.7,
      action: "defend_owner",
      reason: "Defende o dono com quem desenvolveu vínculo."
    },
    {
      name: "respond-to-threat", priority: 4,
      when: s => s.threatDetected === true,
      action: s => {
        if (s.health <= 40 || s.energy <= 25) return "retreat_to_safety";
        if (profile.aggression >= 0.7) return "confront_threat";
        if (profile.caution >= 0.8) return "keep_distance_and_observe";
        return profile.threatResponse;
      },
      reason: "Avalia a ameaça conforme saúde, energia e tendência comportamental da espécie."
    },
    {
      name: "defend-territory", priority: 4.5,
      when: s => s.territory?.territoryIntruded === true && s.territory?.canDefend === true,
      action: s => s.territory?.action ?? "challenge_territory_intruder",
      reason: "Defende o território quando a condição física permite."
    },
    {
      name: "attempt-territorial-invasion", priority: 4.4,
      when: s => s.territory?.invasionPlan?.shouldInvade === true && s.threatDetected !== true,
      action: "attempt_territory_invasion",
      reason: "Um indivíduo agressivo, saudável e em condições favoráveis tenta raramente ocupar um território vizinho; a disputa não inicia combate automaticamente."
    },
    {
      name: "follow-bonded-owner", priority: 6,
      when: s => s.ownerNearby === true && s.bondLevel >= (profile.independence >= 0.8 ? 3 : 2) && s.trainingCommand !== "stay",
      action: "stay_near_owner",
      reason: "Mantém proximidade voluntária com o dono de confiança."
    },
    {
      name: "care-for-young", priority: 7,
      when: s => (s.lifeCycle?.parentalAction ?? s.relationships?.parentalAction) != null,
      action: s => s.lifeCycle?.parentalAction ?? s.relationships?.parentalAction ?? "care_for_young",
      reason: "Cuida dos filhotes quando estão seguros e precisam de atenção."
    },
    {
      name: "long-cycle-migration", priority: 8,
      when: s => ["long_cycle", "long_cycle_nomadic"].includes(profile.migrationPattern) &&
        s.migrationDue === true && s.migrationRouteSafe === true &&
        s.ownerNearby !== true && s.hasYoung !== true,
      action: profile.territoryMode === "temporary" ? "relocate_temporary_territory" : "begin_long_migration",
      reason: profile.territoryMode === "temporary"
        ? "Encerra a permanência no território temporário e procura uma nova região após o longo ciclo; pode atravessar territórios de Lava sem exigir que esses dragões acompanhem o grupo."
        : "Inicia uma grande migração quando o ciclo natural da espécie chega e a rota é segura."
    },
    {
      name: "avoid-remembered-hostile-dragon", priority: 8.7,
      when: s => s.knownHostileNearby === true && s.threatDetected !== true,
      action: "keep_distance_from_known_hostile_dragon",
      reason: "Evita aproximação de um indivíduo que já demonstrou hostilidade, sem iniciar combate por conta própria."
    },
    {
      name: "respond-to-dragon-aggression", priority: 3.5,
      when: s => s.socialInteractions?.action && s.socialInteractions.kind !== "peaceful",
      action: s => s.socialInteractions.action,
      reason: "Responde a agressão ou conflito territorial de outro dragão sem iniciar hostilidade automaticamente."
    },
    {
      name: "electric-storm-communication-ritual", priority: 11,
      when: s => s.electricStormRitual?.eligible === true,
      action: "perform_electric_storm_communication_ritual",
      reason: "Três ou mais Dragões Elétricos realizam um voo coletivo nas nuvens e formam uma tempestade de raios como chamado de comunicação."
    },
    {
      name: "peaceful-cross-species-interaction", priority: 12,
      when: s => s.socialInteractions?.action === "perform_peaceful_cross_species_interaction",
      action: "perform_peaceful_cross_species_interaction",
      reason: "Realiza uma interação pacífica com outra espécie quando existe oportunidade segura."
    },
    {
      name: "travel-with-mixed-earth-lava-group", priority: 10,
      when: s => s.groupPlan?.mixedGroup === true && s.groupPlan?.action === "organize_territory_patrol_group" && s.safeToExplore === true,
      action: "coordinate_mixed_territory_patrol",
      reason: "Terra e Lava coordenam patrulhas distribuídas em um território compartilhado sem precisar caminhar como manada."
    },
    {
      name: "maintain-natural-group", priority: 9,
      when: s => profile.socialPattern !== "solitary" &&
        s.sameSpeciesGroupNearby === true &&
        s.groupPlan?.action !== "travel_with_mixed_earth_lava_group",
      action: "continue_distributed_territory_patrol",
      reason: "Mantém a defesa territorial por patrulhas independentes, sem exigir que todos caminhem juntos."
    },
    {
      name: "form-natural-group", priority: 10,
      when: s => profile.socialPattern !== "solitary" &&
        Number.isFinite(s.nearbySameSpeciesCount) &&
        s.nearbySameSpeciesCount >= 1 && s.safeToExplore === true,
      action: s => s.groupPlan?.action === "organize_territory_patrol_group"
        ? "organize_territory_patrol_group" : "seek_group_members",
      reason: "Procura completar um grupo territorial e organizar patrulhas independentes conforme a espécie."
    },
    {
      name: "form-compatible-pair", priority: 11,
      when: s => s.relationships?.canFormPair === true,
      action: "approach_compatible_mate",
      reason: "Procura aproximar-se de um parceiro adulto compatível e sem parentesco próximo."
    },
    {
      name: "socialize-compatible-dragon", priority: 12,
      when: s => s.compatibleDragonNearby === true && s.socialOpportunity === true && profile.sociability >= 0.5,
      action: "socialize_with_dragon",
      reason: "Interage socialmente com outro dragão compatível."
    },
    {
      name: "hatch-ready-egg", priority: 12.5,
      when: s => s.lifeCycle?.eggReadyToHatch === true,
      action: "hatch_egg",
      reason: "O ovo concluiu a incubação em condições adequadas."
    },
    {
      name: "hunt-available-prey", priority: 13,
      when: s => s.huntingPlan?.shouldHunt === true && s.huntingPlan?.selectedPreyId,
      action: s => s.huntingPlan.cooperative ? "coordinate_cooperative_hunt" : "hunt_selected_prey",
      reason: "Seleciona uma presa adequada conforme fome, risco e distância."
    },
    {
      name: "rest-in-preferred-place", priority: 14,
      when: s => s.safeToRest === true && s.energy < 65,
      action: "rest_in_preferred_habitat",
      reason: "Escolhe um local seguro e adequado para descansar."
    },
    {
      name: "natural-daily-routine", priority: 14.5,
      when: s => s.naturalBehavior?.eligible === true && s.naturalBehavior?.action,
      action: s => s.naturalBehavior.action,
      reason: "Executa hábitos naturais e autocuidado quando necessidades vitais e segurança permitem."
    },
    {
      name: "sound-group-echo-signal", priority: 8.5,
      when: s => profile.soundSensing === true && s.groupSignalRequested === true &&
        s.sameSpeciesGroupNearby === true && s.energy > 12,
      action: "signal_group_with_echoes",
      reason: "Envia um padrão de ecos para orientar ou alertar membros próximos do grupo."
    },
    {
      name: "sound-investigate-vibration", priority: 8.6,
      when: s => profile.soundSensing === true && s.unusualVibrationDetected === true &&
        s.energy > 15 && s.threatDetected !== true,
      action: "investigate_unusual_vibration",
      reason: "Investiga uma vibração incomum antes de decidir se representa presa, ameaça ou alteração no terreno."
    },
    {
      name: "sound-echo-localization", priority: 13.2,
      when: s => profile.soundSensing === true && s.soundScanRequested === true && s.energy > 10,
      action: "perform_echo_localization",
      reason: "Emite pulsos de eco para mapear obstáculos e localizar movimentos próximos."
    },
    {
      name: "sound-vibration-tracking", priority: 13.25,
      when: s => profile.soundSensing === true && s.vibrationDetected === true && s.energy > 8,
      action: "track_target_by_vibration",
      reason: "Rastreia a origem de vibrações percebidas no solo ou nas paredes."
    },
    {
      name: "sound-impact-wave", priority: 3.8,
      when: s => profile.soundCombat === true && s.sonicImpactRequested === true &&
        s.threatDetected === true && s.energy >= 25,
      action: "perform_sonic_impact_wave",
      reason: "Usa uma onda de pressão para afastar ameaças próximas."
    },
    {
      name: "sound-disorienting-roar", priority: 3.85,
      when: s => profile.soundCombat === true && s.disorientingRoarRequested === true &&
        s.threatDetected === true && s.energy >= 30,
      action: "perform_disorienting_roar",
      reason: "Emite uma frequência intensa para desorientar temporariamente um inimigo."
    },
    {
      name: "poison-ambush-wait", priority: 3.45,
      when: s => profile.poisonCombat === true && s.ambushOpportunity === true &&
        s.preyNearby === true && s.threatDetected !== true && s.energy >= 20,
      action: "wait_in_ambush",
      reason: "Permanece imóvel em cobertura e espera o momento seguro para surpreender uma presa."
    },
    {
      name: "poison-seek-cover", priority: 3.48,
      when: s => profile.poisonCamouflage === true && s.poisonCamouflageRequested === true &&
        s.camouflageSuitable !== true && s.coverTargetAvailable === true && s.energy >= 10,
      action: "move_to_shade_before_camouflage",
      reason: "Procura sombra ou vegetação densa antes de usar a nuvem de camuflagem."
    },
    {
      name: "poison-camouflage-mist", priority: 3.5,
      when: s => profile.poisonCamouflage === true &&
        s.poisonCamouflageRequested === true && s.camouflageSuitable === true &&
        (s.threatDetected === true || s.ambushOpportunity === true) && s.energy >= 20,
      action: "release_camouflage_mist",
      reason: "Libera uma nuvem de camuflagem somente em sombra ou escuridão; ela bloqueia a visão, mas não concede invisibilidade."
    },
    {
      name: "poison-venom-breath", priority: 3.6,
      when: s => profile.poisonCombat === true && s.poisonBreathRequested === true &&
        s.threatDetected === true && s.energy >= 25,
      action: "breathe_venom",
      reason: "Bafora veneno em área à frente para atingir ameaças próximas."
    },
    {
      name: "poison-venom-spit", priority: 3.7,
      when: s => profile.poisonCombat === true && s.poisonSpitRequested === true &&
        s.threatDetected === true && s.energy >= 15,
      action: "spit_venom",
      reason: "Cospe uma quantidade concentrada de veneno contra uma ameaça."
    },
    {
      name: "plasma-storm-charge", priority: 13.1,
      when: s => profile.plasmaStealth === true && s.thunderstorm === true &&
        s.energy < 80 && s.threatDetected !== true && s.safeToRest === true,
      action: "absorb_charge_from_storm",
      reason: "Aproveita a tempestade para recuperar energia em um ponto protegido, sem se expor desnecessariamente."
    },
    {
      name: "plasma-storm-shelter", priority: 13.15,
      when: s => profile.plasmaStealth === true && s.thunderstorm === true &&
        s.stormShelterAvailable === true && s.isExposed === true,
      action: "seek_shelter_during_storm",
      reason: "Procura cobertura durante a tempestade para observar o ambiente e reduzir o brilho."
    },
    {
      name: "plasma-concealment", priority: 3.3,
      when: s => profile.plasmaStealth === true && s.stealthRequested === true &&
        s.coverAvailable === true && s.isExposed !== true && s.energy >= 12,
      action: "dim_plasma_glow_and_conceal",
      reason: "Reduz o brilho das fissuras e usa cobertura para evitar ser detectado; não concede invisibilidade."
    },
    {
      name: "plasma-silent-reposition", priority: 3.4,
      when: s => profile.plasmaStealth === true && s.repositionRequested === true &&
        s.coverAvailable === true && s.energy >= 10,
      action: "reposition_silently",
      reason: "Muda de posição por uma rota protegida, evitando exposição desnecessária."
    },
    {
      name: "plasma-overload", priority: 3.5,
      when: s => profile.plasmaCombat === true && s.overloadRequested === true &&
        s.threatDetected === true && s.energy >= 45,
      action: "activate_plasma_overload",
      reason: "Eleva temporariamente a potência do plasma, com alto consumo de energia e maior luminosidade."
    },
    {
      name: "plasma-breath", priority: 3.6,
      when: s => profile.plasmaCombat === true && s.plasmaBreathRequested === true &&
        s.threatDetected === true && s.energy >= 30,
      action: "release_plasma_breath",
      reason: "Libera um fluxo concentrado de plasma contra uma ameaça."
    },
    {
      name: "plasma-discharge", priority: 3.7,
      when: s => profile.plasmaCombat === true && s.plasmaDischargeRequested === true &&
        s.threatDetected === true && s.energy >= 35,
      action: "release_plasma_discharge",
      reason: "Libera uma descarga de plasma em área próxima para afastar ameaças."
    },
    {
      name: "plasma-ionized-projectile", priority: 3.8,
      when: s => profile.plasmaCombat === true && s.ionizedProjectileRequested === true &&
        s.threatDetected === true && s.energy >= 20,
      action: "fire_ionized_projectile",
      reason: "Dispara um projétil concentrado de energia ionizada."
    },
    {
      name: "plasma-arc", priority: 3.9,
      when: s => profile.plasmaCombat === true && s.plasmaArcRequested === true &&
        s.threatDetected === true && s.energy >= 35,
      action: "create_plasma_arc",
      reason: "Cria arcos de plasma contra alvos próximos."
    },

    {
      name: "acid-corrosion-jet", priority: 3.55,
      when: s => profile.acidCombat === true && s.acidJetRequested === true &&
        s.threatDetected === true && s.energy >= 25,
      action: "release_acid_jet",
      reason: "Usa um jato corrosivo contra uma ameaça; a corrosão de blocos deve obedecer à lista restrita de alvos permitidos."
    },
    {
      name: "acid-temporary-pool", priority: 3.56,
      when: s => profile.acidCombat === true && s.acidPoolRequested === true &&
        s.threatDetected === true && s.energy >= 30,
      action: "create_temporary_acid_pool",
      reason: "Cria uma poça corrosiva temporária em área de combate, sem destruir construções indiscriminadamente."
    },
    {
      name: "sand-burrow", priority: 3.52,
      when: s => profile.sandCombat === true && s.burrowRequested === true &&
        s.sandAvailable === true && s.energy >= 15,
      action: "burrow_under_sand",
      reason: "Enterra-se em areia adequada para se esconder ou preparar uma emboscada."
    },
    {
      name: "sandstorm-attack", priority: 3.57,
      when: s => profile.sandCombat === true && s.sandstormRequested === true &&
        s.threatDetected === true && s.energy >= 30,
      action: "raise_sandstorm",
      reason: "Levanta uma cortina de areia para dificultar a aproximação de ameaças."
    },
    {
      name: "light-dazzling-pulse", priority: 3.58,
      when: s => profile.lightCombat === true && s.lightPulseRequested === true &&
        s.threatDetected === true && s.energy >= 20,
      action: "release_blinding_light_pulse",
      reason: "Emite um clarão para desorientar temporariamente uma ameaça; não cria aura protetora."
    },
    {
      name: "radioactive-exposure-pulse", priority: 3.59,
      when: s => profile.radioactiveCombat === true && s.radiationPulseRequested === true &&
        s.threatDetected === true && s.energy >= 30,
      action: "release_radiation_pulse",
      reason: "Libera um pulso energético fictício; efeitos de exposição devem ser acumulativos e controlados pelo adaptador."
    },
    {
      name: "radioactive-exposure-field", priority: 3.61,
      when: s => profile.radioactiveCombat === true && s.exposureFieldRequested === true &&
        s.threatDetected === true && s.energy >= 45,
      action: "activate_cumulative_exposure_field",
      reason: "Ativa um campo de exposição por tempo limitado, sem tratar o efeito como veneno instantâneo."
    },
    {
      name: "shadow-cloak", priority: 3.32,
      when: s => profile.shadowCloak === true && s.shadowCloakRequested === true &&
        s.darknessNearby === true && s.energy >= 15,
      action: "activate_shadow_cloak",
      reason: "Envolve o corpo em escuridão para ocultação em ambiente escuro."
    },
    {
      name: "shadow-step", priority: 3.34,
      when: s => profile.shortShadowDisplacement === true && s.shadowStepRequested === true &&
        s.darknessNearby === true && s.energy >= 25,
      action: "perform_shadow_step",
      reason: "Executa um deslocamento curto entre áreas sombreadas; não é teleporte ilimitado."
    },
    {
      name: "wind-gust-ability", priority: 13.5,
      when: s => profile.windCombat === true && s.windAbilityRequested === true && s.energy > 25 && s.threatDetected === true,
      action: "perform_wind_gust",
      reason: "Usa uma rajada de vento defensiva quando há ameaça e energia suficiente."
    },
    {
      name: "species-environment-behavior", priority: 15,
      when: s => profile.preferredEnvironment.includes(s.environment),
      action: () => profile.preferredActivities[0],
      reason: "Escolhe uma atividade natural no ambiente preferido da espécie."
    },
    {
      name: "explore-by-curiosity", priority: 16,
      when: s => s.safeToExplore === true && profile.curiosity >= 0.6,
      action: "explore_environment",
      reason: "A curiosidade da espécie favorece a exploração segura."
    },
    {
      name: "idle-observe", priority: 17,
      when: () => true,
      action: "observe_environment",
      reason: "Observa o ambiente enquanto nenhuma necessidade prioritária exige ação."
    }
  ];
}

/**
 * Integra comportamento ao MIS: necessidades críticas sempre têm precedência.
 * O contexto descreve fatos percebidos pelo adaptador do jogo; este módulo não
 * acessa a API Minecraft diretamente.
 */
export function decideDragonBehavior(state) {
  if (!state || typeof state !== "object") {
    throw new TypeError("O estado do dragão precisa ser um objeto.");
  }

  const profile = getBehaviorProfile(state.species);
  const nearbyDragons = state.nearbyDragons ?? [];
  // Reconhecimento nasce da observação; confiança/hostilidade só mudam
  // quando o adaptador fornece um evento explícito em socialObservations.
  const socialObservations = [
    ...nearbyDragons.filter(other => other && typeof other.id === "string")
      .map(other => ({ entityId: other.id, species: other.species })),
    ...(Array.isArray(state.socialObservations) ? state.socialObservations : [])
  ];
  const socialMemory = Number.isInteger(state.currentTick) && state.currentTick >= 0
    ? updateSocialMemory(state.socialMemory ?? [], socialObservations, state.currentTick)
    : (state.socialMemory ?? []);
  const socialTags = socialMemoryTags(socialMemory);
  const rememberedNearbyDragons = nearbyDragons.map(other => {
    const relation = socialMemory.find(item => item.entityId === other?.id);
    return relation ? {
      ...other,
      knownToSelf: true,
      socialTrust: relation.trust,
      hostile: relation.hostile
    } : other;
  });
  const environmentAssessment = assessEnvironment(state.species, state.environmentContext ?? state);
  const territory = assessTerritory(state, nearbyDragons, state);
  const huntingPlan = assessHuntingPlan(state, state.nearbyPrey ?? [], state);
  const lifeCycle = assessLifeCycle({ ...state, reproductionRequiresNest: profile.nestRequired !== false }, nearbyDragons, {
    environmentSafe: environmentAssessment.safetyScore >= 70 && !environmentAssessment.immediateHazard,
    incubationConditionsValid: state.incubationConditionsValid === true
  });
  const worldAssessment = { environmentAssessment, territory, huntingPlan, lifeCycle, socialMemory, socialMemoryTags: socialTags };
  const survival = decideSurvivalAction(state);
  if (survival.action !== "species_behavior") {
    return { ...survival, ...worldAssessment, system: "MIS", species: state.species ?? null };
  }

  const relationships = assessDragonRelationships(state, rememberedNearbyDragons);
  const naturalBehavior = assessNaturalBehavior(state, profile);
  const migrationStatus = Number.isInteger(state.currentTick)
    ? getMigrationStatus({
        species: state.species,
        currentTick: state.currentTick,
        spawnTick: state.spawnTick,
        lastMigrationTick: state.lastMigrationTick,
        cycleDurationTicks: state.migrationCycleTicks
      })
    : { migratory: profile.migrationPattern === "long_cycle", due: false };
  const migrationCycle = Math.floor((state.currentTick ?? 0) / (migrationStatus.cycleDurationTicks ?? 1));
  const currentTerritory = assessTerritory(state, rememberedNearbyDragons, { ...state, migrationDue: migrationStatus.due, migrationCycle, invasionCycle: Math.floor((state.currentTick ?? 0) / 24000) });
  const hostileObservation = (state.socialObservations ?? []).find(item => item.interaction === "hostile");
  const socialInteractions = assessSocialInteractions(state, rememberedNearbyDragons, {
    ...state,
    migrationDue: migrationStatus.due,
    attackedByDragon: state.attackedByDragon === true || Boolean(hostileObservation),
    attackerId: hostileObservation?.entityId ?? state.attackerId,
    socialOpportunity: state.socialOpportunity === true
  });
  const electricStormRitual = assessElectricStormRitual(state, rememberedNearbyDragons, state);
  const groupPlan = getSocialGroupPlan(
    state.species,
    Number.isInteger(state.nearbySameSpeciesCount) ? state.nearbySameSpeciesCount : 0,
    rememberedNearbyDragons
  );
  const enrichedState = {
    ...state,
    environment: state.environment ?? state.environmentContext?.tags?.[0],
    hasYoung: state.hasYoung ?? lifeCycle.needs.protection,
    ...state,
    relationships,
    socialMemory,
    socialMemoryTags: socialTags,
    knownHostileNearby: rememberedNearbyDragons.some(other => other?.hostile === true),
    naturalBehavior,
    socialInteractions,
    environmentAssessment,
    territory: currentTerritory,
    huntingPlan,
    lifeCycle,
    electricStormRitual,
    groupPlan,
    migrationDue: state.migrationDue === true || migrationStatus.due
  };
  const decision = chooseAction(enrichedState, behaviorRules(profile), "observe_environment");
  return {
    ...decision,
    action: typeof decision.action === "function" ? decision.action(enrichedState) : decision.action,
    system: "DBS",
    species: state.species,
    temperament: profile.temperament,
    relationships,
    naturalBehavior,
    ...worldAssessment,
    territory: currentTerritory,
    migrationStatus,
    groupPlan,
    socialInteractions,
    electricStormRitual
  };
}

export { commandActions };
