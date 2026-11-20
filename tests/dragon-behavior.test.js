import test from "node:test";
import assert from "node:assert/strict";
import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";
import { behaviorProfiles, getBehaviorProfile } from "../src/species/behavior-profiles.js";
import { getSocialGroupPlan } from "../src/ai/social-groups.js";
import { assessDragonRelationships, classifyDragonRelationship, isEligiblePair } from "../src/ai/dragon-relationships.js";
import { ELECTRIC_MIGRATION_CYCLE_TICKS, getMigrationStatus } from "../src/ai/migration-cycle.js";
import { assessSocialInteractions } from "../src/ai/social-interactions.js";
import { assessTerritorialInvasion } from "../src/ai/territory.js";

const healthy = (species, extra = {}) => ({
  species, energy: 90, hunger: 90, health: 100,
  immediateDanger: false, safeToExplore: true, ...extra
});

test("as quinze espécies possuem personalidades próprias", () => {
  assert.deepEqual(Object.keys(behaviorProfiles).sort(), [
    "acid", "earth", "electric", "fire", "ice", "lava", "light", "plasma", "poison", "radioactive", "sand", "shadow", "sound", "water", "wind"
  ]);
  for (const profile of Object.values(behaviorProfiles)) {
    for (const trait of ["aggression", "caution", "curiosity", "protectiveness", "sociability", "independence"]) {
      assert.ok(profile[trait] >= 0 && profile[trait] <= 1);
    }
    assert.ok(profile.preferredActivities.length > 0);
  }
});

test("o MIS mantém prioridade sobre comportamentos de rotina", () => {
  const result = decideDragonBehavior(healthy("fire", {
    energy: 10, hunger: 90, health: 100, immediateDanger: true
  }));
  assert.equal(result.system, "MIS");
  assert.equal(result.action, "escape_danger");
});

test("cada espécie escolhe comportamento associado ao seu ambiente", () => {
  const cases = [
    ["electric", "mountain", "scan_high_ground"],
    ["water", "water", "swim_patrol"],
    ["ice", "snow", "observe_quietly"],
    ["fire", "hot", "patrol_territory"],
    ["earth", "forest", "dig_explore"],
    ["lava", "volcanic", "patrol_hot_ground"]
  ];
  for (const [species, environment, expected] of cases) {
    const result = decideDragonBehavior(healthy(species, { environment }));
    assert.equal(result.action, expected);
    assert.equal(result.system, "DBS");
  }
});

test("dragão protege filhotes e ninho antes de atividades naturais", () => {
  assert.equal(decideDragonBehavior(healthy("earth", {
    hasYoung: true, youngInDanger: true, nestThreatened: true
  })).action, "protect_young");
  assert.equal(decideDragonBehavior(healthy("water", {
    nestThreatened: true
  })).action, "guard_nest");
});

test("personalidade e condição física influenciam resposta a ameaças", () => {
  assert.equal(decideDragonBehavior(healthy("fire", {
    threatDetected: true
  })).action, "confront_threat");
  assert.equal(decideDragonBehavior(healthy("water", {
    threatDetected: true
  })).action, "keep_distance_and_observe");
  assert.equal(decideDragonBehavior(healthy("fire", {
    threatDetected: true, health: 30
  })).action, "retreat_to_safety");
});

test("vínculo permite proteger e acompanhar o dono", () => {
  assert.equal(decideDragonBehavior(healthy("electric", {
    ownerInDanger: true, bondLevel: 2
  })).action, "defend_owner");
  assert.equal(decideDragonBehavior(healthy("ice", {
    ownerNearby: true, bondLevel: 3
  })).action, "stay_near_owner");
});

test("comandos reconhecidos do treinamento são executados", () => {
  assert.equal(decideDragonBehavior(healthy("earth", {
    trainingCommand: "return_nest"
  })).action, "return_to_nest");
  assert.equal(decideDragonBehavior(healthy("lava", {
    trainingCommand: "stay"
  })).action, "stay_in_place");
});

test("descanso seguro, socialização e exploração são considerados", () => {
  assert.equal(decideDragonBehavior(healthy("earth", {
    energy: 50, safeToRest: true
  })).action, "rest_in_preferred_habitat");
  assert.equal(decideDragonBehavior(healthy("water", {
    compatibleDragonNearby: true, socialOpportunity: true
  })).action, "socialize_with_dragon");
  assert.equal(decideDragonBehavior(healthy("electric", {
    environment: "plains", safeToExplore: true
  })).action, "explore_environment");
});


