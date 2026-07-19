import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import SeriesIndex from './components/SeriesIndex.vue'
import ComingSoon from './components/ComingSoon.vue'
import ChapterIndex from './components/ChapterIndex.vue'
import './styles/index.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('SeriesIndex', SeriesIndex)
    app.component('ComingSoon', ComingSoon)
    app.component('ChapterIndex', ChapterIndex)
  },
} satisfies Theme
