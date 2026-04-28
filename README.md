# Monochrome Particle

**[Repository](https://github.com/itsyuvallavi/monochrome-particle)**

[![Agent Skills](https://img.shields.io/badge/Agent_Skills-compatible-2dd4bf?style=flat-square)](https://github.com/vercel-labs/agent-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/itsyuvallavi/monochrome-particle?style=flat-square&color=yellow)](https://github.com/itsyuvallavi/monochrome-particle/stargazers)

Portable **Agent Skills** for a configurable, full-viewport **Three.js** particle wave: layered `Points`, GLSL waves, soft circular sprites, additive blending, and sensible mobile/desktop density. The model gets clear knobs for **colors, speed, direction, density, point size, and opacity** instead of hunting shader constants.

**Background only** — no route transitions, no “storm” providers, no CTA wiring. Works anywhere the instructions reach the model (Cursor, Claude Code, Codex, Windsurf, Copilot, Gemini-capable clients, JetBrains AI, VS Code–based agents, or paste into a web chat).

## Installing

Works via CLI for major AI coding agents (Cursor, Claude Code, Codex, Windsurf, Copilot, Antigravity, Gemini extensions, etc.):

```bash
npx skills add itsyuvallavi/monochrome-particle
```

Or copy `skills/monochrome-particle/` into your project’s skills/rules folder, or open **`SKILL.md`** and paste it into ChatGPT / Codex / any agent session.

For CLI flags and install targets, run `npx skills add --help`, or see [Agent Skills](https://github.com/vercel-labs/agent-skills).

**Layout / full viewport:** [FULL_BLEED_CANVAS.md](FULL_BLEED_CANVAS.md) (drawable size, CSS, `setSize(..., false)`, resize). Older context: [FULL_VIEWPORT_PARTICLE_BACKGROUND.md](FULL_VIEWPORT_PARTICLE_BACKGROUND.md).

## Validate the example

The repo includes a tiny TypeScript setup for checking the example component:

```bash
npm install
npm run typecheck
```

## Skills

| Skill | Description |
| --- | --- |
| **monochrome-particle** | Full-viewport Three.js monochrome particle field with a prop-driven customization contract (`colors`, `speed`, `direction`, `density`, `pointSize`, `opacity`). Includes `reference.md` and `examples/MonochromeDotsBackground.tsx`. |

## Feedback & contributions

Open a [Pull Request](https://github.com/itsyuvallavi/monochrome-particle/pulls) or [Issue](https://github.com/itsyuvallavi/monochrome-particle/issues). See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
