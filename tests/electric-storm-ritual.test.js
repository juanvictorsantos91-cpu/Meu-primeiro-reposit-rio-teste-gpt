import test from "node:test";
import assert from "node:assert/strict";
import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";
import {
  assessElectricStormRitual,
  ELECTRIC_STORM_RITUAL_COOLDOWN_TICKS
} from "../src/ai/electric-storm-ritual.js";

const dragon = (id, extra = {}) => ({
  id, species: "electric", lifeStage: "adult", energy: 90, health: 100, ...extra
});
const sky = { cloudLayerAvailable: true, cloudFlightSafe: true, currentTick: 50_000 };

test("três Elétricos adultos saudáveis podem iniciar o ritual nas nuvens", () => {
  const result = assessElectricStormRitual(
    dragon("e1"),
    [dragon("e2"), dragon("e3")],
    sky
  );
  assert.equal(result.eligible, true);
  assert.equal(result.action, "perform_electric_storm_communication_ritual");
  assert.equal(result.participantCount, 3);
  assert.equal(result.signal.effect, "form_lightning_storm_above_clouds");
});

test("o ritual não começa com menos de três participantes aptos", () => {
  const result = assessElectricStormRitual(dragon("e1"), [dragon("e2")], sky);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "fewer_than_three_ready_dragons");
});

test("dragões feridos ou sem energia suficiente não participam", () => {
  const result = assessElectricStormRitual(
    dragon("e1"),
    [dragon("e2"), dragon("e3", { energy: 20 })],
    sky
  );
  assert.equal(result.eligible, false);
});

test("ritual exige camada de nuvens segura e não ocorre sob ameaça", () => {
  assert.equal(
    assessElectricStormRitual(dragon("e1"), [dragon("e2"), dragon("e3")],
      { ...sky, cloudFlightSafe: false }).eligible,
    false
  );
  assert.equal(
    assessElectricStormRitual(dragon("e1"), [dragon("e2"), dragon("e3")],
      { ...sky, threatDetected: true }).eligible,
    false
  );
});

test("ritual respeita intervalo mínimo de sete dias Minecraft", () => {
  const result = assessElectricStormRitual(
    dragon("e1", { lastStormRitualTick: 40_000 }),
    [dragon("e2"), dragon("e3")],
    { ...sky, currentTick: 40_000 + ELECTRIC_STORM_RITUAL_COOLDOWN_TICKS - 1 }
  );
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "ritual_cooldown");
});

test("DBS escolhe o ritual quando há três Elétricos e MIS continua prioritário", () => {
  const group = [dragon("e2"), dragon("e3")];
  const normal = decideDragonBehavior({
    ...dragon("e1"), energy: 90, hunger: 90, immediateDanger: false,
    nearbyDragons: group, cloudLayerAvailable: true, cloudFlightSafe: true,
    currentTick: 50_000
  });
  assert.equal(normal.action, "perform_electric_storm_communication_ritual");
  assert.equal(normal.electricStormRitual.participantCount, 3);

  const critical = decideDragonBehavior({
    ...dragon("e1"), energy: 5, hunger: 90, immediateDanger: true,
    nearbyDragons: group, cloudLayerAvailable: true, cloudFlightSafe: true,
    currentTick: 50_000
  });
  assert.equal(critical.system, "MIS");
  assert.notEqual(critical.action, "perform_electric_storm_communication_ritual");
});
