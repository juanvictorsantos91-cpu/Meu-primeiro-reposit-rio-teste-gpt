import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const species = ["fire","water","ice","electric","earth","lava","wind","sound","poison","sand","light","plasma","acid","radioactive","shadow"];
const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

test("o build gera Behavior Pack e Resource Pack para as quinze espécies", async () => {
  for (const id of species) {
    const bp = await json(`../bedrock/behavior_pack/entities/${id}_dragon.json`);
    const rp = await json(`../bedrock/resource_pack/entity/dragon_${id}.entity.json`);
    const b = bp["minecraft:entity"];
    const c = rp["minecraft:client_entity"].description;
    assert.equal(b.description.identifier, `dragon_survival:${id}_dragon`);
    assert.ok(b.components["minecraft:health"].max > 0);
    assert.ok(b.components["minecraft:collision_box"].height > 0);
    assert.ok(c.geometry.default.endsWith(id));
    assert.ok(c.textures.default.endsWith(id));
    assert.ok(c.animations[id+"_controller"]);
  }
});

test("vento recebe quatro asas e veneno mantém o plano corporal de duas patas", async () => {
  const wind = await json("../bedrock/resource_pack/models/entity/dragon_wind.geo.json");
  const poison = await json("../bedrock/resource_pack/models/entity/dragon_poison.geo.json");
  const windBones = wind["minecraft:geometry"][0].bones.map(b => b.name);
  const poisonBones = poison["minecraft:geometry"][0].bones.map(b => b.name);
  assert.ok(windBones.includes("wing_rear_left") && windBones.includes("wing_rear_right"));
  assert.ok(poisonBones.includes("rear_leg_left") && poisonBones.includes("rear_leg_right"));
  assert.ok(!poisonBones.includes("front_leg_left") && !poisonBones.includes("front_leg_right"));
});

test("texturas de espécie e ovos são PNGs de 128 e 16 pixels", async () => {
  for (const id of species) {
    const texture = await readFile(new URL(`../bedrock/resource_pack/textures/entity/dragon_${id}.png`, import.meta.url));
    const egg = await readFile(new URL(`../bedrock/resource_pack/textures/items/dragon_${id}_spawn_egg.png`, import.meta.url));
    for (const png of [texture, egg]) assert.equal(png.subarray(0,8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(texture.readUInt32BE(16),128); assert.equal(texture.readUInt32BE(20),128);
    assert.equal(egg.readUInt32BE(16),16); assert.equal(egg.readUInt32BE(20),16);
  }
});

test("animações idle, caminhada e voo estão registradas para cada espécie", async () => {
  for (const id of species) {
    const file = await json(`../bedrock/resource_pack/animations/dragon_${id}.animation.json`);
    const animations = file.animations;
    assert.ok(animations[`animation.dragon_survival.${id}.idle`]);
    assert.ok(animations[`animation.dragon_survival.${id}.walk`]);
    assert.ok(animations[`animation.dragon_survival.${id}.fly`]);
  }
});
