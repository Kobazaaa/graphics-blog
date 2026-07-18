import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

/** First "# Heading" in a markdown file, or a fallback. */
function getTitle(file: string, fallback: string): string {
  const match = readFileSync(file, 'utf-8').match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}



/**
 * Every folder in docs/ with an index.md is a series. A numeric folder
 * prefix sets the series' position ("01-math" sorts before
 * "02-rasterization") and is stripped from URLs. Every other .md in the
 * folder is a chapter, ordered by its numeric filename prefix (01-, 02-, …).
 * A "major.minor" prefix (01.1-, 01.2-, …) makes the file a sub-chapter,
 * nested under its chapter in the sidebar as "1.1 Title" (collapsed
 * until you're inside that chapter). Nav dropdown and sidebar are
 * generated from that — new chapters only need a new file, not a config
 * edit. (Dev server picks new files up on restart; builds are always
 * current.)
 */
type SidebarItem = { text: string; link: string; collapsed?: boolean; items?: SidebarItem[] }

function scanSeries() {
  const sidebar: Record<string, unknown> = {}
  const rewrites: Record<string, string> = {}
  const collected: { slug: string; order: number; group: SidebarItem; chapterCount: number }[] = []

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

    const parsed = files
      .filter((f) => f !== 'index.md')
      .map((f) => {
        const m = f.match(/^0*(\d+)(?:\.0*(\d+))?-/)
        return {
          major: m ? Number(m[1]) : Number.MAX_SAFE_INTEGER,
          minor: m?.[2] !== undefined ? Number(m[2]) : null,
          title: getTitle(join(dir, f), f),
          link: `/${slug}/${f.replace(/\.md$/, '')}`,
          file: f,
        }
      })
      .sort(
        (a, b) => a.major - b.major || (a.minor ?? 0) - (b.minor ?? 0) || a.file.localeCompare(b.file)
      )

    const chapters: SidebarItem[] = []
    const byMajor = new Map<number, SidebarItem>()
    for (const p of parsed) {
      if (p.minor === null) {
        const item: SidebarItem = {
          text: p.major !== Number.MAX_SAFE_INTEGER ? `${p.major}. ${p.title}` : p.title,
          link: p.link,
        }
        chapters.push(item)
        byMajor.set(p.major, item)
      } else {
        const sub: SidebarItem = { text: `${p.major}.${p.minor} ${p.title}`, link: p.link }
        const parent = byMajor.get(p.major)
        if (parent) {
          parent.items = parent.items ?? []
          parent.items.push(sub)
          parent.collapsed = false
        } else {
          chapters.push(sub) // sub-chapter without a parent chapter file
        }
      }
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

  // Everywhere else (landing page, about): a flat catalog — series names
  // only, no chapters.
  sidebar['/'] = [{ text: 'All Series', items: nav }]

  // Data for the <SeriesIndex /> component on the landing page.
  const seriesIndex = collected.map((s) => ({
    title: s.group.text,
    link: `/${s.slug}/`,
    chapters: s.chapterCount,
  }))

  return { sidebar, nav, rewrites, seriesIndex }
}

const series = scanSeries()

export default {
  theme: '@vitepress/theme-default',
  lang: 'en-US',
  title: 'Graphics Blog',
  description: "A Graphics Blog by Kobe Dereyne going over rendering topics, math, and more.",

  base: '/graphics-blog/',

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/graphics-blog/images/logo-dark.png' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
      },
    ],
  ],

  // Strip numeric series-folder prefixes (01-math → /math/) from URLs.
  rewrites: series.rewrites,

  markdown: {
    math: true,
  },

  lastUpdated: false,
  cleanUrls: true,

  appearance: 'dark',

  themeConfig: {
    logo: { dark: '/images/logo-dark.png', light: '/images/logo-light.png' },

    // Consumed by the <SeriesIndex /> component on the landing page.
    seriesIndex: series.seriesIndex,

    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Series',
        items: series.nav,
      },
      { text: 'About', link: '/about' },
    ],

    outline: { label: 'Contents' },

    sidebar: series.sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kobazaaa' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/kobe-dereyne-925ba02a3/' },
    ],

    footer: {
      copyright: 'Copyright © 2026-present Kobe Dereyne',
    },

    docFooter: {
      prev: 'Previous chapter',
      next: 'Next chapter',
},
  },
}
