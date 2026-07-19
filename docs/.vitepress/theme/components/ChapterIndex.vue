<script setup lang="ts">
// "What's in this chapter" (on a chapter-overview page) or "what's in this
// series" (on a series' index.md) list, generated from the same file-prefix
// numbering config.mts builds the sidebar from. Add, remove, or rename a
// page and this list updates on its own, no markdown edits needed.
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import type { ChapterIndexEntry } from '../../types'

const BASE_PADDING_LEFT = 2
const INDENT_STEP = 24

const { theme, page } = useData()

// filePath is the un-rewritten source path ("01-math/foo.md"), matching how
// chapterIndex is keyed in config.mts; relativePath is the public,
// rewrite-stripped path ("math/foo.md") and won't match.
const items = computed<ChapterIndexEntry[]>(() => {
  const map = (theme.value.chapterIndex ?? {}) as Record<string, ChapterIndexEntry[]>
  return map[page.value.filePath] ?? []
})

const indent = (depth: number) => `${BASE_PADDING_LEFT + depth * INDENT_STEP}px`
</script>

<template>
  <div v-if="items.length" class="gb-chapter-index">
    <a
      v-for="item in items"
      :key="item.link"
      class="gb-chapter-index-row"
      :style="{ paddingLeft: indent(item.depth) }"
      :href="withBase(item.link)"
    >
      <span class="gb-chapter-index-num">{{ item.number }}</span>
      <span class="gb-chapter-index-title">{{ item.title }}</span>
    </a>
  </div>
</template>

<style>
.gb-chapter-index {
  display: flex;
  flex-direction: column;
  margin: 1.5rem 0;
  border-top: 1px solid var(--vp-c-divider);
}

.vp-doc a.gb-chapter-index-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 11px 2px;
  border-bottom: 1px solid var(--vp-c-divider);
  text-decoration: none;
  font-weight: 400;
  color: inherit;
}

.gb-chapter-index-num {
  flex-shrink: 0;
  width: 38px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.vp-doc .gb-chapter-index-title {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.gb-chapter-index-row:hover .gb-chapter-index-title {
  color: var(--vp-c-brand-1);
}
</style>
