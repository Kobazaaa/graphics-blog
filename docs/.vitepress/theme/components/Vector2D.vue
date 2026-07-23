<script setup lang="ts">
import { computed } from 'vue'

export interface VectorSpec2D {
  to: [number, number]
  from?: [number, number]
  color?: string
  label?: string
  dashed?: boolean
  line?: boolean
  labelOffset?: [number, number]
  labelScale?: number
}

export interface PointSpec2D {
  at: [number, number]
  color?: string
  label?: string
  labelOffset?: [number, number]
  labelScale?: number
  size?: number
}

const props = withDefaults(
  defineProps<{
    vectors?: VectorSpec2D[]
    points?: PointSpec2D[]
    extent?: number
    grid?: boolean
    axes?: boolean
    height?: string
  }>(),
  { vectors: () => [], points: () => [], extent: 5, grid: true, axes: true, height: '360px' },
)

const extent = computed(() => {
  const vectorCoords = props.vectors.reduce((max, spec) => {
    const coords = [spec.to, ...(spec.from ? [spec.from] : [])]
    return Math.max(max, ...coords.flat().map(Math.abs))
  }, 0)
  const pointCoords = props.points.reduce((max, spec) => Math.max(max, ...spec.at.map(Math.abs)), 0)
  const farthestCoord = Math.max(vectorCoords, pointCoords)
  return Math.max(props.extent, farthestCoord * 1.15)
})

const DEFAULT_POINT_COLOR = 'var(--vp-c-brand-1)'

const renderPoints = computed(() =>
  props.points.map((spec, index) => {
    const [labelOffsetX, labelOffsetY] = spec.labelOffset ?? [0, 0]
    return {
      id: `gb-vector2d-point-${index}`,
      color: spec.color ?? DEFAULT_POINT_COLOR,
      label: spec.label,
      labelScale: spec.labelScale ?? 1,
      radius: (spec.size ?? 1) * extent.value * 0.012,
      at: { x: spec.at[0], y: -spec.at[1] },
      labelAt: {
        x: spec.at[0] + extent.value * 0.05 + labelOffsetX,
        y: -(spec.at[1] + extent.value * 0.05 + labelOffsetY),
      },
    }
  }),
)

const gridExtent = computed(() => Math.ceil(extent.value))
const viewBox = computed(() => {
  const e = gridExtent.value
  return `${-e} ${-e} ${e * 2} ${e * 2}`
})
const gridLines = computed(() => {
  const e = gridExtent.value
  const lines = []
  for (let i = -e; i <= e; i++) lines.push(i)
  return lines
})

const DEFAULT_COLOR = 'var(--vp-c-brand-1)'

