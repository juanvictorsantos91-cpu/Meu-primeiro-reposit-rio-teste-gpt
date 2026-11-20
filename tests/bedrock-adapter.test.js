import test from "node:test";
import assert from "node:assert/strict";
import {
  actionIntentTag,
  buildDragonSnapshot,
  distanceBetween,
  readSpecies,
  readTaggedNumber
} from "../src/adapters/bedrock/snapshot.js";

test("lê espécie e indicadores armazenados em tags", () => {
  const tags = ["ds:dragon", "ds:species:electric", "ds:energy:42", "ds:hunger:18"];
  assert.equal(readSpecies(tags), "electric");
  assert.equal(readTaggedNumber(tags, "ds:energy:", 100), 42);
  assert.equal(readTaggedNumber(tags, "ds:hunger:", 100), 18);
  assert.equal(readTaggedNumber(tags, "ds:health:", 100), 100);
});

test("calcula distância tridimensional", () => {
  assert.equal(distanceBetween({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }), 5);
});

test("monta estado do dragão e protege presas não marcadas como selvagens", () => {
  const dragon = {
    id: "dragon-1",
    typeId: "dragon_survival:electric_dragon",
    location: { x: 0, y: 64, z: 0 },
    getTags: () => ["ds:dragon", "ds:species:electric", "ds:energy:70", "ds:hunger:30"],
    getComponent: () => ({ currentValue: 90 })
  };
  const wildSalmon = {
    id: "salmon-1", typeId: "minecraft:salmon",
    location: { x: 4, y: 64, z: 0 }, getTags: () => ["ds:wild"]
  };
  const farmChicken = {
    id: "chicken-1", typeId: "minecraft:chicken",
    location: { x: 5, y: 64, z: 0 }, getTags: () => []
  };
  const state = buildDragonSnapshot(
    dragon, [dragon, wildSalmon, farmChicken],
    { biome: "plains", tags: ["forest"] }, 500
  );
  assert.equal(state.species, "electric");
  assert.equal(state.energy, 70);
  assert.equal(state.hunger, 30);
  assert.equal(state.health, 90);
  assert.equal(state.nearbyPrey.length, 2);
  assert.equal(state.nearbyPrey.find(prey => prey.id === "salmon-1").protectedByPlayer, false);
  assert.equal(state.nearbyPrey.find(prey => prey.id === "chicken-1").protectedByPlayer, true);
});

test("ignora entidades sem etiqueta de espécie", () => {
  const entity = { getTags: () => ["ds:dragon"] };
  assert.equal(buildDragonSnapshot(entity), null);
});

test("gera apenas tags de intenção com ação válida", () => {
  assert.equal(actionIntentTag("hunt_selected_prey"), "ds:action:hunt_selected_prey");
  assert.throws(() => actionIntentTag("bad action"));
});
