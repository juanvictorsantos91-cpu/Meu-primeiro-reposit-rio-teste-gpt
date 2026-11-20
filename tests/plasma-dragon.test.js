import test from "node:test";
import assert from "node:assert/strict";
import { getSpeciesProfile, speciesProfiles } from "../src/species/profiles/index.js";
import { getBehaviorProfile, behaviorProfiles } from "../src/species/behavior-profiles.js";
import { getSpeciesDiet, canEat } from "../src/species/diets/species-diets.js";
import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";
import { assessLifeCycle } from "../src/ai/life-cycle.js";

const healthyPlasma = extra => ({
  species: "plasma", energy: 90, hunger: 90, health: 100,
  immediateDanger: false, safeToExplore: true, ...extra
});

test("Dragão de Plasma possui porte médio, anatomia padrão e raridade extrema", () => {
  const profile = getSpeciesProfile("plasma");
  const behavior = getBehaviorProfile("plasma");
  assert.equal(profile.species, "plasma");
  assert.equal(behavior.bodyPlan, "standard_medium_four_legged_two_winged");
  assert.equal(behavior.locomotionSupport, "four_legs_and_two_wings");
  assert.equal(behavior.spawnRarity, "extremely_rare");
  assert.equal(behavior.socialPattern, "solitary");
  assert.equal(behavior.nestRequired, false);
  assert.equal(behavior.visualSignature, "dark_scales_blue_violet_white_plasma_fissures");
  assert.equal(getSpeciesDiet("plasma").foods.includes("meat"), true);
  assert.equal(canEat("plasma", "rabbit"), true);
});

test("Dragão de Plasma reduz o brilho e se esconde quando há cobertura", () => {
  const hidden = decideDragonBehavior(healthyPlasma({
    stealthRequested: true, coverAvailable: true, isExposed: false
  }));
  assert.equal(hidden.action, "dim_plasma_glow_and_conceal");
  assert.match(hidden.reason, /não concede invisibilidade/);
  const exposed = decideDragonBehavior(healthyPlasma({
    stealthRequested: true, coverAvailable: false, isExposed: true
  }));
  assert.notEqual(exposed.action, "dim_plasma_glow_and_conceal");
});

test("Dragão de Plasma pode reposicionar-se por uma rota protegida", () => {
  const result = decideDragonBehavior(healthyPlasma({
    repositionRequested: true, coverAvailable: true
  }));
  assert.equal(result.action, "reposition_silently");
});

test("habilidades de plasma exigem ameaça e energia suficiente", () => {
  const cases = [
    [{ plasmaBreathRequested: true, threatDetected: true }, "release_plasma_breath"],
    [{ plasmaDischargeRequested: true, threatDetected: true }, "release_plasma_discharge"],
    [{ ionizedProjectileRequested: true, threatDetected: true }, "fire_ionized_projectile"],
    [{ overloadRequested: true, threatDetected: true }, "activate_plasma_overload"],
    [{ plasmaArcRequested: true, threatDetected: true }, "create_plasma_arc"]
  ];
  for (const [state, expected] of cases) {
    assert.equal(decideDragonBehavior(healthyPlasma(state)).action, expected);
  }
  const tired = decideDragonBehavior(healthyPlasma({
    plasmaBreathRequested: true, threatDetected: true, energy: 10
  }));
  assert.notEqual(tired.action, "release_plasma_breath");
});

test("Dragão de Plasma pode reproduzir sem construir ou procurar ninho", () => {
  const self = {
    id: "plasma-a", species: "plasma", lifeStage: "adult",
    pairCompatible: true, health: 90, energy: 80, safeToPair: true,
    reproductionCooldownTicks: 0, reproductionRequiresNest: false,
    parentIds: []
  };
  const mate = { ...self, id: "plasma-b" };
  const result = assessLifeCycle(self, [mate], { environmentSafe: true });
  assert.equal(result.canAttemptBreeding, true);
  assert.equal(result.mateCandidateId, "plasma-b");
});

test("Dragão de Plasma não ativa proteção de ninho", () => {
  const result = decideDragonBehavior(healthyPlasma({ nestThreatened: true }));
  assert.notEqual(result.action, "guard_nest");
});

test("Plasma está registrado no catálogo metabólico e comportamental", () => {
  assert.ok(speciesProfiles.plasma);
  assert.ok(behaviorProfiles.plasma);
});
