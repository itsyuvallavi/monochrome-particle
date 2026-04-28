# Monochrome Particle Reference

This reference describes the background-only effect. It intentionally excludes route transitions, sandstorm providers, CTA button triggers, and page opacity orchestration.

These notes are **editor- and model-agnostic**: they apply whether the agent runs in Cursor, Claude Code, Codex, Gemini, Windsurf, JetBrains, Copilot, or a web chat, as long as the instructions are available to the model.

**Parity:** If another codebase (e.g. a separate “playground” or portfolio file) uses different shaders, attribute names, or storm logic, it will not match this skill’s output even with similar colors—share one implementation or one package if you need identical visuals.

## Visual Model

- A **full-bleed wrapper** owns layout: `position: fixed` (or equivalent), `inset: 0`, `100dvw` × `100dvh` (or `100vw`/`100vh`), no `max-width` shrink. The **canvas** is `position: absolute; inset: 0; width/height: 100%`, `display: block`, `max-width: none`, no margin/padding—so CSS controls the painted box and `renderer.setSize(..., false)` only sizes the drawing buffer.
- **Camera:** `OrthographicCamera` frustum each rebuild: `left/right` = `±(drawableWidth/2 + buffer)`, `top/bottom` = `±(drawableHeight/2 + buffer)`—identical `buffer` to the particle grid. Optional **`zoom`**: divide those half-extents by `zoom` (greater than 1 = zoom in / center crop) without rebuilding points.
- **Drawable size:** use `readDrawableCssSize(canvas)`: per axis, `Math.max` of `canvas.clientWidth`, `getBoundingClientRect()` size, `window.inner*`, `document.documentElement.client*`, and `visualViewport` when present—never size the buffer from `innerWidth` alone if the canvas can paint wider (pillarboxing).
- **Portal:** optional `createPortal(..., document.body)` when `#root` is narrow or stacking is fragile; default in-tree is often easier for dev tooling.
- Keep the wrapper in a non-negative stacking layer (`z-0`) and put app content above (`z-index` ≥ 1).
- Set **`points.frustumCulled = false`** for large point sprites.
- The renderer owns a black `THREE.Scene`.
- The particle field is made from multiple `THREE.Points` layers, not one mesh per dot.
- Each layer uses `BufferGeometry` with:
  - `position`: particle position in screen-like plane space
  - `delay`: random phase offset for organic wave variation
  - `particleDist`: distance from the top-left plane origin, used for gradient placement (never name this attribute `distance`; it collides with the GLSL builtin)
- A small generated canvas texture creates soft circular dots.
- `THREE.AdditiveBlending` creates subtle glow where particles overlap.

## Required Config Surface

Expose these as props or a config object:

```ts
type ParticleBackgroundConfig = {
  colors: {
    start: string
    mid: string
    end: string
  }
  speed: number
  direction: { x: number; y: number }
  density: number
  pointSize: number
  opacity: number
  zoom: number
}
```

Recommended defaults:

```ts
const DEFAULT_CONFIG = {
  colors: {
    start: "#14b8d2",
    mid: "#b066ec",
    end: "#ec599e",
  },
  speed: 1.5,
  direction: { x: 1, y: 0.2 },
  density: 1,
  pointSize: 1,
  opacity: 1,
  zoom: 1,
}
```

## Shader Contract

Use uniforms for common visual customization:

```glsl
uniform float uTime;
uniform float uWaveLayer;
uniform float uMaxDistance;
uniform float uPointSizeMultiplier;
uniform float uOpacityMultiplier;
uniform vec2 uFlowDirection;
uniform vec3 uColorStart;
uniform vec3 uColorMid;
uniform vec3 uColorEnd;
uniform sampler2D uTexture;
```

Use attributes for per-particle variation:

```glsl
attribute float delay;
attribute float particleDist;
```

(Do not name the second attribute `distance`: in GLSL ES, `distance()` is a builtin and that name breaks shader compilation on many drivers.)

The vertex shader should:

