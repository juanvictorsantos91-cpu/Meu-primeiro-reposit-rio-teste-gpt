import test from "node:test";
import assert from "node:assert/strict";
import { assessSocialGroupFormation } from "../src/ai/social-group-formation.js";

const dragon = (id, species, extra = {}) => ({ id, species, ...extra });

test("Fogo e Gelo formam duplas", () => {
  for (const species of ["fire", "ice"]) {
    const result = assessSocialGroupFormation({
      dragon: dragon(`${species}-1`, species),
      candidates: Array.from({ length: 1 }, (_, i) => dragon(`${species}-${i + 2}`, species, { distance: 12 }))
    });
    assert.equal(result.targetGroupSize, 2);
    assert.equal(result.status, "formation_candidate");
    assert.equal(result.candidateIds.length, 1);
  }
});

test("Água forma grupos territoriais de três", () => {
  const result = assessSocialGroupFormation({
    dragon: dragon("w1", "water"),
    candidates: Array.from({ length: 2 }, (_, i) => dragon(`w${i + 2}`, "water", { distance: 4 }))
  });
  assert.equal(result.targetGroupSize, 3);
  assert.equal(result.shouldForm, true);
});

test("Terra exige seis membros e Terra/Lava podem compartilhar grupo", () => {
  const result = assessSocialGroupFormation({
    dragon: dragon("e1", "earth"),
    candidates: [
      ...Array.from({ length: 4 }, (_, i) => dragon(`l${i + 1}`, "lava", { distance: 10 })),
      ...Array.from({ length: 5 }, (_, i) => dragon(`e${i + 2}`, "earth", { distance: 11 }))
    ]
  });
  assert.equal(result.targetGroupSize, 6);
  assert.equal(result.candidateIds.length, 9);
  assert.equal(result.status, "formation_candidate");
});

test("Elétrico permanece solitário mesmo com outros elétricos próximos", () => {
  const result = assessSocialGroupFormation({
    dragon: dragon("e1", "electric"),
    candidates: [dragon("e2", "electric", { distance: 1 }), dragon("e3", "electric", { distance: 2 })]
  });
  assert.equal(result.status, "not_eligible");
  assert.equal(result.shouldForm, false);
  assert.deepEqual(result.candidateIds, []);
});

test("filtra distância, duplicatas, indisponíveis e candidatos inválidos", () => {
  const result = assessSocialGroupFormation({
    dragon: dragon("s1", "sound"),
    candidates: [
      dragon("s2", "sound", { distance: 32 }),
      dragon("s2", "sound", { distance: 2 }),
      dragon("s3", "sound", { distance: 33 }),
      dragon("s4", "sound", { distance: 1, available: false }),
      dragon("s5", "sound", { distance: 2, groupId: "g1" })
    ]
  });
  assert.deepEqual(result.candidateIds, ["s2"]);
  assert.equal(result.shouldForm, false);
});


test("as cinco novas espécies são reconhecidas pelo planejador de grupos", () => {
  for (const species of ["acid", "sand", "light", "radioactive", "shadow"]) {
    const result = assessSocialGroupFormation({
      dragon: dragon(`${species}-1`, species),
      candidates: []
    });
    assert.equal(result.species, species);
    assert.ok(result.targetGroupSize >= 1);
  }
});

test("não substitui grupo já associado e valida entradas", () => {
  const existing = assessSocialGroupFormation({
    dragon: dragon("f1", "fire", { groupId: "pair-1" }),
    candidates: [dragon("f2", "fire", { distance: 2 })]
  });
  assert.equal(existing.status, "already_grouped");
  assert.equal(existing.action, "maintain_existing_group");
  assert.throws(() => assessSocialGroupFormation({ dragon: dragon("x", "unknown") }), /Espécie/);
  assert.throws(() => assessSocialGroupFormation({ dragon: dragon("x", "fire"), maxDistance: -1 }), /maxDistance/);
});
