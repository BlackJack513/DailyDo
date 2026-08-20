<!--
  PriorityBadge.vue — 统一优先级徽章组件

  用法：
  <PriorityBadge priority="high" />
  <PriorityBadge priority="medium" show-dot />

  Props:
  - priority: 'high' | 'medium' | 'low'（必填）
  - showDot: 是否显示彩色圆点（默认 false）
  - size: 'sm' | 'md'（默认 'sm'）
-->
<template>
  <span
    class="inline-flex items-center gap-1 rounded-full font-medium"
    :class="[sizeClass, priorityClass]"
  >
    <span v-if="showDot" class="w-1.5 h-1.5 rounded-full" :class="dotClass"></span>
    {{ displayLabel }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  priority: {
    type: String,
    required: true,
    validator: (v) => ['high', 'medium', 'low'].includes(v),
  },
  showDot: { type: Boolean, default: false },
  size: { type: String, default: 'sm', validator: (v) => ['sm', 'md'].includes(v) },
})

const PRIORITY_MAP = {
  high: { label: '高', class: 'bg-red-50 text-red-500', dot: 'bg-red-500' },
  medium: { label: '中', class: 'bg-amber-50 text-amber-500', dot: 'bg-amber-500' },
  low: { label: '低', class: 'bg-green-50 text-green-500', dot: 'bg-green-500' },
}

const displayLabel = computed(() => PRIORITY_MAP[props.priority]?.label || props.priority)
const priorityClass = computed(() => PRIORITY_MAP[props.priority]?.class || '')
const dotClass = computed(() => PRIORITY_MAP[props.priority]?.dot || '')
const sizeClass = computed(() => (props.size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs'))
</script>
