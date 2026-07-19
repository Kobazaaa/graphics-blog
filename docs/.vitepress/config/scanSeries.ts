import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SidebarItem, ChapterIndexEntry, SeriesEntry } from '../types'

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** First "# Heading" in a markdown file, or a fallback. */
function getTitle(file: string, fallback: string): string {
  const match = readFileSync(file, 'utf-8').match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}

export type ScanResult = {
  sidebar: Record<string, unknown>
  nav: { text: string; link: string }[]
  rewrites: Record<string, string>
  seriesIndex: SeriesEntry[]
  chapterIndex: Record<string, ChapterIndexEntry[]>
}

/**
 * Every folder in docs/ with an index.md is a series. A numeric folder
 * prefix sets the series' position ("01-math" sorts before
 * "02-rasterization") and is stripped from URLs. Every other .md in the
 * folder is a chapter, ordered by its numeric filename prefix (01-, 02-, …).
 * The prefix's dot-segments set nesting depth to match: "01.2-" is a
 * sub-chapter nested under chapter 1 ("1.2 Title" in the sidebar), "01.2.1-"
 * nests under 1.2, and so on to any depth, collapsed until you're inside
 * that branch. Nav and sidebar are both generated from this, so new
 * chapters only need a new file, not a config edit (the dev server picks
 * them up on restart; builds are always current).
 */
