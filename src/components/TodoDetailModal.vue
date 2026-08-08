<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="$emit('close')">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>

        <!-- Modal -->
        <div class="relative w-full max-w-xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">待办详情</h3>
            <button @click="$emit('close')" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            <!-- Title -->
            <h2 class="text-lg font-bold text-gray-900 dark:text-gray-50 leading-relaxed">{{ todo?.title }}</h2>

            <!-- Meta badges -->
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" :class="statusClass">
                <span class="w-1.5 h-1.5 rounded-full" :class="statusDotClass"></span>
                {{ statusLabel }}
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" :class="priorityClass">
                <span class="w-1.5 h-1.5 rounded-full" :class="priorityDotClass"></span>
                {{ priorityLabel }}
              </span>
              <span v-if="todo?.due_date" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                截止 {{ todo.due_date }}
              </span>
              <span class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ todo?.todo_date }}
              </span>
              <span v-if="todo?.recurrence_type && todo.recurrence_type !== 'none'" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {{ recurrenceLabel }}
              </span>
            </div>

            <!-- Tags -->
            <div v-if="todo?.tags && todo.tags.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="tag in todo.tags"
                :key="tag.id"
                class="text-xs px-2.5 py-1 rounded-full font-medium"
                :style="{ backgroundColor: tag.color + '18', color: tag.color }"
              >
                {{ tag.name }}
              </span>
            </div>

            <!-- Steps -->
            <div v-if="todo?.steps && todo.steps.length > 0" class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">任务步骤</p>
                <span class="text-xs text-gray-400 dark:text-gray-500">{{ stepCompleted }}/{{ todo.steps.length }} 已完成</span>
              </div>
              <!-- Progress bar -->
              <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="stepCompleted === todo.steps.length ? 'bg-green-500' : 'bg-primary'"
                  :style="{ width: (stepCompleted / todo.steps.length * 100) + '%' }"
                ></div>
              </div>
              <div class="space-y-1">
                <button
                  v-for="(step, index) in todo.steps"
                  :key="step.id || index"
                  @click="$emit('toggle-step', step)"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 group"
                >
                  <span
                    class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                    :class="step.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-primary'"
                  >
                    <svg v-if="step.completed" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </span>
                  <span class="text-sm" :class="step.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-200'">
                    {{ step.title }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="todo?.notes" class="space-y-2">
              <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">备注</p>
              <div
                class="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                v-html="todo.notes"
              ></div>
            </div>

            <!-- Attachment -->
            <div v-if="todo?.attachment_path" class="space-y-2">
              <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">附件</p>
              <div class="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <div class="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ todo.attachment_name }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">{{ formatSize(todo.attachment_size) }}</p>
                </div>
                <div class="flex items-center gap-1.5">
                  <button
                    @click="showInExplorer"
                    :disabled="opening"
                    class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="在文件资源管理器中显示"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    定位
                  </button>
                  <button
                    @click="openAttachment"
                    :disabled="opening"
                    class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg v-if="opening" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {{ opening ? '打开中...' : '打开' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
            <p class="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              双击待办卡片可查看详情
            </p>
            <button @click="$emit('delete', todo)" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              删除
            </button>
          </div>
        </div>
      </div>
    </Transition>
    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="toast.show" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 pointer-events-none"
        :class="toast.type === 'success' ? 'bg-emerald-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-700 text-white'"
      >
        <svg v-if="toast.type === 'success'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else-if="toast.type === 'error'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        {{ toast.message }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/tauri'

const props = defineProps({
  show: Boolean,
  todo: { type: Object, default: null },
})

const emit = defineEmits(['close', 'delete', 'toggle-step'])

const opening = ref(false)
const toast = ref({ show: false, message: '', type: 'info' })

let toastTimer = null
function showToast(message, type = 'info') {
  toast.value = { show: true, message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.show = false }, 2500)
}

const stepCompleted = computed(() => {
  if (!props.todo?.steps) return 0
  return props.todo.steps.filter(s => s.completed).length
})

const statusLabel = computed(() => {
  const map = { pending: '待处理', in_progress: '进行中', done: '已完成' }
  return map[props.todo?.status] || '待处理'
})

const statusClass = computed(() => {
  const map = {
    pending: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    in_progress: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    done: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  }
  return map[props.todo?.status] || map.pending
})

const statusDotClass = computed(() => {
  const map = { pending: 'bg-amber-500', in_progress: 'bg-blue-500', done: 'bg-emerald-500' }
  return map[props.todo?.status] || 'bg-amber-500'
})

const priorityLabel = computed(() => {
  const map = { high: '高优先级', medium: '中优先级', low: '低优先级' }
  return map[props.todo?.priority] || '中优先级'
})

const priorityClass = computed(() => {
  const map = {
    high: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    medium: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    low: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  }
  return map[props.todo?.priority] || map.medium
})

const priorityDotClass = computed(() => {
  const map = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' }
  return map[props.todo?.priority] || 'bg-amber-500'
})

const recurrenceLabel = computed(() => {
  const map = { daily: '每日', weekly: '每周', monthly: '每月', yearly: '每年', workday: '工作日' }
  return map[props.todo?.recurrence_type] || ''
})

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function openAttachment() {
  if (opening.value || !props.todo?.attachment_path) return
  opening.value = true
  try {
    await invoke('open_attachment', { filePath: props.todo.attachment_path })
    showToast('附件已打开', 'success')
  } catch (e) {
    console.error('Failed to open attachment:', e)
    showToast('打开失败：' + (e.message || e), 'error')
  } finally {
    opening.value = false
  }
}

async function showInExplorer() {
  if (opening.value || !props.todo?.attachment_path) return
  opening.value = true
  try {
    await invoke('show_attachment_in_explorer', { filePath: props.todo.attachment_path })
    showToast('已在文件资源管理器中定位', 'success')
  } catch (e) {
    console.error('Failed to show in explorer:', e)
    showToast('定位失败：' + (e.message || e), 'error')
  } finally {
    opening.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .animate-in {
  transform: scale(0.95) translateY(10px);
}
.modal-leave-to {
  opacity: 0;
}
.modal-leave-to .animate-in {
  transform: scale(0.95) translateY(10px);
}
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}
</style>
