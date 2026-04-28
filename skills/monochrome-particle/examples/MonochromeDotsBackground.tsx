"use client"

import { createPortal } from "react-dom"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import * as THREE from "three"

type ParticleColorStops = {
  start?: string
  mid?: string
  end?: string
}

type FlowDirection = {
  x?: number
  y?: number
}

type MonochromeDotsBackgroundProps = {
  colors?: ParticleColorStops
  speed?: number
  direction?: FlowDirection
  density?: number
  pointSize?: number
  opacity?: number
  /** CSS classes on the full-bleed wrapper (layout box observed by ResizeObserver). */
  wrapperClassName?: string
  wrapperStyle?: CSSProperties
  /** CSS classes on the canvas (absolutely inset inside the wrapper). */
  className?: string
  style?: CSSProperties
  /**
   * Opt-in: render the full wrapper via `createPortal` into `document.body` when `#root` is
   * narrow or `fixed` stacking is unreliable. Default is in-tree for predictable layout/refs (e.g. Vite dev).
   */
  useDocumentBodyPortal?: boolean
}

type ParticleSystem = {
  particles: THREE.Points
  material: THREE.ShaderMaterial
}

/** Padding around the drawable rect for the particle grid; must match ortho frustum half-extent. */
const GRID_BUFFER = 500

const DEFAULT_WRAPPER_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  width: "100dvw",
  height: "100dvh",
  maxWidth: "none",
  margin: 0,
  padding: 0,
  zIndex: 0,
  pointerEvents: "none",
}

const DEFAULT_CANVAS_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  display: "block",
  maxWidth: "none",
  margin: 0,
  padding: 0,
}

const DEFAULT_COLORS = {
  start: "#14b8d2",
  mid: "#b066ec",
  end: "#ec599e",
}

const vertexShader = `
  #define PI 3.1415926535897932384626433832795
  uniform float uTime;
  uniform float uWaveLayer;
  uniform float uMaxDistance;
  uniform float uPointSizeMultiplier;
  uniform float uOpacityMultiplier;
  uniform vec2 uFlowDirection;
  attribute float delay;
  /* distance() is a GLSL builtin — attribute must not be named distance */
  attribute float particleDist;
  varying float vAlpha;
  varying float vDistanceRatio;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    vec2 flow = length(uFlowDirection) < 0.001 ? vec2(1.0, 0.0) : normalize(uFlowDirection);
    float directionalDistance = dot(position.xy, flow);

    float layerSpeed = 2.0 + uWaveLayer * 0.3;
    float layerFreq = 0.008 + uWaveLayer * 0.002;

    float wave1 = sin(directionalDistance * layerFreq - uTime * layerSpeed + delay);
    float wave2 = sin(particleDist * (layerFreq * 1.5) - uTime * (layerSpeed * 1.2) + delay * 0.7);
    float wave3 = sin(directionalDistance * (layerFreq * 0.6) - uTime * (layerSpeed * 0.8) + delay * 1.3);
    float wave4 = cos(particleDist * (layerFreq * 1.8) - uTime * (layerSpeed * 0.7) + delay * 0.3);

    float pulse = wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.2 + wave4 * 0.1;

    float baseSize = 2.35 + uWaveLayer * 0.55;
    float size = (baseSize + pulse * 2.25) * uPointSizeMultiplier;
    gl_PointSize = max(size, 1.0);

    float baseAlpha = 0.35 + uWaveLayer * 0.07;
    vAlpha = (baseAlpha + (pulse + 1.5) * baseAlpha * 0.55) * uOpacityMultiplier;
    vDistanceRatio = clamp(particleDist / uMaxDistance, 0.0, 1.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec3 uColorStart;
  uniform vec3 uColorMid;
  uniform vec3 uColorEnd;
  varying float vAlpha;
  varying float vDistanceRatio;

  void main() {
    vec4 textureColor = texture2D(uTexture, gl_PointCoord);
    if (textureColor.a < 0.3) discard;

    vec3 gradientColor;
    if (vDistanceRatio < 0.5) {
      gradientColor = mix(uColorStart, uColorMid, vDistanceRatio * 2.0);
    } else {
      gradientColor = mix(uColorMid, uColorEnd, (vDistanceRatio - 0.5) * 2.0);
    }

    gl_FragColor = vec4(gradientColor, vAlpha) * textureColor;
  }
`

/**
 * Single source for CSS pixel width/height: never allocate a buffer narrower than the painted layout
 * when `innerWidth` lags or the canvas fills more than the layout box reports on first frame.
 */
function readDrawableCssSize(canvas: HTMLCanvasElement): { width: number; height: number } {
  const rect = canvas.getBoundingClientRect()
  const vv = window.visualViewport
  const docEl = document.documentElement

  const width = Math.max(
    canvas.clientWidth,
    rect.width,
    window.innerWidth,
    docEl.clientWidth,
    vv?.width ?? 0,
    1,
  )
  const height = Math.max(
    canvas.clientHeight,
    rect.height,
    window.innerHeight,
    docEl.clientHeight,
    vv?.height ?? 0,
    1,
  )

  return { width: Math.round(width), height: Math.round(height) }
}

