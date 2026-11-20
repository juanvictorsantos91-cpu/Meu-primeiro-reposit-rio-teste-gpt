import test from "node:test";
import assert from "node:assert/strict";
import { createTerritory, createTerritoryDomain, annexTerritoryToDomain } from "../src/ai/territory-state.js";
import { assessDomainAttackPressure, applyDomainRaid, DOMAIN_ATTACK_RULES } from "../src/ai/territory-pressure.js";

function setup() {
  const core = createTerritory({
    id: "fire-core", species: "fire", ownerGroupId: "fire-group",
    center: { x: 0, y: 64, z: 0 }, radius: 224, createdTick: 0
  });
  const frontier = createTerritory({
    id: "ice-frontier", species: "ice", ownerGroupId: "ice-group",
    center: { x: 300, y: 64, z: 0 }, radius: 192, createdTick: 0
  });
  const domain = createTerritoryDomain({
    id: "fire-realm", ownerGroupId: "fire-group", capitalTerritoryId: core.id, createdTick: 0
  });
  const annexed = annexTerritoryToDomain(domain, frontier, { tick: 1 });
  return { core, domain: annexed.domain, frontier: annexed.territory };
}

test("reinos expandidos ficam sujeitos a incursões recorrentes", () => {
  const { domain } = setup();
  const early = assessDomainAttackPressure(domain, { tick: 11999 });
  const due = assessDomainAttackPressure(domain, { tick: 12000 });
  assert.equal(early.eligible, false);
  assert.equal(due.eligible, true);
  assert.ok(due.attackChance > 0);
  assert.ok(due.vulnerableTerritoryIds.includes("ice-frontier"));
  assert.equal(DOMAIN_ATTACK_RULES.attackIntervalTicks, 12000);
});

test("uma incursão reduz apenas uma pequena fração da região anexada", () => {
  const { domain, frontier } = setup();
  const result = applyDomainRaid(domain, frontier, { tick: 12000 });
  assert.equal(result.territoryReleased, false);
  assert.equal(result.remainingIntegrity, 0.95);
  assert.deepEqual(result.domain.territoryIds, ["fire-core", "ice-frontier"]);
  assert.equal(result.territory.ownerGroupId, "fire-group");
});

test("incursões repetidas podem desfazer a expansão até o reino voltar ao núcleo original", () => {
  let { domain, frontier } = setup();
  let tick = 12000;
  let result;
  for (let i = 0; i < 20; i++) {
    result = applyDomainRaid(domain, frontier, { tick, loss: 0.05 });
    domain = result.domain;
    frontier = result.territory;
    tick += 12000;
  }
  assert.equal(result.territoryReleased, true);
  assert.deepEqual(domain.territoryIds, ["fire-core"]);
  assert.equal(frontier.ownerGroupId, "ice-group");
  assert.equal(frontier.domainId, null);
});

test("o núcleo original nunca pode ser perdido por incursões", () => {
  const { domain, core } = setup();
  assert.throws(() => applyDomainRaid(domain, core, { tick: 12000 }), /núcleo original/);
});

test("ataques não podem reduzir integridade com valores inválidos nem retroceder o tempo", () => {
  const { domain, frontier } = setup();
  assert.throws(() => applyDomainRaid(domain, frontier, { tick: 10, loss: 0 }), /loss/);
  assert.throws(() => applyDomainRaid(domain, frontier, { tick: 0 }), /não pode retroceder/);
});
