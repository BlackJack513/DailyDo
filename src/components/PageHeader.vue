<!--
  PageHeader.vue — 统一页面头部组件

  用法：
  <PageHeader title="待办列表" subtitle="0 待处理 · 1 进行中 · 0 等待中 · 3 已完成">
    <template #actions>
      <button class="btn-primary">新建待办</button>
    </template>
  </PageHeader>

  Props:
  - title: 页面标题（必填）
  - subtitle: 副标题/描述文字（可选）
  - bordered: 是否带底部边框和背景（默认 false，用于 TemplatesView/AttachmentsView 风格）
  - compact: 是否使用紧凑间距（默认 false）
-->
<template>
  <div
    class="flex items-center justify-between flex-shrink-0"
    :class="
      bordered
        ? 'px-6 py-5 border-b border-border bg-surface'
        : compact
          ? 'px-6 pt-5 pb-3'
          : 'px-8 pt-6 pb-4'
    "
  >
    <div>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  bordered: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})
</script>
