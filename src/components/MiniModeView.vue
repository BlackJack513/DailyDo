<template>
  <div
    ref="rootEl"
    class="h-screen flex flex-col bg-surface bg-body overflow-hidden"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Collapsed hint overlay -->
    <div
      v-if="isCollapsed"
      class="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
    >
      <div
        class="flex items-center gap-1 px-2 py-1 rounded bg-black/50 text-white text-[10px] font-medium"
        :class="collapsedEdge === 'top' ? 'mt-1' : 'ml-1'"
      >
        <svg class="w-3 h-3" :class="collapsedEdge === 'top' ? 'rotate-180' : (collapsedEdge === 'left' ? '-rotate-90' : 'rotate-90')" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
        DailyDo
      </div>
    </div>

    <!-- Compact Header -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <span class="text-sm font-bold text-content">DailyDo</span>
      </div>
      <button
        @click="exitMiniMode"
        class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-content-tertiary hover:bg-surface-tertiary transition-colors"
        title="退出迷你模式"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
        退出
      </button>
    </div>

    <!-- Stats Bar -->
    <div class="flex items-center gap-3 px-4 py-2 flex-shrink-0">
      <div
        v-if="inProgressTodos.length > 0"
        class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
        进行中 {{ inProgressTodos.length }}
      </div>
      <div
        v-if="pendingTodos.length > 0"
        class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-tertiary text-content-secondary text-muted text-xs font-medium"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-content-tertiary"></span>
        待处理 {{ pendingTodos.length }}
      </div>
      <div v-if="inProgressTodos.length === 0 && pendingTodos.length === 0" class="text-xs text-green-500 font-medium">
        全部完成!
      </div>
    </div>

    <!-- Todo List -->
    <div class="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
      <!-- Empty state -->
      <EmptyState v-if="activeTodos.length === 0" text="暂无待办" :large="false" />

      <!-- Todo items -->
      <div
        v-for="todo in activeTodos"
        :key="todo.id"
        class="group flex items-start gap-2.5 p-2.5 rounded-lg border border-border hover:border-primary/30 transition-all bg-surface"
        :class="{ 'opacity-70': todo.status === 'done' }"
      >
        <!-- Status toggle -->
        <button
          @click="handleToggle(todo)"
          class="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
          :class="statusClass(todo)"
        >
          <svg v-if="todo.status === 'done'" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <div v-else-if="todo.status === 'in_progress'" class="w-1.5 h-1.5 rounded-full bg-primary"></div>
        </button>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p
            class="text-sm leading-tight font-medium"
            :class="{ 'line-through text-content-tertiary': todo.status === 'done' }"
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
          class="flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-surface-tertiary text-content-tertiary hover:text-content transition-all"
          title="编辑"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="px-3 py-2 border-t border-border flex-shrink-0">
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
      <div class="relative w-full bg-surface border-t border-border p-3 space-y-2">
        <input
          ref="quickInput"
          v-model="quickTitle"
          class="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-content placeholder-content-tertiary focus:outline-none focus:ring-1 focus:ring-primary/50"
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
            :class="quickPriority === p.value ? p.activeClass : 'border-border text-content-tertiary'"
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
              :class="
                quickTagIds.includes(tag.id)
                  ? 'border-current opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-75'
              "
              :style="{ backgroundColor: tag.color + '18', color: tag.color }"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2">
          <button
            @click="expandToFull"
            class="flex items-center gap-1 text-[10px] text-content-tertiary hover:text-primary transition-colors"
            title="展开到完整页面编辑"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            展开更多
          </button>
          <div class="flex gap-2">
            <button
              @click="showAddForm = false"
              class="px-4 py-1.5 rounded-lg text-xs text-content-tertiary hover:bg-surface-tertiary transition-colors"
            >
              取消
            </button>
            <button
              @click="quickAdd"
              class="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!quickTitle.trim()"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '../stores/app'
import { appWindow } from '@tauri-apps/api/window'
import EmptyState from '@/components/EmptyState.vue'

const store = useAppStore()

const showAddForm = ref(false)
const quickTitle = ref('')
const quickPriority = ref('medium')
const quickTagIds = ref([])
const quickInput = ref(null)
const rootEl = ref(null)

// Edge auto-hide state
const isCollapsed = ref(false)
const collapsedEdge = ref(null)       // 'top' | 'left' | 'right'
const expandedPos = ref(null)          // { x, y } saved before collapse
const expandedSize = ref(null)         // { width, height } saved before collapse
const isMouseOver = ref(false)
const expandCooldown = ref(false)      // prevent rapid collapse after expand
let positionTimer = null
let cooldownTimer = null

const MINI_WIDTH = 400
const MINI_HEIGHT = 540
const COLLAPSED_THICKNESS = 40         // collapsed strip thickness
const EDGE_THRESHOLD = 5               // px from screen edge to trigger collapse

const priorities = [
  { value: 'high', label: '高', activeClass: 'border-red-500 bg-red-50 text-red-500' },
  { value: 'medium', label: '中', activeClass: 'border-amber-500 bg-amber-50 text-amber-500' },
  { value: 'low', label: '低', activeClass: 'border-green-500 bg-green-50 bg-green-50/20 text-green-500' },
]

const activeTodos = computed(() => store.currentTodos.filter(t => t.status === 'pending' || t.status === 'in_progress'))
const inProgressTodos = computed(() => store.currentTodos.filter(t => t.status === 'in_progress'))
const pendingTodos = computed(() => store.currentTodos.filter(t => t.status === 'pending'))

