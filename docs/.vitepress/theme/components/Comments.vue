<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'
import { giscusConfig } from '../giscus.config'

const { isDark } = useData()
const route = useRoute()
const el = ref<HTMLDivElement | null>(null)

function themeFor(dark: boolean) {
  const { hostname, origin } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') return dark ? 'dark_dimmed' : 'light'
  return `${origin}${withBase(dark ? '/giscus/dark.css' : '/giscus/light.css')}`
}

function loadGiscus() {
  if (!el.value) return
  el.value.innerHTML = ''

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('data-repo', giscusConfig.repo)
  script.setAttribute('data-repo-id', giscusConfig.repoId)
  script.setAttribute('data-category', giscusConfig.category)
  script.setAttribute('data-category-id', giscusConfig.categoryId)
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', themeFor(isDark.value))
  script.setAttribute('data-lang', 'en')

  el.value.appendChild(script)
}

watch(() => route.path, loadGiscus)

watch(isDark, (dark) => {
  const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  iframe?.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: themeFor(dark) } } },
    'https://giscus.app',
  )
})

onMounted(loadGiscus)
</script>

<template>
  <div class="giscus-section">
    <h2 class="giscus-heading">Discussion</h2>
    <div ref="el" class="giscus-comments" />
  </div>
</template>

<style scoped>
.giscus-section {
  margin-top: 1rem;
}

.giscus-heading {
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 0 0 0.35rem;
  margin: 0 0 1.5rem;
  font-size: 1.65rem;
  font-weight: 400;
  line-height: 1.3;
  color: var(--vp-c-text-1);
}

.giscus-comments :deep(iframe.giscus-frame) {
  width: 100%;
}
</style>
