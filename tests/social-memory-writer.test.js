import test from "node:test";
import assert from "node:assert/strict";
import { writeSocialMemory } from "../src/adapters/bedrock/social-memory-writer.js";

function mockEntity(initialTags = []) {
  const tags = new Set(initialTags);
  return {
    getTags: () => [...tags],
    addTag: tag => tags.add(tag),
    removeTag: tag => tags.delete(tag)
  };
}

test("grava e atualiza memória social sem remover tags alheias", () => {
  const entity = mockEntity(["ds:species:fire", "ds:trait:curiosity:0.8", "ds:known:old"]);
  const first = writeSocialMemory(entity, [{
    entityId: "dragon:two",
    known: true,
    trust: 2,
    hostile: true,
    lastSeenTick: 480,
    encounters: 4
  }]);
  assert.equal(first.added.length, 5);
  assert.ok(entity.getTags().includes("ds:species:fire"));
  assert.ok(entity.getTags().includes("ds:trait:curiosity:0.8"));
  assert.ok(entity.getTags().includes("ds:seen:dragon%3Atwo:480"));
  assert.ok(entity.getTags().includes("ds:encounters:dragon%3Atwo:4"));

  const second = writeSocialMemory(entity, [{
    entityId: "dragon:two",
    known: true,
    trust: 3,
    hostile: false,
    lastSeenTick: 500,
    encounters: 5
  }]);
  assert.ok(second.removed.includes("ds:hostile:dragon%3Atwo"));
  assert.ok(entity.getTags().includes("ds:relation:dragon%3Atwo:trust:3"));
  assert.ok(!entity.getTags().some(tag => tag.startsWith("ds:hostile:")));
});

test("remove apenas tags próprias da memória social ao limpar memória", () => {
  const entity = mockEntity([
    "ds:known:dragon-a", "ds:relation:dragon-a:trust:1",
    "ds:seen:dragon-a:20", "ds:encounters:dragon-a:2",
    "ds:hostile:dragon-a", "ds:action:rest", "ds:species:water"
  ]);
  writeSocialMemory(entity, []);
  assert.deepEqual(entity.getTags().sort(), ["ds:action:rest", "ds:species:water"]);
});

test("exige entidade com métodos de tag necessários", () => {
  assert.throws(() => writeSocialMemory({}, []), /getTags/);
});
