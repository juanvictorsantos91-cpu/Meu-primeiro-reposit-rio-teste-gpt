import test from "node:test";
import assert from "node:assert/strict";
import { assessEnvironment } from "../src/ai/environment-awareness.js";
import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";

test("habitats preferenciais estão distribuídos por biomas e terrenos variados", () => {
  const cases = [
    ["water", "mangrove"], ["ice", "frozen_peaks"], ["fire", "savanna"],
    ["earth", "plains"], ["lava", "basalt_deltas"], ["wind", "coast"],
    ["poison", "swamp"], ["sound", "rocky_canyon"], ["plasma", "storm_exposed"],
    ["electric", "mountain"]
  ];
  for (const [species, tag] of cases) {
    const result = assessEnvironment(species, { tags: [tag] });
    assert.equal(result.habitatMatch, true, species + " deve reconhecer " + tag);
  }
});

test("Dragão de Som pode sinalizar o grupo e investigar vibrações", () => {
  const base = { species: "sound", energy: 80, hunger: 90, health: 100, safeToExplore: true };
  assert.equal(decideDragonBehavior({ ...base, groupSignalRequested: true, sameSpeciesGroupNearby: true }).action,
    "signal_group_with_echoes");
  assert.equal(decideDragonBehavior({ ...base, unusualVibrationDetected: true }).action,
    "investigate_unusual_vibration");
});

test("Dragão Venenoso espera em emboscada e procura sombra antes de camuflar", () => {
  const base = { species: "poison", energy: 80, hunger: 90, health: 100, safeToExplore: true };
  assert.equal(decideDragonBehavior({ ...base, ambushOpportunity: true, preyNearby: true }).action,
    "wait_in_ambush");
  assert.equal(decideDragonBehavior({
    ...base, poisonCamouflageRequested: true, camouflageSuitable: false, coverTargetAvailable: true
  }).action, "move_to_shade_before_camouflage");
});

test("Dragão de Plasma aproveita tempestades e procura abrigo", () => {
  const base = { species: "plasma", energy: 50, hunger: 90, health: 100, safeToExplore: true, safeToRest: true };
  assert.equal(decideDragonBehavior({ ...base, thunderstorm: true }).action, "absorb_charge_from_storm");
  assert.equal(decideDragonBehavior({
    ...base, energy: 90, thunderstorm: true, stormShelterAvailable: true, isExposed: true
  }).action, "seek_shelter_during_storm");
});
