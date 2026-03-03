import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

type BrokenLink = {
  file: string;
  target: string;
};

const repoRoot = resolve(import.meta.dir, "..");
const skillsRoot = resolve(repoRoot, "skills");
const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

function collectMarkdownFiles(dir: string, output: string[] = []): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      collectMarkdownFiles(fullPath, output);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      output.push(fullPath);
    }
  }

  return output;
}

function extractLinks(filePath: string): string[] {
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  const links: string[] = [];
  let inFence = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      continue;
    }

    if (inFence) {
      continue;
    }

    for (const match of line.matchAll(markdownLinkPattern)) {
      links.push(match[1].trim());
    }
  }

  return links;
}

function normalizeTarget(rawTarget: string): string | null {
  let target = rawTarget.trim();

  if (target.startsWith("<") && target.endsWith(">")) {
    target = target.slice(1, -1).trim();
  }

  const firstSpace = target.search(/\s/);
  if (firstSpace !== -1) {
    target = target.slice(0, firstSpace);
  }

  if (
    target.length === 0 ||
    target.startsWith("#") ||
    target.startsWith("/") ||
    target.startsWith("http://") ||
    target.startsWith("https://") ||
    target.startsWith("mailto:") ||
    target.startsWith("tel:")
  ) {
    return null;
  }

  const hashIndex = target.indexOf("#");
  if (hashIndex !== -1) {
    target = target.slice(0, hashIndex);
  }

  return target.length > 0 ? target : null;
}

const markdownFiles = collectMarkdownFiles(skillsRoot).sort();
const brokenLinks: BrokenLink[] = [];

for (const filePath of markdownFiles) {
  const links = extractLinks(filePath);

  for (const rawTarget of links) {
    const target = normalizeTarget(rawTarget);
    if (!target) {
      continue;
    }

    const resolvedPath = resolve(dirname(filePath), target);
    if (!existsSync(resolvedPath)) {
      brokenLinks.push({
        file: relative(repoRoot, filePath),
        target,
      });
    }
  }
}

if (brokenLinks.length === 0) {
  console.log(`Checked ${markdownFiles.length} markdown files under skills/.`);
  console.log("No broken relative markdown links found.");
  process.exit(0);
}

console.error(`Found ${brokenLinks.length} broken relative markdown link(s):`);
for (const link of brokenLinks) {
  console.error(`- ${link.file} -> ${link.target}`);
}

process.exit(1);
