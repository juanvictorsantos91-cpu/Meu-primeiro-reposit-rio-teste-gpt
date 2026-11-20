const clamp = (value) => Math.min(100, Math.max(0, value));

export function reduceHunger(current, amount) {
  validate(current, amount);
  return clamp(current - amount);
}

export function feedHunger(current, nutrition) {
  validate(current, nutrition);
  return clamp(current + nutrition);
}

function validate(current, amount) {
  if (!Number.isFinite(current) || current < 0 || current > 100) {
    throw new RangeError("A fome atual deve estar entre 0 e 100.");
  }
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError("A quantidade deve ser um número não negativo.");
  }
}
