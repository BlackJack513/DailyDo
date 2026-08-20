<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>
      <div class="relative bg-surface rounded-2xl shadow-2xl border border-border w-[420px] max-h-[70vh] flex flex-col">
        <!-- Header -->
        <div class="px-5 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 class="text-base font-semibold text-content">历史记录</h2>
            <p class="text-xs text-content-tertiary mt-0.5 truncate max-w-[280px]">{{ todoTitle }}</p>
          </div>
          <button
            @click="handleClose"
            class="p-1.5 rounded-lg hover:bg-surface-tertiary text-content-tertiary hover:text-content transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Timeline -->
        <div class="flex-1 overflow-y-auto px-5 py-4">
          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span class="ml-2 text-sm text-content-tertiary">加载中...</span>
          </div>

          <EmptyState v-else-if="logs.length === 0" text="暂无活动记录" :large="false" />

          <div v-else class="relative">
            <!-- Vertical line -->
            <div class="absolute left-[11px] top-2 bottom-2 w-px bg-border"></div>

            <div v-for="(log, index) in logs" :key="log.id" class="relative flex gap-3 pb-4 last:pb-0">
              <!-- Dot -->
              <div
                class="relative z-10 flex-shrink-0 w-[23px] h-[23px] rounded-full flex items-center justify-center border-2"
                :class="getDotClass(log.action)"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" :d="getDotIcon(log.action)" />
                </svg>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0 pt-0.5">
                <p class="text-sm text-content leading-tight">{{ getActionText(log) }}</p>
                <p class="text-xs text-content-tertiary mt-1">{{ formatTime(log.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-border flex justify-end flex-shrink-0">
          <button
            @click="handleClose"
            class="px-4 py-1.5 rounded-lg text-sm text-content-tertiary hover:bg-surface-tertiary transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import * as db from '../utils/db'
import EmptyState from '@/components/EmptyState.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  todoId: { type: Number, default: null },
  todoTitle: { type: String, default: '' },
  todoCreatedAt: { type: String, default: null },
})

const emit = defineEmits(['close'])

const logs = ref([])
const loading = ref(false)

watch(
  () => props.show,
  async val => {
    if (val && props.todoId) {
      loading.value = true
      try {
        logs.value = await db.getActivityLogsByTodoId(props.todoId)
      } catch (e) {
        console.error('Failed to load activity logs:', e)
        logs.value = []
      }
      loading.value = false
    } else {
      logs.value = []
    }
  },
)

function handleClose() {
  emit('close')
}

function getDotClass(action) {
  const map = {
    created: 'bg-green-500/20 border-green-500 text-green-500',
    status_changed: 'bg-blue-500/20 border-blue-500 text-blue-500',
    step_completed: 'bg-emerald-500/20 border-emerald-500 text-emerald-500',
    step_reopened: 'bg-amber-500/20 border-amber-500 text-amber-500',
    deleted: 'bg-red-500/20 border-red-500 text-red-500',
    restored: 'bg-teal-500/20 border-teal-500 text-teal-500',
  }
  return map[action] || 'bg-gray-500/20 border-gray-500 text-gray-500'
}

function getDotIcon(action) {
  const map = {
    created: 'M12 4v16m8-8H4',
    status_changed: 'M13 7l5 5-5 5M4 7l5 5-5 5',
    step_completed: 'M5 13l4 4L19 7',
    step_reopened: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    deleted: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6',
    restored: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
  }
  return map[action] || 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
}

function getStatusLabel(status) {
  const map = {
    pending: '待处理',
    in_progress: '进行中',
    done: '已完成',
    blocked: '等待中',
  }
  return map[status] || status || '未知'
}

function getActionText(log) {
  switch (log.action) {
    case 'created':
      return '创建了待办'
    case 'status_changed':
      return `状态从「${getStatusLabel(log.old_status)}」变为「${getStatusLabel(log.new_status)}」`
    case 'step_completed':
      return `完成了子步骤「${log.detail || ''}」`
    case 'step_reopened':
      return `重新打开了子步骤「${log.detail || ''}」`
    case 'deleted':
      return '移入了回收站'
    case 'restored':
      return '从回收站恢复'
    default:
      return log.action
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '暂无'
  try {
    const d = new Date(timeStr.replace(' ', 'T'))
    if (isNaN(d.getTime())) return timeStr
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    const sec = String(d.getSeconds()).padStart(2, '0')
    return `${month}-${day} ${hour}:${min}:${sec}`
  } catch {
    return timeStr
  }
}
</script>
