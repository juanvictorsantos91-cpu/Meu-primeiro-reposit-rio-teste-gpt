import test from "node:test";
import assert from "node:assert/strict";
import { buildDragonSnapshot, readTaggedNumber } from "../src/adapters/bedrock/snapshot.js";

function entity(id, tags, location = { x: 0, y: 64, z: 0 }, typeId = "dragon:entity") {
  return {
    id, typeId, location,
    getTags: () => [...tags],
    getComponent: component => component === "minecraft:health"
      ? { currentValue: 100, effectiveMax: 100 }
      : undefined
  };
}

test("snapshot herda agressividade do perfil e lê estado territorial do dragão", () => {
  const dragon = entity("fire-1", [
    "ds:species:fire", "ds:energy:85", "ds:hunger:70",
    "ds:territory:fire-north", "ds:has_young", "ds:injury:minor"
  ]);
  const state = buildDragonSnapshot(dragon, [], { immediateHazard: false }, 1200);
  assert.equal(state.aggression, 0.9);
  assert.equal(state.territoryId, "fire-north");
  assert.equal(state.groupId, null);
  assert.equal(state.hasYoung, true);
  assert.equal(state.injury.severity, "minor");
  assert.equal(state.isTamed, false);
  assert.equal(state.isOwned, false);
});

test("snapshot permite agressividade individual dentro do intervalo de 0 a 1", () => {
  const dragon = entity("wind-1", ["ds:species:wind", "ds:aggression:0.82"]);
  assert.equal(buildDragonSnapshot(dragon).aggression, 0.82);
  const invalid = entity("wind-2", ["ds:species:wind", "ds:aggression:4"]);
  assert.equal(buildDragonSnapshot(invalid).aggression, 1);
  assert.equal(readTaggedNumber([], "ds:aggression:", 0.35), 0.35);
});

test("snapshot transmite domesticação, propriedade e relações dos dragões próximos", () => {
  const self = entity("self", ["ds:species:fire", "ds:group:flame%3Aalpha", "ds:leader", "ds:known:tamed", "ds:hostile:hostile", "ds:relation:tamed:trust:2"]);
  const tamed = entity("tamed", ["ds:species:water", "ds:group:river-pack", "ds:tamed", "ds:owned", "ds:territory:water-home"], { x: 5, y: 64, z: 0 });
  const hostile = entity("hostile", ["ds:species:ice", "ds:near_nest", "ds:territory:ice-home"], { x: 8, y: 64, z: 0 });
  const state = buildDragonSnapshot(self, [tamed, hostile]);
  assert.equal(state.groupId, "flame:alpha");
  assert.equal(state.isGroupLeader, true);
  assert.equal(state.sameSpeciesGroupNearby, false);
  assert.equal(state.nearbyDragons[0].groupId, "river-pack");
  assert.equal(state.nearbyDragons[0].isTamed, true);
  assert.equal(state.nearbyDragons[0].isOwned, true);
  assert.equal(state.nearbyDragons[0].knownToSelf, true);
  assert.equal(state.nearbyDragons[0].hostile, false);
  assert.equal(state.nearbyDragons[1].hostile, true);
  assert.equal(state.socialMemory.find(item => item.entityId === "tamed").trust, 2);
  assert.equal(state.nearbyDragons[1].nearNest, true);
});


test("snapshot converte vida absoluta do Bedrock para percentual de 0 a 100", () => {
  const dragon = {
    id: "fire-120hp",
    location: { x: 0, y: 64, z: 0 },
    getTags: () => ["ds:species:fire", "ds:energy:150", "ds:hunger:-5"],
    getComponent: () => ({ currentValue: 60, effectiveMax: 120 })
  };
  const neighbor = {
    id: "water-120hp",
    location: { x: 2, y: 64, z: 0 },
    getTags: () => ["ds:species:water"],
    getComponent: () => ({ currentValue: 120, effectiveMax: 120 })
  };
  const state = buildDragonSnapshot(dragon, [neighbor]);
  assert.equal(state.health, 50);
  assert.equal(state.energy, 100);
  assert.equal(state.hunger, 0);
  assert.equal(state.nearbyDragons[0].health, 100);
});

test("snapshot lê sinais de rotina e traços individuais sem inventar valores ausentes", () => {
  const dragon = entity("young-fire", [
    "ds:species:fire", "ds:stage:juvenile",
    "ds:trait:curiosity:0.91", "ds:trait:playfulness:0.88",
    "ds:sleep_requested", "ds:grooming_needed", "ds:trait:courage:0.99",
    "ds:play_opportunity", "ds:temperature:too_hot"
  ]);
  const state = buildDragonSnapshot(dragon, [], { immediateHazard: false });
  assert.equal(state.personality.curiosity, 0.91);
  assert.equal(state.personality.playfulness, 0.88);
  assert.equal(state.personality.courage, undefined);
  assert.equal(state.groomingNeeded, undefined);
  assert.equal(state.sleepRequested, true);
  assert.equal(state.playOpportunity, true);
  assert.equal(state.temperatureCondition, "too_hot");
  assert.equal(state.safeToRest, true);
});


test("snapshot restaura recência e quantidade de encontros da memória social", () => {
  const self = entity("fire-memory", [
    "ds:species:fire",
    "ds:known:water%3Adragon",
    "ds:relation:water%3Adragon:trust:2",
    "ds:seen:water%3Adragon:9600",
    "ds:encounters:water%3Adragon:7",
    "ds:hostile:water%3Adragon"
  ]);
  const state = buildDragonSnapshot(self, [], {}, 9700);
  const relation = state.socialMemory[0];
  assert.equal(relation.entityId, "water:dragon");
  assert.equal(relation.trust, 2);
  assert.equal(relation.hostile, true);
  assert.equal(relation.lastSeenTick, 9600);
  assert.equal(relation.encounters, 7);
});

test("snapshot reconhece membro da mesma patrulha e líder em entidades próximas", () => {
  const self = entity("fire-leader", ["ds:species:fire", "ds:group:fire-patrol", "ds:leader"]);
  const member = entity("fire-member", ["ds:species:fire", "ds:group:fire-patrol"], { x: 3, y: 64, z: 0 });
  const other = entity("fire-outsider", ["ds:species:fire", "ds:group:other-patrol", "ds:leader"], { x: 5, y: 64, z: 0 });
  const state = buildDragonSnapshot(self, [member, other]);
  assert.equal(state.isGroupLeader, true);
  assert.equal(state.sameSpeciesGroupNearby, true);
  assert.equal(state.nearbyDragons[0].isGroupLeader, false);
  assert.equal(state.nearbyDragons[1].isGroupLeader, true);
  assert.equal(state.nearbyDragons[0].groupId, state.groupId);
  assert.notEqual(state.nearbyDragons[1].groupId, state.groupId);
});
