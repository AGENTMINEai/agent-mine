#!/usr/bin/env node
/**
 * Installs the agent-mine skill into the current agent workspace.
 *
 * Looks for `.zcode/skills` or `.agents/skills` walking up from the current
 * directory; falls back to `~/.zcode/skills`.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const skillSrc = path.join(here, "..", "skill");

function findWorkspace(from) {
  let dir = from;
  for (let i = 0; i < 6; i++) {
    for (const marker of [".zcode", ".agents", ".claude"]) {
      if (fs.existsSync(path.join(dir, marker))) return { root: dir, marker };
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(skillSrc)) {
  console.error(`找不到 skill 目录: ${skillSrc}`);
  process.exit(1);
}

const found = findWorkspace(process.cwd());
const targets = [];

if (found) {
  targets.push(path.join(found.root, found.marker, "skills", "agent-mine"));
  // Mirror into the other agent conventions used in this workspace.
  for (const marker of [".zcode", ".agents"]) {
    const alt = path.join(found.root, marker, "skills", "agent-mine");
    if (!targets.includes(alt)) targets.push(alt);
  }
} else {
  targets.push(path.join(os.homedir(), ".zcode", "skills", "agent-mine"));
}

for (const dest of targets) {
  copyDir(skillSrc, dest);
  console.log(`✓ ${dest}`);
}

console.log("");
console.log("agent-mine 技能已安装。对代理说：");
console.log("  「用 agent-mine 技能帮我挖矿」");
