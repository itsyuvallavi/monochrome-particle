---
name: monochrome-particle
description: >-
  Build or port a configurable full-viewport Three.js layered particle wave
  background using Points, ShaderMaterial, GLSL waves, soft sprite textures,
  additive blending, and mobile/desktop density tiers. Use for Next.js/React
  canvas backgrounds, Three.js Points shaders, monochrome dots, particle wave,
  animated hero backdrop, or requests to change particle colors, speed,
  direction, density, point size, or opacity. Portable Markdown instructions:
  applies in any coding agent or IDE that loads SKILL.md (Cursor, Claude Code,
  OpenAI Codex, Google Gemini, Windsurf, JetBrains AI, Copilot Chat, VS
  Code–based agents, or paste into web UIs). Does NOT cover page transitions,
  SandstormProvider, sandstorm hooks, button-triggered navigation, or route
  orchestration; only the static/ambient background.
---

# Monochrome Particle

## Portability

This package is **not Cursor-specific**. It is a portable `SKILL.md` plus supporting Markdown and a TypeScript example. Use it anywhere the model can read files or pasted instructions:

- **Cursor:** project or user `.cursor/skills/monochrome-particle/`, or `npx skills add itsyuvallavi/monochrome-particle` when supported.
- **Other IDEs and agents:** follow that product’s documented location for skills, rules, custom instructions, or repository context; if none exists, attach `SKILL.md` and `reference.md` to the chat or add them to your project’s agent configuration file.

Tool-specific install mechanics may differ; the **implementation contract** (customization surface, shaders, cleanup) does not.

## Scope

Build a background-only React/Next.js component that owns a fixed full-viewport canvas, `WebGLRenderer`, layered `THREE.Points`, buffer geometry with `delay` and `distance` attributes, vertex + fragment shaders, circular sprite texture, animation loop, resize handling, visibility handling, and full WebGL cleanup.

Do not implement or document these as part of this skill:

- `SandstormProvider`, `sandstorm-transition`, `stormIntensityRef`, or syncing storm intensity to routes
- "Explore work" or any other button driving the background or navigation
- `contentOpacityFromStormIntensity` or fading page chrome with storm
- Any Next.js transition tied to clicking a CTA

If a source implementation contains storm shader code, remove it or keep `uStormIntensity` fixed at `0`. Do not add context providers or navigation triggers.

## Customization Contract

Every implementation generated from this skill must expose a simple prop or config API so future LLM requests can safely change the visual result without editing raw shader constants.

Required customization surface:

- `colors`: three gradient stops (`start`, `mid`, `end`) as hex strings or RGB values
- `speed`: animation speed multiplier
- `direction`: `{ x, y }` flow vector used by the wave shader
- `density`: particle density multiplier; changing it rebuilds geometry
- `pointSize`: point-size multiplier
- `opacity`: alpha multiplier

Prefer shader uniforms for runtime-safe visual changes:

- `uColorStart`, `uColorMid`, `uColorEnd`
- `uFlowDirection`
- `uPointSizeMultiplier`
- `uOpacityMultiplier`

When the user asks "make it blue and gold", "slow it down", "reverse direction", "make it denser", "make the dots smaller", or similar, edit the config/props first. Do not ask the user to edit GLSL constants for common visual changes.

## Implementation Recipe

- Use a `"use client"` React component with `useEffect` and `useRef`.
- Install `three` and `@types/three`.
- Use `PerspectiveCamera(75, width / height, 0.1, 2000)` with `camera.position.z = 500`.
- Use `WebGLRenderer` with `powerPreference: "high-performance"`, `alpha: false`, `depth: false`, `stencil: false`, and capped DPR (`Math.min(devicePixelRatio, 2)`).
- Build 2 to 3 particle layers using `BufferGeometry`, `ShaderMaterial`, `THREE.Points`, and additive blending.
- Generate a 32x32 radial-gradient canvas texture for soft circular particles.
- Use distance from the top-left plane origin for the cyan/purple/pink-style gradient, but keep actual colors configurable through uniforms.
- Animate with `requestAnimationFrame`, time deltas, and a capped delta to avoid jumps after tab inactivity.
- Skip rendering while the tab is hidden.
- Update common visual props (`colors`, `speed`, `direction`, `pointSize`, `opacity`) through refs/uniforms without recreating the WebGL renderer.
- Rebuild particle geometry on density changes or viewport resize so particle count, mobile/desktop layer tiers, and `uMaxDistance` stay correct.
- On cleanup, cancel rAF, remove listeners, dispose textures/geometries/materials/renderer, and clear the scene.

## Files To Read

- Read `reference.md` for shader contracts, sizing, layers, and performance rules.
- Read `examples/MonochromeDotsBackground.tsx` for a complete background-only component with configurable colors, speed, direction, density, point size, and opacity.

## Integration

- Mount the component once near the app root.
- Canvas should be `fixed inset-0 h-full w-full -z-10`.
- Page content should sit above it with `relative z-10`.
- Keep the component independent from routes, buttons, and page transitions.

## Verification

- Changing `colors`, `speed`, `direction`, `density`, `pointSize`, or `opacity` produces the expected visual change.
- Resize and tab hide/show work without console errors.
- Unmounting disposes textures, geometries, materials, and renderer resources.
- No references to sandstorm, route transitions, or CTA-triggered navigation are introduced.
