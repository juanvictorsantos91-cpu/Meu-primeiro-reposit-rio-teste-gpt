import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const staging = await mkdtemp(path.join(tmpdir(), "dragon-survival-"));

const behaviorSource = path.join(root, "bedrock", "behavior_pack");
const resourceSource = path.join(root, "bedrock", "resource_pack");
const behaviorStage = path.join(staging, "Dragon-Survival-Behavior");
const resourceStage = path.join(staging, "Dragon-Survival-Resources");
const behaviorMcpack = path.join(output, "Dragon-Survival-Behavior.mcpack");
const resourceMcpack = path.join(output, "Dragon-Survival-Resources.mcpack");
const addon = path.join(output, "Dragon-Survival-Prototype.mcaddon");

try {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(behaviorSource, behaviorStage, { recursive: true });
  await cp(resourceSource, resourceStage, { recursive: true });

  execFileSync("zip", ["-qr", behaviorMcpack, "."], { cwd: behaviorStage });
  execFileSync("zip", ["-qr", resourceMcpack, "."], { cwd: resourceStage });
  execFileSync("zip", ["-qj", addon, behaviorMcpack, resourceMcpack]);

  console.log("Pacote criado: dist/Dragon-Survival-Prototype.mcaddon");
} finally {
  await rm(staging, { recursive: true, force: true });
}