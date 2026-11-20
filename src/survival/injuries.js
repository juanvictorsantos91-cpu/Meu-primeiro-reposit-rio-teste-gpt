const SEVERITY = { light: 1, moderate: 2, severe: 3 };

export function applyInjury(currentInjury, newInjury) {
  validateInjury(newInjury);
  if (!currentInjury) return { ...newInjury, recovery: 0 };
  validateInjury(currentInjury);
  return SEVERITY[newInjury.severity] > SEVERITY[currentInjury.severity]
    ? { ...newInjury, recovery: 0 }
    : currentInjury;
}

export function progressInjury(injury, recoveryPoints) {
  if (!injury) return null;
  validateInjury(injury);
  if (!Number.isFinite(recoveryPoints) || recoveryPoints < 0) {
    throw new RangeError("A recuperação deve ser não negativa.");
  }
  const recovery = Math.min(100, (injury.recovery ?? 0) + recoveryPoints);
  return recovery >= 100 ? null : { ...injury, recovery };
}

function validateInjury(injury) {
  if (!injury || !Object.hasOwn(SEVERITY, injury.severity)) {
    throw new TypeError("Ferimento deve ter gravidade light, moderate ou severe.");
  }
}
