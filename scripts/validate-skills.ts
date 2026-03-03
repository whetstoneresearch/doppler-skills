import { existsSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const decoder = new TextDecoder();
const repoRoot = resolve(import.meta.dir, "..");
const skillsRoot = join(repoRoot, "skills");

const skillDirs = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (skillDirs.length === 0) {
  console.error("No skill directories found under skills/.");
  process.exit(1);
}

let failures = 0;

for (const skill of skillDirs) {
  const skillPath = join(skillsRoot, skill);
  const skillFile = join(skillPath, "SKILL.md");

  if (!existsSync(skillFile)) {
    console.error(`[FAIL] ${skill}: missing SKILL.md`);
    failures += 1;
    continue;
  }

  const result = Bun.spawnSync({
    cmd: ["bunx", "skills-ref", "validate", skillPath],
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (result.exitCode === 0) {
    console.log(`[OK] ${skill}`);
    continue;
  }

  failures += 1;
  console.error(`[FAIL] ${skill}`);

  const output = decoder.decode(result.stdout).trim();
  const error = decoder.decode(result.stderr).trim();

  if (output.length > 0) {
    console.error(output);
  }

  if (error.length > 0) {
    console.error(error);
  }
}

if (failures > 0) {
  console.error(`skills-ref validation failed for ${failures} skill(s).`);
  process.exit(1);
}

console.log(`Validated ${skillDirs.length} skill(s) with skills-ref.`);
console.log(`Scope: ${relative(repoRoot, skillsRoot)}`);
