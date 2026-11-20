import test from "node:test";
import assert from "node:assert/strict";
import { assessNaturalSpawn } from "../src/ai/spawn-director.js";

const base = {
  isThunderstorm: true, scanDue: true, currentTick: 200000,
  lastSpawnTick: 0, candidateLocation: { x: 5000, y: 100, z: 5000 },
  lastSpawnLocation: { x: 0, y: 100, z: 0 },
  existingPlasmaLocations: [], spawnRoll: 0
};

test("Plasma só pode surgir durante tempestade", () => {
  assert.equal(assessNaturalSpawn("plasma", { ...base, isThunderstorm: false }).reason, "thunderstorm_required");
});

test("Plasma respeita intervalo global de cinco dias Minecraft", () => {
  assert.equal(assessNaturalSpawn("plasma", { ...base, currentTick: 119999, lastSpawnTick: 0 }).reason, "global_spawn_cooldown");
});

test("Plasma respeita distância mínima do último surgimento", () => {
  assert.equal(assessNaturalSpawn("plasma", {
    ...base, candidateLocation: { x: 1000, y: 100, z: 0 }
  }).reason, "too_close_to_previous_spawn");
});

test("Plasma não surge perto de outro indivíduo existente", () => {
  assert.equal(assessNaturalSpawn("plasma", {
    ...base, existingPlasmaLocations: [{ x: 4500, y: 100, z: 5000 }]
  }).reason, "another_plasma_too_close");
});

test("Plasma é extremamente raro: somente 1 resultado em 100 passa", () => {
  assert.equal(assessNaturalSpawn("plasma", { ...base, spawnRoll: 1 }).reason, "rare_chance_not_met");
  assert.equal(assessNaturalSpawn("plasma", { ...base, spawnRoll: 0 }).eligible, true);
});

test("A tentativa só ocorre no intervalo de varredura configurado", () => {
  assert.equal(assessNaturalSpawn("plasma", { ...base, scanDue: false }).reason, "scan_interval_not_reached");
});

test("Plasma não surge sem coordenadas válidas para avaliar os raios", () => {
  assert.equal(assessNaturalSpawn("plasma", { ...base, candidateLocation: undefined }).reason,
    "invalid_candidate_location");
});
