import { chooseAction } from "./rule-engine.js";

const survivalRules = [
  {
    name: "immediate-danger",
    priority: 1,
    when: (s) => s.immediateDanger === true,
    action: "escape_danger",
    reason: "Perigo imediato tem prioridade sobre necessidades de rotina."
  },
  {
    name: "critical-injury",
    priority: 2,
    when: (s) => s.health <= 25 || s.injury?.severity === "severe",
    action: "seek_shelter",
    reason: "Saúde crítica ou ferimento grave exige abrigo e recuperação."
  },
  {
    name: "urgent-hunger",
    priority: 3,
    when: (s) => s.hunger <= 20,
    action: "search_food",
    reason: "Fome elevada: procurar alimento adequado."
  },
  {
    name: "low-energy",
    priority: 4,
    when: (s) => s.energy <= 20,
    action: "conserve_energy",
    reason: "Energia crítica: reduzir atividades e procurar descanso seguro."
  },
  {
    name: "moderate-hunger",
    priority: 5,
    when: (s) => s.hunger <= 50,
    action: "consider_food",
    reason: "Fome moderada: avaliar alimento próximo e riscos."
  },
  {
    name: "normal-behavior",
    priority: 6,
    when: () => true,
    action: "species_behavior",
    reason: "Indicadores permitem comportamentos naturais da espécie."
  }
];

export function decideSurvivalAction(state) {
  validateState(state);
  return chooseAction(state, survivalRules, "species_behavior");
}

function validateState(state) {
  for (const key of ["energy", "hunger", "health"]) {
    if (!Number.isFinite(state[key]) || state[key] < 0 || state[key] > 100) {
      throw new RangeError(`${key} deve estar entre 0 e 100.`);
    }
  }
}
