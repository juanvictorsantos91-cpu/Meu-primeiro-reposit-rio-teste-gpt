import test from "node:test";
import assert from "node:assert/strict";
import { executeDragonAction } from "../src/adapters/bedrock/action-executor.js";

function mockEntity(id, location, tags = [], typeId = "minecraft:cow") {
  const entity = {
    id, location, typeId, tags: [...tags], impulses: [], knockbacks: [], damage: [],
    getTags() { return [...this.tags]; },
    hasTag(tag) { return this.tags.includes(tag); },
    addTag(tag) { if (!this.tags.includes(tag)) this.tags.push(tag); },
    removeTag(tag) { this.tags = this.tags.filter(value => value !== tag); },
    applyImpulse(vector) { this.impulses.push(vector); },
    applyKnockback(vector, vertical) { this.knockbacks.push({ vector, vertical }); },
    applyDamage(amount) { this.damage.push(amount); return true; },
    clearVelocity() { this.velocityCleared = true; }
  };
  return entity;
}

test("executor estabiliza o dragão ao descansar ou pousar", () => {
  const dragon = mockEntity("dragon", { x: 0, y: 64, z: 0 });
  const result = executeDragonAction(dragon, { action: "land_safely" });
  assert.equal(result.executed, true);
  assert.equal(dragon.velocityCleared, true);
});

test("executor aproxima o dragão de uma presa selvagem verificada", () => {
  const dragon = mockEntity("dragon", { x: 0, y: 64, z: 0 });
  const prey = mockEntity("rabbit", { x: 8, y: 64, z: 0 }, ["ds:wild"]);
  const result = executeDragonAction(
    dragon, { action: "hunt_selected_prey", huntingPlan: { selectedPreyId: "rabbit" } }, [prey]
  );
  assert.equal(result.mode, "approach_and_pursue");
  assert.equal(dragon.impulses.length, 1);
});

test("executor recusa animais que não estejam marcados como selvagens", () => {
  const dragon = mockEntity("dragon", { x: 0, y: 64, z: 0 });
  const farmAnimal = mockEntity("cow", { x: 1, y: 64, z: 0 }, ["ds:farm"]);
  const result = executeDragonAction(
    dragon, { action: "hunt_selected_prey", huntingPlan: { selectedPreyId: "cow" } }, [farmAnimal]
  );
  assert.equal(result.executed, false);
  assert.equal(farmAnimal.damage.length, 0);
});

test("rajada de vento empurra criaturas hostis vanilla", () => {
  const dragon = mockEntity("dragon", { x: 0, y: 64, z: 0 });
  const zombie = mockEntity("zombie", { x: 2, y: 64, z: 0 }, [], "minecraft:zombie");
  const result = executeDragonAction(dragon, { action: "perform_wind_gust" }, [zombie]);
  assert.equal(result.affectedTargets, 1);
  assert.equal(zombie.knockbacks.length, 1);
});
