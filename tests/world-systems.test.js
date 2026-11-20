import test from "node:test";
import assert from "node:assert/strict";
import { assessEnvironment, scoreEnvironmentCandidate } from "../src/ai/environment-awareness.js";
import { assessTerritory, evaluateNestSite } from "../src/ai/territory.js";
import { assessHuntingPlan } from "../src/ai/hunting.js";
import { assessLifeCycle, getLifeStage, LIFE_STAGE_TICKS } from "../src/ai/life-cycle.js";

const healthy = (species, extra = {}) => ({
  id: "dragon-1", species, energy: 90, hunger: 40, health: 100, ...extra
});

test("percepção ambiental reconhece habitat e recursos por espécie", () => {
  const water = assessEnvironment("water", { tags: ["river", "lush"], waterNearby: true });
  assert.equal(water.habitatMatch, true);
  assert.equal(water.resources.water, true);
  assert.equal(assessEnvironment("ice", { tags: ["snow", "ice"] }).habitatMatch, true);
  assert.equal(assessEnvironment("lava", { tags: ["volcanic", "lava"] }).habitatMatch, true);
});

test("perigos ambientais reduzem segurança e recomendam afastamento", () => {
  const result = assessEnvironment("earth", { lavaNearby: true, fallRisk: true });
  assert.equal(result.immediateHazard, true);
  assert.equal(result.recommendation, "move_away_from_environmental_hazard");
  assert.equal(scoreEnvironmentCandidate("earth", { lavaNearby: true }), 0);
});

test("avaliação territorial reconhece invasão e protege o ninho", () => {
  const self = healthy("earth");
  const intruder = { id: "intruder", distance: 12, territoryId: "forest-home", nearNest: true };
  const result = assessTerritory(self, [intruder], { territoryId: "forest-home" });
  assert.equal(result.territoryIntruded, true);
  assert.equal(result.nestThreatened, true);
  assert.equal(result.action, "guard_nest");
});

test("avaliação de ninho rejeita locais perigosos", () => {
  const safe = evaluateNestSite("earth", { tags: ["forest", "cave"], hidden: true, protectedFromWeather: true });
  const unsafe = evaluateNestSite("earth", { tags: ["forest"], predatorNearby: true, floodRisk: true });
  assert.equal(safe.suitable, true);
  assert.equal(unsafe.suitable, false);
});

test("caça seleciona presa adequada e exclui animais do jogador", () => {
  const prey = [
    { id: "farm-cow", foodId: "beef", distance: 2, isFarmAnimal: true },
    { id: "wild-rabbit", foodId: "rabbit", dietCategory: "small_animals", distance: 8, risk: 5 },
    { id: "wild-cow", foodId: "beef", dietCategory: "land_animals", distance: 15, risk: 10 }
  ];
  const result = assessHuntingPlan(healthy("electric", { hunger: 35 }), prey);
  assert.equal(result.selectedPreyId, "wild-rabbit");
  assert.equal(result.protectedPreyExcluded, true);
});

test("caça cooperativa só é sugerida quando há necessidade e condições físicas", () => {
  const result = assessHuntingPlan(healthy("water", { hunger: 45 }), [
    { id: "fish-1", foodId: "salmon", dietCategory: "fish", distance: 5, risk: 5 }
  ], { compatibleHuntersNearby: true });
  assert.equal(result.action, "coordinate_cooperative_hunt");
});

test("ciclo de vida progride de filhote a jovem e adulto", () => {
  assert.equal(getLifeStage(0), "hatchling");
  assert.equal(getLifeStage(LIFE_STAGE_TICKS.hatchling), "juvenile");
  assert.equal(getLifeStage(LIFE_STAGE_TICKS.hatchling + LIFE_STAGE_TICKS.juvenile), "adult");
  assert.equal(getLifeStage(0, true), "egg");
});

test("cuidado parental e eclosão dependem de condições", () => {
  const hatchling = healthy("fire", { id: "baby", ageTicks: 100, hunger: 40, parentIds: ["parent"] });
  const parent = healthy("fire", { id: "parent", ageTicks: 999999, parentIds: [] });
  const care = assessLifeCycle(hatchling, [parent]);
  assert.equal(care.parentalAction, "feed_young");
  const egg = healthy("ice", { isEgg: true, incubationProgress: 100 });
  assert.equal(assessLifeCycle(egg, [], { incubationConditionsValid: true }).eggReadyToHatch, true);
  assert.equal(assessLifeCycle(egg, [], { incubationConditionsValid: false }).eggReadyToHatch, false);
});

test("reprodução natural exige ninho, ambiente seguro e parceiro elegível", () => {
  const adult = healthy("water", {
    lifeStage: "adult", ageTicks: 500000, nestReady: true,
    pairCompatible: true, safeToPair: true, reproductionCooldownTicks: 0
  });
  const mate = { ...adult, id: "dragon-2" };
  const plan = assessLifeCycle(adult, [mate], { environmentSafe: true });
  assert.equal(plan.canAttemptBreeding, true);
  assert.equal(plan.mateCandidateId, "dragon-2");
});
