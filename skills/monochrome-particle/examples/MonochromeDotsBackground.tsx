"use client"

import { useEffect, useMemo, useRef, type CSSProperties } from "react"
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
  className?: string
  style?: CSSProperties
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
  attribute float distance;
  varying float vAlpha;
  varying float vDistanceRatio;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    vec2 flow = length(uFlowDirection) < 0.001 ? vec2(1.0, 0.0) : normalize(uFlowDirection);
    float directionalDistance = dot(position.xy, flow);

    float layerSpeed = 2.0 + uWaveLayer * 0.3;
    float layerFreq = 0.008 + uWaveLayer * 0.002;

    float wave1 = sin(directionalDistance * layerFreq - uTime * layerSpeed + delay);
    float wave2 = sin(distance * (layerFreq * 1.5) - uTime * (layerSpeed * 1.2) + delay * 0.7);
    float wave3 = sin(directionalDistance * (layerFreq * 0.6) - uTime * (layerSpeed * 0.8) + delay * 1.3);
    float wave4 = cos(distance * (layerFreq * 1.8) - uTime * (layerSpeed * 0.7) + delay * 0.3);

    float pulse = wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.2 + wave4 * 0.1;

    float baseSize = 2.35 + uWaveLayer * 0.55;
    float size = (baseSize + pulse * 2.25) * uPointSizeMultiplier;
    gl_PointSize = max(size, 1.0);

    float baseAlpha = 0.35 + uWaveLayer * 0.07;
    vAlpha = (baseAlpha + (pulse + 1.5) * baseAlpha * 0.55) * uOpacityMultiplier;
    vDistanceRatio = clamp(distance / uMaxDistance, 0.0, 1.0);

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

export function MonochromeDotsBackground({
  colors,
  speed = 1.5,
  direction,
  density = 1,
  pointSize = 1,
  opacity = 1,
  className = "fixed inset-0 h-full w-full -z-10",
  style,
}: MonochromeDotsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const speedMultiplier = clampMultiplier(speed, 1.5, 0.05, 10)
    const densityMultiplier = clampMultiplier(density, 1, 0.05, 3)
    const pointSizeMultiplier = clampMultiplier(pointSize, 1, 0.2, 5)
    const opacityMultiplier = clampMultiplier(opacity, 1, 0, 3)

    let isVisible = true
    const handleVisibilityChange = () => {
      isVisible = !document.hidden
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    camera.position.z = 500

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
      stencil: false,
      depth: false,
      preserveDrawingBuffer: false,
    })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const originX = -window.innerWidth / 2
    const originY = window.innerHeight / 2
    const maxDistance = Math.sqrt(
      Math.pow(window.innerWidth / 2 - originX, 2) + Math.pow(-window.innerHeight / 2 - originY, 2),
    )

    const isMobile = window.innerWidth < 768
    const isLowPerformance = isMobile || window.devicePixelRatio < 2
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

    const colorStart = new THREE.Color(resolvedColors.start)
    const colorMid = new THREE.Color(resolvedColors.mid)
    const colorEnd = new THREE.Color(resolvedColors.end)
    const particleSystems: { particles: THREE.Points; material: THREE.ShaderMaterial }[] = []

    layers.forEach((config) => {
      const buffer = 500
      const cols = Math.ceil((window.innerWidth + buffer * 2) / config.spacing)
      const rows = Math.ceil((window.innerHeight + buffer * 2) / config.spacing)
      const particleCount = cols * rows
      const keepProbability = Math.min(1, Math.max(0, config.density * densityMultiplier))

      const positions = new Float32Array(particleCount * 3)
      const delays = new Float32Array(particleCount)
      const distances = new Float32Array(particleCount)

      let index = 0

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (Math.random() > keepProbability) continue

          const x = i * config.spacing - window.innerWidth / 2 - buffer
          const y = j * config.spacing - window.innerHeight / 2 - buffer
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
      geometry.setAttribute("distance", new THREE.BufferAttribute(distances.slice(0, index), 1))

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
          uFlowDirection: { value: new THREE.Vector2(flowDirection.x, flowDirection.y) },
          uColorStart: { value: colorStart },
          uColorMid: { value: colorMid },
          uColorEnd: { value: colorEnd },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      })

      const particles = new THREE.Points(geometry, material)
      scene.add(particles)
      particleSystems.push({ particles, material })
    })

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

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

      particleSystems.forEach((system) => {
        system.material.uniforms.uTime.value += cappedDelta * speedMultiplier
      })

      renderer.render(scene, camera)
    }

    animate(performance.now())

    return () => {
      isAnimating = false
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("visibilitychange", handleVisibilityChange)

      particleSystems.forEach((system) => {
        system.material.uniforms.uTexture.value?.dispose()
        system.particles.geometry.dispose()
        system.material.dispose()
        scene.remove(system.particles)
      })

      renderer.renderLists.dispose()
      renderer.dispose()
      scene.clear()
    }
  }, [
    resolvedColors.start,
    resolvedColors.mid,
    resolvedColors.end,
    speed,
    flowDirection.x,
    flowDirection.y,
    density,
    pointSize,
    opacity,
  ])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        willChange: "transform",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        perspective: 2000,
        ...style,
      }}
    />
  )
}
