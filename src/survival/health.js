const clamp = (value) => Math.min(100, Math.max(0, value));

export function damageHealth(current, damage) {
  validate(current, damage);
  return clamp(current - damage);
}

export function recoverHealth(current, recovery) {
  validate(current, recovery);
  return clamp(current + recovery);
}

function validate(current, amount) {
  if (!Number.isFinite(current) || current < 0 || current > 100) {
    throw new RangeError("A saúde atual deve estar entre 0 e 100.");
  }
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError("O valor deve ser um número não negativo.");
  }
}
