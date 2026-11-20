import test from "node:test";
import assert from "node:assert/strict";
import {
  createTerritory, transferTerritory, abandonTerritory,
  relocateTemporaryTerritory, InMemoryTerritoryRepository
} from "../src/ai/territory-state.js";

const base = () => createTerritory({
  id: "earth-west", species: "earth", ownerGroupId: "earth-group-1",
  center: { x: 10, y: 64, z: 20 }, radius: 160, createdTick: 100,
  temporary: true, expiresTick: 500
});

test("cria território ativo com histórico inicial", () => {
  const territory = base();
  assert.equal(territory.status, "active");
  assert.equal(territory.revision, 1);
  assert.equal(territory.history[0].type, "created");
});

test("transfere propriedade apenas após a confirmação externa da conquista", () => {
  const transferred = transferTerritory(base(), {
    newOwnerGroupId: "fire-group-2", tick: 200, reason: "invasion_won"
  });
  assert.equal(transferred.ownerGroupId, "fire-group-2");
  assert.equal(transferred.history.at(-1).from, "earth-group-1");
  assert.equal(transferred.history.at(-1).to, "fire-group-2");
  assert.equal(transferred.revision, 2);
});

test("não permite transferência para o mesmo proprietário nem retrocesso temporal", () => {
  assert.throws(() => transferTerritory(base(), {
    newOwnerGroupId: "earth-group-1", tick: 200
  }), /proprietário atual/);
  assert.throws(() => transferTerritory(base(), {
    newOwnerGroupId: "fire-group-2", tick: 99
  }), /não pode retroceder/);
});

test("abandona território sem apagar seu histórico", () => {
  const abandoned = abandonTerritory(base(), { tick: 250, reason: "migration" });
  assert.equal(abandoned.status, "abandoned");
  assert.equal(abandoned.ownerGroupId, "earth-group-1");
  assert.equal(abandoned.history.at(-1).type, "abandoned");
  assert.throws(() => transferTerritory(abandoned, {
    newOwnerGroupId: "fire-group-2", tick: 260
  }), /precisa estar ativo/);
});

test("reloca território temporário preservando identidade e proprietário", () => {
  const moved = relocateTemporaryTerritory(base(), {
    center: { x: 300, y: 70, z: -40 }, tick: 300, expiresTick: 700
  });
  assert.equal(moved.id, "earth-west");
  assert.equal(moved.ownerGroupId, "earth-group-1");
  assert.deepEqual(moved.center, { x: 300, y: 70, z: -40 });
  assert.equal(moved.history.at(-1).type, "relocated");
});

test("não permite relocação de território permanente", () => {
  const permanent = createTerritory({
    id: "fire-home", species: "fire", ownerGroupId: "fire-1",
    center: { x: 0, y: 64, z: 0 }, radius: 224, createdTick: 10
  });
  assert.throws(() => relocateTemporaryTerritory(permanent, {
    center: { x: 5, y: 64, z: 5 }, tick: 20
  }), /temporários/);
});

test("repositório em memória isola cópias e rejeita revisão antiga", () => {
  const repository = new InMemoryTerritoryRepository();
  repository.save(base());
  const changed = repository.save(transferTerritory(base(), {
    newOwnerGroupId: "fire-2", tick: 200
  }));
  changed.center.x = 999;
  assert.equal(repository.get("earth-west").center.x, 10);
  assert.throws(() => repository.save(base()), /revisão mais recente/);
  assert.equal(repository.list({ status: "active" }).length, 1);
});