function updateOrthographicFrustum(camera: THREE.OrthographicCamera, width: number, height: number) {
  const halfW = width / 2 + GRID_BUFFER
  const halfH = height / 2 + GRID_BUFFER
  camera.left = -halfW
  camera.right = halfW
  camera.top = halfH
  camera.bottom = -halfH
  camera.updateProjectionMatrix()
}

function createCircleTexture() {
  const textureCanvas = document.createElement("canvas")
  textureCanvas.width = 32
  textureCanvas.height = 32

  const ctx = textureCanvas.getContext("2d")
  if (!ctx) return new THREE.CanvasTexture(textureCanvas)

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)")
  gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.8)")
  gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.3)")
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)

  return new THREE.CanvasTexture(textureCanvas)
}

function clampMultiplier(value: number | undefined, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function disposeParticleSystems(scene: THREE.Scene, systems: ParticleSystem[]) {
  systems.forEach((system) => {
    system.material.uniforms.uTexture.value?.dispose()
    system.particles.geometry.dispose()
    system.material.dispose()
    scene.remove(system.particles)
  })
}

export function MonochromeDotsBackground({
  colors,
  speed = 1.5,
  direction,
  density = 1,
  pointSize = 1,
  opacity = 1,
  wrapperClassName,
  wrapperStyle,
  className,
  style,
  useDocumentBodyPortal = false,
}: MonochromeDotsBackgroundProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleSystemsRef = useRef<ParticleSystem[]>([])
  const speedMultiplierRef = useRef(1.5)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!useDocumentBodyPortal) {
      setPortalTarget(null)
      return
    }
    setPortalTarget(document.body)
  }, [useDocumentBodyPortal])

  const resolvedColors = useMemo(
    () => ({
      start: colors?.start ?? DEFAULT_COLORS.start,
      mid: colors?.mid ?? DEFAULT_COLORS.mid,
      end: colors?.end ?? DEFAULT_COLORS.end,
    }),
    [colors?.start, colors?.mid, colors?.end],
  )

  const flowDirection = useMemo(
    () => ({
      x: direction?.x ?? 1,
      y: direction?.y ?? 0.2,
    }),
    [direction?.x, direction?.y],
  )

  const runtimeConfig = useMemo(
    () => ({
      colors: resolvedColors,
      densityMultiplier: clampMultiplier(density, 1, 0.05, 3),
      pointSizeMultiplier: clampMultiplier(pointSize, 1, 0.2, 5),
      opacityMultiplier: clampMultiplier(opacity, 1, 0, 3),
      flowDirection,
    }),
    [density, flowDirection, opacity, pointSize, resolvedColors],
  )

  const runtimeConfigRef = useRef(runtimeConfig)

  useEffect(() => {
    runtimeConfigRef.current = runtimeConfig
  }, [runtimeConfig])

  useEffect(() => {
    speedMultiplierRef.current = clampMultiplier(speed, 1.5, 0.05, 10)

    particleSystemsRef.current.forEach((system) => {
      const { colors: activeColors, pointSizeMultiplier, opacityMultiplier, flowDirection: activeDirection } =
        runtimeConfig

      system.material.uniforms.uColorStart.value.set(activeColors.start)
      system.material.uniforms.uColorMid.value.set(activeColors.mid)
      system.material.uniforms.uColorEnd.value.set(activeColors.end)
      system.material.uniforms.uPointSizeMultiplier.value = pointSizeMultiplier
      system.material.uniforms.uOpacityMultiplier.value = opacityMultiplier
      system.material.uniforms.uFlowDirection.value.set(activeDirection.x, activeDirection.y)
    })
  }, [
    speed,
    runtimeConfig,
  ])

  const portalReady = useDocumentBodyPortal ? portalTarget !== null : true

  const mergedWrapperStyle = useMemo(
    () => ({ ...DEFAULT_WRAPPER_STYLE, ...wrapperStyle }),
    [wrapperStyle],
  )

  const mergedCanvasStyle = useMemo(
    () => ({ ...DEFAULT_CANVAS_STYLE, ...style }),
    [style],
  )

  useEffect(() => {
    if (!portalReady) return

    const canvas = canvasRef.current
    if (!canvas) return

    let isVisible = true
    const handleVisibilityChange = () => {
      isVisible = !document.hidden
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000)
    camera.position.set(0, 0, 500)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      stencil: false,
      depth: false,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false,
      powerPreference: "high-performance",
    })

    renderer.toneMapping = THREE.NoToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const gl = renderer.getContext()
    if (!gl || gl.isContextLost?.()) {
      console.error("MonochromeDotsBackground: WebGL context unavailable")
    }

    const buildParticleSystems = () => {
      disposeParticleSystems(scene, particleSystemsRef.current)
      particleSystemsRef.current = []

      const { width, height } = readDrawableCssSize(canvas)
      const dpr = window.devicePixelRatio || 1
      const { colors: activeColors, densityMultiplier, pointSizeMultiplier, opacityMultiplier, flowDirection: activeDirection } =
        runtimeConfigRef.current

      renderer.setPixelRatio(Math.min(dpr, 2))
      renderer.setSize(width, height, false)
      updateOrthographicFrustum(camera, width, height)

      const originX = -width / 2
      const originY = height / 2
      const maxDistance = Math.sqrt(Math.pow(width / 2 - originX, 2) + Math.pow(-height / 2 - originY, 2))

      const isMobile = width < 768
      const isLowPerformance = isMobile || dpr < 2
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

      layers.forEach((config) => {
        const cols = Math.ceil((width + GRID_BUFFER * 2) / config.spacing)
        const rows = Math.ceil((height + GRID_BUFFER * 2) / config.spacing)
        const particleCount = cols * rows
        const keepProbability = Math.min(1, Math.max(0, config.density * densityMultiplier))

        const positions = new Float32Array(particleCount * 3)
        const delays = new Float32Array(particleCount)
        const distances = new Float32Array(particleCount)

        let index = 0

        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            if (Math.random() > keepProbability) continue

            const x = i * config.spacing - width / 2 - GRID_BUFFER
            const y = j * config.spacing - height / 2 - GRID_BUFFER
            const z = config.layer * -10

            positions[index * 3] = x
            positions[index * 3 + 1] = y
            positions[index * 3 + 2] = z

            distances[index] = Math.sqrt(Math.pow(x - originX, 2) + Math.pow(y - originY, 2))
            delays[index] = Math.random() * Math.PI * 0.5
            index++
          }
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", new THREE.BufferAttribute(positions.slice(0, index * 3), 3))
        geometry.setAttribute("delay", new THREE.BufferAttribute(delays.slice(0, index), 1))
        geometry.setAttribute("particleDist", new THREE.BufferAttribute(distances.slice(0, index), 1))

        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uTexture: { value: createCircleTexture() },
            uWaveLayer: { value: config.layer },
            uMaxDistance: { value: maxDistance },
            uPointSizeMultiplier: { value: pointSizeMultiplier },
            uOpacityMultiplier: { value: opacityMultiplier },
            uFlowDirection: { value: new THREE.Vector2(activeDirection.x, activeDirection.y) },
            uColorStart: { value: new THREE.Color(activeColors.start) },
            uColorMid: { value: new THREE.Color(activeColors.mid) },
            uColorEnd: { value: new THREE.Color(activeColors.end) },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthTest: false,
          depthWrite: false,
        })

        const particles = new THREE.Points(geometry, material)
        particles.frustumCulled = false
        scene.add(particles)
        particleSystemsRef.current.push({ particles, material })
      })
    }

    let resizeFrameId = 0

    const scheduleRebuild = () => {
      if (resizeFrameId) {
        cancelAnimationFrame(resizeFrameId)
      }
      resizeFrameId = requestAnimationFrame(() => {
        buildParticleSystems()
        renderer.render(scene, camera)
      })
    }

    const handleResize = () => {
      scheduleRebuild()
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        buildParticleSystems()
        renderer.render(scene, camera)
      })
    })

    window.addEventListener("resize", handleResize)
    const visualViewport = window.visualViewport
    visualViewport?.addEventListener("resize", handleResize)

    const wrapper = wrapperRef.current
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => scheduleRebuild())
        : null
    resizeObserver?.observe(canvas)
    if (wrapper) resizeObserver?.observe(wrapper)
    resizeObserver?.observe(document.documentElement)

    let animationFrameId = 0
    let lastFrameTime = performance.now()
    let isAnimating = true

    function animate(currentTime: number) {
      if (!isAnimating) return

      animationFrameId = requestAnimationFrame(animate)
      if (!isVisible) return

      const deltaTime = (currentTime - lastFrameTime) / 1000
      lastFrameTime = currentTime
      const cappedDelta = Math.min(deltaTime, 0.1)

      particleSystemsRef.current.forEach((system) => {
        system.material.uniforms.uTime.value += cappedDelta * speedMultiplierRef.current
      })

      renderer.render(scene, camera)
    }

    animate(performance.now())

    return () => {
      isAnimating = false
      cancelAnimationFrame(animationFrameId)
      if (resizeFrameId) {
        cancelAnimationFrame(resizeFrameId)
      }
      window.removeEventListener("resize", handleResize)
      visualViewport?.removeEventListener("resize", handleResize)
      resizeObserver?.disconnect()
      document.removeEventListener("visibilitychange", handleVisibilityChange)

      disposeParticleSystems(scene, particleSystemsRef.current)
      particleSystemsRef.current = []
      renderer.renderLists.dispose()
      renderer.dispose()
      scene.clear()
    }
  }, [density, portalReady, useDocumentBodyPortal])

  const tree = (
    <div ref={wrapperRef} className={wrapperClassName} style={mergedWrapperStyle}>
      <canvas ref={canvasRef} className={className} style={mergedCanvasStyle} />
    </div>
  )

  if (useDocumentBodyPortal) {
    if (!portalTarget) return null
    return createPortal(tree, portalTarget)
  }

  return tree
}
