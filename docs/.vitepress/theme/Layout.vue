<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { onMounted } from 'vue'
import { useSidebarResize } from './composables/useSidebarResize'
import { useChapterFold } from './composables/useChapterFold'

onMounted(() => {
  useSidebarResize()
  useChapterFold()
})
</script>

<template>
  <component :is="DefaultTheme.Layout" />
</template>
