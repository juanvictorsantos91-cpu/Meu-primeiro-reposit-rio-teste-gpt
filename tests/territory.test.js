import test from "node:test";
import assert from "node:assert/strict";
import {
  SPECIES_TERRITORY_RADII, TERRITORY_RULES, getTerritoryRadius,
  assessTerritorialSpacing, assessTerritory, assessTerritorialInvasion
} from "../src/ai/territory.js";

test("cada espécie recebe seu raio territorial inicial", () => {
  assert.deepEqual(SPECIES_TERRITORY_RADII, {
    electric: 256, water: 160, ice: 192, fire: 224, earth: 160,
    lava: 192, wind: 96, sound: 128, poison: 112, plasma: null,
    acid: 112, sand: 176, light: 144, radioactive: 192, shadow: 128
  });
  assert.equal(getTerritoryRadius("electric"), 256);
  assert.equal(getTerritoryRadius("plasma"), null);
  assert.equal(getTerritoryRadius("water", 180), 180);
  assert.throws(() => getTerritoryRadius("unknown"), RangeError);
});

test("indivíduos do mesmo grupo compartilham território sem serem invasores", () => {
  const self = { id: "a", species: "water", territoryId: "water-west", health: 90, energy: 80 };
  const result = assessTerritory(self, [
    { id: "b", species: "water", territoryId: "water-west", distance: 30 }
  ], { territoryId: "water-west" });
  assert.equal(result.intruderCount, 0);
  assert.equal(result.spacing.sharedTerritoryMembers, 1);
  assert.equal(result.action, "patrol_territory");
});

test("grupos independentes da mesma espécie evitam sobreposição", () => {
  const self = { id: "a", species: "fire", territoryId: "fire-a" };
  const result = assessTerritorialSpacing(self, [
    { id: "b", species: "fire", territoryId: "fire-b", distance: 100 },
    { id: "c", species: "fire", territoryId: "fire-c", distance: 200 },
    { id: "d", species: "fire", territoryId: "fire-d", distance: 600 }
  ]);
  assert.equal(result.overlapRiskCount, 1);
  assert.equal(result.preferredSpacingCount, 2);
  assert.equal(result.comfortableSpacingCount, 1);
  assert.equal(result.shouldAvoidSameSpeciesGroup, true);
  assert.equal(TERRITORY_RULES.sameSpeciesAvoidOverlap, 128);
});

test("espécies diferentes podem visitar áreas compartilhadas sem combate automático", () => {
  const self = { id: "a", species: "water", health: 90, energy: 90 };
  const result = assessTerritory(self, [
    { id: "b", species: "wind", distance: 50, hostile: false }
  ], { territoryId: "water-home" });
  assert.equal(result.territoryIntruded, true);
  assert.equal(result.spacing.crossSpeciesVisitors, 1);
  assert.equal(result.spacing.crossSpeciesConflictAutomatic, false);
  assert.equal(result.action, "challenge_territory_intruder");
});

test("Plasma não mantém território fixo nem reage como defensor territorial", () => {
  const self = { id: "p", species: "plasma", health: 100, energy: 90 };
  const result = assessTerritory(self, [{ id: "x", species: "fire", distance: 10 }]);
  assert.equal(result.isNomadic, true);
  assert.equal(result.radius, null);
  assert.equal(result.territoryIntruded, false);
  assert.equal(result.action, "remain_nomadic");
});

test("dragão debilitado observa o visitante em vez de desafiar", () => {
  const self = { id: "a", species: "ice", health: 30, energy: 20 };
  const result = assessTerritory(self, [{ id: "b", species: "fire", distance: 20 }], { territoryId: "ice-home" });
  assert.equal(result.action, "observe_intruder_from_safety");
});


test("invasões usam agressividade individual ou o perfil oficial da espécie", () => {
  const target = { id: "target", species: "water", territoryId: "water-home", distance: 40 };
  const fire = assessTerritorialInvasion({
    id: "fire-1", species: "fire", health: 100, energy: 100, hunger: 100
  }, [target], { invasionCycle: 1 });
  assert.equal(fire.aggression, 0.9);
  assert.equal(fire.eligible, true);

  const cautiousFire = assessTerritorialInvasion({
    id: "fire-2", species: "fire", aggression: 0.2,
    health: 100, energy: 100, hunger: 100
  }, [target], { invasionCycle: 1 });
  assert.equal(cautiousFire.eligible, false);
  assert.equal(cautiousFire.chance, 0);
});

test("invasões escolhem o território elegível mais próximo e ignoram dragões domesticados", () => {
  const result = assessTerritorialInvasion({
    id: "fire-1", species: "fire", health: 100, energy: 100, hunger: 100
  }, [
    { id: "tamed", species: "water", territoryId: "water-player", distance: 5, isTamed: true },
    { id: "far", species: "ice", territoryId: "ice-far", distance: 90 },
    { id: "near", species: "wind", territoryId: "wind-near", distance: 20 }
  ], { invasionCycle: 1 });
  assert.equal(result.eligible, true);
  assert.equal(result.selectedTargetDragonId, "near");
  assert.equal(result.selectedTargetTerritoryId, "wind-near");
  assert.equal(result.selectedTargetDistance, 20);
  assert.equal(result.targetDragonId, result.shouldInvade ? "near" : null);
});

test("água, plasma e lava, além de dragões domesticados, nunca iniciam invasões", () => {
  const target = { id: "target", species: "fire", territoryId: "fire-home", distance: 10 };
  for (const species of ["water", "plasma", "lava"]) {
    const result = assessTerritorialInvasion({
      id: species, species, health: 100, energy: 100, hunger: 100, aggression: 1
    }, [target]);
    assert.equal(result.eligible, false);
    assert.equal(result.shouldInvade, false);
  }
  const tamed = assessTerritorialInvasion({
    id: "tamed-fire", species: "fire", isTamed: true,
    health: 100, energy: 100, hunger: 100
  }, [target]);
  assert.equal(tamed.eligible, false);
});


test("dragão domesticado ou do jogador é visitante amigável, não invasor territorial", () => {
  const self = { id: "wild", species: "fire", health: 90, energy: 90 };
  const result = assessTerritory(self, [
    { id: "pet", species: "water", distance: 20, territoryId: "water-home", isTamed: true, isOwned: true }
  ], { territoryId: "fire-home" });
  assert.equal(result.territoryIntruded, false);
  assert.equal(result.intruderCount, 0);
  assert.equal(result.friendlyVisitorCount, 1);
  assert.equal(result.action, "patrol_territory");
});


test("outras espécies só entram na disputa quando a agressividade individual aumenta", () => {
  const target = { id: "target", species: "water", territoryId: "water-home", distance: 35 };
  const normalElectric = assessTerritorialInvasion({
    id: "electric-normal", species: "electric", health: 100, energy: 100, hunger: 100
  }, [target]);
  const unusuallyAggressiveElectric = assessTerritorialInvasion({
    id: "electric-aggressive", species: "electric", aggression: 0.82,
    health: 100, energy: 100, hunger: 100
  }, [target]);
  assert.equal(normalElectric.eligible, false);
  assert.equal(unusuallyAggressiveElectric.eligible, true);
  assert.equal(unusuallyAggressiveElectric.aggression, 0.82);
});
