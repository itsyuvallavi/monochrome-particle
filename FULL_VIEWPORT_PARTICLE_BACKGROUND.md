# Full-viewport particle background: what went wrong and how it was fixed

This note is for review. It describes the issues that showed up in **monochrome-particle-demo** (narrow field, black side gutters, “zoomed” crop, dim appearance vs another playground) and the root causes in the codebase and environment—not bugs in Three.js itself.

## Symptoms

- **Black bars left/right** — Particles only occupied part of the browser width; the rest was solid black.
- **Not feeling full-screen** — Effect looked cropped or “zoomed” even when the canvas seemed mounted behind the UI.
- **Much dimmer than another “playground”** — Same general idea, very different brightness.
- **After “fixing” the camera distance, width still looked wrong** — Layout/CSS and sizing source were separate problems.

## Root cause 1: Two different implementations (parity vs demo)

The skill ships **MonochromeDotsBackground** (uniform-based colors, `particleDist` attribute, flow-direction waves, no storm).

A separate “playground” or portfolio file may use a **different** implementation: hard-coded GLSL colors, a `distance` attribute name, storm uniforms and displacement, and different wave terms. It is not the same shader or the same props surface.

**Implication:** Matching JSON colors on the demo cannot reproduce another app’s look exactly. Dimness is often low luminance gradient stops plus additive blending on black—low RGB means little light added per pixel—while saturated defaults read brighter.

**If you need identical output:** One shared module (or package) imported by both apps, same Three.js version, same props—not two divergent copies.

## Root cause 2: Perspective camera vs “pixel grid” world units

The effect places particles on a plane using coordinates derived from `window.innerWidth` / `innerHeight` (plus a fixed buffer), in a “1 world unit ≈ 1 CSS pixel” style layout.

A **PerspectiveCamera** at a fixed distance (e.g. `z = 500`) with a fixed FOV only sees a fixed frustum on that plane. If that frustum is **smaller** than the rectangle that holds the grid, you get clipping—mostly black past the particle extent—which reads as “zoomed in” or “not full frame.”

A computed `z` that fits the grid (`tan(fov/2)` vs half-extent) fixes clipping in theory, but perspective still does not give a strict 1:1 mapping from world units to screen pixels the way an orthographic projection does.

**Fix in this repo:** Switch to **OrthographicCamera** with `left` / `right` / `top` / `bottom` set to `±(width/2 + buffer)` and `±(height/2 + buffer)` on each resize. The visible region matches the grid bounds for any aspect ratio (width and height are independent—no “demo aspect ratio” lock-in).

**Trade-off:** Ortho removes perspective foreshortening; points feel a bit flatter than with a perspective camera.

## Root cause 3: Reading size from the wrong place (narrow grid + buffer)

The renderer and particle system must use the **same** width and height as the intended drawable area.

Early versions used `canvas.parentElement.clientWidth` / `clientHeight` (or mixed fallbacks). If any ancestor constrained width (app shell, flex, `max-width`, browser UI quirks, etc.), that value could be **smaller** than the actual browser viewport.

Then:

- `setSize(w, h)` built a narrow WebGL buffer, and/or
- The particle grid was built for that narrow `w`,

while the page background or user expectation was full viewport → **black gutters** (no particles drawn in those pixel columns).

**Fix in this repo (see also `FULL_BLEED_CANVAS.md`):**

- **`readDrawableCssSize(canvas)`** — `Math.max` per axis across canvas layout, `innerWidth`/`innerHeight`, `documentElement.client*`, and `visualViewport`.
- **`renderer.setSize(width, height, false)`** — CSS controls display size; full-bleed wrapper + absolutely inset canvas (`100dvw`/`100dvh` pattern).
- **`ResizeObserver`** on canvas, wrapper, and optionally `documentElement`, plus **`window`** and **`visualViewport`** resize, coalesced with `requestAnimationFrame`.
- Double **`requestAnimationFrame`** on first paint before trusting `clientWidth`.

## Root cause 4: Canvas placement inside `#root`

Keeping the canvas inside the React tree under `#root` is fine if `#root` is truly full width and no ancestor uses **transform** / **filter** / **perspective** (which can change how `fixed` behaves).

To remove layout risk, the example can **portal** the canvas to `document.body` and give `#root` a higher z-index so copy stays on top. The canvas stays `pointer-events: none`.

## Root cause 5: `setSize(updateStyle: true)` vs CSS

Default `renderer.setSize(w, h)` sets inline width / height on the canvas in pixels. That can fight CSS (`fixed`, `%`, `inset`) and produce confusing layout vs buffer mismatches.

Using **`setSize(w, h, false)`** and driving dimensions from the viewport keeps one clear rule: shader/grid = `innerWidth` × `innerHeight`, CSS = full-screen fixed.

## Quick reference: fixes in this repo

| Area | Approach |
| --- | --- |
| Camera | `OrthographicCamera` bounds = particle grid bounds (incl. buffer) |
| Sizing | `readDrawableCssSize(canvas)` (max of layout + viewport signals) |
| DOM | Full-bleed wrapper + canvas; optional `createPortal` (opt-in in example) |
| Renderer | `setSize(w, h, false)` + capped DPR + `powerPreference: "high-performance"` |
| Stacking | Wrapper `z-index: 0`, app root `z-index: 1` (or higher) |
| Resize | `window` + `visualViewport` + `ResizeObserver` + rAF coalesce |

## Optional follow-ups

- **Single package:** Move the canonical component to a shared package consumed by demo + portfolio if visual parity is required.
- **Docs:** This file; linked from the main README for discoverability.

_Last updated alongside orthographic + portal + viewport-sizing alignment in the skill example and documentation._
