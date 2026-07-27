<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'

export interface VectorSpec {
  to: [number, number, number]
  from?: [number, number, number]
  color?: string
  label?: string
  dashed?: boolean
  line?: boolean
  labelOffset?: [number, number, number]
  labelScale?: number
}

export interface PointSpec {
  at: [number, number, number]
  color?: string
  label?: string
  labelOffset?: [number, number, number]
  labelScale?: number
  size?: number
}

export interface AngleSpec {
  origin: [number, number, number]
  from: [number, number, number]
  to: [number, number, number]
  radius?: number
  color?: string
  dashed?: boolean
  label?: string
  labelOffset?: [number, number, number]
  labelScale?: number
  fill?: boolean | string
  fillOpacity?: number
}

const props = withDefaults(
  defineProps<{
    vectors?: VectorSpec[]
    points?: PointSpec[]
    angles?: AngleSpec[]
    extent?: number
    grid?: boolean
    axes?: boolean
    height?: string
  }>(),
  { vectors: () => [], points: () => [], angles: () => [], extent: 5, grid: true, axes: true, height: '360px' },
)

// Rendered in a left-handed system: math (x, y, z) maps to scene
// (x, y, -z), so positive z points away from the default camera.
function toScene(v: [number, number, number]) {
  return new THREE.Vector3(v[0], v[1], -v[2])
}

function toSceneVec(v: THREE.Vector3) {
  return new THREE.Vector3(v.x, v.y, -v.z)
}

const container = ref<HTMLDivElement | null>(null)

let controls: OrbitControls | null = null
let webglRenderer: THREE.WebGLRenderer | null = null
let css2dRenderer: CSS2DRenderer | null = null
let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null
let rafId = 0
const lineMaterials: LineMaterial[] = []

function themeColor(varName: string, fallbackHex: number) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  if (!raw) return new THREE.Color(fallbackHex)
  try {
    return new THREE.Color(raw)
  } catch {
    return new THREE.Color(fallbackHex)
  }
}

