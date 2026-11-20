import test from "node:test";
import assert from "node:assert/strict";
import { createBedrockSocialWorldRuntime } from "../src/adapters/bedrock/social-world-runtime.js";

function mockWorld() {
  const values = new Map();
  return {
    getDynamicProperty: key => values.get(key),
    setDynamicProperty: (key,value) => values.set(key,value)
  };
}
function mockEntity(id) {
  const tags = new Set();
  return {
    id, location:{x:10,y:70,z:20}, isOnGround:true,
    getTags:()=>[...tags], hasTag:tag=>tags.has(tag),
    addTag:tag=>tags.add(tag), removeTag:tag=>tags.delete(tag)
  };
}

test("runtime grava grupos sociais e territórios no estado persistente do mundo", () => {
  const runtime = createBedrockSocialWorldRuntime(mockWorld());
  const entity = mockEntity("fire-a");
  const state = {
    id:"fire-a", species:"fire", health:100, energy:90, aggression:0.8,
    currentTick:2400, lifeStage:"adult", isTamed:false,
    nearbyDragons:[{id:"fire-b",species:"fire",distance:12,health:90,energy:80,partnerId:"fire-a"}]
  };
  const decision = {groupPlan:{pattern:"territorial_patrol",action:"organize_territory_patrol_group",targetGroupSize:2}};
  const group = runtime.synchronizeGroup(entity,state,decision);
  assert.equal(group.memberIds.length,2);
  assert.equal(entity.hasTag("ds:group:"+encodeURIComponent(group.id)),true);
  assert.equal(entity.hasTag("ds:leader"),true);
  const territory = runtime.ensureTerritory(entity,{...state,groupId:group.id});
  assert.equal(territory.ownerGroupId,group.id);
  const saved = runtime.storage.load();
  assert.equal(saved.groups.length,1);
  assert.equal(saved.territories.length,1);
});

test("espécies solitárias não formam grupos e Plasma não recebe território fixo", () => {
  const runtime = createBedrockSocialWorldRuntime(mockWorld());
  const entity = mockEntity("plasma-a");
  const group = runtime.synchronizeGroup(entity,{
    id:"plasma-a",species:"plasma",currentTick:10
  },{groupPlan:{pattern:"solitary",action:"remain_solo",targetGroupSize:1}});
  assert.equal(group,null);
  assert.equal(runtime.ensureTerritory(entity,{
    id:"plasma-a",species:"plasma",currentTick:10,lifeStage:"adult"
  }),null);
  assert.equal(runtime.storage.load(),null);
});