const renderVectors = computed(() =>
  props.vectors
    .map((spec, index) => {
      const from = spec.from ?? [0, 0]
      const to = spec.to
      const dx = to[0] - from[0]
      const dy = to[1] - from[1]
      const length = Math.hypot(dx, dy)
      if (length < 1e-6) return null
      const dir = { x: dx / length, y: dy / length }
      const isLine = !!spec.line

      const headLength = isLine ? 0 : Math.min(extent.value * 0.16, length * 0.3)
      const headWidth = headLength * 0.8
      const shaftEnd = isLine
        ? { x: to[0], y: to[1] }
        : {
            x: to[0] - dir.x * headLength,
            y: to[1] - dir.y * headLength,
          }
      const [labelOffsetX, labelOffsetY] = spec.labelOffset ?? [0, 0]

      return {
        id: `gb-vector2d-arrow-${index}`,
        color: spec.color ?? DEFAULT_COLOR,
        dashed: !!spec.dashed,
        line: isLine,
        label: spec.label,
        labelScale: spec.labelScale ?? 1,
        // Flip y: SVG's y-axis grows downward, math is y-up.
        from: { x: from[0], y: -from[1] },
        shaftEnd: { x: shaftEnd.x, y: -shaftEnd.y },
        to: { x: to[0], y: -to[1] },
        labelAt: {
          x: to[0] + dir.x * extent.value * 0.1 + labelOffsetX,
          y: -(to[1] + dir.y * extent.value * 0.1 + labelOffsetY),
        },
        headLength,
        headWidth,
      }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null),
)
</script>

<template>
  <div class="gb-vector2d" :style="{ height }">
    <svg class="gb-vector2d-svg" :viewBox="viewBox" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker
          v-for="v in renderVectors.filter((v) => !v.line)"
          :id="v.id"
          :key="v.id"
          markerUnits="userSpaceOnUse"
          :markerWidth="v.headLength"
          :markerHeight="v.headWidth"
          refX="0"
          :refY="v.headWidth / 2"
          orient="auto"
        >
          <path :d="`M0 0 L${v.headLength} ${v.headWidth / 2} L0 ${v.headWidth} Z`" :fill="v.color" />
        </marker>
      </defs>

      <template v-if="grid">
        <line
          v-for="g in gridLines"
          :key="`v${g}`"
          :x1="g"
          :y1="-gridExtent"
          :x2="g"
          :y2="gridExtent"
          class="gb-vector2d-grid"
        />
        <line
          v-for="g in gridLines"
          :key="`h${g}`"
          :x1="-gridExtent"
          :y1="g"
          :x2="gridExtent"
          :y2="g"
          class="gb-vector2d-grid"
        />
      </template>

      <template v-if="axes">
        <line :x1="-gridExtent" y1="0" :x2="gridExtent" y2="0" class="gb-vector2d-axis" />
        <line x1="0" :y1="-gridExtent" x2="0" :y2="gridExtent" class="gb-vector2d-axis" />
        <text class="gb-vector2d-axis-label" :x="gridExtent * 1.05" y="0" dy="4">x</text>
        <text class="gb-vector2d-axis-label" x="0" :y="-gridExtent * 1.05" dx="4">y</text>
      </template>

      <g v-for="v in renderVectors" :key="v.id">
        <line
          :x1="v.from.x"
          :y1="v.from.y"
          :x2="v.shaftEnd.x"
          :y2="v.shaftEnd.y"
          class="gb-vector2d-arrow"
          :class="{ 'gb-vector2d-arrow--dashed': v.dashed }"
          :style="{ stroke: v.color }"
          :marker-end="v.line ? undefined : `url(#${v.id})`"
        />
        <text
          v-if="v.label"
          class="gb-vector2d-label"
          :x="v.labelAt.x"
          :y="v.labelAt.y"
          :style="{ fill: v.color, fontSize: `calc(5.5% * ${v.labelScale})` }"
        >
          {{ v.label }}
        </text>
      </g>

      <g v-for="p in renderPoints" :key="p.id">
        <circle :cx="p.at.x" :cy="p.at.y" :r="p.radius" :style="{ fill: p.color }" />
        <text
          v-if="p.label"
          class="gb-vector2d-label"
          :x="p.labelAt.x"
          :y="p.labelAt.y"
          :style="{ fill: p.color, fontSize: `calc(5.5% * ${p.labelScale})` }"
        >
          {{ p.label }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style>
.gb-vector2d {
  position: relative;
  margin: 1.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.gb-vector2d-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.gb-vector2d-grid {
  stroke: var(--vp-c-divider);
  stroke-width: 0.3%;
  opacity: 0.55;
}

.gb-vector2d-axis {
  stroke: var(--vp-c-text-3);
  stroke-width: 0.5%;
}

.gb-vector2d-axis-label {
  font-family: var(--vp-font-family-mono);
  font-size: 4.5%;
  font-weight: 500;
  fill: var(--vp-c-text-2);
  user-select: none;
}

.gb-vector2d-arrow {
  stroke-width: 1%;
  fill: none;
}

.gb-vector2d-arrow--dashed {
  stroke-dasharray: 3% 2.2%;
}

.gb-vector2d-label {
  font-family: var(--vp-font-family-mono);
  font-size: 5.5%;
  font-weight: 600;
  paint-order: stroke;
  stroke: var(--vp-c-bg);
  stroke-width: 4%;
  stroke-linejoin: round;
  user-select: none;
}
</style>
