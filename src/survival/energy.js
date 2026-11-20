const clamp = (value) => Math.min(100, Math.max(0, value));

export function spendEnergy(current, amount) {
  validate(current, amount);
  return clamp(current - amount);
}

export function recoverEnergy(current, amount) {
  validate(current, amount);
  return clamp(current + amount);
}

export function canSpendEnergy(current, cost, { reserve = 15, emergency = false } = {}) {
  validate(current, cost);
  return emergency ? current >= cost : current - cost >= reserve;
}

function validate(current, amount) {
  if (!Number.isFinite(current) || current < 0 || current > 100) {
    throw new RangeError("A energia atual deve estar entre 0 e 100.");
  }
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError("O custo/recuperação deve ser não negativo.");
  }
}
