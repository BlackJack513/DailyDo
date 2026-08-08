<template>
  <div class="h-screen flex flex-col bg-surface dark:bg-gray-900 overflow-hidden">
    <!-- Compact Header -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-border dark:border-gray-700 flex-shrink-0">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span class="text-sm font-bold text-content dark:text-gray-100">DailyDo</span>
      </div>
      <button
        @click="exitMiniMode"
        class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-content-tertiary dark:text-gray-400 hover:bg-surface-tertiary dark:hover:bg-gray-700 transition-colors"
        title="退出迷你模式"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        退出
      </button>
    </div>

    <!-- Stats Bar -->
    <div class="flex items-center gap-3 px-4 py-2 flex-shrink-0">
      <div v-if="inProgressTodos.length > 0" class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
        进行中 {{ inProgressTodos.length }}
      </div>
      <div v-if="pendingTodos.length > 0" class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-tertiary dark:bg-gray-700 text-content-secondary dark:text-gray-400 text-xs font-medium">
        <span class="w-1.5 h-1.5 rounded-full bg-content-tertiary dark:bg-gray-500"></span>
        待处理 {{ pendingTodos.length }}
      </div>
      <div v-if="inProgressTodos.length === 0 && pendingTodos.length === 0" class="text-xs text-green-500 font-medium">
        全部完成!
      </div>
    </div>

    <!-- Todo List -->
    <div class="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
      <!-- Empty state -->
      <div
        v-if="activeTodos.length === 0"
        class="flex flex-col items-center justify-center h-full text-content-tertiary dark:text-gray-500"
      >
        <svg class="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm font-medium">没有进行中的待办</p>
        <p class="text-xs mt-1 opacity-60">点击「新建」添加一个吧</p>
      </div>

      <!-- Todo items -->
      <div
        v-for="todo in activeTodos"
        :key="todo.id"
        class="group flex items-start gap-2.5 p-2.5 rounded-lg border border-border dark:border-gray-700 hover:border-primary/30 dark:hover:border-indigo-500/30 transition-all bg-white dark:bg-gray-800"
        :class="{ 'opacity-70': todo.status === 'done' }"
      >
        <!-- Status toggle -->
        <button
          @click="handleToggle(todo)"
          class="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
          :class="statusClass(todo)"
        >
          <svg v-if="todo.status === 'done'" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <div v-else-if="todo.status === 'in_progress'" class="w-1.5 h-1.5 rounded-full bg-primary"></div>
        </button>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p
            class="text-sm leading-tight font-medium"
            :class="{ 'line-through text-content-tertiary dark:text-gray-500': todo.status === 'done' }"
          >
            {{ todo.title }}
          </p>
          <div class="flex items-center gap-1.5 mt-1 flex-wrap">
            <span class="text-[10px]" :class="priorityColor(todo.priority)">
              {{ priorityLabel(todo.priority) }}
            </span>
            <span
              v-for="tag in todo.tags || []"
              :key="tag.id"
              class="inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium"
              :style="{ backgroundColor: tag.color + '20', color: tag.color }"
            >
              {{ tag.name }}
            </span>
          </div>
        </div>

        <!-- Edit button -->
        <button
          @click="handleEdit(todo)"
          class="flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-surface-tertiary dark:hover:bg-gray-700 text-content-tertiary hover:text-content dark:hover:text-gray-300 transition-all"
          title="编辑"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="px-3 py-2 border-t border-border dark:border-gray-700 flex-shrink-0">
      <button
        @click="showAddForm = !showAddForm"
        class="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新建待办
      </button>
    </div>

    <!-- Quick Add Form (inline) -->
    <div v-if="showAddForm" class="absolute inset-0 z-50 flex items-end">
      <div class="absolute inset-0 bg-black/30" @click="showAddForm = false"></div>
      <div class="relative w-full bg-surface dark:bg-gray-800 border-t border-border dark:border-gray-700 p-3 space-y-2">
        <input
          ref="quickInput"
          v-model="quickTitle"
          class="w-full bg-surface-secondary dark:bg-gray-700 border border-border dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-content dark:text-gray-100 placeholder-content-tertiary focus:outline-none focus:ring-1 focus:ring-primary/50"
          placeholder="输入待办标题..."
          @keydown.enter="quickAdd"
          autofocus
        />
        <div class="flex gap-2">
          <button
            v-for="p in priorities"
            :key="p.value"
            @click="quickPriority = p.value"
            class="flex-1 py-1.5 rounded text-[11px] font-medium border transition-colors"
            :class="quickPriority === p.value ? p.activeClass : 'border-border dark:border-gray-600 text-content-tertiary'"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Tags -->
        <div v-if="store.tags.length > 0">
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in store.tags"
              :key="tag.id"
              @click="toggleTag(tag.id)"
              class="text-[10px] px-2 py-0.5 rounded-full font-medium border transition-all cursor-pointer"
              :class="quickTagIds.includes(tag.id) ? 'border-current opacity-100' : 'border-transparent opacity-50 hover:opacity-75'"
              :style="{ backgroundColor: tag.color + '18', color: tag.color }"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2">
          <button
            @click="expandToFull"
            class="flex items-center gap-1 text-[10px] text-content-tertiary dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors"
            title="展开到完整页面编辑"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            展开更多
          </button>
          <div class="flex gap-2">
            <button @click="showAddForm = false" class="px-4 py-1.5 rounded-lg text-xs text-content-tertiary dark:text-gray-400 hover:bg-surface-tertiary dark:hover:bg-gray-700 transition-colors">取消</button>
            <button @click="quickAdd" class="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed" :disabled="!quickTitle.trim()">添加</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useAppStore } from '../stores/app'