test("as cinco novas espécies expõem ações elementais condicionadas por energia e contexto", () => {
  assert.equal(decideDragonBehavior(healthy("acid", {
    acidJetRequested: true, threatDetected: true, energy: 60
  })).action, "release_acid_jet");
  assert.equal(decideDragonBehavior(healthy("sand", {
    sandstormRequested: true, threatDetected: true, energy: 60
  })).action, "raise_sandstorm");
  assert.equal(decideDragonBehavior(healthy("light", {
    lightPulseRequested: true, threatDetected: true, energy: 60
  })).action, "release_blinding_light_pulse");
  assert.equal(decideDragonBehavior(healthy("radioactive", {
    radiationPulseRequested: true, threatDetected: true, energy: 60
  })).action, "release_radiation_pulse");
  assert.equal(decideDragonBehavior(healthy("shadow", {
    shadowStepRequested: true, darknessNearby: true, energy: 60
  })).action, "perform_shadow_step");
  assert.notEqual(decideDragonBehavior(healthy("shadow", {
    shadowStepRequested: true, darknessNearby: false, energy: 60
  })).action, "perform_shadow_step");
});

test("espécie desconhecida é rejeitada", () => {
  assert.throws(() => getBehaviorProfile("unknown"), RangeError);
});

test("padrões sociais naturais usam grupos territoriais e exceções solitárias", () => {
  for (const species of ["earth", "lava", "wind"]) {
    assert.equal(getBehaviorProfile(species).socialPattern, "territorial_groups");
    assert.ok(getBehaviorProfile(species).preferredGroupSize > 4);
    assert.equal(getBehaviorProfile(species).patrolStyle, "distributed_patrol");
  }
  assert.equal(getBehaviorProfile("fire").internalPairing, true);
  assert.equal(getBehaviorProfile("ice").internalPairing, true);
  assert.equal(getBehaviorProfile("electric").socialPattern, "solitary");
  assert.equal(getBehaviorProfile("poison").socialPattern, "solitary");
  assert.equal(getBehaviorProfile("plasma").socialPattern, "solitary");
  assert.equal(getBehaviorProfile("water").preferredGroupSize, 3);
  assert.equal(getBehaviorProfile("fire").preferredGroupSize, 2);
  assert.equal(getBehaviorProfile("ice").preferredGroupSize, 2);
  assert.equal(getBehaviorProfile("earth").preferredGroupSize, 6);
  assert.equal(getBehaviorProfile("lava").preferredGroupSize, 6);
  assert.equal(getBehaviorProfile("sound").preferredGroupSize, 3);
  assert.equal(getBehaviorProfile("electric").migrationPattern, "long_cycle");
});

test("grupos respeitam o tamanho social definido para cada espécie", () => {
  for (const species of ["earth", "lava"]) {
    const result = decideDragonBehavior(healthy(species, {
      nearbySameSpeciesCount: 2, safeToExplore: true
    }));
    assert.equal(result.action, "seek_group_members");
  }
  for (const species of ["water", "fire", "ice"]) {
    const result = decideDragonBehavior(healthy(species, {
      nearbySameSpeciesCount: 2, safeToExplore: true
    }));
    assert.equal(result.action, "organize_territory_patrol_group");
  }
});

test("dragões elétricos permanecem solitários e migram em ciclos longos seguros", () => {
  const alone = decideDragonBehavior(healthy("electric", {
    nearbySameSpeciesCount: 3, sameSpeciesGroupNearby: true
  }));
  assert.notEqual(alone.action, "travel_in_large_group");
  assert.notEqual(alone.action, "travel_in_small_group");
  const migrate = decideDragonBehavior(healthy("electric", {
    migrationDue: true, migrationRouteSafe: true
  }));
  assert.equal(migrate.action, "begin_long_migration");
  const unsafe = decideDragonBehavior(healthy("electric", {
    migrationDue: true, migrationRouteSafe: false
  }));
  assert.notEqual(unsafe.action, "begin_long_migration");
});


