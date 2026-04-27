# Install

## Prerequisites

- [Node.js](https://nodejs.org/) if you use `npx`.
- [Cursor](https://cursor.com/) or another agent that loads skills from `.cursor/skills/`.

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

## Option C: `install.sh` from a clone

```bash
git clone https://github.com/itsyuvallavi/monochrome-particle.git
cd monochrome-particle
chmod +x install.sh
./install.sh          # ~/.cursor/skills/monochrome-particle
./install.sh project  # ./.cursor/skills/monochrome-particle
```

## Verify

Open your project in Cursor and reference `@.cursor/skills/monochrome-particle/SKILL.md`, or ask the agent to follow the **Monochrome Particle** skill.