function statusClass(todo) {
  if (todo.status === 'done') return 'bg-green-500 border-green-500'
  if (todo.status === 'in_progress') return 'border-primary bg-primary/10'
  return 'border-border hover:border-primary'
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
  const nextStatus = todo.status === 'pending' ? 'in_progress' : todo.status === 'in_progress' ? 'done' : 'pending'
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
  appWindow.setResizable(true)
  appWindow.setSize({ type: 'Physical', width: 1200, height: 800 })
  appWindow.center()
  stopPositionMonitor()
  store.pendingQuickAdd = {
    title: quickTitle.value.trim(),
    priority: quickPriority.value,
    tagIds: [...quickTagIds.value],
  }
}

async function handleEdit(todo) {
  store.isMiniMode = false
  await appWindow.setAlwaysOnTop(false)
  await appWindow.setResizable(true)
  await appWindow.setSize({ type: 'Physical', width: 1200, height: 800 })
  await appWindow.center()
  stopPositionMonitor()
  store.pendingEditTodo = todo
}

watch(showAddForm, async val => {
  if (val) {
    await nextTick()
    quickInput.value?.focus()
  }
})

async function exitMiniMode() {
  store.isMiniMode = false
  await appWindow.setAlwaysOnTop(false)
  await appWindow.setResizable(true)
  await appWindow.setSize({ type: 'Physical', width: 1200, height: 800 })
  await appWindow.center()
  stopPositionMonitor()
}

// ── Edge Auto-Hide ───────────────────────────────────────────────

function onMouseEnter() {
  isMouseOver.value = true
  if (isCollapsed.value) {
    doExpand()
  }
}

function onMouseLeave() {
  isMouseOver.value = false
}

function startPositionMonitor() {
  stopPositionMonitor()
  positionTimer = setInterval(() => checkEdgeAndCollapse(), 1000)
  // Also check immediately after a short delay to catch initial position
  setTimeout(() => checkEdgeAndCollapse(), 500)
}

function stopPositionMonitor() {
  if (positionTimer) {
    clearInterval(positionTimer)
    positionTimer = null
  }
  if (cooldownTimer) {
    clearTimeout(cooldownTimer)
    cooldownTimer = null
  }
  expandCooldown.value = false
}

async function checkEdgeAndCollapse() {
  // Don't collapse during cooldown after manual expand
  if (expandCooldown.value) return
  // Don't collapse if mouse is over the window
  if (isMouseOver.value) return
  // Don't collapse if already collapsed
  if (isCollapsed.value) return

  try {
    const pos = await appWindow.outerPosition()
    const size = await appWindow.innerSize()
    const screenW = window.screen.availWidth
    const screenH = window.screen.availHeight
    const x = pos.x
    const y = pos.y
    const w = size.width
    const h = size.height

    let edge = null
    if (y <= EDGE_THRESHOLD) {
      edge = 'top'
    } else if (x <= EDGE_THRESHOLD) {
      edge = 'left'
    } else if (x + w >= screenW - EDGE_THRESHOLD) {
      edge = 'right'
    }

    if (edge) {
      await doCollapse(edge, x, y, w, h)
    }
  } catch (e) {
    // Window might be closing, ignore
  }
}

async function doCollapse(edge, x, y, w, h) {
  isCollapsed.value = true
  collapsedEdge.value = edge
  expandedPos.value = { x, y }
  expandedSize.value = { width: w, height: h }

  if (edge === 'top') {
    // Collapse to a thin horizontal strip at the top
    await appWindow.setSize({ type: 'Physical', width: w, height: COLLAPSED_THICKNESS })
  } else if (edge === 'left') {
    // Collapse to a thin vertical strip at the left
    await appWindow.setSize({ type: 'Physical', width: COLLAPSED_THICKNESS, height: h })
  } else if (edge === 'right') {
    // Collapse to a thin vertical strip at the right, keep right edge aligned
    const screenW = window.screen.availWidth
    await appWindow.setPosition({ type: 'Physical', x: screenW - COLLAPSED_THICKNESS, y })
    await appWindow.setSize({ type: 'Physical', width: COLLAPSED_THICKNESS, height: h })
  }
}

async function doExpand() {
  if (!isCollapsed.value) return
  isCollapsed.value = false
  collapsedEdge.value = null

  const pos = expandedPos.value
  const size = expandedSize.value

  if (pos && size) {
    // Restore to the position/size before collapse
    await appWindow.setPosition({ type: 'Physical', x: pos.x, y: pos.y })
    await appWindow.setSize({ type: 'Physical', width: size.width, height: size.height })
  } else {
    // Fallback: default mini mode size at bottom-right
    const screenW = window.screen.availWidth
    const screenH = window.screen.availHeight
    await appWindow.setPosition({ type: 'Physical', x: screenW - MINI_WIDTH - 20, y: screenH - MINI_HEIGHT - 20 })
    await appWindow.setSize({ type: 'Physical', width: MINI_WIDTH, height: MINI_HEIGHT })
  }

  // Set cooldown to prevent immediate re-collapse
  expandCooldown.value = true
  if (cooldownTimer) clearTimeout(cooldownTimer)
  cooldownTimer = setTimeout(() => {
    expandCooldown.value = false
  }, 3000)
}

onMounted(() => {
  startPositionMonitor()
})

onBeforeUnmount(() => {
  stopPositionMonitor()
})
</script>