test("planejador social respeita o tamanho preferido de cada espécie", () => {
  const cases = [
    ["water", 3, 1, "seek_group_members"],
    ["fire", 2, 0, "seek_group_members"],
    ["ice", 2, 0, "seek_group_members"],
    ["earth", 6, 2, "seek_group_members"],
    ["lava", 6, 2, "seek_group_members"]
  ];

  for (const [species, target, nearby, action] of cases) {
    const plan = getSocialGroupPlan(species, nearby);
    assert.equal(plan.targetGroupSize, target);
    assert.equal(plan.observedGroupSize, nearby + 1);
    assert.equal(plan.action, action);
  }
});

test("o elétrico mantém padrão solitário mesmo com outros dragões próximos", () => {
  const plan = getSocialGroupPlan("electric", 5);
  assert.equal(plan.targetGroupSize, 1);
  assert.equal(plan.action, "remain_solo");
  assert.equal(plan.seekingMembers, false);
});

test("o plano social é incluído nas decisões DBS e não substitui o MIS", () => {
  const normal = decideDragonBehavior(healthy("water", {
    nearbySameSpeciesCount: 1
  }));
  assert.equal(normal.groupPlan.targetGroupSize, 3);
  assert.equal(normal.groupPlan.action, "seek_group_members");

  const critical = decideDragonBehavior(healthy("water", {
    energy: 10, immediateDanger: true, nearbySameSpeciesCount: 2
  }));
  assert.equal(critical.system, "MIS");
  assert.equal(critical.groupPlan, undefined);
});

test("o planejador rejeita quantidades inválidas de indivíduos próximos", () => {
  assert.throws(() => getSocialGroupPlan("water", -1), RangeError);
  assert.throws(() => getSocialGroupPlan("water", 1.5), RangeError);
});


test("reconhece pais, filhos, irmãos, parceiros e dragões da mesma espécie", () => {
  const parent = { id: "p1", species: "earth" };
  const child = { id: "c1", species: "earth", parentIds: ["p1"] };
  const sibling = { id: "s1", species: "earth", parentIds: ["p1"] };
  const partner = { id: "m1", species: "earth" };
  assert.equal(classifyDragonRelationship(parent, child), "child");
  assert.equal(classifyDragonRelationship(child, parent), "parent");
  assert.equal(classifyDragonRelationship(child, sibling), "sibling");
  assert.equal(classifyDragonRelationship({ id: "x", species: "earth", partnerId: "m1" }, partner), "partner");
  assert.equal(classifyDragonRelationship(parent, { id: "z", species: "earth" }), "same_species");
});

test("casais exigem adultos compatíveis, saudáveis, seguros e sem parentesco próximo", () => {
  const adult = {
    id: "a", species: "water", lifeStage: "adult", pairCompatible: true,
    health: 90, energy: 80, safeToPair: true, parentIds: []
  };
  const candidate = { ...adult, id: "b" };
  assert.equal(isEligiblePair(adult, candidate), true);
  assert.equal(isEligiblePair(adult, { ...candidate, lifeStage: "young" }), false);
  assert.equal(isEligiblePair(adult, { ...candidate, parentIds: ["a"] }), false);
  assert.equal(isEligiblePair(adult, { ...candidate, health: 20 }), false);
  assert.equal(isEligiblePair(adult, { ...candidate, safeToPair: false }), false);
});

test("MIS/DBS identifica parceiro potencial e não escolhe casal entre parentes", () => {
  const self = {
    id: "a", species: "ice", lifeStage: "adult", pairCompatible: true,
    health: 90, energy: 80, safeToPair: true, parentIds: []
  };
  const mate = { ...self, id: "b" };
  const plan = assessDragonRelationships(self, [mate]);
  assert.equal(plan.canFormPair, true);
  assert.equal(plan.mateCandidateId, "b");
  const sibling = { ...mate, id: "c", parentIds: ["shared-parent"] };
  const relatedSelf = { ...self, parentIds: ["shared-parent"] };
  assert.equal(assessDragonRelationships(relatedSelf, [sibling]).canFormPair, false);
});

test("cuidado parental escolhe proteger, alimentar ou aquecer filhotes", () => {
  const base = { id: "parent", species: "earth", hasYoung: true };
  assert.equal(assessDragonRelationships({ ...base, youngInDanger: true }).parentalAction, "protect_young");
  assert.equal(assessDragonRelationships({ ...base, youngNeedsFood: true }).parentalAction, "feed_young");
  assert.equal(assessDragonRelationships({ ...base, youngNeedsWarmth: true }).parentalAction, "warm_young");
  assert.equal(assessDragonRelationships({ ...base, youngNeedsCare: true }).parentalAction, "care_for_young");
});

