<template>
  <div
    ref="columnEl"
    data-kanban-column
    class="flex flex-col rounded-xl border-t-4 bg-surface-secondary/50 border-border overflow-hidden transition-all duration-300 flex-1 min-w-[280px]"
    :class="[statusColor, isDragOver ? 'ring-2 ring-primary/40' : '']"
  >
    <!-- Column Header -->
    <div
      class="px-4 py-3 flex items-center justify-between border-b border-border cursor-pointer transition-colors select-none"
      :class="isDragOver ? 'bg-primary/10' : ''"
      @click="collapsed = !collapsed"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-content">{{ title }}</span>
        <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="badgeColor">{{ todos.length }}</span>
      </div>
    </div>

    <!-- Drop Zone - hidden when collapsed so column shrinks -->
    <div
      v-if="!collapsed"
      class="p-3 space-y-2 overflow-y-auto transition-colors flex-1"
      :class="isDragOver ? 'bg-primary/5' : ''"
    >
      <div
        v-for="todo in todos"
        :key="todo.id"
        @mousedown="onMouseDown($event, todo)"
        @dblclick="onDoubleClick($event, todo)"
        class="group flex items-start gap-3 rounded-xl border border-border hover:border-primary/30 transition-all duration-150 bg-surface select-none"
        :class="[
          todo.steps && todo.steps.length > 0 ? 'p-4' : 'p-3',
          {
            'opacity-40': dragState && dragState.todo.id === todo.id,
            'opacity-60': todo.status === 'done',
            'cursor-grab': !dragState || dragState.todo.id !== todo.id,
          },
        ]"
      >
        <!-- Status toggle -->
        <button
          @click.stop="$emit('toggle', todo)"
          class="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
          :class="getStatusClass(todo.status)"
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
            <span class="inline-flex items-center gap-1 text-xs" :class="getPriorityColor(todo.priority)">
              <span class="w-1.5 h-1.5 rounded-full" :class="getPriorityDot(todo.priority)"></span>
              {{ getPriorityLabel(todo.priority) }}
            </span>
            <span
              v-for="tag in todo.tags || []"
              :key="tag.id"
              class="tag-badge"
              :style="{ backgroundColor: tag.color + '20', color: tag.color }"
            >
              {{ tag.name }}
            </span>
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
              {{ getRecurrenceLabel(todo.recurrence_type) }}
            </span>
            <span v-if="todo.attachment_path" class="text-xs text-content-tertiary flex items-center gap-0.5">
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
          </div>

          <!-- Inline Steps (only for todos with steps) -->
          <div v-if="todo.steps && todo.steps.length > 0" class="mt-3 space-y-1.5">
            <!-- Progress bar -->
            <div class="flex items-center gap-2 mb-2">
              <div class="flex-1 h-1.5 rounded-full bg-control overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="getStepBarColor(todo)"
                  :style="{ width: getStepPercent(todo) + '%' }"
                ></div>
              </div>
              <span class="text-xs font-medium tabular-nums" :class="getStepProgressClass(todo)">
                {{ getStepCompleted(todo) }}/{{ todo.steps.length }}
              </span>
            </div>
            <!-- Step items -->
            <div
              v-for="step in todo.steps"
              :key="step.id"
              @mousedown.stop
              @click.stop="onStepClick(step)"
              class="flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer transition-colors hover:bg-surface-secondary"
            >
              <div
                class="flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                :class="step.completed ? 'bg-green-500 border-green-500' : 'border-divider hover:border-primary'"
              >
                <svg v-if="step.completed" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <span
                class="text-xs leading-tight"
                :class="step.completed ? 'line-through text-content-tertiary' : 'text-content-secondary'"
              >
                {{ step.title }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click.stop="$emit('history', todo)"
            class="p-1.5 rounded-lg hover:bg-surface-tertiary text-content-tertiary hover:text-primary transition-colors"
            title="历史记录"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <button
            @click.stop="$emit('edit', todo)"
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
            @click.stop="$emit('delete', todo)"
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

      <!-- Empty column hint -->
      <div v-if="todos.length === 0" class="flex flex-col items-center justify-center py-8 text-content-tertiary">
        <svg class="w-8 h-8 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p class="text-xs">拖拽待办到此处</p>
      </div>
    </div>

    <!-- Ghost element that follows cursor during drag -->
    <div
      v-if="dragState"
      data-drag-ghost
      class="fixed z-[9999] pointer-events-none"
      :style="{
        left: dragState.x + 'px',
        top: dragState.y + 'px',
        transform: 'translate(-50%, -50%) rotate(3deg)',
        opacity: 0.9,
      }"
    >
      <div
        class="flex items-start gap-3 p-3 rounded-xl border-2 border-primary bg-surface shadow-2xl min-w-[250px] max-w-[320px]"
      >
        <div
          class="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center"
          :class="getStatusClass(dragState.todo.status)"
        >
          <svg
            v-if="dragState.todo.status === 'done'"
            class="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <div v-else-if="dragState.todo.status === 'in_progress'" class="w-2 h-2 rounded-full bg-primary"></div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium leading-tight text-content truncate">{{ dragState.todo.title }}</p>
          <div class="flex items-center gap-2 mt-1.5">
            <span class="inline-flex items-center gap-1 text-xs" :class="getPriorityColor(dragState.todo.priority)">
              <span class="w-1.5 h-1.5 rounded-full" :class="getPriorityDot(dragState.todo.priority)"></span>
              {{ getPriorityLabel(dragState.todo.priority) }}
            </span>
            <span
              v-for="tag in dragState.todo.tags || []"
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const props = defineProps({
  title: { type: String, required: true },
  todos: { type: Array, required: true },
  statusColor: { type: String, default: '' },
  badgeColor: { type: String, default: '' },
})

