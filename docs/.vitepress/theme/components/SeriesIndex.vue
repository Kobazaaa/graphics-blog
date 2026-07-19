<script setup lang="ts">
// Table-of-contents rows for the landing page, fed by themeConfig.seriesIndex
// (generated in config.mts from the series folders).
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import type { SeriesEntry } from '../../types'

withDefaults(defineProps<{ showComingSoon?: boolean }>(), { showComingSoon: true })

const { theme } = useData()

const entries = computed<SeriesEntry[]>(() => theme.value.seriesIndex ?? [])

const chapterLabel = (count: number) => (count === 1 ? '1 chapter' : `${count} chapters`)
</script>

<template>
  <div class="gb-series-index">
    <a v-for="s in entries" :key="s.link" class="gb-series-row" :href="withBase(s.link)">
      <p class="gb-series-title">{{ s.title }}</p>
      <div class="gb-series-meta">
        <span>{{ chapterLabel(s.chapters) }}</span>
        <span class="gb-series-arrow">→</span>
      </div>
    </a>

    <!-- Static teaser row, deliberately not a link. -->
    <div v-if="showComingSoon" class="gb-series-row gb-series-soon">
      <p class="gb-series-title">More coming soon…</p>
      <div class="gb-series-meta"><span>in the works</span></div>
    </div>
  </div>
</template>

<style>
.gb-series-index {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

/* The row is an <a> inside .vp-doc, so undo the prose link styling. */
.vp-doc a.gb-series-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 400;
  color: inherit;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.gb-series-row:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

.vp-doc .gb-series-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}

.gb-series-row:hover .gb-series-title {
  color: var(--vp-c-brand-1);
}

.gb-series-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}

/* Non-clickable "coming soon" teaser row. */
.gb-series-index .gb-series-soon {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 8px;
}

.vp-doc .gb-series-soon .gb-series-title {
  color: var(--vp-c-text-3);
  font-weight: 400;
}

.gb-series-arrow {
  color: var(--vp-c-brand-1);
}

@media (max-width: 640px) {
  .gb-series-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
