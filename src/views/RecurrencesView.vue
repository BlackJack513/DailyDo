<template>
  <div class="h-full flex flex-col overflow-y-auto">
    <!-- Header -->
    <div class="px-8 pt-6 pb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-content">周期任务</h1>
        <p class="text-sm text-content-tertiary mt-0.5">管理系统中所有重复待办的周期规则</p>
      </div>
      <button @click="openAddModal" class="btn-primary flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新增周期任务
      </button>
    </div>

    <div class="flex-1 px-8 pb-6">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center h-48">
        <p class="text-sm text-content-tertiary">加载中...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="groups.length === 0" class="flex flex-col items-center justify-center h-64 text-content-tertiary">
        <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <p class="text-sm">暂无周期任务</p>
        <p class="text-xs mt-1">点击右上方「新增周期任务」创建</p>
      </div>

      <!-- Groups table -->
      <div v-else class="space-y-3">
        <div
          v-for="group in groups"
          :key="group.groupId"
          class="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface-secondary/50 hover:border-primary/30 transition-colors"
        >
          <!-- Recurrence icon -->
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            :class="recurrenceColor(group.recurrenceType)"
          >
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-content truncate">{{ group.title }}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="recurrenceBadgeClass(group.recurrenceType)"
              >
                {{ recurrenceLabel(group.recurrenceType) }}
              </span>
              <span class="text-xs text-content-tertiary">共 {{ group.items.length }} 条记录</span>
            </div>
          </div>

          <!-- Status toggle -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="toggleEnabled(group)"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
              :class="group.enabled ? 'bg-primary' : 'bg-control'"
              :title="group.enabled ? '点击关闭周期任务' : '点击开启周期任务'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-surface transition-transform duration-200 shadow"
                :class="group.enabled ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
            <span class="text-xs font-medium w-8" :class="group.enabled ? 'text-primary' : 'text-content-tertiary'">
              {{ group.enabled ? '开启' : '关闭' }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              @click="triggerManual(group)"
              class="p-2 rounded-lg hover:bg-green-50 hover:bg-green-50/20 text-content-tertiary hover:text-green-500 transition-colors"
              title="手动触发 — 立即创建下一次周期任务"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              @click="editGroup(group)"
              class="p-2 rounded-lg hover:bg-surface-tertiary text-content-tertiary hover:text-content transition-colors"
              title="编辑"
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
              @click="deleteGroup(group)"
              class="p-2 rounded-lg hover:bg-red-50 hover:bg-red-50/20 text-content-tertiary hover:text-red-500 transition-colors"
              title="删除"
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

    <!-- Add/Edit Modal -->
    <AddTodoModal :show="showModal" :todo="editingItem" @close="showModal = false" @submit="handleSubmit" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as db from '../utils/db'
import { useAppStore } from '../stores/app'
import AddTodoModal from '../components/AddTodoModal.vue'

const store = useAppStore()

const loading = ref(true)
const allRecurring = ref([])
const showModal = ref(false)
const editingItem = ref(null)
const isAdding = ref(false)

const groups = computed(() => {
  const map = {}
  for (const item of allRecurring.value) {
    const groupId = item.recurrence_group_id || `single_${item.id}`
    if (!map[groupId]) {
      map[groupId] = {
        groupId,
        title: item.title,
        recurrenceType: item.recurrence_type,
        enabled: item.recurrence_enabled !== false,
        items: [],
      }
    }
    map[groupId].items.push(item)
  }
  // Sort groups by most recent item date
  return Object.values(map).sort((a, b) => {
    const aDate = a.items[a.items.length - 1]?.todo_date || ''
    const bDate = b.items[b.items.length - 1]?.todo_date || ''
    return bDate.localeCompare(aDate)
  })
})

function recurrenceLabel(type) {
  const map = { daily: '每日', weekly: '每周', monthly: '每月', yearly: '每年', workday: '工作日' }
  return map[type] || type
}

function recurrenceColor(type) {
  const map = {
    daily: 'bg-blue-500',
    weekly: 'bg-purple-500',
    monthly: 'bg-amber-500',
    yearly: 'bg-rose-500',
    workday: 'bg-emerald-500',
  }
  return map[type] || 'bg-surface-20'
}

function recurrenceBadgeClass(type) {
  const map = {
    daily: 'bg-blue-50/20 text-blue-600',
    weekly: 'bg-purple-50/20 text-purple-600',
    monthly: 'bg-amber-50/20 text-amber-600',
    yearly: 'bg-rose-50/20 text-rose-600',
    workday: 'bg-emerald-50/20 text-emerald-600',
  }
  return map[type] || 'bg-surface-2 text-muted'
}

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const todos = await db.getAllTodos()
    allRecurring.value = todos.filter(t => t.recurrence_type && t.recurrence_type !== 'none')
    // Load tags and steps for each
    for (const todo of allRecurring.value) {
      todo.tags = await db.getTodoTags(todo.id)
      todo.steps = await db.getStepsByTodoId(todo.id)
    }
  } catch (e) {
    console.error('Failed to load recurring todos:', e)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  isAdding.value = true
  editingItem.value = null
  showModal.value = true
}

function editGroup(group) {
  // Find the first non-done item as the template for editing
  const template = group.items.find(item => item.status !== 'done') || group.items[0]
  isAdding.value = false
  editingItem.value = template
  showModal.value = true
}

async function handleSubmit(data) {
  if (isAdding.value) {
    // Create new recurring todo
    const created = await db.createTodo({
      ...data,
      recurrence_enabled: true,
    })
    if (data.tagIds && data.tagIds.length > 0) {
      await db.setTodoTags(created.id, data.tagIds)
    }
    // Save steps if provided
    if (data.steps && data.steps.length > 0) {
      await db.saveTodoSteps(created.id, data.steps)
    }
  } else {
    // Update all non-deleted items in the group with new title/settings
    const groupId = editingItem.value.recurrence_group_id
    if (groupId) {
      // Update all active items in the group
      for (const item of allRecurring.value.filter(t => t.recurrence_group_id === groupId && t.deleted_at == null)) {
        await db.updateTodo({
          ...item,
          title: data.title,
          notes: data.notes || '',
          priority: data.priority,
          due_date: data.due_date,
          recurrence_type: data.recurrence_type,
          recurrence_config: data.recurrence_config,
          tagIds: data.tagIds,
        })
        if (data.tagIds && data.tagIds.length > 0) {
          await db.setTodoTags(item.id, data.tagIds)
        }
        // Save steps for each item in the group
        if (data.steps !== undefined) {
          await db.saveTodoSteps(item.id, data.steps || [])
        }
      }
    } else {
      // Single item (no group)
      await db.updateTodo(data)
      if (data.tagIds) {
        await db.setTodoTags(data.id, data.tagIds)
      }
      if (data.steps !== undefined) {
        await db.saveTodoSteps(data.id, data.steps || [])
      }
    }
  }
  showModal.value = false
  editingItem.value = null
  isAdding.value = false
  await loadData()
}

async function toggleEnabled(group) {
  const newEnabled = !group.enabled
  await db.toggleRecurrenceEnabled(group.groupId, newEnabled)
  await loadData()
}

async function deleteGroup(group) {
  if (confirm(`确定要删除周期任务「${group.title}」吗？该操作会将所有相关记录移入回收站。`)) {
    await db.deleteRecurrenceGroup(group.groupId)
    await loadData()
  }
}

async function triggerManual(group) {
  const result = await store.triggerRecurrenceManually(group.groupId)
  if (result.success) {
    await loadData()
  }
  alert(result.message)
}
</script>