test("DBS integra cuidado parental e aproximação de parceiro compatível", () => {
  const parental = decideDragonBehavior(healthy("earth", {
    hasYoung: true, youngNeedsFood: true
  }));
  assert.equal(parental.action, "feed_young");
  const self = {
    id: "a", species: "water", lifeStage: "adult", pairCompatible: true,
    health: 90, energy: 80, safeToPair: true, parentIds: []
  };
  const mate = { ...self, id: "b" };
  const pair = decideDragonBehavior(healthy("water", {
    ...self, nearbyDragons: [mate]
  }));
  assert.equal(pair.action, "approach_compatible_mate");
  assert.equal(pair.relationships.mateCandidateId, "b");
});


test("migração elétrica usa um ciclo longo contado em ticks do mundo", () => {
  const start = 1000;
  const before = getMigrationStatus({
    species: "electric",
    currentTick: start + ELECTRIC_MIGRATION_CYCLE_TICKS - 1,
    spawnTick: start
  });
  assert.equal(before.due, false);
  const due = getMigrationStatus({
    species: "electric",
    currentTick: start + ELECTRIC_MIGRATION_CYCLE_TICKS,
    spawnTick: start
  });
  assert.equal(due.due, true);
  assert.equal(due.progress, 1);
  const otherSpecies = getMigrationStatus({
    species: "water",
    currentTick: start + ELECTRIC_MIGRATION_CYCLE_TICKS,
    spawnTick: start
  });
  assert.equal(otherSpecies.migratory, false);
});

test("DBS inicia migração elétrica quando o ciclo longo vence e a rota está segura", () => {
  const start = 0;
  const result = decideDragonBehavior(healthy("electric", {
    currentTick: ELECTRIC_MIGRATION_CYCLE_TICKS,
    spawnTick: start,
    migrationRouteSafe: true
  }));
  assert.equal(result.action, "begin_long_migration");
  assert.equal(result.migrationStatus.due, true);
});


test("Terra e Lava formam grupos mistos e viajam juntas", () => {
  const lavaNearby = { id: "lava-1", species: "lava", lifeStage: "adult" };
  const earthNearby = { id: "earth-1", species: "earth", lifeStage: "adult" };
  const earth = decideDragonBehavior(healthy("earth", {
    nearbyDragons: [lavaNearby], nearbySameSpeciesCount: 0
  }));
  const lava = decideDragonBehavior(healthy("lava", {
    nearbyDragons: [earthNearby], nearbySameSpeciesCount: 0
  }));
  assert.equal(earth.groupPlan.action, "seek_group_members");
  assert.equal(lava.groupPlan.action, "seek_group_members");
  assert.equal(earth.groupPlan.mixedGroup, true);
  assert.equal(lava.groupPlan.mixedGroup, true);
});

test("grupos mistos Terra-Lava contam indivíduos das duas espécies", () => {
  const plan = getSocialGroupPlan("earth", 2, [
    { species: "lava", lifeStage: "adult" },
    { species: "lava", lifeStage: "young" }
  ]);
  assert.equal(plan.observedGroupSize, 5);
  assert.equal(plan.mixedCompanions, 2);
  assert.equal(plan.seekingMembers, true);
});

test("interações pacíficas entre espécies são sugeridas sem iniciar combate", () => {
  const interactions = assessSocialInteractions(
    { id: "earth-1", species: "earth" },
    [{ id: "lava-1", species: "lava" }],
    { socialOpportunity: true }
  );
  assert.equal(interactions.kind, "peaceful");
  assert.equal(interactions.action, "perform_peaceful_cross_species_interaction");
  assert.ok(interactions.peacefulInteractions[0].options.includes("cooperate_in_excavation"));
});

test("agressão entre dragões exige provocação ou conflito territorial", () => {
  const calm = decideDragonBehavior(healthy("fire", {
    nearbyDragons: [{ id: "water-1", species: "water" }]
  }));
  assert.notEqual(calm.action, "challenge_intruding_dragon");
  const conflict = decideDragonBehavior(healthy("fire", {
    nearbyDragons: [{ id: "water-1", species: "water" }],
    territoryConflict: true,
    conflictingDragonId: "water-1"
  }));
  assert.equal(conflict.action, "challenge_intruding_dragon");
  const attacked = decideDragonBehavior(healthy("ice", {
    attackedByDragon: true, attackerId: "fire-1"
  }));
  assert.equal(attacked.action, "defend_against_dragon");
});