- Normalize `uFlowDirection`, with a safe fallback when length is near zero.
- Use `dot(position.xy, flowDirection)` to make waves respond to direction.
- Combine several sine/cosine waves for organic motion.
- Multiply `gl_PointSize` by `uPointSizeMultiplier`.
- Multiply alpha by `uOpacityMultiplier`.

The fragment shader should:

- Sample `uTexture` with `gl_PointCoord`.
- Discard low-alpha pixels to keep dots circular.
- Mix `uColorStart -> uColorMid -> uColorEnd` using normalized distance.

## Layers

Use mobile and desktop density tiers:

```ts
const layers = isMobile
  ? [
      { spacing: 6, density: 0.6, layer: 0 },
      { spacing: 10, density: 0.4, layer: 1 },
    ]
  : isLowPerformance
    ? [
        { spacing: 4, density: 0.8, layer: 0 },
        { spacing: 6, density: 0.6, layer: 1 },
        { spacing: 8, density: 0.4, layer: 2 },
      ]
    : [
        { spacing: 4, density: 0.9, layer: 0 },
        { spacing: 6, density: 0.6, layer: 1 },
        { spacing: 8, density: 0.4, layer: 2 },
      ]
```

Apply the public `density` multiplier to layer density:

```ts
const keepProbability = Math.min(1, Math.max(0, layer.density * config.density))
```

Changing density should rebuild geometry because skipped particles are chosen during generation.

Changing `colors`, `speed`, `direction`, `pointSize`, or `opacity` should update uniforms in place and should not recreate the renderer or particle geometry.

Changing **`zoom`** should only update the orthographic camera frustum (half-extents divided by zoom); do not rebuild particle geometry for zoom alone.

## Renderer Settings

Use:

```ts
new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  stencil: false,
  depth: false,
  preserveDrawingBuffer: false,
  failIfMajorPerformanceCaveat: false,
  powerPreference: "high-performance",
})
```

Set drawing buffer from **`readDrawableCssSize(canvas)`** (see Visual Model), never from `innerWidth` alone if the canvas can paint larger:

```ts
const { width, height } = readDrawableCssSize(canvas)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(width, height, false) // false: do not set inline width/height on the canvas element
renderer.toneMapping = THREE.NoToneMapping
renderer.outputColorSpace = THREE.SRGBColorSpace
```

Add `powerPreference: "high-performance"` on the renderer where supported.

On resize, listen to **`window`**, **`visualViewport`** (when defined), and use **`ResizeObserver`** on the canvas, the full-bleed wrapper, and optionally `document.documentElement`. Coalesce handler work with **`requestAnimationFrame`**.

## Performance And Cleanup

- Skip rendering when `document.hidden` is true.
- Use delta time and cap it around `0.1` seconds.
- Rebuild particle geometry whenever drawable size changes so rows, columns, mobile/desktop layer tiers, `uMaxDistance`, and the orthographic frustum stay in sync.
- Set `frustumCulled = false` on `THREE.Points` when using large `gl_PointSize`.
- Dispose generated textures, geometries, materials, render lists, and renderer on unmount; **`ResizeObserver.disconnect()`** in teardown.
- Do not create a new Three.js object per particle.
- Do not drive per-frame animation through React state.

## Tuning brightness

Additive blending can look dim on some displays. Prefer props before editing shader constants, for example:

```tsx
<MonochromeDotsBackground density={1.15} pointSize={1.2} opacity={1.55} />
```

(`opacity` above `1` is allowed when your component clamps a sensible max, as in the example.)

## Bounded region (not full viewport)

To fill only a card, hero, or panel:

- Wrap in `position: relative` with explicit width/height (or a flex child with `flex: 1` and a parent height).
- Reuse the same **wrapper + absolutely inset canvas** pattern inside that box; `readDrawableCssSize(canvas)` follows `clientWidth` / `clientHeight` from the wrapper.
- Point **`ResizeObserver.observe` at that wrapper** (and/or the canvas). The same pipeline applies: `readDrawableCssSize` → `setSize(..., false)` → orthographic frustum → grid rebuild.

## Forbidden Additions

Do not add:

- `SandstormProvider`
- `stormIntensityRef`
- `triggerStorm`
- Explore-work button behavior
- Next.js route transitions
- Page opacity curves tied to storm intensity
