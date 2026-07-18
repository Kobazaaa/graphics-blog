import { defineComponent, h } from 'vue'
import { useData, withBase } from 'vitepress'

type SeriesEntry = { title: string; link: string; chapters: number }

/**
 * Table-of-contents rows for the landing page, fed by themeConfig
 * .seriesIndex (generated in config.mts from the series folders).
 */
export default defineComponent({
  name: 'SeriesIndex',
  setup() {
    const { theme } = useData()
    return () => {
      const entries: SeriesEntry[] = theme.value.seriesIndex ?? []
      return h('div', { class: 'gb-series-index' }, [
        ...entries.map((s) =>
          h('a', { class: 'gb-series-row', href: withBase(s.link) }, [
            h('p', { class: 'gb-series-title' }, s.title),
            h('div', { class: 'gb-series-meta' }, [
              h('span', s.chapters === 1 ? '1 chapter' : `${s.chapters} chapters`),
              h('span', { class: 'gb-series-arrow' }, '→'),
            ]),
          ])
        ),
        // Static teaser row — deliberately not a link.
        h('div', { class: 'gb-series-row gb-series-soon' }, [
          h('p', { class: 'gb-series-title' }, 'More coming soon…'),
          h('div', { class: 'gb-series-meta' }, [h('span', 'in the works')]),
        ]),
      ])
    }
  },
})
