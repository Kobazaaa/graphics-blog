import { defineAsyncComponent } from 'vue'
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import SeriesIndex from './components/SeriesIndex.vue'
import ComingSoon from './components/ComingSoon.vue'
import ChapterIndex from './components/ChapterIndex.vue'
import Proof from './components/Proof.vue'
import Vector2D from './components/Vector2D.vue'
import './styles/index.css'

// Lazy: pulls in `three` (~500kb), only fetched on pages that render <Vector3D />.
const Vector3D = defineAsyncComponent(() => import('./components/Vector3D.vue'))

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('SeriesIndex', SeriesIndex)
    app.component('ComingSoon', ComingSoon)
    app.component('ChapterIndex', ChapterIndex)
    app.component('Proof', Proof)
    app.component('Vector2D', Vector2D)
    app.component('Vector3D', Vector3D)
  },
} satisfies Theme
