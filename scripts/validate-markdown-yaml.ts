import { readdirSync, readFileSync } from "node:fs";
import { basename, resolve, relative } from "node:path";

type Failure = {
  file: string;
  reason: string;
};

const repoRoot = resolve(import.meta.dir, "..");
const skipDirs = new Set([".git", "node_modules"]);

function collectMarkdownFiles(dir: string, output: string[] = []): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) {
        collectMarkdownFiles(resolve(dir, entry.name), output);
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      output.push(resolve(dir, entry.name));
    }
  }

  return output;
}

function validateFrontmatter(filePath: string, text: string): Failure | null {
  const lines = text.split(/\r?\n/);

  if (lines[0]?.trim() !== "---") {
    return { file: relative(repoRoot, filePath), reason: "missing YAML frontmatter start delimiter" };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { file: relative(repoRoot, filePath), reason: "missing YAML frontmatter end delimiter" };
  }

  const yamlText = lines.slice(1, endIndex).join("\n");
  if (yamlText.trim().length === 0) {
    return { file: relative(repoRoot, filePath), reason: "empty YAML frontmatter" };
  }

  try {
    const parsed = Bun.YAML.parse(yamlText);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { file: relative(repoRoot, filePath), reason: "frontmatter YAML must parse to an object" };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { file: relative(repoRoot, filePath), reason: `invalid YAML frontmatter: ${message}` };
  }

  const body = lines.slice(endIndex + 1).join("\n");
  try {
    Bun.markdown.html(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { file: relative(repoRoot, filePath), reason: `invalid markdown body: ${message}` };
  }

  return null;
}

const markdownFiles = collectMarkdownFiles(repoRoot).sort();
const failures: Failure[] = [];

let markdownParsedCount = 0;
let skillFrontmatterCount = 0;

for (const filePath of markdownFiles) {
  const text = readFileSync(filePath, "utf8");

  try {
    Bun.markdown.html(text);
    markdownParsedCount += 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ file: relative(repoRoot, filePath), reason: `invalid markdown: ${message}` });
    continue;
  }

  if (basename(filePath) !== "SKILL.md") {
    continue;
  }

  skillFrontmatterCount += 1;
  const error = validateFrontmatter(filePath, text);
  if (error) {
    failures.push(error);
  }
}

if (failures.length > 0) {
  console.error(`Found ${failures.length} markdown/YAML validation issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.reason}`);
  }
  process.exit(1);
}

console.log(`Parsed markdown successfully in ${markdownParsedCount} file(s).`);
console.log(`Parsed YAML frontmatter and markdown body in ${skillFrontmatterCount} SKILL.md file(s).`);
