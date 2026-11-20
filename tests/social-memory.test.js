import test from "node:test";
import assert from "node:assert/strict";
import { updateSocialMemory, findSocialRelationship, socialMemoryTags } from "../src/ai/social-memory.js";

test("reconhece indivíduos encontrados sem presumir amizade", () => {
  const memory = updateSocialMemory([], [{ entityId: "dragon-b", species: "water" }], 100);
  assert.equal(memory.length, 1);
  assert.equal(memory[0].known, true);
  assert.equal(memory[0].trust, 0);
  assert.equal(memory[0].hostile, false);
  assert.equal(memory[0].encounters, 1);
});

test("interações pacíficas aumentam confiança gradualmente", () => {
  let memory = updateSocialMemory([], [{ entityId: "dragon-c", interaction: "peaceful" }], 10);
  memory = updateSocialMemory(memory, [{ entityId: "dragon-c", interaction: "peaceful" }], 20);
  assert.equal(findSocialRelationship(memory, "dragon-c").trust, 2);
});

test("hostilidade observada é lembrada sem apagar o reconhecimento", () => {
  const memory = updateSocialMemory(
    [{ entityId: "dragon-d", trust: 2, known: true, lastSeenTick: 5, encounters: 1 }],
    [{ entityId: "dragon-d", interaction: "hostile" }],
    6
  );
  const relation = findSocialRelationship(memory, "dragon-d");
  assert.equal(relation.known, true);
  assert.equal(relation.hostile, true);
  assert.equal(relation.trust, 1);
});

test("proteção fortalece confiança sem marcar hostilidade", () => {
  const memory = updateSocialMemory([], [{ entityId: "dragon-e", interaction: "protective" }], 7);
  assert.equal(memory[0].trust, 1);
  assert.equal(memory[0].hostile, false);
});

test("limita memória a 32 indivíduos e prioriza contatos recentes", () => {
  const observations = Array.from({ length: 40 }, (_, i) => ({ entityId: `dragon-${i}` }));
  const memory = updateSocialMemory([], observations, 100);
  assert.equal(memory.length, 32);
  assert.equal(memory[0].entityId, "dragon-0");
});

test("gera tags compatíveis com o snapshot e codifica IDs", () => {
  const tags = socialMemoryTags([{ entityId: "dragon:with space", trust: 2, hostile: true }]);
  assert.deepEqual(tags, [
    "ds:known:dragon%3Awith%20space",
    "ds:relation:dragon%3Awith%20space:trust:2",
    "ds:hostile:dragon%3Awith%20space"
  ]);
});

test("impede tempo regressivo e identificadores vazios", () => {
  const memory = updateSocialMemory([{ entityId: "dragon-f", lastSeenTick: 50 }], [], 40);
  assert.equal(memory[0].lastSeenTick, 50);
  assert.throws(() => updateSocialMemory(memory, [{ entityId: "dragon-f" }], 40), /não pode retroceder/);
  assert.throws(() => updateSocialMemory([], [{ entityId: "" }], 1), /identificador/);
});
