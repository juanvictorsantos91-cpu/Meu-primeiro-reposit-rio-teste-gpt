import test from "node:test";
import assert from "node:assert/strict";
import {
  createOrganizedDragonGroup, selectDragonGroupLeader, createTerritoryPatrolPlan,
  updateOrganizedDragonGroup
} from "../src/ai/dragon-group-organization.js";

const roster = (species, count, prefix = species) =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`, species,
    leadership: index === count - 1 ? 0.95 : 0.2,
    experience: index / count, healthRatio: 0.9, energyRatio: 0.8,
    protectiveness: 0.7, aggression: 0.4
  }));

test("Fogo forma dupla territorial e mantém vínculo interno", () => {
  const dragons = roster("fire", 2);
  const group = createOrganizedDragonGroup({
    id: "fire-01", species: "fire", dragons, createdTick: 10,
    homeTerritoryId: "territory-fire-01", pairBonds: [[dragons[0].id, dragons[1].id]]
  });
  assert.equal(group.memberIds.length, 2);
  assert.equal(group.pairBonds.length, 1);
  assert.equal(group.leaderId, dragons[1].id);
  assert.equal(group.leader.role, "territory_leader");
});

test("Terra forma grupo territorial de seis indivíduos", () => {
  assert.throws(() => createOrganizedDragonGroup({
    id: "earth-small", species: "earth", dragons: roster("earth", 5), createdTick: 0
  }), /pelo menos 6/);
  const group = createOrganizedDragonGroup({
    id: "earth-large", species: "earth", dragons: roster("earth", 6), createdTick: 0
  });
  assert.equal(group.memberIds.length, 6);
});

test("Lava usa seis membros e Terra/Lava podem compartilhar estrutura de grupo", () => {
  const dragons = [...roster("lava", 3, "lava"), ...roster("earth", 3, "earth")];
  const group = createOrganizedDragonGroup({ id: "lava-earth", species: "lava", dragons, createdTick: 0 });
  assert.equal(group.memberIds.length, 6);
});

test("seleciona líder pelo perfil e desempata pelo ID", () => {
  const dragons = [{ id: "b", leadership: 0.5 }, { id: "a", leadership: 0.5 }];
  assert.equal(selectDragonGroupLeader(dragons), "a");
});

test("plano distribui patrulhas e mantém casais juntos sem formar manada", () => {
  const dragons = roster("fire", 2);
  const group = createOrganizedDragonGroup({
    id: "fire-patrol", species: "fire", dragons, createdTick: 1,
    homeTerritoryId: "territory-1", pairBonds: [[dragons[0].id, dragons[1].id]]
  });
  const plan = createTerritoryPatrolPlan(group, ["north", "south", "east", "west"]);
  assert.equal(plan.membersStayTogetherAsHerd, false);
  assert.equal(plan.assignments.length, 1);
  assert.deepEqual(plan.assignments[0].memberIds, [dragons[0].id, dragons[1].id].sort());
  assert.equal(new Set(plan.assignments.map(item => item.sectorId)).size, 1);
  assert.equal(plan.leaderDuty, "coordinate_and_oversee_patrol_sectors");
});

test("troca líder quando o atual sai, usando o elenco completo remanescente", () => {
  const dragons = roster("water", 3);
  const group = createOrganizedDragonGroup({ id: "water-01", species: "water", dragons, createdTick: 0 });
  const remaining = dragons.filter(dragon => dragon.id !== group.leaderId);
  remaining[0].leadership = 1;
  const updated = updateOrganizedDragonGroup(group, {
    removeMemberIds: [group.leaderId], remainingDragons: remaining, tick: 5
  });
  assert.equal(updated.leaderId, remaining[0].id);
  assert.equal(updated.leader.role, "territory_leader");
});

test("grupos solitários não podem ser criados como grupos sociais", () => {
  assert.throws(() => createOrganizedDragonGroup({
    id: "electric", species: "electric", dragons: roster("electric", 6), createdTick: 0
  }), /solitárias/);
});
