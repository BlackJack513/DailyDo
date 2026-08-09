<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="px-8 pt-6 pb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-content dark:text-gray-100">待办列表</h1>
        <p class="text-sm text-content-tertiary dark:text-gray-500 mt-0.5">
          {{ pendingTodos.length }} 待处理 · {{ inProgressTodos.length }} 进行中 · {{ doneTodos.length }} 已完成
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="openTemplatePicker" class="btn-secondary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          从模板创建
        </button>
        <button @click="openNewTodoModal" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建待办
        </button>
      </div>
    </div>

    <!-- Quick Add -->
    <div class="px-8 pb-4">
      <div class="flex items-center gap-3 bg-surface-secondary dark:bg-gray-800 border border-border dark:border-gray-700 rounded-xl px-4 py-3">
        <svg class="w-5 h-5 text-content-tertiary dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <input
          v-model="quickTitle"
          @keydown.enter="quickAdd"
          class="flex-1 bg-transparent text-sm text-content dark:text-gray-100 placeholder-content-tertiary outline-none"
          placeholder="快速添加待办，按回车确认..."
        />
        <button
          v-if="quickTitle.trim()"
          @click="quickAdd"
          class="text-primary hover:text-primary-hover text-sm font-medium"
        >
          添加
        </button>
      </div>
    </div>

    <!-- Kanban Board (wide screen) -->
    <div class="flex-1 px-8 pb-6 overflow-y-auto hidden lg:block">
      <!-- Today's Kanban Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="text-sm font-semibold text-content dark:text-gray-200">今日待办</span>
          <span class="text-xs text-content-tertiary dark:text-gray-500">{{ store.currentDate }}</span>
        </div>
        <button
          @click="toggleAllColumns"
          class="flex items-center gap-1.5 text-xs text-content-tertiary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-secondary dark:hover:bg-gray-800"
        >
          <svg
            class="w-3.5 h-3.5 transition-transform duration-200"
            :class="{ 'rotate-[-90deg]': allCollapsed }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          {{ allCollapsed ? '全部展开' : '全部折叠' }}
        </button>
      </div>
      <!-- Use flex-wrap so collapsed columns shrink and historical items flow up -->
      <div class="flex flex-wrap gap-4">
        <!-- Pending Column -->
        <KanbanColumn
          title="待处理"
          :todos="pendingTodos"
          status-color="border-amber-400"
          badge-color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          @drop="handleDrop"
          @toggle="handleToggle"
          @edit="handleEdit"
          @delete="handleDelete"
          @detail="handleDetail"
        />
        <!-- In Progress Column -->
        <KanbanColumn
          title="进行中"
          :todos="inProgressTodos"
          status-color="border-blue-400"
          badge-color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          @drop="handleDrop"
          @toggle="handleToggle"
          @edit="handleEdit"
          @delete="handleDelete"
          @detail="handleDetail"
        />
        <!-- Done Column -->
        <KanbanColumn
          title="已完成"
          :todos="doneTodos"
          status-color="border-green-400"
          badge-color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          @drop="handleDrop"
          @toggle="handleToggle"
          @edit="handleEdit"
          @delete="handleDelete"
          @detail="handleDetail"
        />
      </div>

      <!-- Historical Incomplete Todos (below kanban) -->
      <div v-if="historicalGroups.length > 0" class="mt-8">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex-1 h-px bg-border dark:bg-gray-700"></div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-content-tertiary dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm font-semibold text-content-tertiary dark:text-gray-400">历史未完成</span>
          </div>
          <div class="flex-1 h-px bg-border dark:bg-gray-700"></div>
        </div>
        <div class="space-y-4">
        <div v-for="group in historicalGroups" :key="group.date" class="space-y-2">
          <h3 class="text-xs font-semibold text-content-tertiary dark:text-gray-500 uppercase tracking-wider">
            {{ group.label }} <span class="font-normal normal-case">· {{ group.todos.length }} 项未完成</span>
          </h3>
          <TodoItem
            v-for="todo in group.todos"
            :key="todo.id"
            :todo="todo"
            :show-date="true"
            :drag-mousedown="onHistMouseDown"
            :dragging="histDragState && histDragState.todo.id === todo.id"
            @toggle-status="handleToggle"
            @edit="handleEdit"
            @delete="handleDelete"
            @detail="handleDetail"
          />
        </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="store.currentTodos.length === 0 && historicalGroups.length === 0" class="flex flex-col items-center justify-center h-64 text-content-tertiary dark:text-gray-500">
        <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p class="text-sm">还没有待办事项</p>
        <p class="text-xs mt-1">点击上方按钮或快速添加开始记录</p>
      </div>
    </div>

    <!-- Compact List (narrow screen) -->
    <div class="flex-1 px-4 pb-6 overflow-y-auto lg:hidden">
      <!-- Today's Todos -->
      <div class="flex items-center gap-2 mb-3">
        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span class="text-sm font-semibold text-content dark:text-gray-200">今日待办</span>
      </div>
      <div class="space-y-2">
        <CompactTodoItem
          v-for="todo in store.currentTodos"
          :key="todo.id"
          :todo="todo"
          @toggle="handleToggle"
          @edit="handleEdit"
          @delete="handleDelete"
          @detail="handleDetail"
        />
      </div>

      <!-- Historical Incomplete Todos -->
      <div v-if="historicalGroups.length > 0" class="mt-6">
        <div class="flex items-center gap-3 mb-3">
          <div class="flex-1 h-px bg-border dark:bg-gray-700"></div>
          <span class="text-xs font-semibold text-content-tertiary dark:text-gray-400">历史未完成</span>
          <div class="flex-1 h-px bg-border dark:bg-gray-700"></div>
        </div>
        <div v-for="group in historicalGroups" :key="group.date" class="mt-3 space-y-2">
          <h3 class="text-xs font-semibold text-content-tertiary dark:text-gray-500 uppercase tracking-wider">
            {{ group.label }} <span class="font-normal normal-case">· {{ group.todos.length }} 项未完成</span>
          </h3>
          <CompactTodoItem
            v-for="todo in group.todos"
            :key="todo.id"
            :todo="todo"
            :drag-mousedown="onHistMouseDown"
            :dragging="histDragState && histDragState.todo.id === todo.id"
            @toggle="handleToggle"
            @edit="handleEdit"
            @delete="handleDelete"
            @detail="handleDetail"
          />
        </div>
      </div>

      <!-- Empty -->
      <div v-if="store.currentTodos.length === 0 && historicalGroups.length === 0" class="flex flex-col items-center justify-center h-64 text-content-tertiary dark:text-gray-500">
        <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p class="text-sm">还没有待办事项</p>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <AddTodoModal
      :show="showFullModal"
      :todo="editingTodo"
      :locked-fields="modalLockedFields"
      @close="closeFullModal"
      @submit="handleSubmit"
    />

    <!-- Detail Modal -->
    <TodoDetailModal
      :show="showDetailModal"
      :todo="detailTodo"
      @close="closeDetailModal"
      @delete="handleDetailDelete"
      @toggle-step="handleStepToggle"
    />

    <!-- Double-click hint -->
    <div v-if="store.currentTodos.length > 0" class="px-8 pb-2 hidden lg:block">
      <p class="text-xs text-content-tertiary dark:text-gray-600 flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        双击待办卡片可查看详情
      </p>
    </div>

    <!-- Template Picker Modal -->
    <div v-if="showTemplatePicker" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showTemplatePicker = false"></div>
      <div class="relative w-full max-w-md mx-4 bg-surface dark:bg-gray-800 rounded-2xl shadow-2xl border border-border dark:border-gray-700">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border dark:border-gray-700">
          <h3 class="text-lg font-semibold text-content dark:text-gray-100">从模板创建待办</h3>
          <button @click="showTemplatePicker = false" class="p-1 rounded-lg hover:bg-surface-tertiary dark:hover:bg-gray-700 text-content-tertiary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Template List -->
        <div class="px-6 py-4 max-h-[50vh] overflow-y-auto">
          <div v-if="templateList.length === 0 && !templateLoading" class="text-center py-8 text-content-tertiary dark:text-gray-500">
            <p class="text-sm">暂无模板</p>
            <p class="text-xs mt-1">请先在「模板管理」中创建模板</p>
          </div>
          <div v-else class="space-y-2">
            <button
              v-for="tpl in templateList"
              :key="tpl.id"
              @click="createFromTemplate(tpl)"
              class="w-full text-left p-3 rounded-xl border border-border dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-content dark:text-gray-100 truncate">{{ tpl.name }}</h4>
                  <p class="text-sm text-content-secondary dark:text-gray-400 truncate mt-0.5">{{ tpl.title }}</p>
                </div>
                <svg class="w-4 h-4 text-content-tertiary group-hover:text-primary transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div class="flex flex-wrap items-center gap-1.5 mt-2">
                <span class="text-xs px-1.5 py-0.5 rounded font-medium" :class="tplPriorityClass(tpl.priority)">{{ tplPriorityLabel(tpl.priority) }}</span>
                <span v-if="tpl.recurrence_type && tpl.recurrence_type !== 'none'" class="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
                  {{ tplRecurrenceLabel(tpl.recurrence_type) }}
                </span>
                <span v-if="getTplLockedCount(tpl) > 0" class="text-xs px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-500 font-medium">
                  {{ getTplLockedCount(tpl) }} 个锁定字段
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deletingTodo" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="deletingTodo = null"></div>
      <div class="relative bg-surface dark:bg-gray-800 rounded-2xl shadow-2xl border border-border dark:border-gray-700 p-6 w-80">
        <h3 class="text-lg font-semibold text-content dark:text-gray-100 mb-2">移入回收站</h3>
        <p class="text-sm text-content-secondary dark:text-gray-400 mb-4">确定要将「{{ deletingTodo.title }}」移入回收站吗？回收站中的项目将在 7 天后自动删除。</p>
        <div class="flex justify-end gap-3">
          <button @click="deletingTodo = null" class="btn-secondary">取消</button>
          <button @click="confirmDelete" class="btn-danger">删除</button>
        </div>
      </div>
    </div>

    <!-- Historical Drag Ghost Element -->
    <Teleport to="body">
      <div
        v-if="histDragState && histDragState.active"
        data-drag-ghost
        class="fixed z-[9999] pointer-events-none"
        :style="{
          left: histDragState.x + 'px',
          top: histDragState.y + 'px',
          transform: 'translate(-50%, -50%) rotate(3deg)',
          opacity: 0.9
        }"
      >
        <div class="flex items-start gap-3 p-3 rounded-xl border-2 border-primary bg-surface dark:bg-gray-800 shadow-2xl min-w-[250px] max-w-[320px]">
          <div class="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center border-border dark:border-gray-600"></div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium leading-tight text-content dark:text-gray-100 truncate">{{ histDragState.todo.title }}</p>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="inline-flex items-center gap-1 text-xs" :class="getHistPriorityColor(histDragState.todo.priority)">
                <span class="w-1.5 h-1.5 rounded-full" :class="getHistPriorityDot(histDragState.todo.priority)"></span>
                {{ getHistPriorityLabel(histDragState.todo.priority) }}
              </span>
              <span
                v-for="tag in histDragState.todo.tags || []"
                :key="tag.id"
                class="tag-badge text-xs px-1.5 py-0.5 rounded"
                :style="{ backgroundColor: tag.color + '20', color: tag.color }"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Historical Drag Warning Dialog -->
    <div v-if="showHistWarning" class="fixed inset-0 z-[10000] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div class="relative bg-surface dark:bg-gray-800 rounded-2xl shadow-2xl border border-border dark:border-gray-700 p-6 w-96 mx-4">
        <h3 class="text-lg font-semibold text-content dark:text-gray-100 mb-2">将历史待办移入今日</h3>
        <p class="text-sm text-content-secondary dark:text-gray-400 mb-4">
          此操作会将「{{ histDragTodo?.title }}」的日期重置为今天（{{ store.currentDate }}），并设置状态为「{{ getHistStatusLabel(histDragTargetStatus) }}」。
          该操作不可逆，原始日期的记录将被修改。
        </p>
        <label class="flex items-center gap-2 mb-5 cursor-pointer select-none">
          <input type="checkbox" v-model="skipHistWarning" class="w-4 h-4 rounded border-border dark:border-gray-600" />
          <span class="text-sm text-content-secondary dark:text-gray-400">不再提醒</span>
        </label>
        <div class="flex justify-end gap-3">
          <button @click="cancelHistDrag" class="btn-secondary">取消</button>
          <button @click="confirmHistDrag" class="btn-primary">确认移动</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '../stores/app'
