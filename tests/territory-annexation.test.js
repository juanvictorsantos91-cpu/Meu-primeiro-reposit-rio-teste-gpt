import test from "node:test";
import assert from "node:assert/strict";
import {
  createTerritory, createTerritoryDomain, annexTerritoryToDomain,
  getDomainTerritoryIds, InMemoryTerritoryDomainRepository
} from "../src/ai/territory-state.js";

function setup() {
  const capital = createTerritory({
    id: "fire-capital", species: "fire", ownerGroupId: "fire-kingdom",
    center: { x: 0, y: 64, z: 0 }, radius: 224, createdTick: 10
  });
  const conquered = createTerritory({
    id: "ice-north", species: "ice", ownerGroupId: "ice-clan",
    center: { x: 400, y: 70, z: 0 }, radius: 192, createdTick: 5
  });
  const domain = createTerritoryDomain({
    id: "fire-realm", ownerGroupId: "fire-kingdom",
    capitalTerritoryId: capital.id, createdTick: 10
  });
  return { capital, conquered, domain };
}

test("domínio nasce com a capital como seu primeiro território", () => {
  const { domain, capital } = setup();
  assert.deepEqual(getDomainTerritoryIds(domain), [capital.id]);
  assert.equal(domain.ownerGroupId, "fire-kingdom");
});

test("conquista anexa uma nova região sem abandonar nem apagar a região original", () => {
  const { domain, capital, conquered } = setup();
  const result = annexTerritoryToDomain(domain, conquered, {
    tick: 300, reason: "kingdom_conquest"
  });

  assert.deepEqual(getDomainTerritoryIds(result.domain), ["fire-capital", "ice-north"]);
  assert.equal(result.territory.id, "ice-north");
  assert.deepEqual(result.territory.center, conquered.center);
  assert.equal(result.territory.radius, conquered.radius);
  assert.equal(result.territory.status, "active");
  assert.equal(result.territory.ownerGroupId, "fire-kingdom");
  assert.equal(result.territory.domainId, "fire-realm");
  assert.equal(result.domain.history.at(-1).type, "territory_annexed");
  assert.equal(result.territory.history.at(-1).fromOwnerGroupId, "ice-clan");
  assert.equal(result.territory.history.at(-1).toOwnerGroupId, "fire-kingdom");
  assert.equal(capital.status, "active");
  assert.equal(capital.ownerGroupId, "fire-kingdom");
});

test("impede anexar duas vezes o mesmo território", () => {
  const { domain, conquered } = setup();
  const once = annexTerritoryToDomain(domain, conquered, { tick: 300 });
  assert.throws(() => annexTerritoryToDomain(once.domain, once.territory, {
    tick: 301
  }), /já faz parte/);
});

test("não anexa território abandonado nem aceita data anterior", () => {
  const { domain, conquered } = setup();
  const abandoned = { ...conquered, status: "abandoned" };
  assert.throws(() => annexTerritoryToDomain(domain, abandoned, {
    tick: 300
  }), /precisa estar ativo/);
  assert.throws(() => annexTerritoryToDomain(domain, conquered, {
    tick: 1
  }), /não pode retroceder/);
});

test("conquista de região de outro reino remove a região do reino anterior", () => {
  const capital = createTerritory({
    id: "ice-capital", species: "ice", ownerGroupId: "ice-kingdom",
    center: { x: 100, y: 64, z: 0 }, radius: 192, createdTick: 10
  });
  const outer = createTerritory({
    id: "ice-frontier", species: "ice", ownerGroupId: "ice-kingdom",
    center: { x: 300, y: 64, z: 0 }, radius: 192, createdTick: 12
  });
  const source = {
    ...createTerritoryDomain({
      id: "ice-realm", ownerGroupId: "ice-kingdom",
      capitalTerritoryId: capital.id, createdTick: 10
    }),
    territoryIds: ["ice-capital", "ice-frontier"]
  };
  const { domain: fireRealm } = setup();
  const frontier = { ...outer, domainId: "ice-realm" };
  const result = annexTerritoryToDomain(fireRealm, frontier, {
    tick: 400, sourceDomain: source, reason: "kingdom_conquest"
  });
  assert.deepEqual(result.sourceDomain.territoryIds, ["ice-capital"]);
  assert.equal(result.sourceDomain.capitalTerritoryId, "ice-capital");
  assert.equal(result.sourceDomain.status, "active");
  assert.equal(result.territory.domainId, "fire-realm");
  assert.equal(result.territory.ownerGroupId, "fire-kingdom");
});

test("reino que perde sua última região é dissolvido, sem apagar o histórico", () => {
  const { domain: fireRealm } = setup();
  const onlyRegion = createTerritory({
    id: "small-kingdom-capital", species: "wind", ownerGroupId: "wind-kingdom",
    center: { x: -200, y: 64, z: 0 }, radius: 96, createdTick: 20
  });
  const source = createTerritoryDomain({
    id: "wind-realm", ownerGroupId: "wind-kingdom",
    capitalTerritoryId: onlyRegion.id, createdTick: 20
  });
  const result = annexTerritoryToDomain(fireRealm, {
    ...onlyRegion, domainId: source.id
  }, { tick: 500, sourceDomain: source });
  assert.equal(result.sourceDomain.status, "dissolved");
  assert.equal(result.sourceDomain.capitalTerritoryId, null);
  assert.deepEqual(result.sourceDomain.territoryIds, []);
  assert.equal(result.sourceDomain.history.at(-1).type, "domain_dissolved_by_conquest");
});

test("não permite anexar território de reino rival sem atualizar o reino de origem", () => {
  const { domain: fireRealm } = setup();
  const rivalRegion = {
    ...createTerritory({
      id: "rival-region", species: "ice", ownerGroupId: "ice-kingdom",
      center: { x: 10, y: 64, z: 200 }, radius: 192, createdTick: 10
    }),
    domainId: "ice-realm"
  };
  assert.throws(() => annexTerritoryToDomain(fireRealm, rivalRegion, {
    tick: 400
  }), /domínio de origem/);
});

test("repositório de domínios mantém cópias isoladas e filtra por estado", () => {
  const { domain } = setup();
  const repository = new InMemoryTerritoryDomainRepository();
  repository.save(domain);
  const copy = repository.get(domain.id);
  copy.territoryIds.push("fake-region");
  assert.deepEqual(repository.get(domain.id).territoryIds, ["fire-capital"]);
  assert.equal(repository.list({ status: "active" }).length, 1);
  assert.throws(() => repository.save({ ...domain, revision: 0 }), /revisão mais recente/);
});
