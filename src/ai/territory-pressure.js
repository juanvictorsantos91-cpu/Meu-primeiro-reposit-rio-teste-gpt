/**
 * Pressão de ataques e desgaste gradual de reinos expandidos.
 * Uma incursão só reduz controle territorial após confirmação externa do ataque.
 */

const ATTACK_INTERVAL_TICKS = 12000;
const DEFAULT_LOSS_PER_RAID = 0.05;

function validTick(tick) {
  if (!Number.isInteger(tick) || tick < 0) throw new RangeError("tick precisa ser inteiro não negativo.");
}

function stableRoll(seed) {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

/**
 * Reinos com regiões anexadas ficam continuamente sujeitos a incursões.
 * A avaliação pode ser repetida sem alterar o domínio; o chamador confirma o ataque.
 */
export function assessDomainAttackPressure(domain, { tick }) {
  if (!domain || domain.status !== "active" || !Array.isArray(domain.territoryIds)) {
    throw new TypeError("Domínio ativo válido é necessário.");
  }
  validTick(tick);
  const coreIds = domain.coreTerritoryIds ?? domain.territoryIds.slice(0, 1);
  const expansionIds = domain.territoryIds.filter(id => !coreIds.includes(id));
  const lastRaidTick = Number.isInteger(domain.lastRaidTick) ? domain.lastRaidTick : domain.createdTick;
  const elapsedTicks = Math.max(0, tick - lastRaidTick);
  const eligible = expansionIds.length > 0 && elapsedTicks >= ATTACK_INTERVAL_TICKS;
  const attackChance = eligible
    ? Math.min(0.9, 0.55 + expansionIds.length * 0.12)
    : 0;
  const cycle = Math.floor(tick / ATTACK_INTERVAL_TICKS);
  const roll = eligible ? stableRoll(`domain-raid:${domain.id}:${cycle}`) : 1;
  return {
    eligible,
    shouldExpectAttack: eligible && roll < attackChance,
    attackChance,
    roll,
    elapsedTicks,
    nextCheckTick: lastRaidTick + ATTACK_INTERVAL_TICKS,
    vulnerableTerritoryIds: expansionIds
  };
}

/**
 * Aplica uma pequena perda de controle em região anexada.
 * O território original/núcleo nunca pode ser reduzido por esta operação.
 * Ao perder todo o controle da expansão, a região retorna ao antigo proprietário.
 */
export function applyDomainRaid(domain, territory, {
  tick, loss = DEFAULT_LOSS_PER_RAID, sourceDomain = null
}) {
  if (!domain || domain.status !== "active" || !Array.isArray(domain.territoryIds)) {
    throw new TypeError("Domínio ativo válido é necessário.");
  }
  if (!territory || territory.status !== "active" || !domain.territoryIds.includes(territory.id)) {
    throw new Error("O território precisa estar ativo e pertencer ao domínio atacado.");
  }
  validTick(tick);
  if (tick < domain.updatedTick || tick < territory.updatedTick) {
    throw new RangeError("tick não pode retroceder.");
  }
  if (!Number.isFinite(loss) || loss <= 0 || loss > 1) {
    throw new RangeError("loss precisa estar entre 0 e 1.");
  }

  const coreIds = domain.coreTerritoryIds ?? domain.territoryIds.slice(0, 1);
  if (coreIds.includes(territory.id)) {
    throw new Error("O núcleo original do reino é protegido contra perda por incursão.");
  }
  const currentIntegrity = domain.expansionIntegrity?.[territory.id] ?? 1;
  const nextIntegrity = Math.max(0, Math.round((currentIntegrity - loss) * 10000) / 10000);
  const released = nextIntegrity === 0;
  const annexation = [...(territory.history ?? [])].reverse()
    .find(event => event.type === "annexed_to_domain");
  const previousOwnerGroupId = annexation?.fromOwnerGroupId ?? territory.ownerGroupId;
  const previousDomainId = annexation?.previousDomainId ?? null;
  if (released && previousDomainId && !sourceDomain) {
    throw new Error("É necessário informar o domínio anterior para restaurar uma região de outro reino.");
  }

  const nextDomain = {
    ...domain,
    territoryIds: released ? domain.territoryIds.filter(id => id !== territory.id) : [...domain.territoryIds],
    expansionIntegrity: released
      ? Object.fromEntries(Object.entries(domain.expansionIntegrity ?? {}).filter(([id]) => id !== territory.id))
      : { ...(domain.expansionIntegrity ?? {}), [territory.id]: nextIntegrity },
    lastRaidTick: tick,
    updatedTick: tick,
    revision: (domain.revision ?? 0) + 1,
    history: [...(domain.history ?? []), {
      type: released ? "annexed_region_lost_after_raids" : "territory_weakened_by_raid",
      tick, territoryId: territory.id, integrity: nextIntegrity, loss
    }]
  };

  const nextTerritory = released ? {
    ...territory,
    ownerGroupId: previousOwnerGroupId,
    domainId: previousDomainId,
    updatedTick: tick,
    revision: (territory.revision ?? 0) + 1,
    history: [...(territory.history ?? []), {
      type: "returned_after_territorial_raids",
      tick, fromOwnerGroupId: domain.ownerGroupId,
      toOwnerGroupId: previousOwnerGroupId, previousDomainId
    }]
  } : {
    ...territory,
    updatedTick: tick,
    revision: (territory.revision ?? 0) + 1,
    history: [...(territory.history ?? []), {
      type: "territory_weakened_by_raid", tick, integrity: nextIntegrity, loss
    }]
  };

  let nextSourceDomain = null;
  if (released && sourceDomain) {
    if (sourceDomain.id !== previousDomainId || sourceDomain.ownerGroupId !== previousOwnerGroupId) {
      throw new Error("O domínio restaurado não corresponde ao antigo proprietário.");
    }
    const ids = sourceDomain.territoryIds ?? [];
    nextSourceDomain = {
      ...sourceDomain,
      territoryIds: ids.includes(territory.id) ? [...ids] : [...ids, territory.id],
      status: "active",
      capitalTerritoryId: sourceDomain.capitalTerritoryId ?? territory.id,
      updatedTick: tick,
      revision: (sourceDomain.revision ?? 0) + 1,
      history: [...(sourceDomain.history ?? []), {
        type: "territory_recovered_after_raids", tick, territoryId: territory.id,
        recoveredFromDomainId: domain.id
      }]
    };
  }

  return {
    domain: nextDomain,
    territory: nextTerritory,
    sourceDomain: nextSourceDomain,
    territoryReleased: released,
    remainingIntegrity: nextIntegrity
  };
}

export const DOMAIN_ATTACK_RULES = Object.freeze({
  attackIntervalTicks: ATTACK_INTERVAL_TICKS,
  defaultLossPerRaid: DEFAULT_LOSS_PER_RAID,
  maximumAttackChance: 0.9
});
