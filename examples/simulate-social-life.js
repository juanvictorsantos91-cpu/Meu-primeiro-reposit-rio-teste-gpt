import { decideDragonBehavior } from "../src/ai/dragon-behavior.js";
import { assessDragonRelationships } from "../src/ai/dragon-relationships.js";

const speciesCases = [
  ["water", 2],
  ["fire", 1],
  ["ice", 1],
  ["electric", 0],
  ["earth", 5],
  ["lava", 5]
];

console.log("=== Dragon Survival: simulação social ===");
for (const [species, nearbySameSpeciesCount] of speciesCases) {
  const decision = decideDragonBehavior({
    species,
    energy: 90,
    hunger: 90,
    health: 100,
    immediateDanger: false,
    safeToExplore: true,
    nearbySameSpeciesCount,
    sameSpeciesGroupNearby: nearbySameSpeciesCount > 0
  });
  console.log(
    `${species}: ação=${decision.action}; padrão=${decision.groupPlan.pattern}; ` +
    `grupo desejado=${decision.groupPlan.targetGroupSize}`
  );
}

const parent = {
  id: "earth-parent",
  species: "earth",
  lifeStage: "adult",
  hasYoung: true,
  youngNeedsFood: true
};
const child = {
  id: "earth-hatchling",
  species: "earth",
  lifeStage: "hatchling",
  parentIds: ["earth-parent"]
};
const family = assessDragonRelationships(parent, [child]);
console.log(
  `família Terra: relação=${family.recognized[0].relationship}; ` +
  `ação parental=${family.parentalAction}`
);


console.log("\\n=== grupo misto Terra + Lava ===");
const earthWithLava = decideDragonBehavior({
  species: "earth", energy: 90, hunger: 90, health: 100,
  immediateDanger: false, safeToExplore: true,
  nearbyDragons: [{ id: "lava-01", species: "lava", lifeStage: "adult" }],
  nearbySameSpeciesCount: 0
});
console.log(`Terra: ação=${earthWithLava.action}; grupo misto=${earthWithLava.groupPlan.mixedGroup}`);

console.log("\\n=== interação pacífica Água + Gelo ===");
const waterWithIce = decideDragonBehavior({
  species: "water", energy: 90, hunger: 90, health: 100,
  immediateDanger: false, safeToExplore: true, socialOpportunity: true,
  nearbyDragons: [{ id: "ice-01", species: "ice", lifeStage: "adult" }]
});
console.log(`Água: ação=${waterWithIce.action}; opções=${waterWithIce.socialInteractions.peacefulInteractions[0]?.options.join(", ")}`);

console.log("\\n=== ritual de comunicação dos Dragões Elétricos ===");
const electricRitual = decideDragonBehavior({
  species: "electric", id: "electric-01", lifeStage: "adult",
  energy: 90, hunger: 90, health: 100, immediateDanger: false,
  currentTick: 50_000, cloudLayerAvailable: true, cloudFlightSafe: true,
  nearbyDragons: [
    { id: "electric-02", species: "electric", lifeStage: "adult", energy: 85, health: 95 },
    { id: "electric-03", species: "electric", lifeStage: "adult", energy: 80, health: 90 }
  ]
});
console.log(`Elétricos: ação=${electricRitual.action}; participantes=${electricRitual.electricStormRitual?.participantCount ?? 0}; sinal=${electricRitual.electricStormRitual?.signal?.effect ?? "nenhum"}`);
