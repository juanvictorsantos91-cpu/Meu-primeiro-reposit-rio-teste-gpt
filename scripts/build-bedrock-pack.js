import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "src");
const target = path.join(root, "bedrock/behavior_pack/scripts/core");

await mkdir(path.dirname(target), { recursive: true });
await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
console.log("Núcleo Dragon Survival copiado para o Behavior Pack.");
console.log("Importante: a ponte registra intenções em tags; movimentos, animações e ataques dependem dos componentes/eventos das entidades.");
