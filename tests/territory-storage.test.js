import test from "node:test";
import assert from "node:assert/strict";
import {
  serializeTerritoryWorldState,
  deserializeTerritoryWorldState,
  createTerritoryWorldStorage
} from "../src/adapters/bedrock/territory-storage.js";

const state = {
  savedTick: 48000,
  territories: [{ id: "core", ownerGroupId: "group-a", status: "active" }],
  domains: [{ id: "realm-a", ownerGroupId: "group-a", territoryIds: ["core"], status: "active" }]
};

test("serializa e restaura territórios e reinos sem perder histórico ou campos", () => {
  const restored = deserializeTerritoryWorldState(serializeTerritoryWorldState(state));
  assert.deepEqual(restored, { schemaVersion: 2, ...state, groups: [] });
});


test("migra leitura do esquema 1 para esquema 2 sem perder reinos", () => {
  const legacy = JSON.stringify({ schemaVersion: 1, ...state });
  assert.deepEqual(deserializeTerritoryWorldState(legacy), { schemaVersion: 2, ...state, groups: [] });
});

test("rejeita versão de esquema desconhecida", () => {
  assert.throws(() => deserializeTerritoryWorldState(JSON.stringify({ ...state, schemaVersion: 99 })), /não suportada/);
});

test("rejeita IDs duplicados e ticks inválidos", () => {
  assert.throws(() => serializeTerritoryWorldState({
    ...state, territories: [{ id: "same" }, { id: "same" }]
  }), /duplicado/);
  assert.throws(() => serializeTerritoryWorldState({ ...state, savedTick: -1 }), /savedTick/);
});

test("adaptador grava e carrega usando callbacks do host", () => {
  const store = new Map();
  const storage = createTerritoryWorldStorage({
    read: key => store.get(key),
    write: (key, value) => store.set(key, value)
  });
  assert.equal(storage.load(), null);
  assert.ok(storage.save(state) > 0);
  assert.deepEqual(storage.load(), { schemaVersion: 2, ...state, groups: [] });
});

test("não assume armazenamento quando callbacks estão ausentes", () => {
  assert.throws(() => createTerritoryWorldStorage({}), /read e write/);
});
