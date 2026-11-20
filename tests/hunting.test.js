import test from "node:test";
import assert from "node:assert/strict";
import { assessHuntingPlan, getHuntingStyle } from "../src/ai/hunting.js";
import { assessTerritory, assessEarthMigrationReception } from "../src/ai/territory.js";
import { assessSocialInteractions } from "../src/ai/social-interactions.js";

const prey = (id, foodId, distance = 8, extra = {}) => ({
  id, foodId, type: foodId, distance, isWild: true, ...extra
});

test("seleciona presa compatível com a dieta e prioriza valor nutricional", () => {
  const plan = assessHuntingPlan({ species: "fire", hunger: 30, energy: 80, health: 90 }, [
    prey("rabbit-1", "rabbit", 4), prey("cow-1", "beef", 12)
  ]);
  assert.equal(plan.selectedPreyId, "cow-1");
  assert.equal(plan.action, "hunt_selected_prey");
});

test("nunca seleciona animais domesticados, de fazenda ou protegidos", () => {
  const plan = assessHuntingPlan({ species: "wind", hunger: 10, energy: 80, health: 90 }, [
    prey("pet", "chicken", 2, { isTamed: true }),
    prey("farm", "rabbit", 2, { isFarmAnimal: true }),
    prey("protected", "salmon", 2, { protectedByPlayer: true })
  ]);
  assert.equal(plan.selectedPreyId, null);
  assert.equal(plan.shouldHunt, false);
});

test("abandona caça quando surge perigo imediato", () => {
  const plan = assessHuntingPlan({ species: "poison", hunger: 5, energy: 80, health: 90 },
    [prey("spider-1", "spider")], { threatDetected: true });
  assert.equal(plan.action, "abandon_hunt_for_safety");
  assert.equal(plan.shouldHunt, false);
});

test("cooperação exige grupo compatível, boa energia, saúde e risco moderado", () => {
  const good = assessHuntingPlan({ species: "water", hunger: 40, energy: 70, health: 80 },
    [prey("salmon-1", "salmon")], { compatibleHuntersNearby: true });
  const weak = assessHuntingPlan({ species: "water", hunger: 40, energy: 20, health: 80 },
    [prey("salmon-1", "salmon")], { compatibleHuntersNearby: true });
  assert.equal(good.action, "coordinate_cooperative_hunt");
  assert.equal(weak.cooperative, false);
});

test("cada espécie recebe um estilo de caça coerente", () => {
  assert.equal(getHuntingStyle("poison"), "stealth_and_venom_ambush");
  assert.equal(getHuntingStyle("sound"), "echo_tracking");
  assert.equal(getHuntingStyle("water"), "aquatic_group_hunt");
  assert.equal(getHuntingStyle("plasma"), "concealed_stalk_and_short_burst");
});

test("Lava tolera a passagem migratória de Terra sem considerar invasão territorial", () => {
  const nearby = [{ id: "earth-1", species: "earth", distance: 40, temporaryTerritoryMigrationDue: true }];
  const territory = assessTerritory({ id: "lava-1", species: "lava", health: 100, energy: 100 }, nearby);
  const interaction = assessSocialInteractions({ id: "lava-1", species: "lava", health: 100, energy: 100 }, nearby);
  assert.equal(territory.territoryIntruded, false);
  assert.equal(territory.toleratedEarthMigrationCount, 1);
  assert.equal(interaction.action, "tolerate_earth_migration_passage");
  assert.equal(interaction.kind, "peaceful_passage");
});

test("Terra não precisa de Dragão de Lava para iniciar sua migração", () => {
  const interactions = assessSocialInteractions({ id: "earth-1", species: "earth" }, [], { migrationDue: true });
  assert.equal(interactions.action, null);
  assert.equal(interactions.migrationRoles, null);
});

test("somente Lava aceita a passagem migratória de Terra", () => {
  const earth = { id: "earth-migrant", species: "earth", temporaryTerritoryMigrationDue: true };
  const lava = assessEarthMigrationReception({ id: "lava-home", species: "lava" }, earth);
  assert.equal(lava.accepts, true);
  assert.equal(lava.conflict, false);
  assert.equal(lava.action, "tolerate_earth_migration_passage");
  for (const species of ["fire", "water", "electric", "ice", "wind", "sound", "poison", "plasma"]) {
    const reception = assessEarthMigrationReception({ id: species + "-home", species }, earth);
    assert.equal(reception.accepts, false);
    assert.ok(["challenge_migrating_earth_group", "warn_migrating_earth_group"].includes(reception.action));
  }
});

test("a invasão migratória pode gerar confronto ou aviso, sem aceitação de outras espécies", () => {
  const earth = { id: "earth-migrant", species: "earth", temporaryTerritoryMigrationDue: true, distance: 40 };
  const territory = assessTerritory(
    { id: "fire-home", species: "fire", health: 90, energy: 90 },
    [earth]
  );
  assert.equal(territory.territoryIntruded, true);
  assert.ok(["challenge_migrating_earth_group", "warn_migrating_earth_group"].includes(territory.action));
  assert.equal(territory.migrationReception[0].accepts, false);
});
