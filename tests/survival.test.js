import test from "node:test";
import assert from "node:assert/strict";
import { spendEnergy, recoverEnergy, canSpendEnergy } from "../src/survival/energy.js";
import { reduceHunger, feedHunger } from "../src/survival/hunger.js";
import { damageHealth, recoverHealth } from "../src/survival/health.js";
import { applyInjury, progressInjury } from "../src/survival/injuries.js";
import { tickMetabolism, feedDragon } from "../src/survival/metabolism.js";
import { decideSurvivalAction } from "../src/ai/survival-decisions.js";
import { electricDragonProfile } from "../src/species/profiles/electric.js";
import { speciesProfiles } from "../src/species/profiles/index.js";
import { getSpeciesDiet, canEat } from "../src/species/diets/species-diets.js";

test("energia nunca ultrapassa 100 nem fica abaixo de zero", () => {
  assert.equal(spendEnergy(10, 20), 0);
  assert.equal(recoverEnergy(95, 20), 100);
});

test("reserva de energia só pode ser usada em emergência", () => {
  assert.equal(canSpendEnergy(20, 10, { reserve: 15 }), false);
  assert.equal(canSpendEnergy(20, 10, { reserve: 15, emergency: true }), true);
});

test("alimentação e consumo respeitam limites da fome", () => {
  assert.equal(reduceHunger(3, 10), 0);
  assert.equal(feedHunger(95, 20), 100);
});

test("saúde respeita os limites de 0 a 100", () => {
  assert.equal(damageHealth(5, 10), 0);
  assert.equal(recoverHealth(95, 10), 100);
});

test("mantém no máximo um ferimento e prioriza o mais grave", () => {
  const light = { type: "wing", severity: "light" };
  const severe = { type: "wing", severity: "severe" };
  assert.equal(applyInjury(light, severe).severity, "severe");
  assert.equal(progressInjury({ ...severe, recovery: 95 }, 5), null);
});

test("descanso seguro recupera energia e saúde", () => {
  const before = { energy: 40, hunger: 80, health: 70, injury: null };
  const after = tickMetabolism(before, electricDragonProfile, {
    minutes: 2, resting: true, safe: true, stationary: true, environment: "night"
  });
  assert.ok(after.energy > before.energy);
  assert.ok(after.health > before.health);
});

test("perigo imediato vence as necessidades de rotina", () => {
  const result = decideSurvivalAction({
    energy: 5, hunger: 0, health: 10, immediateDanger: true
  });
  assert.equal(result.action, "escape_danger");
});

test("fome extrema leva o dragão a procurar comida", () => {
  const result = decideSurvivalAction({
    energy: 70, hunger: 10, health: 100, immediateDanger: false
  });
  assert.equal(result.action, "search_food");
});

test("alimentação recupera fome e energia com limite por refeição", () => {
  const before = { energy: 40, hunger: 20, health: 100, injury: null };
  const after = feedDragon(before, electricDragonProfile, {
    nutrition: 35, energy: 25
  });
  assert.equal(after.hunger, 55);
  assert.equal(after.energy, 55);
});


test("as quinze espécies possuem perfis metabólicos válidos", () => {
  assert.deepEqual(Object.keys(speciesProfiles).sort(), [
    "acid", "earth", "electric", "fire", "ice", "lava", "light", "plasma", "poison", "radioactive", "sand", "shadow", "sound", "water", "wind"
  ]);
  for (const profile of Object.values(speciesProfiles)) {
    assert.ok(profile.restRecoveryPerMinute > 0);
    assert.ok(profile.hungerPerMinute > 0);
    assert.ok(profile.activityCosts);
    assert.ok(profile.diet.length > 0);
  }
});

test("dietas diferenciam preferências entre espécies", () => {
  assert.equal(canEat("electric", "salmon"), true);
  assert.equal(canEat("water", "tropical_fish"), true);
  assert.equal(canEat("fire", "beef"), true);
  assert.equal(canEat("ice", "beef"), false);
  assert.equal(getSpeciesDiet("earth").foods.includes("minerals"), true);
  for (const species of ["acid", "sand", "light", "radioactive", "shadow"]) {
    assert.ok(getSpeciesDiet(species).foods.length > 0);
    assert.ok(getSpeciesDiet(species).preferred.length > 0);
  }
});

test("ambiente especial melhora recuperação conforme o perfil", () => {
  const state = { energy: 30, hunger: 80, health: 100, injury: null };
  const water = tickMetabolism(state, speciesProfiles.water, {
    minutes: 1, resting: true, safe: true, stationary: true, environment: "water"
  });
  const normal = tickMetabolism(state, speciesProfiles.water, {
    minutes: 1, resting: true, safe: true, stationary: true, environment: "plain"
  });
  assert.ok(water.energy > normal.energy);
});
