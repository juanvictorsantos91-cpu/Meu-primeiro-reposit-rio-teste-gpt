/**
 * Balanceamento central das 15 espécies.
 * Escalas: dimensões em blocos, velocidade relativa ao componente movement,
 * voo em blocos por segundo como meta de design e metabolismo por minuto real.
 * Os números são parâmetros iniciais de jogo, não medições de Minecraft.
 */
export const dragonBalance = Object.freeze({
  fire:       { height: 3.2, width: 2.5, length: 5.8, groundSpeed: 0.22, flightSpeed: 0.34, maxFlightAltitude: 110, flightRange: 620, health: 120, hunger: 0.052, rest: 2.0, mass: 1.15 },
  water:      { height: 2.8, width: 2.4, length: 5.5, groundSpeed: 0.20, flightSpeed: 0.30, maxFlightAltitude: 90,  flightRange: 520, health: 110, hunger: 0.050, rest: 2.1, mass: 1.00 },
  ice:        { height: 3.0, width: 2.6, length: 5.7, groundSpeed: 0.21, flightSpeed: 0.32, maxFlightAltitude: 105, flightRange: 580, health: 115, hunger: 0.050, rest: 2.0, mass: 1.05 },
  electric:   { height: 3.1, width: 2.7, length: 5.9, groundSpeed: 0.24, flightSpeed: 0.42, maxFlightAltitude: 220, flightRange: 850, health: 115, hunger: 0.055, rest: 2.0, mass: 0.98 },
  earth:      { height: 5.8, width: 4.8, length: 10.5,groundSpeed: 0.16, flightSpeed: 0.25, maxFlightAltitude: 70,  flightRange: 380, health: 240, hunger: 0.075, rest: 2.4, mass: 2.80 },
  lava:       { height: 3.7, width: 3.0, length: 6.6, groundSpeed: 0.19, flightSpeed: 0.30, maxFlightAltitude: 95,  flightRange: 500, health: 170, hunger: 0.060, rest: 2.0, mass: 1.45 },
  wind:       { height: 2.9, width: 3.1, length: 6.0, groundSpeed: 0.25, flightSpeed: 0.46, maxFlightAltitude: 180, flightRange: 1200,health: 105, hunger: 0.050, rest: 2.2, mass: 0.82 },
  sound:      { height: 2.8, width: 2.4, length: 5.3, groundSpeed: 0.26, flightSpeed: 0.43, maxFlightAltitude: 145, flightRange: 760, health: 105, hunger: 0.052, rest: 2.1, mass: 0.86 },
  poison:     { height: 2.0, width: 1.7, length: 7.2, groundSpeed: 0.24, flightSpeed: 0.34, maxFlightAltitude: 95,  flightRange: 540, health: 95,  hunger: 0.048, rest: 2.0, mass: 0.72 },
  sand:       { height: 2.6, width: 2.5, length: 5.8, groundSpeed: 0.23, flightSpeed: 0.33, maxFlightAltitude: 100, flightRange: 570, health: 110, hunger: 0.052, rest: 2.0, mass: 0.95 },
  light:      { height: 2.9, width: 2.4, length: 5.4, groundSpeed: 0.23, flightSpeed: 0.39, maxFlightAltitude: 150, flightRange: 720, health: 105, hunger: 0.050, rest: 2.1, mass: 0.88 },
  plasma:     { height: 2.7, width: 2.3, length: 5.2, groundSpeed: 0.24, flightSpeed: 0.44, maxFlightAltitude: 190, flightRange: 780, health: 100, hunger: 0.050, rest: 2.0, mass: 0.78 },
  acid:       { height: 2.5, width: 2.2, length: 5.6, groundSpeed: 0.22, flightSpeed: 0.32, maxFlightAltitude: 100, flightRange: 560, health: 110, hunger: 0.052, rest: 2.0, mass: 0.92 },
  radioactive:{ height: 3.2, width: 2.8, length: 6.0, groundSpeed: 0.18, flightSpeed: 0.29, maxFlightAltitude: 120, flightRange: 600, health: 145, hunger: 0.058, rest: 2.0, mass: 1.18 },
  shadow:     { height: 2.6, width: 2.1, length: 5.4, groundSpeed: 0.27, flightSpeed: 0.40, maxFlightAltitude: 160, flightRange: 700, health: 100, hunger: 0.048, rest: 2.2, mass: 0.76 }
});

export function getDragonBalance(species) {
  const profile = dragonBalance[species];
  if (!profile) throw new RangeError(`Espécie sem balanceamento: ${species}`);
  return profile;
}
