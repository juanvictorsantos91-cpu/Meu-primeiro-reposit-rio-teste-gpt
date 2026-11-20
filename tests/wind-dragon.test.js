import test from "node:test";
import assert from "node:assert/strict";
import { windDragonProfile } from "../src/species/profiles/wind.js";
import { getBehaviorProfile } from "../src/species/behavior-profiles.js";
import { getSpeciesDiet } from "../src/species/diets/species-diets.js";
import { assessEnvironment } from "../src/ai/environment-awareness.js";
import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";

test("Dragão de Vento possui perfil metabólico próprio", () => {
  assert.equal(windDragonProfile.species, "wind");
  assert.equal(windDragonProfile.activityCosts.glideWithWind, 0.25);
  assert.ok(windDragonProfile.activityCosts.fly < windDragonProfile.activityCosts.fastFly);
});

test("Dragão de Vento tem personalidade exploradora e habitat de correntes de ar", () => {
  const profile = getBehaviorProfile("wind");
  assert.equal(profile.temperament, "independent_explorer");
  assert.ok(profile.preferredEnvironment.includes("wind"));
  assert.ok(profile.preferredActivities.includes("glide_with_wind"));
});

test("Dragão de Vento tem dieta cadastrada", () => {
  assert.deepEqual(getSpeciesDiet("wind").preferred, ["rabbit", "chicken", "salmon"]);
});

test("ambiente de altitude e vento favorece o Dragão de Vento", () => {
  const result = assessEnvironment("wind", { tags: ["wind", "high_altitude"] });
  assert.equal(result.habitatMatch, true);
});

test("DBS escolhe planar quando há corrente de ar e segurança", () => {
  const result = decideDragonBehavior({
    species: "wind", energy: 85, hunger: 85, health: 100,
    safeToExplore: true, safeToRest: true,
    environmentContext: { tags: ["wind", "high_altitude"] }
  });
  assert.equal(result.action, "glide_with_wind");
});
