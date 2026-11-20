/** Grava identidade de grupo sem tocar em tags de outras mecânicas. */
export function writeDragonGroupMembership(entity, groupId) {
  if (!entity || typeof entity.getTags !== "function" ||
      typeof entity.addTag !== "function" || typeof entity.removeTag !== "function") {
    throw new TypeError("Entidade precisa oferecer getTags, addTag e removeTag.");
  }
  if (groupId !== null && (typeof groupId !== "string" || !groupId.trim())) {
    throw new TypeError("groupId precisa ser null ou texto não vazio.");
  }
  const prefix = "ds:group:";
  for (const tag of entity.getTags()) {
    if (tag.startsWith(prefix)) entity.removeTag(tag);
  }
  if (groupId !== null) entity.addTag(prefix + encodeURIComponent(groupId.trim()));
  return groupId;
}

/** Marca o líder com uma tag própria, preservando identidade de grupo e demais tags. */
export function writeDragonGroupLeadership(entity, isLeader) {
  if (!entity || typeof entity.getTags !== "function" ||
      typeof entity.addTag !== "function" || typeof entity.removeTag !== "function") {
    throw new TypeError("Entidade precisa oferecer getTags, addTag e removeTag.");
  }
  if (typeof isLeader !== "boolean") throw new TypeError("isLeader precisa ser booleano.");
  const tag = "ds:leader";
  if (isLeader) entity.addTag(tag);
  else entity.removeTag(tag);
  return isLeader;
}


/**
 * Sincroniza a identidade persistida do grupo com uma entidade específica.
 * Só marca a entidade como membro quando seu ID consta no registro ativo.
 */
export function writeDragonGroupState(entity, group) {
  if (!entity || typeof entity.id !== "string" || !entity.id) {
    throw new TypeError("Entidade precisa ter um ID válido.");
  }
  if (group == null || group.status !== "active" || !group.memberIds?.includes(entity.id)) {
    writeDragonGroupMembership(entity, null);
    writeDragonGroupLeadership(entity, false);
    return { member: false, leader: false };
  }
  writeDragonGroupMembership(entity, group.id);
  const isLeader = group.leaderId === entity.id;
  writeDragonGroupLeadership(entity, isLeader);
  return { member: true, leader: isLeader };
}
