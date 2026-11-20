import test from "node:test";
import assert from "node:assert/strict";
import { createDragonGroup, updateDragonGroup, InMemoryDragonGroupRepository } from "../src/ai/dragon-groups.js";
import { writeDragonGroupMembership, writeDragonGroupLeadership, writeDragonGroupState } from "../src/adapters/bedrock/dragon-group-writer.js";

test("cria grupo com identidade estável e líder membro", () => {
  const group = createDragonGroup({ id:"flame-alpha", species:"fire", memberIds:["f1","f2"], createdTick:100 });
  assert.equal(group.leaderId,"f1");
  assert.deepEqual(group.memberIds,["f1","f2"]);
  assert.equal(group.status,"active");
});

test("atualiza membros sem perder histórico e troca líder quando necessário", () => {
  const group = createDragonGroup({ id:"river", species:"water", memberIds:["w1","w2"], createdTick:10 });
  const next = updateDragonGroup(group,{addMemberIds:["w3"],removeMemberIds:["w1"],tick:20});
  assert.deepEqual(next.memberIds,["w2","w3"]);
  assert.equal(next.leaderId,"w2");
  assert.equal(next.history.length,2);
});

test("encerra grupo quando o último membro sai", () => {
  const group = createDragonGroup({ id:"solo", species:"electric", memberIds:["e1"], createdTick:0 });
  const ended = updateDragonGroup(group,{removeMemberIds:["e1"],tick:1});
  assert.equal(ended.status,"disbanded");
  assert.deepEqual(ended.memberIds,[]);
});

test("rejeita espécie, líder, duplicatas e tempo inválidos", () => {
  assert.throws(()=>createDragonGroup({id:"x",species:"unknown",memberIds:["a"],createdTick:0}),/Espécie/);
  assert.throws(()=>createDragonGroup({id:"x",species:"fire",memberIds:["a","a"],createdTick:0}),/duplicados/);
  assert.throws(()=>createDragonGroup({id:"x",species:"fire",memberIds:["a"],leaderId:"b",createdTick:0}),/líder/);
  const group=createDragonGroup({id:"x",species:"fire",memberIds:["a"],createdTick:5});
  assert.throws(()=>updateDragonGroup(group,{tick:4}),/retroceder/);
});

test("repositório isola cópias e impede revisão antiga", () => {
  const repo = new InMemoryDragonGroupRepository();
  const group = createDragonGroup({id:"x",species:"ice",memberIds:["i1"],createdTick:0});
  repo.save(group);
  const copy=repo.get("x"); copy.memberIds.push("fake");
  assert.deepEqual(repo.get("x").memberIds,["i1"]);
  assert.throws(()=>repo.save({...group,revision:0}),/revisão mais recente/);
});

test("writer substitui somente a tag de grupo e preserva tags alheias", () => {
  const tags=new Set(["ds:species:fire","ds:group:old","ds:energy:80"]);
  const entity={getTags:()=>[...tags],addTag:t=>tags.add(t),removeTag:t=>tags.delete(t)};
  writeDragonGroupMembership(entity,"flame:alpha");
  assert.ok(tags.has("ds:group:flame%3Aalpha"));
  assert.ok(tags.has("ds:species:fire") && tags.has("ds:energy:80"));
  writeDragonGroupMembership(entity,null);
  assert.equal([...tags].some(t=>t.startsWith("ds:group:")),false);
});

test("writer marca e remove líder sem afetar tags de grupo ou espécie", () => {
  const tags = new Set(["ds:species:fire", "ds:group:flame-01", "ds:energy:80"]);
  const entity = { getTags: () => [...tags], addTag: tag => tags.add(tag), removeTag: tag => tags.delete(tag) };
  writeDragonGroupLeadership(entity, true);
  assert.ok(tags.has("ds:leader"));
  assert.ok(tags.has("ds:group:flame-01") && tags.has("ds:species:fire"));
  writeDragonGroupLeadership(entity, false);
  assert.equal(tags.has("ds:leader"), false);
  assert.ok(tags.has("ds:energy:80"));
});


test("sincroniza membro e líder a partir do registro persistido", () => {
  const tags = new Set(["ds:species:fire", "ds:leader", "ds:energy:75"]);
  const entity = { id: "f2", getTags: () => [...tags], addTag: tag => tags.add(tag), removeTag: tag => tags.delete(tag) };
  const group = { id: "fire-alpha", status: "active", memberIds: ["f1", "f2"], leaderId: "f2" };
  assert.deepEqual(writeDragonGroupState(entity, group), { member: true, leader: true });
  assert.ok(tags.has("ds:group:fire-alpha") && tags.has("ds:leader"));
  const notLeader = { ...group, leaderId: "f1" };
  assert.deepEqual(writeDragonGroupState(entity, notLeader), { member: true, leader: false });
  assert.ok(tags.has("ds:group:fire-alpha") && !tags.has("ds:leader"));
  assert.deepEqual(writeDragonGroupState(entity, { ...group, memberIds: ["f1"] }), { member: false, leader: false });
  assert.equal([...tags].some(tag => tag.startsWith("ds:group:") || tag === "ds:leader"), false);
  assert.ok(tags.has("ds:species:fire") && tags.has("ds:energy:75"));
});
