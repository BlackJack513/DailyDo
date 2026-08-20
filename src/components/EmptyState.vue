<!--
  EmptyState.vue — 统一空状态展示组件

  用法：
  <EmptyState text="暂无待办" hint="点击上方按钮创建第一个待办" />
  <EmptyState text="回收站是空的" icon="trash" />

  Props:
  - text: 主要提示文字（必填）
  - hint: 辅助说明文字（可选）
  - icon: 图标类型 'clipboard' | 'trash' | 'refresh' | 'folder'（默认 'clipboard'）
  - large: 是否使用大尺寸图标（默认 true）
-->
<template>
  <div class="flex flex-col items-center justify-center py-16 text-content-tertiary">
    <div :class="large ? 'mb-4' : 'mb-3'">
      <!-- Clipboard -->
      <svg v-if="icon === 'clipboard'" :class="large ? 'w-16 h-16' : 'w-12 h-12'" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity: 0.3">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <!-- Trash -->
      <svg v-else-if="icon === 'trash'" :class="large ? 'w-16 h-16' : 'w-12 h-12'" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity: 0.3">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      <!-- Refresh (周期任务) -->
      <svg v-else-if="icon === 'refresh'" :class="large ? 'w-16 h-16' : 'w-12 h-12'" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity: 0.3">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <!-- Folder -->
      <svg v-else :class="large ? 'w-16 h-16' : 'w-12 h-12'" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity: 0.3">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    </div>
    <p class="text-sm font-medium" :class="hint ? 'mb-1' : ''">{{ text }}</p>
    <p v-if="hint" class="text-xs">{{ hint }}</p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, required: true },
  hint: { type: String, default: '' },
  icon: {
    type: String,
    default: 'clipboard',
    validator: (v) => ['clipboard', 'trash', 'refresh', 'folder'].includes(v),
  },
  large: { type: Boolean, default: true },
})
</script>
