# Install

## Prerequisites

- [Node.js](https://nodejs.org/) if you use `npx`.
- [Cursor](https://cursor.com/) or another agent that loads project or personal skills from `.cursor/skills/`.

## Option A: Agent Skills CLI

This matches the pattern used by collections such as [taste-skill](https://github.com/Leonxlnx/taste-skill):

```bash
npx skills add https://github.com/YOUR_USERNAME/monochrome-particle
```

Replace `YOUR_USERNAME` with the GitHub user or organization that hosts this repository.

## Option B: Git clone and copy

```bash
git clone https://github.com/YOUR_USERNAME/monochrome-particle.git
cd monochrome-particle
```

Copy `skills/monochrome-particle/` into your project:

```bash
mkdir -p /path/to/your-project/.cursor/skills
cp -R skills/monochrome-particle /path/to/your-project/.cursor/skills/
```

Or install for all projects (personal skills):

```bash
mkdir -p ~/.cursor/skills
cp -R skills/monochrome-particle ~/.cursor/skills/
```

## Option C: `install.sh` from a clone

From the root of a **local clone** of this repository:

```bash
chmod +x install.sh
./install.sh          # installs to ~/.cursor/skills/monochrome-particle
./install.sh project  # installs to ./.cursor/skills/monochrome-particle (current directory)
```

## Verify

Open your project in Cursor and ask the agent to follow the **Monochrome Particle** skill, or reference `@.cursor/skills/monochrome-particle/SKILL.md` in your prompt.
