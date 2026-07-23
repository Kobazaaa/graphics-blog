<script setup lang="ts">
withDefaults(defineProps<{ title?: string }>(), { title: 'Proof' })
</script>

<template>
  <details class="gb-proof">
    <summary class="gb-proof-summary">
      <span class="gb-proof-label">{{ title }}</span>
      <span class="gb-proof-toggle"></span>
    </summary>
    <div class="gb-proof-body">
      <slot />
    </div>
  </details>
</template>

<style>
.vp-doc details.gb-proof {
  margin: 1rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  overflow: hidden;
}

.vp-doc .gb-proof-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
  padding: 7px 14px;
  cursor: pointer;
  user-select: none;
  background-color: var(--vp-c-bg-soft);
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.gb-proof-summary::-webkit-details-marker {
  display: none;
}

.gb-proof-summary::marker {
  content: '';
}

.gb-proof-summary:hover {
  background-color: var(--vp-c-bg-alt);
}

.gb-proof-toggle {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--vp-c-brand-1);
}

.gb-proof-toggle::before {
  content: '[show]';
}

.gb-proof[open] .gb-proof-toggle::before {
  content: '[hide]';
}

.vp-doc .gb-proof-body {
  padding: 12px 16px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 15.5px;
  color: var(--vp-c-text-2);
}

.gb-proof-body > :first-child {
  margin-top: 0;
}

.gb-proof-body > :last-child {
  margin-bottom: 0;
}

.gb-proof-body :is(h1, h2, h3, h4) {
  font-size: 15.5px;
}

.gb-proof-body::after {
  display: block;
  margin-top: 4px;
  text-align: right;
  content: '∎';
  color: var(--vp-c-text-3);
}
</style>
