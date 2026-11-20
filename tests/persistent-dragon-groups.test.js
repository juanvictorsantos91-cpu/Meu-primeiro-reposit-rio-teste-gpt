import test from "node:test";
import assert from "node:assert/strict";
import { createTerritoryWorldStorage } from "../src/adapters/bedrock/territory-storage.js";
import { createPersistentDragonGroupLifecycle } from "../src/ai/persistent-dragon-groups.js";

function memoryStorage(initialState = null) {
  let state = initialState;
  return {
    load() { return state == null ? null : structuredClone(state); },
    save(next) { state = structuredClone(next); return JSON.stringify(next).length; }
  };
}

function fireRoster() {
  return [
    { id: "f1", species: "fire", leadership: 1, experience: 1 },
    { id: "f2", species: "fire", leadership: 0.8, experience: 0.8 },
    { id: "f3", species: "fire", leadership: 0.2 },
    { id: "f4", species: "fire", leadership: 0.2 },
    { id: "f5", species: "fire", leadership: 0.2 },
    { id: "f6", species: "fire", leadership: 0.2 }
  ];
}

test("persiste grupo, liderança e vínculos sem apagar territórios ou domínios", () => {
  const storage = memoryStorage({
    schemaVersion: 2,
    savedTick: 10,
    territories: [{ id: "core", ownerGroupId: "old-group" }],
    domains: [{ id: "realm", territoryIds: ["core"] }],
    groups: []
  });
  const lifecycle = createPersistentDragonGroupLifecycle(storage);
  const group = lifecycle.form({
    id: "fire-alpha",
    species: "fire",
    dragons: fireRoster(),
    createdTick: 20,
    homeTerritoryId: "core",
    pairBonds: [["f2", "f3"]]
  });

  assert.equal(group.leaderId, "f1");
  assert.deepEqual(group.pairBonds, [["f2", "f3"]]);
  const restored = createPersistentDragonGroupLifecycle(storage).get("fire-alpha");
  assert.deepEqual(restored, group);
  const state = storage.load();
  assert.deepEqual(state.territories, [{ id: "core", ownerGroupId: "old-group" }]);
  assert.deepEqual(state.domains, [{ id: "realm", territoryIds: ["core"] }]);
  assert.equal(state.savedTick, 20);
});

test("atualiza membros, elege sucessor e mantém vínculo interno válido", () => {
  const storage = memoryStorage();
  const lifecycle = createPersistentDragonGroupLifecycle(storage);
  lifecycle.form({
    id: "fire-alpha", species: "fire", dragons: fireRoster(),
    createdTick: 10, pairBonds: [["f2", "f3"]]
  });
  const remaining = [
    { id: "f2", leadership: 0.8, experience: 0.8 },
    { id: "f3", leadership: 0.2 },
    { id: "f4", leadership: 0.2 },
    { id: "f5", leadership: 0.2 },
    { id: "f6", leadership: 0.2 },
    { id: "f7", leadership: 0.7, experience: 0.9 }
  ];
  const updated = lifecycle.update("fire-alpha", {
    addDragons: [{ id: "f7", species: "fire" }],
    removeMemberIds: ["f1"],
    remainingDragons: remaining,
    tick: 30
  });
  assert.equal(updated.leaderId, "f2");
  assert.deepEqual(updated.memberIds, ["f2", "f3", "f4", "f5", "f6", "f7"]);
  assert.deepEqual(updated.pairBonds, [["f2", "f3"]]);
  assert.equal(lifecycle.get("fire-alpha").revision, 2);
});

test("impede duplicação de ID e formação permanente de espécie solitária", () => {
  const lifecycle = createPersistentDragonGroupLifecycle(memoryStorage());
  const input = { id: "fire-alpha", species: "fire", dragons: fireRoster(), createdTick: 0 };
  lifecycle.form(input);
  assert.throws(() => lifecycle.form(input), /Já existe/);
  assert.throws(() => lifecycle.form({
    id: "electric-one",
    species: "electric",
    dragons: [{ id: "e1", species: "electric" }],
    createdTick: 0
  }), /solitárias/);
});

test("encerra grupo sem apagar seu histórico e permite consultar grupos ativos", () => {
  const lifecycle = createPersistentDragonGroupLifecycle(memoryStorage());
  lifecycle.form({
    id: "fire-alpha", species: "fire", dragons: fireRoster(), createdTick: 0
  });
  const ended = lifecycle.disband("fire-alpha", 40);
  assert.equal(ended.status, "disbanded");
  assert.deepEqual(ended.memberIds, []);
  assert.equal(ended.leaderId, null);
  assert.equal(lifecycle.get("fire-alpha").history.at(-1).type, "group_disbanded");
  assert.deepEqual(lifecycle.list({ status: "active" }), []);
  assert.equal(lifecycle.list({ status: "disbanded" }).length, 1);
});

test("rejeita gravação de revisão antiga e remoção com tick retroativo", () => {
  const store = new Map();
  const storage = createTerritoryWorldStorage({
    read: key => store.get(key),
    write: (key, value) => store.set(key, value)
  });
  const lifecycle = createPersistentDragonGroupLifecycle(storage);
  const group = lifecycle.form({
    id: "fire-alpha", species: "fire", dragons: fireRoster(), createdTick: 50
  });
  const newer = { ...group, revision: 2, updatedTick: 60 };
  lifecycle.repository.save(newer);
  assert.throws(() => lifecycle.repository.save(group), /revisão mais recente/);
  assert.throws(() => lifecycle.repository.remove("fire-alpha", 10), /Tick de remoção/);
});
