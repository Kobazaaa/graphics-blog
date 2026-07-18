import { defineComponent, h, onMounted, onUnmounted, ref } from 'vue'

const SHAPES = ['cube', 'pyramid', 'sphere'] as const
type Shape = (typeof SHAPES)[number]

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

function buildCube() {
  return ['front', 'back', 'right', 'left', 'top', 'bottom'].map((face) =>
    h('div', { class: `gb-coming-soon-face gb-coming-soon-face--${face}` }),
  )
}

function buildPyramidSide(rotateY: number) {
  return h(
    'div',
    {
      class: 'gb-coming-soon-pyramid-side',
      style: { transform: `rotateY(${rotateY}deg) translateZ(32px) rotateX(21deg)` },
    },
    [
      h(
        'svg',
        { viewBox: '0 0 64 90', preserveAspectRatio: 'none' },
        [h('polygon', { points: '32,0 0,90 64,90' })],
      ),
    ],
  )
}

function buildPyramid() {
  return [
    ...[0, 90, 180, 270].map(buildPyramidSide),
    h('div', { class: 'gb-coming-soon-face gb-coming-soon-face--bottom' }),
  ]
}

function buildSphere() {
  const meridians = [0, 45, 90, 135].map((deg) =>
    h('div', { class: 'gb-coming-soon-ring', style: { transform: `rotateY(${deg}deg)` } }),
  )
  const equator = h('div', { class: 'gb-coming-soon-ring', style: { transform: 'rotateX(90deg)' } })
  return [...meridians, equator]
}

const BUILDERS: Record<Shape, () => ReturnType<typeof h>[]> = {
  cube: buildCube,
  pyramid: buildPyramid,
  sphere: buildSphere,
}

const clampTilt = (v: number) => Math.min(MAX_TILT, Math.max(MIN_TILT, v))

/** Placeholder banner for chapters that haven't been written yet. */
export default defineComponent({
  name: 'ComingSoon',
  setup() {
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

    const onPointerDown = (e: PointerEvent) => {
      dragging.value = true
      lastPointerX = e.clientX
      lastPointerY = e.clientY
      lastPointerTime = performance.now()
      pointerDownTime = lastPointerTime
      movedDistance = 0
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: PointerEvent) => {
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

    const onPointerUp = () => {
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

    return () =>
      h('div', { class: 'gb-coming-soon', role: 'note', 'aria-label': 'This part is still being written' }, [
        h(
          'div',
          {
            class: ['gb-coming-soon-scene', { 'gb-coming-soon-scene--dragging': dragging.value }],
            'aria-hidden': 'true',
            onPointerdown: onPointerDown,
            onPointermove: onPointerMove,
            onPointerup: onPointerUp,
            onPointercancel: onPointerUp,
          },
          [
            h(
              'div',
              {
                class: `gb-coming-soon-shape gb-coming-soon-shape--${shape.value}`,
                style: { transform: `rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg)` },
              },
              BUILDERS[shape.value](),
            ),
            h('div', { class: 'gb-coming-soon-shadow' }),
          ],
        ),
        h('div', { class: 'gb-coming-soon-copy' }, [
          h('p', { class: 'gb-coming-soon-eyebrow' }, 'In the works'),
          h('p', { class: 'gb-coming-soon-title' }, "This part hasn't been written yet."),
          h(
            'p',
            { class: 'gb-coming-soon-desc' },
            'Check back soon, or look around elsehwere! (or give the shape a spin ;p )',
          ),
        ]),
      ])
  },
})
