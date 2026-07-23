<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import { useSidebarResize } from './composables/useSidebarResize'
import { useChapterFold } from './composables/useChapterFold'
import Comments from './components/Comments.vue'

const { frontmatter } = useData()
const showComments = computed(() => frontmatter.value.comments !== false)

onMounted(() => {
  useSidebarResize()
  useChapterFold()
})
</script>

<template>
  <component :is="DefaultTheme.Layout">
    <template #doc-after>
      <Comments v-if="showComments" />
    </template>
  </component>
</template>
