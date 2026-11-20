import { createOrganizedDragonGroup, updateOrganizedDragonGroup } from "./dragon-group-organization.js";
import { updateDragonGroup } from "./dragon-groups.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateGroup(group) {
  if (!group || typeof group.id !== "string" || !group.id.trim()) {
    throw new TypeError("Grupo precisa ter um ID válido.");
  }
  if (!["active", "disbanded"].includes(group.status)) {
    throw new TypeError("Status de grupo inválido.");
  }
  if (!Array.isArray(group.memberIds) || new Set(group.memberIds).size !== group.memberIds.length) {
    throw new TypeError("Membros do grupo precisam ser uma lista sem duplicatas.");
  }
  if (group.status === "active" && (!group.memberIds.length || !group.memberIds.includes(group.leaderId))) {
    throw new Error("Grupo ativo precisa ter um líder entre seus membros.");
  }
  if (!Number.isInteger(group.revision) || group.revision < 1) {
    throw new TypeError("Revisão do grupo inválida.");
  }
  if (!Number.isInteger(group.updatedTick) || group.updatedTick < 0) {
    throw new TypeError("updatedTick do grupo inválido.");
  }
}

/**
 * Repositório persistente que guarda grupos dentro do mesmo estado mundial
 * usado por territórios e domínios. Cada gravação preserva os demais registros.
 */
export function createPersistentDragonGroupRepository(storage) {
  if (!storage || typeof storage.load !== "function" || typeof storage.save !== "function") {
    throw new TypeError("storage precisa oferecer load e save.");
  }

  function readState() {
    return storage.load() ?? {
      schemaVersion: 2,
      savedTick: 0,
      territories: [],
      domains: [],
      groups: []
    };
  }

  return {
    get(id) {
      if (typeof id !== "string" || !id.trim()) throw new TypeError("ID do grupo inválido.");
      const group = readState().groups.find(item => item.id === id);
      return group ? clone(group) : null;
    },
    list({ status } = {}) {
      return readState().groups
        .filter(group => status === undefined || group.status === status)
        .map(clone);
    },
    save(group) {
      validateGroup(group);
      const state = readState();
      const existing = state.groups.find(item => item.id === group.id);
      if (existing && group.revision < existing.revision) {
        throw new Error("Não é possível sobrescrever uma revisão mais recente.");
      }
      const groups = state.groups.filter(item => item.id !== group.id);
      groups.push(clone(group));
      storage.save({
        ...state,
        savedTick: Math.max(state.savedTick, group.updatedTick),
        groups
      });
      return this.get(group.id);
    },
    remove(id, tick = null) {
      if (typeof id !== "string" || !id.trim()) throw new TypeError("ID do grupo inválido.");
      const state = readState();
      const groups = state.groups.filter(item => item.id !== id);
      if (groups.length === state.groups.length) return false;
      const savedTick = tick == null ? state.savedTick : tick;
      if (!Number.isInteger(savedTick) || savedTick < state.savedTick) {
        throw new RangeError("Tick de remoção inválido ou anterior ao estado salvo.");
      }
      storage.save({ ...state, savedTick, groups });
      return true;
    }
  };
}

/**
 * Fachada de ciclo de vida. Formação e atualização são sempre explícitas:
 * este módulo não procura dragões nem cria grupos por conta própria.
 */
export function createPersistentDragonGroupLifecycle(storage) {
  const repository = createPersistentDragonGroupRepository(storage);
  return {
    repository,
    list: options => repository.list(options),
    get: id => repository.get(id),
    form(input) {
      const group = createOrganizedDragonGroup(input);
      if (repository.get(group.id)) throw new Error(`Já existe um grupo com ID ${group.id}.`);
      return repository.save(group);
    },
    update(groupId, input) {
      const current = repository.get(groupId);
      if (!current) throw new Error(`Grupo não encontrado: ${groupId}.`);
      const updated = updateOrganizedDragonGroup(current, input);
      return repository.save(updated);
    },
    disband(groupId, tick) {
      const current = repository.get(groupId);
      if (!current) return null;
      const ended = updateDragonGroup(current, {
        removeMemberIds: [...current.memberIds],
        tick
      });
      return repository.save({
        ...ended,
        pairBonds: [],
        leader: null
      });
    }
  };
}

