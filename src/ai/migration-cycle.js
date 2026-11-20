export const MINECRAFT_DAY_TICKS = 24_000;
export const ELECTRIC_MIGRATION_CYCLE_TICKS = 14 * MINECRAFT_DAY_TICKS;
export const EARTH_TERRITORY_CYCLE_DAYS = 21;
export const EARTH_TERRITORY_CYCLE_TICKS = EARTH_TERRITORY_CYCLE_DAYS * MINECRAFT_DAY_TICKS;

/**
 * Calcula o ciclo de migração. A contagem usa ticks do mundo, não tempo real.
 * spawnTick funciona como referência para a primeira migração; depois, o
 * adaptador deve atualizar lastMigrationTick quando uma migração terminar.
 */
export function getMigrationStatus({
  species,
  currentTick,
  spawnTick,
  lastMigrationTick,
  cycleDurationTicks
}) {
  if (!Number.isInteger(currentTick) || currentTick < 0) {
    throw new RangeError("currentTick deve ser um inteiro não negativo.");
  }
  if (cycleDurationTicks !== undefined && (!Number.isInteger(cycleDurationTicks) || cycleDurationTicks <= 0)) {
    throw new RangeError("cycleDurationTicks deve ser um inteiro positivo.");
  }
  if (species !== "electric" && species !== "earth") {
    return { migratory: false, due: false, elapsedTicks: 0, cycleDurationTicks };
  }
  const effectiveCycleDuration = cycleDurationTicks ??
    (species === "earth" ? EARTH_TERRITORY_CYCLE_TICKS : ELECTRIC_MIGRATION_CYCLE_TICKS);

  const referenceTick = Number.isInteger(lastMigrationTick)
    ? lastMigrationTick
    : spawnTick;
  if (!Number.isInteger(referenceTick) || referenceTick < 0 || referenceTick > currentTick) {
    return {
      migratory: true,
      due: false,
      elapsedTicks: null,
      cycleDurationTicks: effectiveCycleDuration,
      temporaryTerritory: species === "earth"
    };
  }

  const elapsedTicks = currentTick - referenceTick;
  return {
    migratory: true,
    due: elapsedTicks >= effectiveCycleDuration,
    elapsedTicks,
    cycleDurationTicks: effectiveCycleDuration,
    temporaryTerritory: species === "earth",
    progress: Math.min(1, elapsedTicks / effectiveCycleDuration)
  };
}