import { appWindow } from '@tauri-apps/api/window'

const store = useAppStore()

const showAddForm = ref(false)
const quickTitle = ref('')
const quickPriority = ref('medium')
const quickTagIds = ref([])
const quickInput = ref(null)

const priorities = [
  { value: 'high', label: '高', activeClass: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-500' },
  { value: 'medium', label: '中', activeClass: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-500' },
  { value: 'low', label: '低', activeClass: 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-500' },
]

const activeTodos = computed(() =>
  store.currentTodos.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  )
)

const inProgressTodos = computed(() =>
  store.currentTodos.filter((t) => t.status === 'in_progress')
)

const pendingTodos = computed(() =>
  store.currentTodos.filter((t) => t.status === 'pending')
)

function statusClass(todo) {
  if (todo.status === 'done') return 'bg-green-500 border-green-500'
  if (todo.status === 'in_progress') return 'border-primary bg-primary/10'
  return 'border-border dark:border-gray-600 hover:border-primary'
}

function priorityLabel(p) {
  const map = { high: '高', medium: '中', low: '低' }
  return map[p] || '中'
}

function priorityColor(p) {
  const map = {
    high: 'text-red-500',
    medium: 'text-amber-500',
    low: 'text-green-500',
  }
  return map[p] || 'text-amber-500'
}

async function handleToggle(todo) {
  const nextStatus =
    todo.status === 'pending'
      ? 'in_progress'
      : todo.status === 'in_progress'
      ? 'done'
      : 'pending'
  await store.updateTodo({ ...todo, status: nextStatus })
}

function toggleTag(tagId) {
  const idx = quickTagIds.value.indexOf(tagId)
  if (idx >= 0) {
    quickTagIds.value.splice(idx, 1)
  } else {
    quickTagIds.value.push(tagId)
  }
}

async function quickAdd() {
  if (!quickTitle.value.trim()) return
  await store.addTodo({
    title: quickTitle.value.trim(),
    todo_date: store.currentDate,
    priority: quickPriority.value,
    tagIds: [...quickTagIds.value],
  })
  quickTitle.value = ''
  quickTagIds.value = []
  showAddForm.value = false
}

function expandToFull() {
  showAddForm.value = false
  store.isMiniMode = false
  appWindow.setAlwaysOnTop(false)
  appWindow.setSize({ type: 'Physical', width: 1200, height: 800 })
  appWindow.center()
  // After exiting mini mode, the main view will handle opening the add modal
  // We set a flag to trigger it
  store.pendingQuickAdd = {
    title: quickTitle.value.trim(),
    priority: quickPriority.value,
    tagIds: [...quickTagIds.value],
  }
}

async function handleEdit(todo) {
  store.isMiniMode = false
  await appWindow.setAlwaysOnTop(false)
  await appWindow.setSize({ type: 'Physical', width: 1200, height: 800 })
  await appWindow.center()
  store.pendingEditTodo = todo
}

watch(showAddForm, async (val) => {
  if (val) {
    await nextTick()
    quickInput.value?.focus()
  }
})

async function exitMiniMode() {
  store.isMiniMode = false
  await appWindow.setAlwaysOnTop(false)
  await appWindow.setSize({ type: 'Physical', width: 1200, height: 800 })
  await appWindow.center()
}
</script>
