import test from "node:test";
import assert from "node:assert/strict";
import { createBedrockTerritoryWorldStorage } from "../src/adapters/bedrock/territory-dynamic-property-storage.js";

function fakeWorld() {
  const values = new Map();
  let writes = 0;
  let failAt = Infinity;
  return {
    values,
    getDynamicProperty(key) { return values.get(key); },
    setDynamicProperty(key, value) {
      writes++;
      if (writes === failAt) throw new Error("simulated write failure");
      if (value === undefined || value === null) values.delete(key);
      else values.set(key, value);
    },
    failAfterSuccessfulWrites(count) { failAt = writes + count + 1; }
  };
}

function state(savedTick, suffix = "") {
  return {
    savedTick,
    territories: [{ id: `territory${suffix}`, ownerGroupId: "group-a", status: "active", note: "dragão 🐉" }],
    domains: [{ id: "realm-a", ownerGroupId: "group-a", territoryIds: [`territory${suffix}`], status: "active" }]
  };
}

test("grava e restaura estado territorial dividido em vários chunks UTF-8", () => {
  const world = fakeWorld();
  const storage = createBedrockTerritoryWorldStorage({ world, maxChunkBytes: 256 });
  const large = state(1200);
  large.territories[0].note = "🐉".repeat(500);
  assert.ok(storage.save(large) > 256);
  assert.deepEqual(storage.load(), { schemaVersion: 2, ...large, groups: [] });
});

test("uma falha antes da troca do ponteiro preserva a última gravação válida", () => {
  const world = fakeWorld();
  const storage = createBedrockTerritoryWorldStorage({ world, maxChunkBytes: 256 });
  storage.save(state(100));
  world.failAfterSuccessfulWrites(1);
  assert.throws(() => storage.save(state(200, "-new")), /simulated write failure/);
  assert.deepEqual(storage.load(), { schemaVersion: 2, ...state(100), groups: [] });
});

test("recupera o slot anterior se o slot apontado estiver corrompido", () => {
  const world = fakeWorld();
  const storage = createBedrockTerritoryWorldStorage({ world, maxChunkBytes: 256 });
  storage.save(state(100));
  storage.save(state(200, "-new"));
  const active = world.getDynamicProperty("ds:territory_v1:active");
  const manifest = JSON.parse(world.getDynamicProperty(`ds:territory_v1:${active}:manifest`));
  world.setDynamicProperty(`ds:territory_v1:${active}:0`, "corrupted");
  assert.deepEqual(storage.load(), { schemaVersion: 2, ...state(100), groups: [] });
  assert.ok(manifest.chunks >= 1);
});

test("rejeita configuração de host ou limite de chunk inválidos", () => {
  assert.throws(() => createBedrockTerritoryWorldStorage({ world: {} }), /getDynamicProperty/);
  assert.throws(() => createBedrockTerritoryWorldStorage({ world: fakeWorld(), maxChunkBytes: 10 }), /maxChunkBytes/);
});
