# Install

## Prerequisites

- [Node.js](https://nodejs.org/) if you use `npx` with the Agent Skills CLI.
- A coding agent or IDE that can apply Markdown instructions (for example Cursor, VS Code–based agents, Claude Code, Codex, Gemini, Windsurf, JetBrains AI, Copilot Chat). The CLI path below is optional; you can always **clone this repo and copy** `skills/monochrome-particle/` or **paste `SKILL.md`** into your tool of choice.

## Option A: Agent Skills CLI (recommended)

Shortest form (GitHub `owner/repo` shorthand, same as [taste-skill](https://github.com/Leonxlnx/taste-skill)):

```bash
npx skills add itsyuvallavi/monochrome-particle
```

Full URL (equivalent):

```bash
npx skills add https://github.com/itsyuvallavi/monochrome-particle
```

Optional: install only the `monochrome-particle` skill if your CLI version supports `--skill`:

```bash
npx skills add itsyuvallavi/monochrome-particle --skill monochrome-particle
```

Global install (all projects), if supported:

```bash
npx skills add -g itsyuvallavi/monochrome-particle
```

## Option B: Git clone and copy

```bash
git clone https://github.com/itsyuvallavi/monochrome-particle.git
cd monochrome-particle
```

Into a project:

```bash
mkdir -p /path/to/your-project/.cursor/skills
cp -R skills/monochrome-particle /path/to/your-project/.cursor/skills/
```

Personal (all projects):

```bash
mkdir -p ~/.cursor/skills
cp -R skills/monochrome-particle ~/.cursor/skills/
```

## Verify

In **Cursor**, reference `@.cursor/skills/monochrome-particle/SKILL.md` or ask the agent to follow the **Monochrome Particle** skill. In **other tools**, open the same files from wherever you installed them, or paste `SKILL.md` into the session so the model applies the customization contract.