import * as db from '../utils/db'
import TodoItem from '../components/TodoItem.vue'
import AddTodoModal from '../components/AddTodoModal.vue'
import TodoDetailModal from '../components/TodoDetailModal.vue'
import KanbanColumn from '../components/KanbanColumn.vue'
import CompactTodoItem from '../components/CompactTodoItem.vue'

const store = useAppStore()

const showFullModal = ref(false)
const editingTodo = ref(null)
const deletingTodo = ref(null)
const quickTitle = ref('')
const allCollapsed = ref(false)
const detailTodo = ref(null)
const showDetailModal = ref(false)
const showTemplatePicker = ref(false)
const templateList = ref([])
const templateLoading = ref(false)
const modalLockedFields = ref([])

// Historical drag state
const histDragState = ref(null) // { todo, startX, startY, x, y, active, targetStatus }
const histDragTodo = ref(null)
const histDragTargetStatus = ref('pending')
const showHistWarning = ref(false)
const skipHistWarning = ref(false)
const HIST_DRAG_THRESHOLD = 5

const pendingTodos = computed(() =>
  store.currentTodos.filter((t) => t.status === 'pending')
)
const inProgressTodos = computed(() =>
  store.currentTodos.filter((t) => t.status === 'in_progress')
)
const doneTodos = computed(() =>
  store.currentTodos.filter((t) => t.status === 'done')
)