export function scanSeries(): ScanResult {
  const sidebar: Record<string, unknown> = {}
  const rewrites: Record<string, string> = {}
  const collected: { slug: string; order: number; group: SidebarItem; chapterCount: number }[] = []
  // Keyed by a page's own relativePath: either a series' "index.md" (whose
  // list is the entire series tree) or a top-level chapter file (whose list
  // is just its own descendants). Consumed by <ChapterIndex />, so both a
  // chapter page's and a series' "what's in here" list stay in sync with
  // the sidebar automatically. Depths start as raw path-length and get
  // normalized to 0-based once every series has been scanned.
  const rawIndex: Record<string, { number: string; title: string; link: string; rawDepth: number }[]> = {}
  function addToIndex(key: string, p: { path: number[]; title: string; link: string }) {
    rawIndex[key] = rawIndex[key] ?? []
    rawIndex[key].push({ number: p.path.join('.'), title: p.title, link: p.link, rawDepth: p.path.length })
  }

  for (const entry of readdirSync(docsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const dir = join(docsRoot, entry.name)
    const files = readdirSync(dir).filter((f) => f.endsWith('.md'))
    if (!files.includes('index.md')) continue

    // Series order comes from a numeric folder prefix ("01-math"); the
    // prefix is stripped from the public URL via `rewrites`, so pages
    // still live at /math/… and renumbering folders never breaks links.
    const dirMatch = entry.name.match(/^0*(\d+)-(.+)$/)
    const order = dirMatch ? Number(dirMatch[1]) : Number.MAX_SAFE_INTEGER
    const slug = dirMatch ? dirMatch[2] : entry.name
    if (dirMatch) rewrites[`${entry.name}/:page*`] = `${slug}/:page*`

    const seriesTitle = getTitle(join(dir, 'index.md'), entry.name)

    // The filename prefix's dot-segments give its nesting path: "01-" is
    // [1] (a chapter), "01.2-" is [1, 2] (nested under chapter 1), "01.2.1-"
    // is [1, 2, 1] (nested under 1.2), and so on to any depth. A file
    // without a numeric prefix sorts after all numbered ones.
    const parsed = files
      .filter((f) => f !== 'index.md')
      .map((f) => {
        const m = f.match(/^([\d.]+)-/)
        const path = m ? m[1].split('.').map((n) => Number(n)) : [Number.MAX_SAFE_INTEGER]
        return { path, title: getTitle(join(dir, f), f), link: `/${slug}/${f.replace(/\.md$/, '')}`, file: f }
      })
      .sort((a, b) => {
        const depth = Math.max(a.path.length, b.path.length)
        for (let i = 0; i < depth; i++) {
          const d = (a.path[i] ?? -1) - (b.path[i] ?? -1)
          if (d) return d
        }
        return a.file.localeCompare(b.file)
      })

    // Every numbered page feeds two lists: the series' own index.md (the
    // whole tree, every chapter and sub-chapter) and, if it's nested, its
    // owning top-level chapter's list (just that chapter's own descendants,
    // not the chapter file itself).
    for (const p of parsed) {
      if (p.path[0] === Number.MAX_SAFE_INTEGER) continue
      addToIndex(`${entry.name}/index.md`, p)
      if (p.path.length > 1) {
        const owner = parsed.find((q: (typeof parsed)[number]) => q.path.length === 1 && q.path[0] === p.path[0])
        if (owner) addToIndex(`${entry.name}/${owner.file}`, p)
      }
    }

    const chapters: SidebarItem[] = []
    const byPath = new Map<string, SidebarItem>()
    for (const p of parsed) {
      const numbered = p.path[0] !== Number.MAX_SAFE_INTEGER
      const item: SidebarItem = {
        text: !numbered ? p.title : p.path.length === 1 ? `${p.path[0]}. ${p.title}` : `${p.path.join('.')} ${p.title}`,
        link: p.link,
      }
      const parent = p.path.length > 1 ? byPath.get(p.path.slice(0, -1).join('.')) : undefined
      if (parent) {
        parent.items = parent.items ?? []
        parent.items.push(item)
        parent.collapsed = false
      } else {
        chapters.push(item) // top-level chapter, or a sub-chapter with no parent file
      }
      if (numbered) byPath.set(p.path.join('.'), item)
    }

    collected.push({
      slug,
      order,
      chapterCount: parsed.length, // sub-chapters count too
      group: {
        text: seriesTitle,
        link: `/${slug}/`,
        collapsed: false,
        items: [{ text: 'Series Overview', link: `/${slug}/` }, ...chapters],
      },
    })
  }

  // Numbered folders first (by prefix), unnumbered ones alphabetically after.
  collected.sort((a, b) => a.order - b.order || a.group.text.localeCompare(b.group.text))
  const nav = collected.map((s) => ({ text: s.group.text, link: `/${s.slug}/` }))

  // Inside a series: its own chapters on top, then quick links to get
  // back home or jump straight into any other series.
  for (const s of collected) {
    const otherSeries = collected
      .filter((o) => o.slug !== s.slug)
      .map((o) => ({ text: o.group.text, link: `/${o.slug}/` }))
    sidebar[`/${s.slug}/`] = [
      s.group,
      {
        text: 'More Reading',
        items: [{ text: '← Back to Home', link: '/' }, ...otherSeries],
      },
    ]
  }

  // Everywhere else (landing page, about): a flat catalog, series names
  // only, no chapters.
  sidebar['/'] = [{ text: 'All Series', items: nav }]

  // Data for the <SeriesIndex /> component on the landing page.
  const seriesIndex = collected.map((s) => ({
    title: s.group.text,
    link: `/${s.slug}/`,
    chapters: s.chapterCount,
  }))

  // Normalize raw path-lengths into a 0-based depth per list, so the
  // shallowest entries always render unindented, whether that list is a
  // whole series (shallowest = its top-level chapters) or one chapter
  // (shallowest = its direct sub-chapters).
  const chapterIndex: Record<string, ChapterIndexEntry[]> = {}
  for (const [key, entries] of Object.entries(rawIndex)) {
    const minDepth = Math.min(...entries.map((e) => e.rawDepth))
    chapterIndex[key] = entries.map((e) => ({
      number: e.number,
      title: e.title,
      link: e.link,
      depth: e.rawDepth - minDepth,
    }))
  }

  return { sidebar, nav, rewrites, seriesIndex, chapterIndex }
}
