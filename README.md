# Monochrome Particle

Agent skills for building a **configurable full-viewport Three.js particle wave background** (layered `Points`, GLSL shaders, soft sprites, additive blending). Works with Cursor, Claude Code, and other tools that read `SKILL.md` files.

The skill is **background-only**: no route transitions, no sandstorm-style providers, and no CTA-driven navigation.

## Install (one line)

The [Agent Skills CLI](https://github.com/vercel-labs/agent-skills) accepts GitHub **`owner/repo`** shorthand (shortest form):

```bash
npx skills add itsyuvallavi/monochrome-particle
```

Equivalent full URL:

```bash
npx skills add https://github.com/itsyuvallavi/monochrome-particle
```

To install only this skill when the CLI prompts or supports filtering:

```bash
npx skills add itsyuvallavi/monochrome-particle --skill monochrome-particle
```

## Site

If [GitHub Pages](https://pages.github.com/) is enabled with source **`/docs`** on branch **`main`**, the landing page is:

[https://itsyuvallavi.github.io/monochrome-particle/](https://itsyuvallavi.github.io/monochrome-particle/)

## Install (manual)

1. Clone [github.com/itsyuvallavi/monochrome-particle](https://github.com/itsyuvallavi/monochrome-particle).
2. Copy `skills/monochrome-particle/` into either:
   - **Project skills:** `<your-project>/.cursor/skills/monochrome-particle/`
   - **Personal skills:** `~/.cursor/skills/monochrome-particle/`

Expected layout:

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
| `skills/monochrome-particle/examples/MonochromeDotsBackground.tsx` | React + Three.js example (`colors`, `speed`, `direction`, `density`, `pointSize`, `opacity`) |

## Documentation

- [Install & CLI](docs/INSTALL.md)
- [Contributing](CONTRIBUTING.md)
- [Landing page (source)](docs/index.html)

## License

MIT — see [LICENSE](LICENSE).