onMounted(() => {
  const el = container.value
  if (!el) return

  const farthestVectorCoord = props.vectors.reduce((max, spec) => {
    const coords = [spec.to, ...(spec.from ? [spec.from] : [])]
    const localMax = Math.max(...coords.flat().map(Math.abs))
    return Math.max(max, localMax)
  }, 0)
  const farthestPointCoord = props.points.reduce((max, spec) => Math.max(max, ...spec.at.map(Math.abs)), 0)
  const farthestAngleCoord = props.angles.reduce((max, spec) => {
    const coords = [spec.origin, spec.from, spec.to]
    return Math.max(max, ...coords.flat().map(Math.abs))
  }, 0)
  const extent = Math.max(
    props.extent,
    farthestVectorCoord * 1.15,
    farthestPointCoord * 1.15,
    farthestAngleCoord * 1.15,
  )

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)

  webglRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  el.appendChild(webglRenderer.domElement)

  css2dRenderer = new CSS2DRenderer()
  css2dRenderer.domElement.style.position = 'absolute'
  css2dRenderer.domElement.style.top = '0'
  css2dRenderer.domElement.style.left = '0'
  css2dRenderer.domElement.style.pointerEvents = 'none'
  el.appendChild(css2dRenderer.domElement)

  const initialWidth = el.clientWidth || 1
  const initialHeight = el.clientHeight || 1
  camera.aspect = initialWidth / initialHeight
  camera.updateProjectionMatrix()

  const contentPoints = [
    ...props.vectors.flatMap((spec) => [toScene(spec.to), toScene(spec.from ?? [0, 0, 0])]),
    ...props.points.map((spec) => toScene(spec.at)),
    ...props.angles.flatMap((spec) => [toScene(spec.origin), toScene(spec.from), toScene(spec.to)]),
  ]
  const bounds = new THREE.Box3()
  if (contentPoints.length) contentPoints.forEach((p) => bounds.expandByPoint(p))
  else bounds.set(new THREE.Vector3(-extent, -extent, -extent), new THREE.Vector3(extent, extent, extent))
  const sphere = new THREE.Sphere()
  bounds.getBoundingSphere(sphere)
  const fitRadius = Math.max(sphere.radius, extent * 0.15)

  const FIT_MARGIN = 1.1
  const halfFovV = THREE.MathUtils.degToRad(camera.fov) / 2
  const halfFovH = Math.atan(Math.tan(halfFovV) * camera.aspect)
  const fitDistance = (fitRadius / Math.sin(Math.min(halfFovV, halfFovH))) * FIT_MARGIN

  const viewDir = new THREE.Vector3(1, 0.75, 1).normalize()
  camera.position.copy(sphere.center).addScaledVector(viewDir, fitDistance)

  controls = new OrbitControls(camera, webglRenderer.domElement)
  controls.target.copy(sphere.center)
  controls.enableDamping = false
  controls.minDistance = Math.min(extent * 0.6, fitDistance * 0.3)
  controls.maxDistance = Math.max(extent * 4, fitDistance * 3)
  controls.update()

  const dividerColor = themeColor('--vp-c-divider', 0x999999)
  const mutedColor = themeColor('--vp-c-text-3', 0x888888)
  const brandColor = themeColor('--vp-c-brand-1', 0xe0793c)

  function makeLineMaterial(color: THREE.Color, linewidth: number, opacity = 1, dashed = false) {
    const material = new LineMaterial({
      color: color.getHex(),
      linewidth,
      transparent: opacity < 1,
      opacity,
      dashed,
      dashSize: 0.18,
      gapSize: 0.14,
    })
    material.resolution.set(initialWidth, initialHeight)
    lineMaterials.push(material)
    return material
  }

  let gridLine: LineSegments2 | null = null
  let gridMaterial: LineMaterial | null = null
  if (props.grid) {
    const gridExtent = Math.ceil(extent)
    const step = 1
    const positions: number[] = []
    for (let i = -gridExtent; i <= gridExtent; i += step) {
      positions.push(-gridExtent, 0, i, gridExtent, 0, i)
      positions.push(i, 0, -gridExtent, i, 0, gridExtent)
    }
    const geometry = new LineSegmentsGeometry().setPositions(positions)
    gridMaterial = makeLineMaterial(dividerColor, 1.4, 0.3)
    gridLine = new LineSegments2(geometry, gridMaterial)
    scene.add(gridLine)
  }

  const axisLines: Line2[] = []
  const axisMaterials: LineMaterial[] = []
  if (props.axes) {
    const axisDefs: Array<{ dir: [number, number, number]; label: string }> = [
      { dir: [1, 0, 0], label: 'x' },
      { dir: [0, 1, 0], label: 'y' },
      { dir: [0, 0, 1], label: 'z' },
    ]
    for (const { dir, label } of axisDefs) {
      const from = toScene([-dir[0] * extent, -dir[1] * extent, -dir[2] * extent])
      const to = toScene([dir[0] * extent, dir[1] * extent, dir[2] * extent])
      const geometry = new LineGeometry().setPositions([from.x, from.y, from.z, to.x, to.y, to.z])
      const material = makeLineMaterial(mutedColor, 1.6)
      const line = new Line2(geometry, material)
      line.computeLineDistances()
      scene.add(line)
      axisLines.push(line)
      axisMaterials.push(material)

      const labelDiv = document.createElement('div')
      labelDiv.className = 'gb-vector3d-axis-label'
      labelDiv.textContent = label
      const labelObj = new CSS2DObject(labelDiv)
      labelObj.position.copy(toScene([dir[0] * extent * 1.08, dir[1] * extent * 1.08, dir[2] * extent * 1.08]))
      scene.add(labelObj)
    }
  }

  const arrowGroup = new THREE.Group()
  scene.add(arrowGroup)

  for (const spec of props.vectors) {
    const from = toScene(spec.from ?? [0, 0, 0])
    const to = toScene(spec.to)
    const delta = to.clone().sub(from)
    const length = delta.length()
    if (length < 1e-6) continue
    const dir = delta.clone().normalize()
    const color = spec.color ? new THREE.Color(spec.color) : brandColor.clone()

    if (spec.line) {
      const geometry = new LineGeometry().setPositions([from.x, from.y, from.z, to.x, to.y, to.z])
      const material = makeLineMaterial(color, 2.4, 1, !!spec.dashed)
      const segment = new Line2(geometry, material)
      segment.computeLineDistances()
      arrowGroup.add(segment)
    } else {
      const headLength = Math.min(extent * 0.08, length * 0.3)
      const headWidth = headLength * 0.5
      const arrow = new THREE.ArrowHelper(dir, from, length, color.getHex(), headLength, headWidth)

      const oldLine = arrow.line
      const shaftGeometry = new LineGeometry().setPositions([0, 0, 0, 0, 1, 0])
      const shaftMaterial = makeLineMaterial(color, 2.4, 1, !!spec.dashed)
      const shaft = new Line2(shaftGeometry, shaftMaterial)
      shaft.scale.copy(oldLine.scale)
      shaft.computeLineDistances()
      arrow.remove(oldLine)
      arrow.add(shaft)
      arrow.line = shaft as unknown as THREE.Line

      arrowGroup.add(arrow)
    }

    if (spec.label) {
      const labelDiv = document.createElement('div')
      labelDiv.className = 'gb-vector3d-label'
      labelDiv.style.color = `#${color.getHexString()}`
      if (spec.labelScale) labelDiv.style.fontSize = `${12.5 * spec.labelScale}px`
      labelDiv.textContent = spec.label
      const labelObj = new CSS2DObject(labelDiv)
      labelObj.position.copy(to).addScaledVector(dir, extent * 0.06)
      if (spec.labelOffset) labelObj.position.add(toScene(spec.labelOffset))
      scene.add(labelObj)
    }
  }

  const pointGroup = new THREE.Group()
  scene.add(pointGroup)

  for (const spec of props.points) {
    const at = toScene(spec.at)
    const color = spec.color ? new THREE.Color(spec.color) : brandColor.clone()
    const radius = (spec.size ?? 1) * extent * 0.02

    const geometry = new THREE.SphereGeometry(radius, 16, 16)
    const material = new THREE.MeshBasicMaterial({ color })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(at)
    pointGroup.add(mesh)

    if (spec.label) {
      const labelDiv = document.createElement('div')
      labelDiv.className = 'gb-vector3d-label'
      labelDiv.style.color = `#${color.getHexString()}`
      if (spec.labelScale) labelDiv.style.fontSize = `${12.5 * spec.labelScale}px`
      labelDiv.textContent = spec.label
      const labelObj = new CSS2DObject(labelDiv)
      labelObj.position.copy(at)
      if (spec.labelOffset) labelObj.position.add(toScene(spec.labelOffset))
      scene.add(labelObj)
    }
  }

  const angleGroup = new THREE.Group()
  scene.add(angleGroup)

  for (const spec of props.angles) {
    const originMath = new THREE.Vector3(...spec.origin)
    const fromDelta = new THREE.Vector3(...spec.from).sub(originMath)
    const toDelta = new THREE.Vector3(...spec.to).sub(originMath)
    const len1 = fromDelta.length()
    const len2 = toDelta.length()
    if (len1 < 1e-6 || len2 < 1e-6) continue

    const u = fromDelta.clone().normalize()
    const d2 = toDelta.clone().normalize()
    const cosTheta = THREE.MathUtils.clamp(u.dot(d2), -1, 1)
    const theta = Math.acos(cosTheta)
    if (theta < 1e-4) continue

    let v = d2.clone().sub(u.clone().multiplyScalar(u.dot(d2)))
    if (v.lengthSq() < 1e-10) {
      const helper = Math.abs(u.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
      v = helper.clone().sub(u.clone().multiplyScalar(u.dot(helper)))
    }
    v.normalize()

    const radius = spec.radius ?? Math.min(extent * 0.25, len1 * 0.6, len2 * 0.6)
    const color = spec.color ? new THREE.Color(spec.color) : brandColor.clone()
    const segments = 48

    const arcPositions: number[] = []
    for (let i = 0; i <= segments; i++) {
      const t = (theta * i) / segments
      const pointMath = originMath.clone().addScaledVector(u, radius * Math.cos(t)).addScaledVector(v, radius * Math.sin(t))
      const pointScene = toSceneVec(pointMath)
      arcPositions.push(pointScene.x, pointScene.y, pointScene.z)
    }
    const arcGeometry = new LineGeometry().setPositions(arcPositions)
    const arcMaterial = makeLineMaterial(color, 2.4, 1, !!spec.dashed)
    const arcLine = new Line2(arcGeometry, arcMaterial)
    arcLine.computeLineDistances()
    angleGroup.add(arcLine)

    if (spec.fill) {
      const fillColor = spec.fill === true ? color.clone() : new THREE.Color(spec.fill)
      const originScene = toSceneVec(originMath)
      const vertexPositions = [originScene.x, originScene.y, originScene.z, ...arcPositions]
      const indices: number[] = []
      for (let i = 1; i <= segments; i++) indices.push(0, i, i + 1)
      const fillGeometry = new THREE.BufferGeometry()
      fillGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertexPositions, 3))
      fillGeometry.setIndex(indices)
      const fillMaterial = new THREE.MeshBasicMaterial({
        color: fillColor,
        transparent: true,
        opacity: spec.fillOpacity ?? 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      angleGroup.add(new THREE.Mesh(fillGeometry, fillMaterial))
    }

    if (spec.label) {
      const midT = theta / 2
      const midMath = originMath.clone().addScaledVector(u, radius * Math.cos(midT)).addScaledVector(v, radius * Math.sin(midT))
      const outward = midMath.clone().sub(originMath).normalize()
      const labelPointMath = midMath.clone().addScaledVector(outward, extent * 0.06)

      const labelDiv = document.createElement('div')
      labelDiv.className = 'gb-vector3d-label'
      labelDiv.style.color = `#${color.getHexString()}`
      if (spec.labelScale) labelDiv.style.fontSize = `${12.5 * spec.labelScale}px`
      labelDiv.textContent = spec.label
      const labelObj = new CSS2DObject(labelDiv)
      labelObj.position.copy(toSceneVec(labelPointMath))
      if (spec.labelOffset) labelObj.position.add(toScene(spec.labelOffset))
      scene.add(labelObj)
    }
  }

  function applySize() {
    if (!webglRenderer || !css2dRenderer) return
    const width = el.clientWidth || 1
    const height = el.clientHeight || 1
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    webglRenderer.setSize(width, height)
    css2dRenderer.setSize(width, height)
    for (const material of lineMaterials) material.resolution.set(width, height)
  }
  applySize()

  const tick = () => {
    controls?.update()
    if (webglRenderer) webglRenderer.render(scene, camera)
    if (css2dRenderer) css2dRenderer.render(scene, camera)
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)

  resizeObserver = new ResizeObserver(applySize)
  resizeObserver.observe(el)

  themeObserver = new MutationObserver(() => {
    const nextDivider = themeColor('--vp-c-divider', 0x999999)
    const nextMuted = themeColor('--vp-c-text-3', 0x888888)
    if (gridMaterial) gridMaterial.color = nextDivider
    for (const material of axisMaterials) material.color = nextMuted
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  controls?.dispose()
  webglRenderer?.dispose()
  for (const material of lineMaterials) material.dispose()
  if (webglRenderer && container.value?.contains(webglRenderer.domElement)) {
    container.value.removeChild(webglRenderer.domElement)
  }
  if (css2dRenderer && container.value?.contains(css2dRenderer.domElement)) {
    container.value.removeChild(css2dRenderer.domElement)
  }
})
</script>

<template>
  <div ref="container" class="gb-vector3d" :style="{ height }"></div>
</template>

<style>
.gb-vector3d {
  position: relative;
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  cursor: grab;
}

.gb-vector3d:active {
  cursor: grabbing;
}

.gb-vector3d-label,
.gb-vector3d-axis-label {
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  font-weight: 600;
  transform: translate(11px, -11px);
  white-space: nowrap;
  user-select: none;
}

.gb-vector3d-label {
  text-shadow:
    0 0 3px var(--vp-c-bg),
    0 0 3px var(--vp-c-bg),
    0 0 5px var(--vp-c-bg),
    0 0 5px var(--vp-c-bg);
}

.gb-vector3d-axis-label {
  color: var(--vp-c-text-2);
  font-weight: 500;
}
</style>
