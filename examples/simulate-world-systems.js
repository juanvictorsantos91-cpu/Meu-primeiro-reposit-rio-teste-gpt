import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";

const scenarios = [
  {
    name: "Dragão de Água encontra um rio",
    state: { species: "water", energy: 85, hunger: 65, health: 100, environmentContext: { tags: ["river"], waterNearby: true }, environment: "water", safeToExplore: true }
  },
  {
    name: "Dragão de Terra detecta uma ameaça à região do ninho",
    state: { species: "earth", energy: 80, hunger: 80, health: 95, territoryId: "forest-nest", nearbyDragons: [{ id: "intruder", species: "fire", distance: 10, territoryId: "forest-nest", nearNest: true }], environmentContext: { tags: ["forest", "cave"] }, safeToExplore: true }
  },
  {
    name: "Dragão Elétrico procura alimento",
    state: { species: "electric", energy: 75, hunger: 35, health: 100, nearbyPrey: [{ id: "rabbit-1", foodId: "rabbit", dietCategory: "small_animals", distance: 8, risk: 5 }] }
  },
  {
    name: "Filhote de Fogo precisa ser alimentado",
    state: { species: "fire", id: "fireling-1", ageTicks: 1200, hunger: 40, energy: 70, health: 90, parentIds: ["parent-1"], nearbyDragons: [{ id: "parent-1", species: "fire", ageTicks: 500000, lifeStage: "adult", energy: 70, health: 90 }] }
  }
];

for (const scenario of scenarios) {
  const result = decideDragonBehavior({ energy: 80, hunger: 80, health: 100, immediateDanger: false, ...scenario.state });
  console.log("\\n" + scenario.name);
  console.log({ system: result.system, action: result.action, environment: result.environmentAssessment?.recommendation, territory: result.territory?.action, hunting: result.huntingPlan?.action, prey: result.huntingPlan?.selectedPreyId, lifeStage: result.lifeCycle?.lifeStage, parentalAction: result.lifeCycle?.parentalAction });
}
