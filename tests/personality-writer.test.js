import test from "node:test";
import assert from "node:assert/strict";
import { initializeDragonPersonality, buildPersonalityTags } from "../src/adapters/bedrock/personality-writer.js";

function fakeEntity(id, tags = []) {
  const stored = [...tags];
  return {
    id,
    getTags: () => [...stored],
    addTag: tag => { stored.push(tag); },
    stored
  };
}

test("gera quatro tags determinísticas por indivíduo", () => {
  const tags = buildPersonalityTags({ seed: "dragon-001", species: "fire" });
  assert.equal(tags.length, 4);
  assert.ok(tags.every(tag => /^ds:trait:(curiosity|sociability|independence|playfulness):0\.\d{2}$/.test(tag)));
  assert.deepEqual(tags, buildPersonalityTags({ seed: "dragon-001", species: "fire" }));
});

test("inicializa a personalidade usando o ID persistente da entidade", () => {
  const entity = fakeEntity("dragon-002");
  const result = initializeDragonPersonality(entity, { species: "water" });
  assert.equal(result.writtenTags.length, 4);
  assert.equal(entity.stored.length, 4);
  assert.deepEqual(Object.keys(result.traits).sort(), ["curiosity", "independence", "playfulness", "sociability"]);
});

test("não sobrescreve traços já existentes ao reexecutar", () => {
  const entity = fakeEntity("dragon-003", ["ds:trait:curiosity:0.99"]);
  const first = initializeDragonPersonality(entity, { species: "earth" });
  assert.equal(first.traits.curiosity, 0.99);
  assert.equal(first.writtenTags.length, 3);
  const second = initializeDragonPersonality(entity, { species: "earth" });
  assert.equal(second.writtenTags.length, 0);
  assert.equal(second.initialized, false);
});

test("rejeita entidades sem API de tags", () => {
  assert.throws(() => initializeDragonPersonality({}, { species: "fire" }), /getTags/);
});