test("dragão ferido recua diante de ataque de outro dragão", () => {
  const result = decideDragonBehavior(healthy("water", {
    health: 30, attackedByDragon: true, attackerId: "fire-1"
  }));
  assert.equal(result.action, "retreat_from_dragon_attack");
});

test("MIS mantém prioridade sobre interação social em situação crítica", () => {
  const result = decideDragonBehavior(healthy("earth", {
    energy: 8, immediateDanger: true, socialOpportunity: true,
    nearbyDragons: [{ id: "lava-1", species: "lava" }]
  }));
  assert.equal(result.system, "MIS");
  assert.equal(result.action, "escape_danger");
});


test("Dragão de Terra migra após 21 dias e coordena mudança com Lava", () => {
  const cycle = 21 * 24_000;
  const before = getMigrationStatus({ species: "earth", currentTick: cycle - 1, spawnTick: 0 });
  assert.equal(before.due, false);
  assert.equal(before.temporaryTerritory, true);
  const due = getMigrationStatus({ species: "earth", currentTick: cycle, spawnTick: 0 });
  assert.equal(due.due, true);
  const earth = decideDragonBehavior(healthy("earth", {
    currentTick: cycle, spawnTick: 0, migrationRouteSafe: true,
    nearbyDragons: [{ id: "lava-1", species: "lava", lifeStage: "adult" }]
  }));
  assert.equal(earth.action, "relocate_temporary_territory");
  assert.equal(earth.territory.relocationDue, true);
  assert.equal(earth.territory.territoryActive, false);
  assert.equal(earth.socialInteractions.migrationRoles, null);
});

test("Dragão de Terra adia mudança de território quando a rota não é segura", () => {
  const cycle = 21 * 24_000;
  const result = decideDragonBehavior(healthy("earth", {
    currentTick: cycle, spawnTick: 0, migrationRouteSafe: false
  }));
  assert.notEqual(result.action, "relocate_temporary_territory");
  assert.equal(result.migrationStatus.due, true);
});


test("Dragão de Terra usa um ciclo territorial temporário de 21 dias", () => {
  const cycle = 21 * 24_000;
  const before = getMigrationStatus({ species: "earth", currentTick: cycle - 1, spawnTick: 0 });
  assert.equal(before.due, false);
  assert.equal(before.temporaryTerritory, true);
  assert.equal(before.cycleDurationTicks, cycle);
  const due = getMigrationStatus({ species: "earth", currentTick: cycle, spawnTick: 0 });
  assert.equal(due.due, true);
  const earth = decideDragonBehavior(healthy("earth", {
    currentTick: cycle, spawnTick: 0, migrationRouteSafe: true,
    nearbyDragons: [{ id: "lava-1", species: "lava", lifeStage: "adult" }]
  }));
  assert.equal(earth.action, "relocate_temporary_territory");
  assert.equal(earth.socialInteractions.migrationRoles, null);
});

test("Dragão de Terra adia mudança de território quando a rota não é segura", () => {
  const cycle = 21 * 24_000;
  const result = decideDragonBehavior(healthy("earth", {
    currentTick: cycle, spawnTick: 0, migrationRouteSafe: false
  }));
  assert.notEqual(result.action, "relocate_temporary_territory");
  assert.equal(result.migrationStatus.due, true);
});

test("Lava reconhece convite de migração de um grupo de Terra", () => {
  const interaction = assessSocialInteractions(
    { id: "lava-1", species: "lava" },
    [{ id: "earth-1", species: "earth", temporaryTerritoryMigrationDue: true }]
  );
  assert.equal(interaction.action, "tolerate_earth_migration_passage");
  assert.equal(interaction.kind, "peaceful_passage");
});


