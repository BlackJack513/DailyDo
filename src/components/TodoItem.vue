<template>
  <div
    @dblclick="$emit('detail', { todo, x: $event.clientX, y: $event.clientY })"
    @mousedown="dragMousedown ? dragMousedown($event, todo) : undefined"
    class="group flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-all duration-150 bg-surface"
    :class="[
      { 'opacity-60': todo.status === 'done' },
      dragging ? 'opacity-40 cursor-grabbing select-none' : dragMousedown ? 'cursor-grab' : '',
    ]"
  >
    <!-- Status toggle -->
    <button
      @click="$emit('toggle-status', todo)"
      class="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
      :class="statusClass"
    >
      <svg v-if="todo.status === 'done'" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clip-rule="evenodd"
        />
      </svg>
      <div v-else-if="todo.status === 'in_progress'" class="w-2 h-2 rounded-full bg-primary"></div>
    </button>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p
        class="text-sm font-medium leading-tight"
        :class="{ 'line-through text-content-tertiary': todo.status === 'done' }"
      >
        {{ todo.title }}
      </p>
      <div class="flex items-center gap-2 mt-1.5 flex-wrap">
        <!-- Priority -->
        <span class="inline-flex items-center gap-1 text-xs" :class="priorityColor">
          <span class="w-1.5 h-1.5 rounded-full" :class="priorityDot"></span>
          {{ priorityLabel }}
        </span>
        <!-- Tags -->
        <span
          v-for="tag in todo.tags || []"
          :key="tag.id"
          class="tag-badge"
          :style="{ backgroundColor: tag.color + '20', color: tag.color }"
        >
          {{ tag.name }}
        </span>
        <!-- Recurrence -->
        <span
          v-if="todo.recurrence_type && todo.recurrence_type !== 'none'"
          class="text-xs text-content-tertiary flex items-center gap-0.5"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {{ recurrenceLabel }}
        </span>
        <!-- Attachment -->
        <span
          v-if="todo.attachment_path"
          class="text-xs text-content-tertiary flex items-center gap-0.5"
          :title="todo.attachment_name || '附件'"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
          附件
        </span>
        <!-- Reminder -->
        <span
          v-if="todo.reminder_at"
          class="text-xs flex items-center gap-0.5"
          :class="isReminderOverdue ? 'text-red-500' : 'text-primary'"
          :title="'提醒: ' + formatReminder"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {{ formatReminder }}
        </span>
        <!-- Step progress -->
        <span v-if="todo.steps && todo.steps.length > 0" class="text-xs flex items-center gap-1">
          <svg class="w-3 h-3 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <span :class="stepProgressClass">{{ stepCompletedCount }}/{{ todo.steps.length }}</span>
        </span>
        <!-- Date -->
        <span v-if="showDate" class="text-xs text-content-tertiary flex items-center gap-0.5">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {{ dateLabel }}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        @click="$emit('edit', todo)"
        class="p-1.5 rounded-lg hover:bg-surface-tertiary text-content-tertiary hover:text-content transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>
      <button
        @click="$emit('delete', todo)"
        class="p-1.5 rounded-lg hover:bg-red-50 hover:bg-red-50/20 text-content-tertiary hover:text-red-500 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  todo: { type: Object, required: true },
  showDate: { type: Boolean, default: false },
  dragMousedown: { type: Function, default: null },
  dragging: { type: Boolean, default: false },
})

defineEmits(['toggle-status', 'edit', 'delete', 'detail'])

const dateLabel = computed(() => {
  if (!props.todo.todo_date) return ''
  const d = new Date(props.todo.todo_date + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '今日'
  if (diffDays === 1) return '昨日'
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const statusClass = computed(() => {
  if (props.todo.status === 'done') return 'bg-green-500 border-green-500'
  if (props.todo.status === 'in_progress') return 'border-primary bg-primary/10'
  return 'border-border hover:border-primary'
})

const priorityLabel = computed(() => {
  const map = { high: '高优先级', medium: '中优先级', low: '低优先级' }
  return map[props.todo.priority] || '中优先级'
})

const priorityColor = computed(() => {
  const map = {
    high: 'text-red-500',
    medium: 'text-amber-500',
    low: 'text-green-500',
  }
  return map[props.todo.priority] || 'text-amber-500'
})

const priorityDot = computed(() => {
  const map = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500' }
  return map[props.todo.priority] || 'bg-amber-500'
})

const recurrenceLabel = computed(() => {
  const map = { daily: '每日', weekly: '每周', monthly: '每月', yearly: '每年', workday: '工作日' }
  return map[props.todo.recurrence_type] || ''
})

const stepCompletedCount = computed(() => {
  if (!props.todo.steps) return 0
  return props.todo.steps.filter(s => s.completed).length
})

const stepProgressClass = computed(() => {
  if (!props.todo.steps || props.todo.steps.length === 0) return 'text-content-tertiary'
  const done = props.todo.steps.filter(s => s.completed).length
  if (done === props.todo.steps.length) return 'text-green-500'
  if (done > 0) return 'text-primary'
  return 'text-content-tertiary'
})

const formatReminder = computed(() => {
  const reminderAt = props.todo.reminder_at
  if (!reminderAt) return ''
  const d = new Date(reminderAt.replace(' ', 'T'))
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (target.getTime() === today.getTime()) {
    return `${hh}:${mm}`
  }
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`
})

const isReminderOverdue = computed(() => {
  if (!props.todo.reminder_at) return false
  const d = new Date(props.todo.reminder_at.replace(' ', 'T'))
  return isNaN(d.getTime()) ? false : d.getTime() < Date.now()
})
</script>
