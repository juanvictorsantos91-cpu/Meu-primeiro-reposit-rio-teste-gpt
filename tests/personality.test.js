import test from "node:test";
import assert from "node:assert/strict";
import { generatePersonalityTraits, PERSONALITY_TRAITS } from "../src/species/personality.js";

test("gera quatro traços individuais em escala de 0 a 1", () => {
  const traits = generatePersonalityTraits({ seed: "dragon-001", species: "fire" });
  assert.deepEqual(Object.keys(traits), PERSONALITY_TRAITS);
  assert.deepEqual(PERSONALITY_TRAITS, ["curiosity", "sociability", "independence", "playfulness"]);
  for (const value of Object.values(traits)) assert.ok(value >= 0 && value <= 1);
  assert.equal("courage" in traits, false);
  assert.equal("fear" in traits, false);
  assert.equal("stress" in traits, false);
});

test("mesmo indivíduo mantém personalidade estável entre chamadas", () => {
  assert.deepEqual(
    generatePersonalityTraits({ seed: "dragon-001", species: "water" }),
    generatePersonalityTraits({ seed: "dragon-001", species: "water" })
  );
});

test("indivíduos diferentes podem ter personalidades distintas", () => {
  assert.notDeepEqual(
    generatePersonalityTraits({ seed: "dragon-001", species: "fire" }),
    generatePersonalityTraits({ seed: "dragon-002", species: "fire" })
  );
});

test("espécies diferentes preservam tendências-base diferentes", () => {
  const fire = generatePersonalityTraits({ seed: "same-seed", species: "fire", variation: 0 });
  const ice = generatePersonalityTraits({ seed: "same-seed", species: "ice", variation: 0 });
  assert.notEqual(fire.curiosity, ice.curiosity);
  assert.notEqual(fire.sociability, ice.sociability);
});

test("valida seed, espécie e intensidade de variação", () => {
  assert.throws(() => generatePersonalityTraits({ seed: "", species: "fire" }), /seed/);
  assert.throws(() => generatePersonalityTraits({ seed: "x", species: "unknown" }), RangeError);
  assert.throws(() => generatePersonalityTraits({ seed: "x", species: "fire", variation: 0.8 }), RangeError);
});