const emit = defineEmits(['drop', 'toggle', 'edit', 'delete', 'toggle-collapse', 'detail', 'history'])

const isDragOver = ref(false)
const collapsed = ref(false)
const columnEl = ref(null)
const dragState = ref(null) // { todo, startX, startY, x, y }

const DRAG_THRESHOLD = 5 // pixels before drag initiates
const statusOrder = { pending: 'pending', in_progress: 'in_progress', done: 'done' }

function onMouseDown(e, todo) {
  // Don't start drag if clicking buttons (they have @click.stop, but mousedown still bubbles)
  const tag = e.target.tagName
  if (tag === 'BUTTON' || e.target.closest('button')) return
  // Only left mouse button
  if (e.button !== 0) return

  e.preventDefault() // prevent text selection during drag

  dragState.value = {
    todo,
    startX: e.clientX,
    startY: e.clientY,
    x: e.clientX,
    y: e.clientY,
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onDoubleClick(e, todo) {
  emit('detail', { todo, x: e.clientX, y: e.clientY })
}

function onMouseMove(e) {
  if (!dragState.value) return

  const dx = e.clientX - dragState.value.startX
  const dy = e.clientY - dragState.value.startY

  // Only start visual drag after threshold
  if (!dragState.value.active && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
    dragState.value.active = true
  }

  if (dragState.value.active) {
    dragState.value.x = e.clientX
    dragState.value.y = e.clientY

    // Detect which column we're hovering over
    detectHoverColumn(e.clientX, e.clientY)
  }
}

function detectHoverColumn(x, y) {
  // Temporarily hide ghost so elementFromPoint can see through
  const ghostEls = document.querySelectorAll('[data-drag-ghost]')
  ghostEls.forEach(el => {
    el.style.display = 'none'
  })

  const el = document.elementFromPoint(x, y)

  // Restore ghost
  ghostEls.forEach(el => {
    el.style.display = ''
  })

  if (!el) {
    isDragOver.value = false
    return
  }

  // Walk up to find a KanbanColumn root via data attribute
  let target = el
  while (target && target !== document.body) {
    if (target.hasAttribute && target.hasAttribute('data-kanban-column')) {
      if (target === columnEl.value) {
        isDragOver.value = true
      } else {
        isDragOver.value = false
      }
      return
    }
    target = target.parentElement
  }

  isDragOver.value = false
}

function onMouseUp(e) {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)

  if (!dragState.value) return

  const wasActive = dragState.value.active
  const todo = dragState.value.todo

  // Clear drag state first
  dragState.value = null
  isDragOver.value = false

  if (!wasActive) {
    // Was just a click, not a drag
    return
  }

  // Detect drop target
  const x = e.clientX
  const y = e.clientY

  // Temporarily hide all ghost elements
  const ghostEls = document.querySelectorAll('[data-drag-ghost]')
  ghostEls.forEach(el => {
    el.style.display = 'none'
  })

  const el = document.elementFromPoint(x, y)
  ghostEls.forEach(el => {
    el.style.display = ''
  })

  if (el) {
    let target = el
    while (target && target !== document.body) {
      if (target.hasAttribute && target.hasAttribute('data-kanban-column')) {
        // Found a column - determine its status from the title
        const titleEl = target.querySelector('.text-sm.font-semibold')
        if (titleEl) {
          const colTitle = titleEl.textContent.trim()
          const targetStatus = Object.values(statusOrder).find(s => colTitle === getStatusTitle(s))
          if (targetStatus && targetStatus !== todo.status) {
            emit('drop', { todoId: todo.id, newStatus: targetStatus })
          }
        }
        break
      }
      target = target.parentElement
    }
  }
}

function handleCollapseAll(event) {
  collapsed.value = event.detail.collapsed
}

onMounted(() => {
  window.addEventListener('kanban-collapse-all', handleCollapseAll)
})

onUnmounted(() => {
  window.removeEventListener('kanban-collapse-all', handleCollapseAll)
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})

function getStatusTitle(status) {
  const map = { pending: '待处理', in_progress: '进行中', done: '已完成' }
  return map[status]
}

function getStatusClass(status) {
  if (status === 'done') return 'bg-green-500 border-green-500'
  if (status === 'in_progress') return 'border-primary bg-primary/10'
  return 'border-border hover:border-primary'
}

function getPriorityLabel(p) {
  const map = { high: '高优先级', medium: '中优先级', low: '低优先级' }
  return map[p] || '中优先级'
}

function getPriorityColor(p) {
  const map = { high: 'text-red-500', medium: 'text-amber-500', low: 'text-green-500' }
  return map[p] || 'text-amber-500'
}

function getPriorityDot(p) {
  const map = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500' }
  return map[p] || 'bg-amber-500'
}

function getRecurrenceLabel(type) {
  const map = { daily: '每日', weekly: '每周', monthly: '每月', yearly: '每年', workday: '工作日' }
  return map[type] || ''
}

function getStepCompleted(todo) {
  if (!todo.steps) return 0
  return todo.steps.filter(s => s.completed).length
}

function getStepProgressClass(todo) {
  if (!todo.steps || todo.steps.length === 0) return 'text-content-tertiary'
  const done = todo.steps.filter(s => s.completed).length
  if (done === todo.steps.length) return 'text-green-500'
  if (done > 0) return 'text-primary'
  return 'text-content-tertiary'
}

function getStepPercent(todo) {
  if (!todo.steps || todo.steps.length === 0) return 0
  const done = todo.steps.filter(s => s.completed).length
  return Math.round((done / todo.steps.length) * 100)
}

function getStepBarColor(todo) {
  if (!todo.steps || todo.steps.length === 0) return 'bg-control'
  const done = todo.steps.filter(s => s.completed).length
  if (done === todo.steps.length) return 'bg-green-500'
  if (done > 0) return 'bg-primary'
  return 'bg-control'
}

async function onStepClick(step) {
  await store.toggleStep(step.id)
}
</script>