// Group historical incomplete todos by date
const historicalGroups = computed(() => {
  const today = formatDateStr(new Date())
  const yesterday = formatDateStr(new Date(Date.now() - 86400000))
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  const pastIncomplete = store.incompleteTodos.filter((t) => t.todo_date < today)

  const groupMap = {}
  for (const todo of pastIncomplete) {
    const date = todo.todo_date
    if (!groupMap[date]) {
      let label
      if (date === yesterday) {
        label = '昨日'
      } else {
        const d = new Date(date + 'T00:00:00')
        label = `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
      }
      groupMap[date] = { date, label, todos: [] }
    }
    groupMap[date].todos.push(todo)
  }

  for (const group of Object.values(groupMap)) {
    group.todos.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
      return bTime - aTime
    })
  }

  return Object.values(groupMap).sort((a, b) => b.date.localeCompare(a.date))
})

function formatDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(async () => {
  await store.loadTags()
  await store.loadTodosForDate(store.currentDate)
  await store.loadIncompleteTodos()
  await store.loadOverviewStats()

  // Load skip warning preference
  try {
    const skip = await db.getSetting('skip_historical_drag_warning')
    if (skip === 'true') skipHistWarning.value = true
  } catch (e) {
    console.error('Failed to load skip warning setting:', e)
  }

  // Check if we're returning from mini mode with pending data
  if (store.pendingQuickAdd) {
    const data = store.pendingQuickAdd
    editingTodo.value = {
      title: data.title || '',
      priority: data.priority || 'medium',
      tags: (data.tagIds || []).map(id => store.tags.find(t => t.id === id)).filter(Boolean),
      todo_date: store.currentDate,
      _isNew: true,
    }
    showFullModal.value = true
    store.pendingQuickAdd = null
  } else if (store.pendingEditTodo) {
    editingTodo.value = store.pendingEditTodo
    showFullModal.value = true
    store.pendingEditTodo = null
  }
})

onUnmounted(() => {
  // Clean up any lingering drag listeners
  document.removeEventListener('mousemove', onHistMouseMove)
  document.removeEventListener('mouseup', onHistMouseUp)
})

// Watch for mini mode → full mode transitions
watch(() => store.pendingQuickAdd, (data) => {
  if (data) {
    editingTodo.value = {
      title: data.title || '',
      priority: data.priority || 'medium',
      tags: (data.tagIds || []).map(id => store.tags.find(t => t.id === id)).filter(Boolean),
      todo_date: store.currentDate,
      _isNew: true,
    }
    showFullModal.value = true
    store.pendingQuickAdd = null
  }
})

watch(() => store.pendingEditTodo, (todo) => {
  if (todo) {
    editingTodo.value = todo
    showFullModal.value = true
    store.pendingEditTodo = null
  }
})

async function quickAdd() {
  if (!quickTitle.value.trim()) return
  await store.addTodo({
    title: quickTitle.value.trim(),
    todo_date: store.currentDate,
    priority: 'medium',
  })
  quickTitle.value = ''
  await store.loadOverviewStats()
  await store.loadIncompleteTodos()
}

async function handleToggle(todo) {
  await store.toggleTodoStatus(todo)
  await store.loadOverviewStats()
  await store.loadIncompleteTodos()
}

async function handleDrop({ todoId, newStatus }) {
  const todo = store.currentTodos.find((t) => t.id === todoId)
  if (!todo || todo.status === newStatus) return
  await store.updateTodo({ ...todo, status: newStatus })
  await store.loadOverviewStats()
  await store.loadIncompleteTodos()
}

function handleEdit(todo) {
  editingTodo.value = todo
  showFullModal.value = true
}

function openNewTodoModal() {
  editingTodo.value = null
  showFullModal.value = true
}

function handleDelete(todo) {
  deletingTodo.value = todo
}

function handleDetail({ todo }) {
  detailTodo.value = todo
  showDetailModal.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  detailTodo.value = null
}

function handleDetailDelete(todo) {
  closeDetailModal()
  deletingTodo.value = todo
}

async function handleStepToggle(step) {
  await store.toggleStep(step.id)
  // Reload the detail todo to reflect updated steps/status
  if (detailTodo.value) {
    const updated = store.currentTodos.find(t => t.id === detailTodo.value.id)
    if (updated) {
      detailTodo.value = updated
    }
  }
}

async function confirmDelete() {
  if (deletingTodo.value) {
    await store.removeTodo(deletingTodo.value.id)
    deletingTodo.value = null
    await store.loadOverviewStats()
    await store.loadIncompleteTodos()
  }
}

async function handleSubmit(data) {
  if (editingTodo.value && !editingTodo.value._isNew) {
    await store.updateTodo(data)
  } else {
    await store.addTodo(data)
  }
  closeFullModal()
  await store.loadOverviewStats()
  await store.loadIncompleteTodos()
}

function closeFullModal() {
  showFullModal.value = false
  editingTodo.value = null
  modalLockedFields.value = []
}

async function openTemplatePicker() {
  showTemplatePicker.value = true
  templateLoading.value = true
  try {
    templateList.value = await db.getAllTemplates()
  } catch (e) {
    templateList.value = []
  } finally {
    templateLoading.value = false
  }
}

async function createFromTemplate(tpl) {
  showTemplatePicker.value = false

  // Parse locked fields
  let locked = []
  try {
    locked = JSON.parse(tpl.locked_fields || '[]')
  } catch {
    locked = []
  }
  modalLockedFields.value = locked

  // Parse tags
  let tagIds = []
  try {
    tagIds = JSON.parse(tpl.tag_ids || '[]')
  } catch {
    tagIds = []
  }

  // Load template steps
  let steps = []
  try {
    const tplSteps = await db.getTemplateSteps(tpl.id)
    steps = tplSteps.map(s => ({ title: s.title, completed: false }))
  } catch {
    steps = []
  }

  // Open modal with pre-filled template data
  editingTodo.value = {
    title: tpl.title || '',
    priority: tpl.priority || 'medium',
    tags: tagIds.map(id => store.tags.find(t => t.id === id)).filter(Boolean),
    todo_date: store.currentDate,
    _isNew: true,
    _templateData: {
      recurrence_type: tpl.recurrence_type || 'none',
      recurrence_config: tpl.recurrence_config || '{}',
      steps,
    },
  }
  showFullModal.value = true
}

function tplPriorityClass(p) {
  if (p === 'high') return 'bg-red-50 dark:bg-red-900/20 text-red-500'
  if (p === 'low') return 'bg-green-50 dark:bg-green-900/20 text-green-500'
  return 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'
}

function tplPriorityLabel(p) {
  if (p === 'high') return '高优先级'
  if (p === 'low') return '低优先级'
  return '中优先级'
}

function tplRecurrenceLabel(r) {
  const map = { workday: '工作日', daily: '每日', weekly: '每周', monthly: '每月' }
  return map[r] || r
}

function getTplLockedCount(tpl) {
  try {
    const fields = JSON.parse(tpl.locked_fields || '[]')
    return Array.isArray(fields) ? fields.length : 0
  } catch {
    return 0
  }
}

function toggleAllColumns() {
  allCollapsed.value = !allCollapsed.value
  window.dispatchEvent(new CustomEvent('kanban-collapse-all', {
    detail: { collapsed: allCollapsed.value }
  }))
}

// ─── Historical Todo Drag & Drop ──────────────────────
function onHistMouseDown(e, todo) {
  // Don't start drag from buttons
  const tag = e.target.tagName
  if (tag === 'BUTTON' || e.target.closest('button')) return
  if (e.button !== 0) return
  e.preventDefault()

  histDragState.value = {
    todo,
    startX: e.clientX,
    startY: e.clientY,
    x: e.clientX,
    y: e.clientY,
    active: false,
    targetStatus: 'pending',
  }

  document.addEventListener('mousemove', onHistMouseMove)
  document.addEventListener('mouseup', onHistMouseUp)
}

function onHistMouseMove(e) {
  if (!histDragState.value) return

  const dx = e.clientX - histDragState.value.startX
  const dy = e.clientY - histDragState.value.startY

  if (!histDragState.value.active && (Math.abs(dx) > HIST_DRAG_THRESHOLD || Math.abs(dy) > HIST_DRAG_THRESHOLD)) {
    histDragState.value.active = true
  }

  if (histDragState.value.active) {
    histDragState.value.x = e.clientX
    histDragState.value.y = e.clientY
    histDragState.value.targetStatus = detectHoverColumn(e.clientX, e.clientY)
  }
}

function detectHoverColumn(x, y) {
  // Temporarily hide ghost so elementFromPoint can see through
  const ghostEls = document.querySelectorAll('[data-drag-ghost]')
  ghostEls.forEach(el => { el.style.display = 'none' })

  const el = document.elementFromPoint(x, y)

  // Restore ghost
  ghostEls.forEach(el => { el.style.display = '' })

  if (!el) return 'pending'

  let target = el
  while (target && target !== document.body) {
    if (target.hasAttribute && target.hasAttribute('data-kanban-column')) {
      const titleEl = target.querySelector('.text-sm.font-semibold')
      if (titleEl) {
        const colTitle = titleEl.textContent.trim()
        const statusMap = { '待处理': 'pending', '进行中': 'in_progress', '已完成': 'done' }
        return statusMap[colTitle] || 'pending'
      }
    }
    target = target.parentElement
  }

  return 'pending'
}

function onHistMouseUp(e) {
  document.removeEventListener('mousemove', onHistMouseMove)
  document.removeEventListener('mouseup', onHistMouseUp)

  if (!histDragState.value) return

  const wasActive = histDragState.value.active
  const todo = histDragState.value.todo
  const targetStatus = detectHoverColumn(e.clientX, e.clientY)

  // Clear drag state
  histDragState.value = null

  if (!wasActive) return

  // Store for warning dialog
  histDragTodo.value = todo
  histDragTargetStatus.value = targetStatus

  // Check if we should show warning
  if (skipHistWarning.value) {
    executeHistoricalMove()
  } else {
    showHistWarning.value = true
  }
}

async function confirmHistDrag() {
  // Save skip preference if checked
  if (skipHistWarning.value) {
    try {
      await db.setSetting('skip_historical_drag_warning', 'true')
    } catch (e) {
      console.error('Failed to save skip warning setting:', e)
    }
  }

  showHistWarning.value = false
  await executeHistoricalMove()
}

function cancelHistDrag() {
  showHistWarning.value = false
  histDragTodo.value = null
  // Reset skip if user unchecked but then cancelled
}

async function executeHistoricalMove() {
  const todo = histDragTodo.value
  const targetStatus = histDragTargetStatus.value
  histDragTodo.value = null

  if (!todo) return

  await store.moveHistoricalTodoToToday(todo.id, targetStatus)
}

// Helper functions for ghost display
function getHistPriorityColor(p) {
  const map = { high: 'text-red-500', medium: 'text-amber-500', low: 'text-green-500' }
  return map[p] || 'text-amber-500'
}

function getHistPriorityDot(p) {
  const map = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500' }
  return map[p] || 'bg-amber-500'
}

function getHistPriorityLabel(p) {
  const map = { high: '高优先级', medium: '中优先级', low: '低优先级' }
  return map[p] || '中优先级'
}

function getHistStatusLabel(status) {
  const map = { pending: '待处理', in_progress: '进行中', done: '已完成' }
  return map[status] || '待处理'
}
</script>
