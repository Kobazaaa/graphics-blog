// The series root ("Math Foundations") keeps its own native collapse
// caret, but repurposed: collapsing the root folds every main chapter
// (level-1) shut instead of hiding the whole list (that default hiding is
// undone in CSS, so the root's own item list stays put). Expanding the
// root unfolds every chapter again.
//
// This rides on VitePress's own toggle rather than intercepting clicks: we
// watch the root item's `class` attribute and react only when the presence
// of `collapsed` actually flips (attributeOldValue diffs against the prior
// class list, so unrelated class churn, e.g. `is-active` on navigation,
// doesn't trigger a fold). Observing `#VPSidebarNav` instead of the item
// node itself survives VPSidebarGroup remounting on route changes.
export function useChapterFold() {
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
