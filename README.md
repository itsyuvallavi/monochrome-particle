# Monochrome Particle

Agent skills for building a **configurable full-viewport Three.js particle wave background** (layered `Points`, GLSL shaders, soft sprites, additive blending).

The files are **plain Markdown** (`SKILL.md` plus reference and example). Any coding agent or IDE can follow them as long as the model receives the text—for example **Cursor**, **VS Code** and forks, **Claude Code**, **OpenAI Codex**, **Google Gemini** in compatible clients, **Windsurf**, **JetBrains AI**, **GitHub Copilot Chat**, or a **web UI** if you paste or attach the skill.

The [Agent Skills CLI](https://github.com/vercel-labs/agent-skills) is one install path (often used from Cursor). If your product does not use that flow, copy the `skills/monochrome-particle/` folder into your tool’s skill/rules directory, or paste `SKILL.md` into the system prompt or project instructions.

The skill is **background-only**: no route transitions, no sandstorm-style providers, and no CTA-driven navigation.

## Install (one line)

When your environment supports it, the [Agent Skills CLI](https://github.com/vercel-labs/agent-skills) accepts GitHub **`owner/repo`** shorthand (shortest form):

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
2. Copy `skills/monochrome-particle/` into the folder your tool expects, for example:
   - **Cursor (project):** `<your-project>/.cursor/skills/monochrome-particle/`
   - **Cursor (user):** `~/.cursor/skills/monochrome-particle/`
   - **Other products:** use that product’s documented “skills”, “rules”, “instructions”, or “AGENTS” path, or keep the folder in-repo and `@`-reference the files from your prompt if supported.

If there is no auto-loader, paste the contents of `SKILL.md` (and optionally `reference.md`) into the model context or project rules so the agent still follows the same contract.

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
