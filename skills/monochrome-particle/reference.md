# Monochrome Particle Reference

This reference describes the background-only effect. It intentionally excludes route transitions, sandstorm providers, CTA button triggers, and page opacity orchestration.

These notes are **editor- and model-agnostic**: they apply whether the agent runs in Cursor, Claude Code, Codex, Gemini, Windsurf, JetBrains, Copilot, or a web chat, as long as the instructions are available to the model.

**Parity:** If another codebase (e.g. a separate “playground” or portfolio file) uses different shaders, attribute names, or storm logic, it will not match this skill’s output even with similar colors—share one implementation or one package if you need identical visuals.

## Visual Model

- A fixed full-viewport canvas sits behind page content.
- **Camera:** use `OrthographicCamera` with frustum bounds matching the particle grid: each frame resize, set `left/right` to `±(innerWidth/2 + buffer)` and `top/bottom` to `±(innerHeight/2 + buffer)` (same `buffer` as the grid padding). This avoids perspective “frustum smaller than the grid” clipping (black side gutters / cropped look). Optional: `PerspectiveCamera` with a computed Z can reduce clipping but still does not give strict 1:1 world units to pixels.
- **Sizing source:** use `window.innerWidth` and `window.innerHeight` for grid math, camera frustum, and `setSize`. Do not substitute `canvas.parentElement.clientWidth/Height` when any ancestor can be narrower than the viewport.
- **Portal:** rendering the canvas with `createPortal(..., document.body)` avoids `#root` width clamps and some stacking-context quirks (`transform` / `filter` / `perspective` on ancestors affecting `fixed`).
- Keep the canvas in a non-negative stacking layer (`z-0` or an equivalent wrapper) and put content above it (`z-index` ≥ 1). A negative z-index can place the canvas behind the body background and make the particles invisible.
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
})
```

Set:

```ts
const w = window.innerWidth
const h = window.innerHeight
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(w, h, false) // do not let Three overwrite canvas CSS; use fixed + inset for layout
renderer.toneMapping = THREE.NoToneMapping
renderer.outputColorSpace = THREE.SRGBColorSpace
```

Add `powerPreference: "high-performance"` on the renderer where supported.

On resize, listen to `window` and `window.visualViewport` (when defined) in addition to—or instead of—`ResizeObserver` on a narrow parent.

## Performance And Cleanup

- Skip rendering when `document.hidden` is true.
- Use delta time and cap it around `0.1` seconds.
- Rebuild particle geometry on viewport resize so rows, columns, mobile/desktop layer tiers, and `uMaxDistance` match the new viewport.
- Dispose generated textures, geometries, materials, render lists, and renderer on unmount.
- Do not create a new Three.js object per particle.
- Do not drive per-frame animation through React state.

## Tuning brightness

Additive blending can look dim on some displays. Prefer props before editing shader constants, for example:

```tsx
<MonochromeDotsBackground density={1.15} pointSize={1.2} opacity={1.55} />
```

(`opacity` above `1` is allowed when your component clamps a sensible max, as in the example.)

## Forbidden Additions

Do not add:

- `SandstormProvider`
- `stormIntensityRef`
- `triggerStorm`
- Explore-work button behavior
- Next.js route transitions
- Page opacity curves tied to storm intensity
