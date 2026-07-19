const STORAGE_KEY = 'gb-sidebar-width'
const MIN_WIDTH = 220
const MAX_WIDTH = 440

const clamp = (x: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, x))

/** Draggable handle on the sidebar's right edge; width persists across visits via localStorage. */
export function useSidebarResize() {
  const root = document.documentElement
  const saved = Number(localStorage.getItem(STORAGE_KEY))
  if (saved >= MIN_WIDTH && saved <= MAX_WIDTH) {
    root.style.setProperty('--vp-sidebar-width', `${saved}px`)
  }

  const handle = document.createElement('div')
  handle.className = 'gb-sidebar-resizer'
  handle.setAttribute('aria-hidden', 'true')
  document.body.appendChild(handle)

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault()
    document.body.classList.add('gb-resizing')

    const onMove = (ev: MouseEvent) => {
      root.style.setProperty('--vp-sidebar-width', `${clamp(ev.clientX)}px`)
    }
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.classList.remove('gb-resizing')
      localStorage.setItem(STORAGE_KEY, String(clamp(ev.clientX)))
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  })
}
