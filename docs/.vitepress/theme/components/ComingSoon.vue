<script setup lang="ts">
// Placeholder banner for chapters that haven't been written yet.
import { useSpinningShape } from '../composables/useSpinningShape'

const CUBE_FACES = ['front', 'back', 'right', 'left', 'top', 'bottom']
const PYRAMID_ROTATIONS = [0, 90, 180, 270]
const SPHERE_MERIDIANS = [0, 45, 90, 135]

const { shape, rotateX, rotateY, dragging, onPointerDown, onPointerMove, onPointerUp } = useSpinningShape()
</script>

<template>
  <div class="gb-coming-soon" role="note" aria-label="This part is still being written">
    <div
      class="gb-coming-soon-scene"
      :class="{ 'gb-coming-soon-scene--dragging': dragging }"
      aria-hidden="true"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div
        class="gb-coming-soon-shape"
        :class="`gb-coming-soon-shape--${shape}`"
        :style="{ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }"
      >
        <template v-if="shape === 'cube'">
          <div
            v-for="face in CUBE_FACES"
            :key="face"
            :class="`gb-coming-soon-face gb-coming-soon-face--${face}`"
          />
        </template>

        <template v-else-if="shape === 'pyramid'">
          <div
            v-for="deg in PYRAMID_ROTATIONS"
            :key="deg"
            class="gb-coming-soon-pyramid-side"
            :style="{ transform: `rotateY(${deg}deg) translateZ(32px) rotateX(21deg)` }"
          >
            <svg viewBox="0 0 64 90" preserveAspectRatio="none">
              <polygon points="32,0 0,90 64,90" />
            </svg>
          </div>
          <div class="gb-coming-soon-face gb-coming-soon-face--bottom" />
        </template>

        <template v-else>
          <div
            v-for="deg in SPHERE_MERIDIANS"
            :key="deg"
            class="gb-coming-soon-ring"
            :style="{ transform: `rotateY(${deg}deg)` }"
          />
          <div class="gb-coming-soon-ring" style="transform: rotateX(90deg)" />
        </template>
      </div>
      <div class="gb-coming-soon-shadow" />
    </div>

    <div class="gb-coming-soon-copy">
      <p class="gb-coming-soon-eyebrow">In the works</p>
      <p class="gb-coming-soon-title">This part hasn't been written yet.</p>
      <p class="gb-coming-soon-desc">Check back soon, or look around elsehwere! (or give the shape a spin ;p )</p>
    </div>
  </div>
</template>

<style>
.gb-coming-soon {
  display: flex;
  align-items: center;
  gap: 44px;
  margin: 2rem 0;
  padding: 24px 28px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
}

.gb-coming-soon-scene {
  position: relative;
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  perspective: 400px;
  cursor: grab;
  touch-action: none;
  user-select: none;
  transition: transform 0.15s ease;
}

.gb-coming-soon-scene:active {
  cursor: grabbing;
}

.gb-coming-soon-scene--dragging {
  transform: scale(1.08);
}

.gb-coming-soon-shape {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.gb-coming-soon-shadow {
  position: absolute;
  left: 50%;
  bottom: -24px;
  width: 44px;
  height: 10px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(ellipse, var(--vp-c-brand-soft) 0%, transparent 72%);
  filter: blur(1px);
  pointer-events: none;
}

.gb-coming-soon-face {
  position: absolute;
  inset: 0;
  border: 1.5px solid var(--vp-c-brand-1);
  background-color: var(--vp-c-brand-soft);
}

.gb-coming-soon-face--front {
  transform: translateZ(32px);
}

.gb-coming-soon-face--back {
  transform: rotateY(180deg) translateZ(32px);
}

.gb-coming-soon-face--right {
  transform: rotateY(90deg) translateZ(32px);
}

.gb-coming-soon-face--left {
  transform: rotateY(-90deg) translateZ(32px);
}

.gb-coming-soon-face--top {
  transform: rotateX(90deg) translateZ(32px);
}

.gb-coming-soon-face--bottom {
  transform: rotateX(-90deg) translateZ(32px);
}

.gb-coming-soon-pyramid-side {
  position: absolute;
  top: -26px;
  left: 0;
  width: 64px;
  height: 90px;
  border: none;
  background: none;
  transform-origin: 50% 100%;
}

.gb-coming-soon-pyramid-side svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.gb-coming-soon-pyramid-side polygon {
  fill: var(--vp-c-brand-soft);
  stroke: var(--vp-c-brand-1);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.gb-coming-soon-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid var(--vp-c-brand-1);
}

.gb-coming-soon-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gb-coming-soon-eyebrow {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
}

.vp-doc .gb-coming-soon-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.vp-doc .gb-coming-soon-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

@media (max-width: 480px) {
  .gb-coming-soon {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
}
</style>
