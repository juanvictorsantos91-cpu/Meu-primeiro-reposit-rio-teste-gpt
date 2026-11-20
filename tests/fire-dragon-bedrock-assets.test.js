import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readJson = async (relativePath) =>
  JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"));

test("Fire Dragon Bedrock manifests and entity identifiers are linked", async () => {
  const behaviorManifest = await readJson("../bedrock/behavior_pack/manifest.json");
  const resourceManifest = await readJson("../bedrock/resource_pack/manifest.json");
  const behaviorEntity = await readJson("../bedrock/behavior_pack/entities/fire_dragon.json");
  const clientEntity = await readJson("../bedrock/resource_pack/entity/dragon_fire.entity.json");

  assert.equal(resourceManifest.dependencies[0].uuid, behaviorManifest.header.uuid);
  assert.equal(behaviorEntity["minecraft:entity"].description.identifier, "dragon_survival:fire_dragon");
  assert.equal(clientEntity["minecraft:client_entity"].description.identifier, "dragon_survival:fire_dragon");
});

test("Fire Dragon geometry contains the approved basic anatomy", async () => {
  const geometryFile = await readJson("../bedrock/resource_pack/models/entity/dragon_fire.geo.json");
  const geometry = geometryFile["minecraft:geometry"][0];
  const bones = geometry.description && geometry.bones;

  assert.equal(geometry.description.identifier, "geometry.dragon_survival.fire");
  assert.ok(Array.isArray(bones) && bones.length > 0);
  const names = new Set(bones.map((bone) => bone.name));

  for (const required of [
    "root", "body", "head", "jaw", "wing_left", "wing_right",
    "front_leg_left", "front_leg_right", "rear_leg_left", "rear_leg_right",
    "tail_base", "tail_mid", "tail_tip"
  ]) assert.ok(names.has(required), `Missing required bone: ${required}`);

  assert.equal([...names].filter((name) => name.includes("_leg_")).length, 4);
  assert.equal([...names].filter((name) => /^wing_(left|right)$/.test(name)).length, 2);
  assert.ok(names.has("wing_tip_left") && names.has("wing_tip_right"));
  assert.ok(names.has("chest_core"));
  assert.ok(names.has("shoulder_armor_left") && names.has("shoulder_armor_right"));
  const byName = Object.fromEntries(bones.map((bone) => [bone.name, bone]));
  assert.ok((byName.wing_left.cubes?.length ?? 0) >= 6);
  assert.ok((byName.wing_right.cubes?.length ?? 0) >= 6);
  assert.ok((byName.tail_base.cubes?.length ?? 0) >= 3);
  assert.ok((byName.head.cubes?.length ?? 0) >= 4);
  const rotatedCubes = bones.flatMap((bone) => bone.cubes ?? []).filter((cube) => cube.rotation?.some((angle) => angle !== 0));
  assert.ok(rotatedCubes.length >= 10, "Expected rotated parts to avoid a purely box-like silhouette");
  for (const bone of bones) for (const cube of bone.cubes ?? []) {
    assert.equal(cube.origin.length, 3);
    assert.equal(cube.size.length, 3);
    assert.ok(cube.size.every((value) => value > 0));
    assert.ok(Array.isArray(cube.uv) ? cube.uv.length === 2 : cube.uv && typeof cube.uv === "object" && Object.keys(cube.uv).length > 0);
  }
});

test("Fire Dragon texture is a valid 128x128 PNG", async () => {
  const png = await readFile(new URL("../bedrock/resource_pack/textures/entity/dragon_fire.png", import.meta.url));
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 128);
  assert.equal(png.readUInt32BE(20), 128);
});

