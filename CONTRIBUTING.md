# Contributing

## Adding or editing a skill

Keep language **product-neutral** where possible: skills are Markdown instructions that should remain useful across Cursor, Claude Code, Codex, Gemini, Windsurf, JetBrains, Copilot, VS Code–based agents, and web UIs that accept pasted context.

1. Each skill lives under `skills/<skill-slug>/` with a required `SKILL.md`.
2. Keep `SKILL.md` focused. Move long reference material to `reference.md` or `examples/`.
3. YAML frontmatter must include:
   - `name`: lowercase letters, numbers, hyphens only (max 64 characters)
   - `description`: non-empty, under 1024 characters, with clear **what** and **when** triggers

## Pull requests

- Describe the change in plain language.
- If you change behavior or the customization contract, update `reference.md` and the example component together.

## Scope for Monochrome Particle

Do not add sandstorm, route transitions, or button-triggered navigation to this skill. Those belong in application code, not in this package.
