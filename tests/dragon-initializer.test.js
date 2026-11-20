import test from "node:test";
import assert from "node:assert/strict";
import { initializeDragonEntity } from "../src/adapters/bedrock/dragon-initializer.js";

function mockDragon(typeId = "dragon_survival:fire_dragon", id = "fire-001", initial = []) {
  const tags = new Set(initial);
  return {
    id, typeId,
    getTags: () => [...tags],
    addTag: tag => tags.add(tag),
    removeTag: tag => tags.delete(tag)
  };
}

test("atribui personalidade e tick de nascimento automaticamente ao dragão", () => {
  const dragon = mockDragon();
  const result = initializeDragonEntity(dragon, 2400);
  assert.equal(result.species, "fire");
  assert.equal(result.spawnTickInitialized, true);
  assert.ok(dragon.getTags().includes("ds:dragon"));
  assert.ok(dragon.getTags().includes("ds:spawn_tick:2400"));
  for (const trait of ["curiosity", "sociability", "independence", "playfulness"]) {
    assert.ok(dragon.getTags().some(tag => tag.startsWith(`ds:trait:${trait}:`)));
  }
});

test("inicialização repetida preserva personalidade e spawn_tick", () => {
  const dragon = mockDragon("dragon_survival:water_dragon", "water-001", [
    "ds:trait:curiosity:0.99", "ds:spawn_tick:120", "ds:dragon"
  ]);
  const result = initializeDragonEntity(dragon, 9000);
  assert.equal(result.species, "water");
  assert.equal(result.spawnTickInitialized, false);
  assert.ok(dragon.getTags().includes("ds:trait:curiosity:0.99"));
  assert.ok(dragon.getTags().includes("ds:spawn_tick:120"));
  assert.equal(dragon.getTags().filter(tag => tag.startsWith("ds:trait:")).length, 4);
});


test("inicializa a identidade e necessidades das quinze espécies", () => {
  const species = ["fire","water","ice","electric","earth","lava","wind","sound","poison","sand","light","plasma","acid","radioactive","shadow"];
  for (const kind of species) {
    const dragon = mockDragon(`dragon_survival:${kind}_dragon`, kind+"-test");
    const result = initializeDragonEntity(dragon, 300);
    assert.equal(result.species, kind);
    assert.ok(dragon.getTags().includes(`ds:species:${kind}`));
    assert.ok(dragon.getTags().includes("ds:energy:100"));
    assert.ok(dragon.getTags().includes("ds:hunger:100"));
  }
});

test("ignora entidades comuns e espécies não registradas", () => {
  assert.equal(initializeDragonEntity(mockDragon("minecraft:wolf")), null);
  assert.equal(initializeDragonEntity(mockDragon("dragon_survival:crystal_dragon")), null);
});
