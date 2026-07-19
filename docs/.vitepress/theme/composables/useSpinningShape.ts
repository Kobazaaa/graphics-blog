import { onMounted, onUnmounted, ref } from 'vue'

export const SHAPES = ['cube', 'pyramid', 'sphere'] as const
export type Shape = (typeof SHAPES)[number]

const START_ANGLE: Record<Shape, { x: number; y: number }> = {
  cube: { x: -22, y: 35 },
  pyramid: { x: -20, y: 32 },
  sphere: { x: -22, y: 15 },
}

const SPIN_DEGREES_PER_SECOND = 360 / 9
const DRAG_SENSITIVITY = 0.5
const MIN_TILT = -80
const MAX_TILT = 20
const MAX_FLICK_SPEED = 720
const MOMENTUM_EASE = 0.6
const CLICK_MOVEMENT_THRESHOLD = 6
const CLICK_MAX_DURATION = 500

const clampTilt = (v: number) => Math.min(MAX_TILT, Math.max(MIN_TILT, v))

/**
 * Drag-to-rotate, momentum-spinning shape for the <ComingSoon /> placeholder.
 * A tap (no meaningful drag, released quickly) cycles cube → pyramid → sphere
 * instead of rotating.
 */
export function useSpinningShape() {
  const shape = ref<Shape>(SHAPES[Math.floor(Math.random() * SHAPES.length)])
  const start = START_ANGLE[shape.value]
  const rotateX = ref(start.x)
  const rotateY = ref(start.y)
  const dragging = ref(false)

  let lastPointerX = 0
  let lastPointerY = 0
  let lastPointerTime = 0
  let pointerDownTime = 0
  let movedDistance = 0
  let lastFrameTime = 0
  let rafId = 0
  let velocityY = SPIN_DEGREES_PER_SECOND

  const tick = (time: number) => {
    if (lastFrameTime && !dragging.value) {
      const dt = (time - lastFrameTime) / 1000
      const ease = 1 - Math.exp(-dt / MOMENTUM_EASE)
      velocityY += (SPIN_DEGREES_PER_SECOND - velocityY) * ease
      rotateY.value += velocityY * dt
    }
    lastFrameTime = time
    rafId = requestAnimationFrame(tick)
  }

  onMounted(() => {
    rafId = requestAnimationFrame(tick)
  })
  onUnmounted(() => cancelAnimationFrame(rafId))

  function onPointerDown(e: PointerEvent) {
    dragging.value = true
    lastPointerX = e.clientX
    lastPointerY = e.clientY
    lastPointerTime = performance.now()
    pointerDownTime = lastPointerTime
    movedDistance = 0
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging.value) return
    const now = performance.now()
    const dt = (now - lastPointerTime) / 1000
    const dx = e.clientX - lastPointerX
    const dy = e.clientY - lastPointerY
    lastPointerX = e.clientX
    lastPointerY = e.clientY
    lastPointerTime = now
    movedDistance += Math.hypot(dx, dy)
    rotateY.value += dx * DRAG_SENSITIVITY
    rotateX.value = clampTilt(rotateX.value - dy * DRAG_SENSITIVITY)
    if (dt > 0) {
      const instantSpeed = (dx * DRAG_SENSITIVITY) / dt
      velocityY = Math.max(-MAX_FLICK_SPEED, Math.min(MAX_FLICK_SPEED, instantSpeed))
    }
  }

  function onPointerUp() {
    dragging.value = false
    const wasTap =
      movedDistance < CLICK_MOVEMENT_THRESHOLD && performance.now() - pointerDownTime < CLICK_MAX_DURATION
    if (!wasTap) return

    const next = SHAPES[(SHAPES.indexOf(shape.value) + 1) % SHAPES.length]
    shape.value = next
    const angle = START_ANGLE[next]
    rotateX.value = angle.x
    rotateY.value = angle.y
    velocityY = SPIN_DEGREES_PER_SECOND
  }

  return { shape, rotateX, rotateY, dragging, onPointerDown, onPointerMove, onPointerUp }
}
