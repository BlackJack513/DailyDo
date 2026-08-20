<!--
  StatusBadge.vue — 统一状态徽章组件

  用法：
  <StatusBadge status="done" />
  <StatusBadge status="in_progress" label="进行中" />

  Props:
  - status: 'pending' | 'in_progress' | 'blocked' | 'done'（必填）
  - label: 自定义标签文字（可选，默认使用内置中文标签）
  - size: 'sm' | 'md'（默认 'sm'）
-->
<template>
  <span
    class="inline-flex items-center rounded-full font-medium"
    :class="[sizeClass, statusClass]"
  >
    {{ displayLabel }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (v) => ['pending', 'in_progress', 'blocked', 'done'].includes(v),
  },
  label: { type: String, default: '' },
  size: { type: String, default: 'sm', validator: (v) => ['sm', 'md'].includes(v) },
})

const STATUS_MAP = {
  pending: { label: '待处理', class: 'bg-amber-50 text-amber-600' },
  in_progress: { label: '进行中', class: 'bg-blue-50 text-blue-600' },
  blocked: { label: '已阻塞', class: 'bg-amber-50 text-amber-600' },
  done: { label: '已完成', class: 'bg-green-50 text-green-600' },
}

const displayLabel = computed(() => props.label || STATUS_MAP[props.status]?.label || props.status)
const statusClass = computed(() => STATUS_MAP[props.status]?.class || '')
const sizeClass = computed(() => (props.size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs'))
</script>
