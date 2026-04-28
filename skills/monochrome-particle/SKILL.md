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

Build a background-only React/Next.js component that owns a fixed full-viewport canvas, `WebGLRenderer`, layered `THREE.Points`, buffer geometry with `delay` and `particleDist` attributes (never name an attribute `distance`; it clashes with the GLSL builtin `distance()`), vertex + fragment shaders, circular sprite texture, animation loop, resize handling, visibility handling, and full WebGL cleanup. Use an **orthographic** camera whose left/right/top/bottom match the particle grid bounds (viewport half-size plus the same edge buffer used for the grid) so the field always fills the drawable area without perspective frustum clipping (black side gutters).

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

- Use a `"use client"` React component with `useEffect` and `useRef` (Next.js App Router); in Vite or CRA you can omit the directive.
- If you mirror props into a ref for the animation loop, derive the object with `useMemo` and assign `ref.current` inside `useEffect`. Do not write to `ref.current` during render — React 19’s ESLint plugin reports that as “Cannot access refs during render”.
- Install `three` and `@types/three`.
- Use `OrthographicCamera` with `left`, `right`, `top`, `bottom` set each rebuild to `±(width/2 + buffer)` and `±(height/2 + buffer)` using the **same** `buffer` as the particle grid margin. Position the camera on +Z (e.g. 500) and `lookAt(0,0,0)`. Trade-off: no perspective foreshortening; the field looks slightly flatter than with a perspective camera.
- **Drawable CSS size:** implement `readDrawableCssSize(canvas)` and use its `width`/`height` for grid math, orthographic frustum updates, and `renderer.setSize`. Take the **maximum** (per axis) of: `canvas.clientWidth`, `getBoundingClientRect()` width/height, `window.innerWidth`/`innerHeight`, `document.documentElement.clientWidth`/`clientHeight`, and `visualViewport` width/height when defined—so the buffer is never narrower than the painted layout when `innerWidth` lags split sidebars, mobile chrome, or first paint.
- Wrap the canvas in a **full-bleed** layout box: e.g. `position: fixed; inset: 0; width: 100dvw; height: 100dvh` (or equivalent), and make the canvas `position: absolute; inset: 0; width/height: 100%; display: block; max-width: none; margin: 0; padding: 0`. Layout owns display size; the renderer must **not** use `setSize(..., true)` (do not let Three.js set inline canvas dimensions that fight CSS).
- Use `WebGLRenderer` with `powerPreference: "high-performance"`, `alpha: false`, `depth: false`, `stencil: false`, and capped DPR (`Math.min(devicePixelRatio, 2)`).
- Call `renderer.setSize(width, height, false)` where `width`/`height` come from `readDrawableCssSize(canvas)`.
- Build 2 to 3 particle layers using `BufferGeometry`, `ShaderMaterial`, `THREE.Points`, and additive blending. Set `points.frustumCulled = false` so large `gl_PointSize` does not disappear at the frustum edge.
- Generate a 32x32 radial-gradient canvas texture for soft circular particles.
- Use distance from the top-left plane origin for the cyan/purple/pink-style gradient, but keep actual colors configurable through uniforms.
- Animate with `requestAnimationFrame`, time deltas, and a capped delta to avoid jumps after tab inactivity.
- Skip rendering while the tab is hidden.
- Update common visual props (`colors`, `speed`, `direction`, `pointSize`, `opacity`) through refs/uniforms without recreating the WebGL renderer.
- Rebuild particle geometry on density changes or whenever drawable size changes. Debounce rapid `ResizeObserver` callbacks with `requestAnimationFrame`. On first mount, run **two** nested `requestAnimationFrame` ticks before the first size-dependent build so `clientWidth` / `clientHeight` are not zero.
- On cleanup, cancel rAF, disconnect `ResizeObserver`, remove listeners, dispose textures/geometries/materials/renderer, and clear the scene.

## Files To Read

- Read `reference.md` for shader contracts, sizing, layers, and performance rules.
- Read `examples/MonochromeDotsBackground.tsx` for a complete background-only component: full-bleed wrapper + canvas, `readDrawableCssSize`, orthographic camera, `setSize(..., false)`, `ResizeObserver` + `window` + `visualViewport`, optional `document.body` portal, and prop-driven customization.

The repository root includes **`FULL_VIEWPORT_PARTICLE_BACKGROUND.md`** (camera/gutters) and **`FULL_BLEED_CANVAS.md`** (CSS + drawable size + resize). Not part of the Agent Skill folder if you only vendor `skills/monochrome-particle/`.

## Integration

- Mount the component once near the app root. Ensure `#root` (or your app shell) is **full width** or sits **above** the background with `position: relative; z-index: 1+` so a narrow `max-width` on `#root` does not crop the **wrapper** if the background stays in-tree.
- **Default:** keep the background **in the React tree** (no portal) for predictable refs and Vite/CSR dev; **opt in** to `createPortal(..., document.body)` only when `#root` is narrow or `fixed` stacking is unreliable.
- The example uses an inline-style full-bleed **wrapper** (`100dvw` / `100dvh`, `fixed`, `inset: 0`) and an absolutely inset **canvas** at `100%`×`100%`.
- Avoid negative z-index on the wrapper unless the stacking context is controlled; otherwise the body background can hide WebGL.
- Wire resize to **`window`**, **`visualViewport`** (if defined), and **`ResizeObserver`** on the canvas, wrapper, and optionally `document.documentElement`; coalesce with `requestAnimationFrame`.
- Keep the component independent from routes, buttons, and page transitions.

## Verification

- Changing `colors`, `speed`, `direction`, `density`, `pointSize`, or `opacity` produces the expected visual change.
- Resize, rotation, mobile browser chrome show/hide, and tab hide/show work without console errors; no black pillarboxing when the painted area is wider than a lagging `innerWidth`.
- Unmounting disposes textures, geometries, materials, and renderer resources.
- **React StrictMode** double-mounting in development can surface fragile WebGL init; prefer idempotent setup/teardown (or disable StrictMode locally while debugging-only if needed).
- No references to sandstorm, route transitions, or CTA-triggered navigation are introduced.