test("invasões territoriais são raras e exigem agressividade e boas condições", () => {
  const owner = { id: "owner-1", species: "ice", territoryId: "ice-home", distance: 40 };
  const fire = assessTerritorialInvasion(healthy("fire", { id: "fire-1" }), [owner], { invasionCycle: 2 });
  assert.equal(fire.eligible, true);
  assert.equal(fire.chance, 0.035);
  assert.ok(fire.roll >= 0 && fire.roll < 1);
  const exhausted = assessTerritorialInvasion(healthy("fire", { id: "fire-2", energy: 20 }), [owner], { invasionCycle: 2 });
  assert.equal(exhausted.eligible, false);
  assert.equal(exhausted.shouldInvade, false);
  const calm = assessTerritorialInvasion(healthy("wind", { id: "wind-1" }), [owner], { invasionCycle: 2 });
  assert.equal(calm.eligible, false);
  const aggressiveWind = assessTerritorialInvasion(healthy("wind", { id: "wind-2", aggression: 0.85 }), [owner], { invasionCycle: 2 });
  assert.equal(aggressiveWind.eligible, true);
  assert.equal(aggressiveWind.chance, 0.008);
  for (const species of ["water", "plasma", "lava"]) {
    const excluded = assessTerritorialInvasion(healthy(species, { id: species + "-1", aggression: 1 }), [owner], { invasionCycle: 2 });
    assert.equal(excluded.eligible, false);
    assert.equal(excluded.shouldInvade, false);
  }
});

test("o DBS só escolhe invasão quando o plano raro é elegível", () => {
  const owner = { id: "ice-owner", species: "ice", territoryId: "ice-home", distance: 20 };
  const result = decideDragonBehavior(healthy("fire", { id: "fire-raider", nearbyDragons: [owner], currentTick: 48_000 }));
  if (result.territory.invasionPlan.shouldInvade) assert.equal(result.action, "attempt_territory_invasion");
  else assert.notEqual(result.action, "attempt_territory_invasion");
});


test("MIS reconhece dragões observados e expõe tags de memória social", () => {
  const result = decideDragonBehavior(healthy("fire", {
    id: "fire-observer",
    currentTick: 120,
    nearbyDragons: [{ id: "water-known", species: "water" }]
  }));
  assert.equal(result.socialMemory.length, 1);
  assert.deepEqual(result.socialMemory[0], {
    entityId: "water-known",
    species: "water",
    known: true,
    trust: 0,
    hostile: false,
    lastSeenTick: 120,
    encounters: 1,
    lastInteraction: null
  });
  assert.ok(result.socialMemoryTags.includes("ds:known:water-known"));
  assert.ok(result.socialMemoryTags.includes("ds:relation:water-known:trust:0"));
});

test("MIS só altera confiança ou hostilidade com evento social explícito", () => {
  const first = decideDragonBehavior(healthy("fire", {
    id: "fire-observer",
    currentTick: 200,
    nearbyDragons: [{ id: "water-known", species: "water" }]
  }));
  const peaceful = decideDragonBehavior(healthy("fire", {
    id: "fire-observer",
    currentTick: 220,
    socialMemory: first.socialMemory,
    nearbyDragons: [{ id: "water-known", species: "water" }],
    socialObservations: [{ entityId: "water-known", interaction: "peaceful" }]
  }));
  assert.equal(peaceful.socialMemory[0].trust, 1);
  assert.equal(peaceful.socialMemory[0].hostile, false);

  const hostile = decideDragonBehavior(healthy("fire", {
    id: "fire-observer",
    currentTick: 240,
    socialMemory: peaceful.socialMemory,
    nearbyDragons: [{ id: "water-known", species: "water" }],
    socialObservations: [{ entityId: "water-known", interaction: "hostile" }]
  }));
  assert.equal(hostile.socialMemory[0].hostile, true);
  assert.equal(hostile.socialMemory[0].trust, 0);
  assert.ok(hostile.socialMemoryTags.includes("ds:hostile:water-known"));
});

test("memória social também é atualizada quando uma necessidade vital domina a decisão", () => {
  const result = decideDragonBehavior(healthy("fire", {
    currentTick: 300,
    energy: 10,
    immediateDanger: true,
    nearbyDragons: [{ id: "ice-observer", species: "ice" }]
  }));
  assert.equal(result.action, "escape_danger");
  assert.equal(result.socialMemory[0].entityId, "ice-observer");
});


test("dragão evita indivíduo com hostilidade lembrada sem iniciar combate", () => {
  const result = decideDragonBehavior(healthy("water", {
    id: "water-observer",
    currentTick: 400,
    socialMemory: [{
      entityId: "fire-known-hostile",
      species: "fire",
      known: true,
      trust: 0,
      hostile: true,
      lastSeenTick: 390,
      encounters: 2,
      lastInteraction: "hostile"
    }],
    nearbyDragons: [{ id: "fire-known-hostile", species: "fire" }]
  }));
  assert.equal(result.action, "keep_distance_from_known_hostile_dragon");
  assert.equal(result.socialMemory[0].hostile, true);
});
