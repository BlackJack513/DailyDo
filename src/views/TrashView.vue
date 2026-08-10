<template>
  <div class="h-full flex flex-col overflow-y-auto">
    <!-- Header -->
    <div class="px-8 pt-6 pb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-content">回收站</h1>
        <p class="text-sm text-content-tertiary mt-0.5">已删除的项目将在 7 天后自动清除</p>
      </div>
      <button
        v-if="store.trashTodos.length > 0"
        @click="confirmClearAll = true"
        class="btn-danger flex items-center gap-2 text-xs px-3 py-1.5"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        清空回收站
      </button>
    </div>

    <div class="flex-1 px-8 pb-6">
      <!-- Empty -->
      <div
        v-if="store.trashTodos.length === 0"
        class="flex flex-col items-center justify-center h-64 text-content-tertiary"
      >
        <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        <p class="text-sm">回收站是空的</p>
        <p class="text-xs mt-1">删除的待办事项会在这里保留 7 天</p>
      </div>

      <!-- Trash list -->
      <div v-else class="space-y-2">
        <div
          v-for="todo in store.trashTodos"
          :key="todo.id"
          class="flex items-start gap-3 p-3 rounded-xl border border-border bg-surface group"
        >
          <!-- Trash icon -->
          <div class="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
            <svg class="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-content">{{ todo.title }}</p>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span class="text-xs text-content-tertiary">原日期: {{ todo.todo_date }}</span>
              <span v-if="todo.deleted_at" class="text-xs text-content-tertiary">
                · 删除于 {{ formatDeletedDate(todo.deleted_at) }}
              </span>
              <span class="text-xs px-1.5 py-0.5 rounded" :class="daysLeftClass(todo.deleted_at)">
                {{ daysLeftText(todo.deleted_at) }}
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
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              @click="handleRestore(todo.id)"
              class="p-1.5 rounded-lg hover:bg-green-50 hover:bg-green-50/20 text-content-tertiary hover:text-green-600 transition-colors"
              title="恢复"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            <button
              @click="handlePermanentDelete(todo)"
              class="p-1.5 rounded-lg hover:bg-red-50 hover:bg-red-50/20 text-content-tertiary hover:text-red-500 transition-colors"
              title="永久删除"
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
      </div>
    </div>

    <!-- Permanent Delete Confirm -->
    <div v-if="deletingTodo" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="deletingTodo = null"></div>
      <div class="relative bg-surface rounded-2xl shadow-2xl border border-border p-6 w-80">
        <h3 class="text-lg font-semibold text-content mb-2">永久删除</h3>
        <p class="text-sm text-content-secondary text-muted mb-4">
          确定要永久删除「{{ deletingTodo.title }}」吗？此操作不可撤销。
        </p>
        <div class="flex justify-end gap-3">
          <button @click="deletingTodo = null" class="btn-secondary">取消</button>
          <button @click="confirmPermanentDelete" class="btn-danger">永久删除</button>
        </div>
      </div>
    </div>

    <!-- Clear All Confirm -->
    <div v-if="confirmClearAll" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="confirmClearAll = false"></div>
      <div class="relative bg-surface rounded-2xl shadow-2xl border border-border p-6 w-80">
        <h3 class="text-lg font-semibold text-content mb-2">清空回收站</h3>
        <p class="text-sm text-content-secondary text-muted mb-4">
          确定要清空回收站中的所有 {{ store.trashTodos.length }} 个项目吗？此操作不可撤销。
        </p>
        <div class="flex justify-end gap-3">
          <button @click="confirmClearAll = false" class="btn-secondary">取消</button>
          <button @click="handleClearAll" class="btn-danger">清空</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const deletingTodo = ref(null)
const confirmClearAll = ref(false)

onMounted(async () => {
  await store.loadTrash()
})

function formatDeletedDate(deletedAt) {
  if (!deletedAt) return ''
  return deletedAt.substring(0, 10)
}

function daysLeftText(deletedAt) {
  if (!deletedAt) return ''
  const deleted = new Date(deletedAt)
  const now = new Date()
  const diff = Math.floor((now - deleted) / (1000 * 60 * 60 * 24))
  const remaining = 7 - diff
  if (remaining <= 0) return '即将清除'
  return `剩余 ${remaining} 天`
}

function daysLeftClass(deletedAt) {
  if (!deletedAt) return ''
  const deleted = new Date(deletedAt)
  const now = new Date()
  const diff = Math.floor((now - deleted) / (1000 * 60 * 60 * 24))
  const remaining = 7 - diff
  if (remaining <= 1) return 'bg-red-100 text-red-600 text-red-400'
  if (remaining <= 3) return 'bg-amber-100 text-amber-600 text-amber-400'
  return 'bg-green-100 text-green-600 text-green-400'
}

async function handleRestore(id) {
  await store.restoreFromTrash(id)
}

function handlePermanentDelete(todo) {
  deletingTodo.value = todo
}

async function confirmPermanentDelete() {
  if (deletingTodo.value) {
    await store.permanentDelete(deletingTodo.value.id)
    deletingTodo.value = null
  }
}

async function handleClearAll() {
  await store.emptyTrash()
  confirmClearAll.value = false
}
</script>
