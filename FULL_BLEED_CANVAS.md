# Full-bleed canvas and correct resize behavior

This note describes what you must change (or keep) so **MonochromeDotsBackground** fills the viewport without black side gutters, stays sharp on DPR changes, and rebuilds when the layout size changes.

Canonical implementation: [`skills/monochrome-particle/examples/MonochromeDotsBackground.tsx`](skills/monochrome-particle/examples/MonochromeDotsBackground.tsx).

## What goes wrong without these pieces

- **`renderer.setSize(w, h, true)`** — Three.js sets inline width / height on the canvas from your numbers. If those numbers come only from `window.innerWidth` and that value is **smaller** than the area the canvas actually occupies (some browsers, split sidebars, delayed layout), the drawable buffer is too narrow and you see **pillarboxing** (empty strips left/right).

- **Sizing only from `innerWidth`** — Same issue: the painted size can disagree with `innerWidth`.

- **Camera frustum ≠ particle grid** — If the orthographic frustum does not match `width` / `height` + `GRID_BUFFER`, particles clip or appear offset when you resize.

- **Only `window.resize`** — Mobile URL bar show/hide, `visualViewport`, and parent layout changes may not fire `resize`; you need **`ResizeObserver`** (and often **`visualViewport`**).

## 1. CSS: wrapper + canvas

The canvas must fill a full-viewport **wrapper**; do not let a narrow `#root` or `max-width` shrink the WebGL element.

**Wrapper** (see example `DEFAULT_WRAPPER_STYLE`):

- `position: fixed` (or absolute within a full-bleed parent)
- `inset: 0`
- `width: 100dvw` / `height: 100dvh` — avoids subtle “almost full” gaps on mobile (fallback: `100vw` / `100vh` in older browsers if needed)

**Canvas** (see example `DEFAULT_CANVAS_STYLE`):

- `position: absolute; inset: 0`
- `width: 100%; height: 100%`
- `display: block; max-width: none; margin: 0; padding: 0`

**Important:** With this setup, **layout owns the displayed size**. The renderer must **not** use `setSize(..., true)`, which would fight CSS.

## 2. Drawable size: `readDrawableCssSize(canvas)`

Use one function for CSS pixel width/height shared by:

- `renderer.setSize`
- orthographic frustum
- particle grid (cols/rows, origins, `maxDistance`)

**Rule:** Take the **maximum** (per axis) of:

- Canvas layout: `canvas.clientWidth`, `getBoundingClientRect().width` (and height)
- `window.innerWidth` / `innerHeight`
- `document.documentElement.clientWidth` / `clientHeight`
- `visualViewport.width` / `height` when available

That way you never allocate a buffer **narrower** than the real viewport when `innerWidth` lies.

## 3. Renderer: `setSize(width, height, false)`

```ts
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setSize(width, height, false)
```

The third argument **`false`** means: update the drawing buffer to those dimensions but **do not** set canvas element inline styles. CSS keeps the canvas 100% of the wrapper.

## 4. Camera: orthographic, lockstep with grid

Use **`THREE.OrthographicCamera`**. Set `left` / `right` / `top` / `bottom` from the drawable width/height and the same **`GRID_BUFFER`** used when placing particles (half-extents `width/2 + GRID_BUFFER`, `height/2 + GRID_BUFFER`). Particle positions must be built from the same width/height and buffer. Divide half-extents by **`zoom`** to zoom in (`> 1`) or out (`< 1`) without regenerating geometry.

On any size change, rerun the routine that:

1. Calls **`readDrawableCssSize(canvas)`**
2. **`setPixelRatio`** + **`setSize(..., false)`**
3. Updates the orthographic frustum
4. Rebuilds particle geometries (this example rebuilds systems on resize)

Wire debounced work (e.g. coalesced with **`requestAnimationFrame`**) to:

- `window` **`resize`**
- **`visualViewport`** **`resize`** (if defined)
- **`ResizeObserver`** on the canvas, the wrapper, and optionally **`document.documentElement`**

**First paint:** After mount, run **two** nested `requestAnimationFrame` ticks before relying on size, so the first `clientWidth` is not `0`.

## 6. React / WebGL gotchas (this repo)

- **React StrictMode** double-mounting can complicate WebGL during development; use idempotent init/teardown in the effect, or disable StrictMode locally while debugging if needed.
- **`particles.frustumCulled = false`** avoids points disappearing at the frustum edge with large point sizes.
- **`useDocumentBodyPortal`:** optional portal to `document.body` when your app root is narrow; **default in the example is in-tree** for predictable refs in Vite dev.

## Using the component at an arbitrary size (not full viewport)

To fill only a region (e.g. a card or hero div):

- Wrap the component in `position: relative` with explicit width and height (or flex child with `flex: 1` and a parent height).
- Use the same wrapper + canvas CSS inside that container (`absolute` inset canvas, `100%` width/height).
- Point **`ResizeObserver.observe(wrapperElement)`** at that wrapper instead of (or in addition to) `document.documentElement`.
- Keep **`readDrawableCssSize(canvas)`** — it will follow `clientWidth` / `clientHeight` from the wrapper.

The same **`readDrawableCssSize` → `setSize(..., false)` → orthographic frustum → grid** pipeline applies; only the CSS container changes from full viewport to a bounded box.

## After changing sizing logic

Verify in a “bad” client (narrow `innerWidth` vs wide paint), with window resize, device rotation, and mobile browser chrome showing/hiding.

---

_See also [`FULL_VIEWPORT_PARTICLE_BACKGROUND.md`](FULL_VIEWPORT_PARTICLE_BACKGROUND.md) for earlier ortho/parity notes._
