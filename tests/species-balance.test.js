import test from "node:test";
import assert from "node:assert/strict";
import { dragonBalance, getDragonBalance } from "../src/species/balance.js";

test("as quinze espécies possuem dimensões, mobilidade e metabolismo válidos", () => {
  assert.equal(Object.keys(dragonBalance).length, 15);
  for (const [species, value] of Object.entries(dragonBalance)) {
    assert.ok(value.height > 0 && value.width > 0 && value.length > 0, species);
    assert.ok(value.groundSpeed > 0 && value.flightSpeed > 0, species);
    assert.ok(value.maxFlightAltitude > 0 && value.flightRange > 0, species);
    assert.ok(value.health >= 90 && value.hunger > 0 && value.rest > 0, species);
  }
});

test("Terra é o maior; Vento tem maior alcance; Elétrico tem maior altitude", () => {
  const values = Object.entries(dragonBalance);
  assert.equal(values.sort((a,b) => b[1].height-a[1].height)[0][0], "earth");
  assert.equal(values.sort((a,b) => b[1].flightRange-a[1].flightRange)[0][0], "wind");
  assert.equal(values.sort((a,b) => b[1].maxFlightAltitude-a[1].maxFlightAltitude)[0][0], "electric");
  assert.ok(getDragonBalance("electric").flightRange > getDragonBalance("wind").flightRange * 0.65);
});

test("espécie desconhecida não recebe balanceamento genérico", () => {
  assert.throws(() => getDragonBalance("crystal"), /sem balanceamento/);
});
