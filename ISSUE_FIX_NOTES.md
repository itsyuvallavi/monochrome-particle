# Issue Fix Notes

> **Repo status:** The fixes below are **already applied** in `skills/monochrome-particle/SKILL.md`, `reference.md`, and `examples/MonochromeDotsBackground.tsx`. This file is optional changelog text; remove it if you want a single source of truth in `skills/` only.

This note documents the problems found while installing and using the
`monochrome-particle` skill in a fresh one-page React demo.

## Summary

The skill instructions and example were conceptually correct, but a few details
made the generated background fail or appear invisible in a real browser:

- The shader used `distance` as a custom attribute name.
- The suggested canvas stacking used a negative z-index.
- The example included fragile canvas compositor styles.
- The runtime config ref was updated during render, which React 19 lint rejects.

These issues were fixed in `skills/monochrome-particle/SKILL.md`,
`skills/monochrome-particle/reference.md`, and
`skills/monochrome-particle/examples/MonochromeDotsBackground.tsx`.

## Root Causes

### 1. GLSL Attribute Name Collision

The original shader contract used an attribute named `distance`:

```glsl
attribute float distance;
```

In GLSL ES, `distance()` is a built-in function. Some WebGL shader compilers
reject a custom variable with the same name, causing errors like:

```text
THREE.WebGLProgram: Shader Error
Program Info Log: Vertex shader is not compiled.
ERROR: syntax error
```

The fix is to use a non-conflicting name:

```glsl
attribute float particleDist;
```

The Three.js geometry attribute must match:

```ts
geometry.setAttribute("particleDist", new THREE.BufferAttribute(distances, 1))
```

### 2. Hidden Canvas From Negative z-index

The original integration guidance suggested a negative z-index canvas layer
(`-z-10`). In a plain React/Vite app, a fixed element with a negative z-index can
be painted behind the `body` background. The page then appears solid black even
when WebGL is running.

The safer pattern is:

- Put the background canvas in a non-negative fixed layer (`z-0` or equivalent).
- Put page content above it (`relative z-10` or equivalent).
- Use an isolated app shell if needed.

### 3. Fragile Canvas Compositor Styles

The example previously included canvas styles such as `transform`,
`willChange`, `backfaceVisibility`, and `perspective`. These are sometimes useful
for compositing, but they can also make WebGL output harder to debug across
browsers.

The example now leaves the canvas style simple and lets layout CSS control the
layering.

### 4. React 19 Ref Lint

The example updated `runtimeConfigRef.current` during render. React 19's hooks
lint flags this:

```text
Cannot access refs during render
```

The fix is to derive a memoized runtime config and update the ref from an
effect:

```ts
const runtimeConfig = useMemo(() => ({ ... }), [/* props */])
const runtimeConfigRef = useRef(runtimeConfig)

useEffect(() => {
  runtimeConfigRef.current = runtimeConfig
}, [runtimeConfig])
```

## Validation Performed

After the fixes:

- `npm run typecheck` passes in the `monochrome-particle` repo.
- A fresh Vite + React demo builds successfully.
- The demo lint passes.
- Browser smoke testing confirmed visible colored particles.
- Browser console showed no WebGL, shader, or runtime errors.

## Practical Guidance

When using this skill in another app:

- Keep shader customization prop-driven (`colors`, `speed`, `direction`,
`density`, `pointSize`, `opacity`).
- Do not rename GLSL attributes to built-in names such as `distance`.
- Avoid negative z-index for the canvas unless the parent stacking context is
explicitly controlled.
- Increase brightness through props first, for example:

```tsx
<MonochromeDotsBackground
  density={1.15}
  pointSize={1.2}
  opacity={1.55}
/>
```

