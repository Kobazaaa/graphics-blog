import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { defineComponent, h, onMounted } from 'vue'
import SeriesIndex from './SeriesIndex'
import ComingSoon from './ComingSoon'
import './custom.css'

const STORAGE_KEY = 'gb-sidebar-width'
const MIN_WIDTH = 220
const MAX_WIDTH = 440

function setupSidebarResize() {
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

    const clamp = (x: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, x))
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

// The series root ("Math Foundations") keeps its own native collapse
// caret, but repurposed: collapsing the root folds every main chapter
// (level-1) shut instead of hiding the whole list (that default hiding
// is undone in CSS, so the root's own item list stays put). Expanding
// the root unfolds every chapter again.
//
// This rides on VitePress's own toggle rather than intercepting clicks:
// we watch the root item's `class` attribute and react only when the
// presence of `collapsed` actually flips (attributeOldValue lets us
// diff against the prior class list), so unrelated class churn — e.g.
// `is-active`/`has-active` on navigation — doesn't trigger a fold.
// Observing `#VPSidebarNav` (rather than the item node itself) survives
// VPSidebarGroup remounting its contents on route changes.
function setupChapterFold() {
  const nav = document.getElementById('VPSidebarNav')
  if (!nav) return

  const ROOT = '.group:first-of-type > .VPSidebarItem.level-0'
  const OPEN_CHAPTER_CARET = '.group:first-of-type .VPSidebarItem.level-1.collapsible:not(.collapsed) > .item > .caret'
  const CLOSED_CHAPTER_CARET = '.group:first-of-type .VPSidebarItem.level-1.collapsible.collapsed > .item > .caret'

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const root = mutation.target
      if (!(root instanceof Element) || !root.matches(ROOT)) continue

      const wasCollapsed = (mutation.oldValue ?? '').split(' ').includes('collapsed')
      const isCollapsed = root.classList.contains('collapsed')
      if (wasCollapsed === isCollapsed) continue

      const carets = isCollapsed ? OPEN_CHAPTER_CARET : CLOSED_CHAPTER_CARET
      nav.querySelectorAll<HTMLElement>(carets).forEach((caret) => caret.click())
    }
  })

  observer.observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true })
}

const Layout = defineComponent({
  name: 'GraphicsBlogLayout',
  setup() {
    onMounted(() => {
      setupSidebarResize()
      setupChapterFold()
    })
    return () => h(DefaultTheme.Layout)
  },
})

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('SeriesIndex', SeriesIndex)
    app.component('ComingSoon', ComingSoon)
  },
} satisfies Theme
