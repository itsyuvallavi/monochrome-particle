# Monochrome Particle

Agent skills for building a **configurable full-viewport Three.js particle wave background** (layered `Points`, GLSL shaders, soft sprites, additive blending). Designed for Cursor, Claude Code, and other tools that read `SKILL.md` files.

The skill teaches a **background-only** implementation: no route transitions, no sandstorm providers, and no CTA-driven navigation.

## Install (recommended)

If you use the Agent Skills CLI ([`skills`](https://github.com/vercel-labs/agent-skills)):

```bash
npx skills add https://github.com/YOUR_USERNAME/monochrome-particle
```

Replace `YOUR_USERNAME` with your GitHub username or org after you publish the repo.

## Install (manual)

1. Clone this repository.
2. Copy the folder `skills/monochrome-particle/` into either:
   - **Project skills:** `<your-project>/.cursor/skills/monochrome-particle/`
   - **Personal skills:** `~/.cursor/skills/monochrome-particle/`

You should end up with:

```text
monochrome-particle/
├── SKILL.md
├── reference.md
└── examples/
    └── MonochromeDotsBackground.tsx
```

## Contents

| Path | Purpose |
| --- | --- |
| `skills/monochrome-particle/SKILL.md` | Agent instructions and scope |
| `skills/monochrome-particle/reference.md` | Shader contract, layers, performance |
| `skills/monochrome-particle/examples/MonochromeDotsBackground.tsx` | Copy-paste React + Three.js example with props for colors, speed, direction, density, point size, opacity |

## Documentation

- [Install & CLI](docs/INSTALL.md)
- [Contributing](CONTRIBUTING.md)
- [Landing page](docs/index.html) (for GitHub Pages or static hosting)

## License

MIT — see [LICENSE](LICENSE).
