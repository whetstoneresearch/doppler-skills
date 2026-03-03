# Repository validation scripts

This directory contains **internal repository tooling** used to validate this skill collection.

These files are **not** skill-bundled scripts in the Agent Skills spec sense.

- Skill-bundled scripts (optional) belong inside a specific skill directory, e.g. `skills/<skill-name>/scripts/`.
- This top-level `scripts/` folder is only for maintainers running repo checks and CI.

## What is here

- `check-bun-version.ts`: enforces Bun `>=1.3.8` for this tooling.
- `validate-markdown-yaml.ts`: parses markdown via `Bun.markdown` and validates SKILL frontmatter via `Bun.YAML.parse`.
- `validate-skills.ts`: runs `skills-ref validate` against each folder in `skills/`.
- `check-links.ts`: checks broken relative markdown links under `skills/`.

## How to run

From the repository root:

```bash
bun run validate
```

If you are consuming the skills through `npx skills add ...`, you do not need anything in this folder.
