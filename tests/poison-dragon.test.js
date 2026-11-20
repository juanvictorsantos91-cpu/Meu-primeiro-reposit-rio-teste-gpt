import test from "node:test";
import assert from "node:assert/strict";
import { speciesProfiles, getSpeciesProfile } from "../src/species/profiles/index.js";
import { behaviorProfiles, getBehaviorProfile } from "../src/species/behavior-profiles.js";
import { getSpeciesDiet, canEat } from "../src/species/diets/species-diets.js";
import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";

const healthyPoisonDragon = extra => ({
  species: "poison", energy: 90, hunger: 90, health: 100,
  immediateDanger: false, safeToExplore: true, ...extra
});

test("Dragão Venenoso possui corpo serpentino alado, duas patas e perfil próprio", () => {
  const profile = getSpeciesProfile("poison");
  const behavior = getBehaviorProfile("poison");
  assert.equal(profile.species, "poison");
  assert.equal(behavior.bodyPlan, "long_serpentine_winged_two_legged");
  assert.equal(behavior.locomotionSupport, "two_legs");
  assert.equal(behavior.socialPattern, "solitary");
  assert.ok(profile.activityCosts.venomSpit > 0);
  assert.ok(profile.activityCosts.venomBreath > profile.activityCosts.venomSpit);
  assert.equal(getSpeciesDiet("poison").foods.includes("venomous_mobs"), true);
  assert.equal(getSpeciesDiet("poison").foods.includes("plants"), true);
  assert.equal(canEat("poison", "spider"), true);
  assert.equal(canEat("poison", "cave_spider"), true);
  assert.equal(canEat("poison", "bee"), true);
  assert.equal(canEat("poison", "spider_eye"), true);
  assert.equal(canEat("poison", "mushroom"), true);
  assert.equal(canEat("poison", "cod"), false);
});

test("Dragão Venenoso cospe veneno somente contra ameaça e com energia suficiente", () => {
  const ready = decideDragonBehavior(healthyPoisonDragon({
    poisonSpitRequested: true, threatDetected: true
  }));
  assert.equal(ready.action, "spit_venom");
  const noThreat = decideDragonBehavior(healthyPoisonDragon({
    poisonSpitRequested: true, threatDetected: false
  }));
  assert.notEqual(noThreat.action, "spit_venom");
  const tired = decideDragonBehavior(healthyPoisonDragon({
    poisonSpitRequested: true, threatDetected: true, energy: 10
  }));
  assert.notEqual(tired.action, "spit_venom");
});

test("Dragão Venenoso bafora veneno em área quando ameaçado", () => {
  const ready = decideDragonBehavior(healthyPoisonDragon({
    poisonBreathRequested: true, threatDetected: true
  }));
  assert.equal(ready.action, "breathe_venom");
});

test("camuflagem venenosa exige sombra ou escuridão e nunca concede invisibilidade", () => {
  const inShadow = decideDragonBehavior(healthyPoisonDragon({
    poisonCamouflageRequested: true, camouflageSuitable: true, threatDetected: true
  }));
  assert.equal(inShadow.action, "release_camouflage_mist");
  assert.match(inShadow.reason, /não concede invisibilidade/);
  const inBrightArea = decideDragonBehavior(healthyPoisonDragon({
    poisonCamouflageRequested: true, camouflageSuitable: false, threatDetected: true
  }));
  assert.notEqual(inBrightArea.action, "release_camouflage_mist");
});

test("camuflagem também pode preparar emboscada em local escuro", () => {
  const result = decideDragonBehavior(healthyPoisonDragon({
    poisonCamouflageRequested: true, camouflageSuitable: true,
    ambushOpportunity: true, threatDetected: false
  }));
  assert.equal(result.action, "release_camouflage_mist");
});