test("Fire Dragon client entity uses valid animation-controller registration", async () => {
  const clientEntity = await readJson("../bedrock/resource_pack/entity/dragon_fire.entity.json");
  const root = clientEntity["minecraft:client_entity"];
  const description = root.description;

  assert.equal(description.textures.default, "textures/entity/dragon_fire");
  assert.equal(description.render_controllers[0], "controller.render.dragon_survival.fire");
  assert.equal(description.spawn_egg.texture, "dragon_survival:fire_dragon_spawn_egg");
  assert.equal(description.animations.fire_idle, "animation.dragon_survival.fire.idle");
  assert.equal(description.animations.fire_walk, "animation.dragon_survival.fire.walk");
  assert.equal(description.animations.fire_fly, "animation.dragon_survival.fire.fly");
  assert.equal(description.animations.fire_controller, "controller.animation.dragon_survival.fire");
  assert.deepEqual(description.scripts.animate, ["fire_controller"]);
  assert.equal(Object.hasOwn(root, "animation_controllers"), false);
  assert.equal(Object.hasOwn(description, "animation_controllers"), false);
});

test("Fire Dragon animation files and render controller are connected", async () => {
  const animationFile = await readJson("../bedrock/resource_pack/animations/dragon_fire.animation.json");
  const controllerFile = await readJson("../bedrock/resource_pack/animation_controllers/dragon_fire.animation_controllers.json");
  const renderFile = await readJson("../bedrock/resource_pack/render_controllers/dragon_fire.render_controllers.json");
  const animations = animationFile.animations;
  const states = controllerFile.animation_controllers["controller.animation.dragon_survival.fire"].states;

  assert.ok(animations["animation.dragon_survival.fire.idle"]);
  assert.ok(animations["animation.dragon_survival.fire.walk"]);
  assert.ok(animations["animation.dragon_survival.fire.fly"]);
  assert.deepEqual(states.idle.animations, ["fire_idle"]);
  assert.deepEqual(states.walk.animations, ["fire_walk"]);
  assert.deepEqual(states.fly.animations, ["fire_fly"]);
  assert.ok(renderFile.render_controllers["controller.render.dragon_survival.fire"]);
});

test("Fire Dragon has a distinct custom spawn egg texture and localized name", async () => {
  const png = await readFile(new URL("../bedrock/resource_pack/textures/items/dragon_fire_spawn_egg.png", import.meta.url));
  const itemAtlas = await readJson("../bedrock/resource_pack/textures/item_texture.json");
  const languages = await readJson("../bedrock/resource_pack/texts/languages.json");
  const pt = await readFile(new URL("../bedrock/resource_pack/texts/pt_BR.lang", import.meta.url), "utf8");

  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 16);
  assert.equal(png.readUInt32BE(20), 16);
  assert.ok(itemAtlas.texture_data["dragon_survival:fire_dragon_spawn_egg"]);
  assert.ok(languages.languages.includes("pt_BR"));
  assert.match(pt, /Ovo de Invocação do Dragão de Fogo/);
});

test("Bedrock dragon discovery uses the declared dragon_survival family", async () => {
  const main = await readFile(new URL("../bedrock/behavior_pack/scripts/main.js", import.meta.url), "utf8");
  const initializer = await readFile(new URL("../src/adapters/bedrock/dragon-initializer.js", import.meta.url), "utf8");
  const behavior = await readJson("../bedrock/behavior_pack/entities/fire_dragon.json");
  const families = behavior["minecraft:entity"].components["minecraft:type_family"].family;

  assert.ok(families.includes("dragon_survival"));
  assert.ok(main.includes('getEntities({ families: ["dragon_survival"] })'));
  assert.ok(main.includes("initializeDragonEntity(entity, currentTick)"));
  assert.ok(initializer.includes('entity.addTag("ds:dragon")'));
});

test("Dragon Survival 0.2.0 manifests and RP dependency are synchronized", async () => {
  const behavior = await readJson("../bedrock/behavior_pack/manifest.json");
  const resource = await readJson("../bedrock/resource_pack/manifest.json");

  assert.deepEqual(behavior.header.version, [0, 2, 0]);
  assert.deepEqual(resource.header.version, [0, 2, 0]);
  assert.deepEqual(behavior.modules.map((module) => module.version), [[0, 2, 0], [0, 2, 0]]);
  assert.deepEqual(resource.modules[0].version, [0, 2, 0]);
  assert.deepEqual(resource.dependencies[0].version, behavior.header.version);
  assert.deepEqual(behavior.header.version, [0, 2, 0]);
  assert.equal(resource.dependencies[0].uuid, behavior.header.uuid);
});
