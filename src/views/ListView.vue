<template>
  <div class="h-full flex flex-col overflow-hidden">
    <PageHeader title="全部待办" :subtitle="`共 ${store.listTodos.length} 条待办`">
      <template #actions>
        <TemplateDropdown @create="createFromTemplate" />
        <button @click="openAddModal" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建待办
        </button>
      </template>
    </PageHeader>

    <!-- Filters -->
    <div class="px-6 pb-3 flex-shrink-0">
      <div class="card p-3 space-y-3">
        <!-- Search -->
        <div class="flex gap-2">
          <input
            v-model="store.listFilter.search"
            type="text"
            placeholder="搜索标题或备注..."
            class="input-field flex-1 text-sm"
            @input="debouncedLoad"
          />
          <select v-model="store.listFilter.status" class="input-field text-sm w-32" @change="loadData">
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="in_progress">进行中</option>
            <option value="blocked">已阻塞</option>
            <option value="done">已完成</option>
          </select>
        </div>

        <!-- Date and tags -->
        <div class="flex gap-2 flex-wrap items-center">
          <input
            v-model="store.listFilter.date"
            type="date"
            class="input-field text-sm w-40"
            @change="loadData"
          />
          <div class="flex gap-1 flex-wrap flex-1">
            <button
              v-for="tag in store.tags"
              :key="tag.id"
              @click="toggleTagFilter(tag.id)"
              class="tag-badge text-xs border transition-all"
              :class="
                store.listFilter.tag_ids.includes(tag.id)
                  ? 'border-current opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-75'
              "
              :style="{ backgroundColor: tag.color + '20', color: tag.color }"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>

        <!-- Custom field filters -->
        <div v-if="store.customFields.length > 0" class="flex gap-2 flex-wrap">
          <div v-for="field in store.customFields" :key="field.id" class="flex items-center gap-1">
            <label class="text-xs text-content-tertiary">{{ field.name }}:</label>
            <select
              v-if="field.field_type === 'enum'"
              v-model="customFieldFilterValues[field.id]"
              class="input-field text-xs py-1 px-2 w-24"
              @change="updateCustomFieldFilters"
            >
              <option value="">全部</option>
              <option v-for="ev in getEnumValues(field)" :key="ev.value" :value="ev.value">{{ ev.note ? `${ev.value}（${ev.note}）` : ev.value }}</option>
            </select>
            <input
              v-else
              v-model="customFieldFilterValues[field.id]"
              type="text"
              class="input-field text-xs py-1 px-2 w-24"
              :placeholder="'筛选'"
              @input="debouncedUpdateCustomFieldFilters"
            />
          </div>
        </div>

        <!-- Multi-field Sort -->
        <div class="space-y-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs text-content-tertiary">排序:</span>
            <div v-for="(criteria, idx) in sortCriteria" :key="idx" class="flex items-center gap-1">
              <select v-model="criteria.field" class="input-field text-xs py-1 px-2 w-24" @change="applySort">
                <option value="todo_date">日期</option>
                <option value="priority">优先级</option>
                <option value="status">状态</option>
                <option value="title">标题</option>
                <option value="created_at">创建时间</option>
              </select>
              <button @click="toggleSortDir(idx)" class="text-xs text-primary hover:text-primary-hover px-1.5 py-1">
                {{ criteria.order === 'asc' ? '升序 ↑' : '降序 ↓' }}
              </button>
              <button
                v-if="sortCriteria.length > 1"
                @click="removeSortLevel(idx)"
                class="text-xs text-content-tertiary hover:text-red-500 px-1"
                title="移除"
              >
                ×
              </button>
            </div>
            <button
              v-if="sortCriteria.length < 3"
              @click="addSortLevel"
              class="text-xs text-primary hover:text-primary-hover px-1.5 py-1"
            >
              + 添加排序
            </button>
            <button @click="resetFilters" class="text-xs text-content-tertiary hover:text-content px-2 py-1 ml-1">
              重置筛选
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="flex-1 px-6 pb-4 overflow-auto">
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm" style="min-width: 700px;">
            <thead class="bg-surface-secondary border-b border-border">
              <tr>
                <th class="text-left px-3 py-2 font-medium text-content-secondary w-20 sticky left-0 bg-surface-secondary z-10">状态</th>
                <th class="text-left px-3 py-2 font-medium text-content-secondary min-w-[200px]">标题</th>
                <th class="text-left px-3 py-2 font-medium text-content-secondary w-20">优先级</th>
                <th class="text-left px-3 py-2 font-medium text-content-secondary w-24">日期</th>
                <th class="text-left px-3 py-2 font-medium text-content-secondary w-32">标签</th>
                <th
                  v-for="field in store.customFields"
                  :key="field.id"
                  class="text-left px-3 py-2 font-medium text-content-secondary w-24"
                >
                  {{ field.name }}
                </th>
                <th class="text-left px-3 py-2 font-medium text-content-secondary w-16 sticky right-0 bg-surface-secondary z-10 border-l border-border">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="todo in store.listTodos" :key="todo.id" class="hover:bg-surface-secondary/50 transition-colors">
                <!-- Status -->
                <td class="px-3 py-2 sticky left-0 z-10" :class="statusTagBg(todo.status)">
                  <button @click="handleToggleStatus(todo)" class="focus:outline-none w-full text-left">
                    <StatusBadge :status="todo.status" />
                  </button>
                </td>
                <!-- Title -->
                <td class="px-3 py-2 max-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-content font-medium truncate block max-w-full">{{ todo.title }}</span>
                    <span v-if="todo.recurrence_type && todo.recurrence_type !== 'none'" class="text-purple-500 flex-shrink-0" title="周期任务">
                      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div v-if="todo.notes" class="text-xs text-content-tertiary truncate mt-0.5 block max-w-full" :title="stripHtml(todo.notes)">{{ stripHtml(todo.notes) }}</div>
                </td>
                <!-- Priority -->
                <td class="px-3 py-2">
                  <PriorityBadge :priority="todo.priority" />
                </td>
                <!-- Date -->
                <td class="px-3 py-2 text-content-secondary text-xs">
                  {{ todo.todo_date || '' }}
                </td>
                <!-- Tags -->
                <td class="px-3 py-2">
                  <div class="flex gap-1 flex-wrap">
                    <span
                      v-for="tag in (todo.tags || [])"
                      :key="tag.id"
                      class="tag-badge text-xs border border-transparent"
                      :style="{ backgroundColor: tag.color + '20', color: tag.color }"
                    >
                      {{ tag.name }}
                    </span>
                  </div>
                </td>
                <!-- Custom fields -->
                <td v-for="field in store.customFields" :key="field.id" class="px-3 py-2 text-content-secondary text-xs">
                  {{ getCustomFieldValue(todo, field.id) }}
                </td>
                <!-- Actions -->
                <td class="px-3 py-2 sticky right-0 z-10 border-l border-border" :class="statusTagBg(todo.status)">
                  <div class="flex gap-2">
                    <button @click="openDetailModal(todo)" class="text-content-secondary hover:text-content text-xs">
                      查看
                    </button>
                    <button @click="openEditModal(todo)" class="text-primary hover:text-primary-hover text-xs">
                      编辑
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="store.listTodos.length === 0">
                <td :colspan="6 + store.customFields.length" class="px-3 py-8 text-center text-content-tertiary">
                  暂无匹配的待办
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <AddTodoModal
      :show="showModal"
      :todo="editingTodo"
      :locked-fields="modalLockedFields"
      @close="closeModal"
      @submit="handleSubmit"
    />

    <!-- Detail Modal (readonly) -->
    <TodoDetailModal
      :show="showDetailModal"
      :todo="detailTodo"
      :readonly="true"
      @close="closeDetailModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import * as db from '../utils/db'
import AddTodoModal from '../components/AddTodoModal.vue'
import TodoDetailModal from '../components/TodoDetailModal.vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PriorityBadge from '@/components/PriorityBadge.vue'
import TemplateDropdown from '@/components/TemplateDropdown.vue'
import {
  priorityLabel,
  recurrenceLabel,
  safeJsonParseArray,
} from '../utils/helpers'

const store = useAppStore()

const showModal = ref(false)
const editingTodo = ref(null)
const showDetailModal = ref(false)
const detailTodo = ref(null)
const customFieldFilterValues = ref({})
const modalLockedFields = ref([])

// Multi-field sort criteria
const sortCriteria = ref([{ field: 'todo_date', order: 'desc' }])

function syncSortToFilter() {
  store.listFilter.sort_criteria = sortCriteria.value.map(c => ({ field: c.field, order: c.order }))
  // Keep legacy fields in sync with primary sort
  if (sortCriteria.value.length > 0) {
    store.listFilter.sort_by = sortCriteria.value[0].field
    store.listFilter.sort_order = sortCriteria.value[0].order
  }
}

function applySort() {
  syncSortToFilter()
  loadData()
}

function toggleSortDir(idx) {
  sortCriteria.value[idx].order = sortCriteria.value[idx].order === 'asc' ? 'desc' : 'asc'
  applySort()
}

function addSortLevel() {
  if (sortCriteria.value.length < 3) {
    sortCriteria.value.push({ field: 'todo_date', order: 'desc' })
    applySort()
  }
}

function removeSortLevel(idx) {
  sortCriteria.value.splice(idx, 1)
  applySort()
}

let debounceTimer = null
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    loadData()
  }, 300)
}

let customFieldDebounceTimer = null
function debouncedUpdateCustomFieldFilters() {
  clearTimeout(customFieldDebounceTimer)
  customFieldDebounceTimer = setTimeout(() => {
    updateCustomFieldFilters()
  }, 300)
}

function updateCustomFieldFilters() {
  const filters = []
  for (const [fieldId, value] of Object.entries(customFieldFilterValues.value)) {
    if (value && value.trim()) {
      filters.push({ field_id: parseInt(fieldId), value: value.trim() })
    }
  }
  store.listFilter.custom_field_filters = filters
  loadData()
}

async function loadData() {
  await store.loadListTodos()
}

function toggleTagFilter(tagId) {
  const idx = store.listFilter.tag_ids.indexOf(tagId)
  if (idx >= 0) {
    store.listFilter.tag_ids.splice(idx, 1)
  } else {
    store.listFilter.tag_ids.push(tagId)
  }
  loadData()
}

function resetFilters() {
  store.listFilter.search = ''
  store.listFilter.status = ''
  store.listFilter.tag_ids = []
  store.listFilter.date = new Date().toISOString().split('T')[0]
  store.listFilter.custom_field_filters = []
  store.listFilter.sort_by = 'todo_date'
  store.listFilter.sort_order = 'desc'
  store.listFilter.sort_criteria = [{ field: 'todo_date', order: 'desc' }]
  sortCriteria.value = [{ field: 'todo_date', order: 'desc' }]
  customFieldFilterValues.value = {}
  loadData()
}

function openAddModal() {
  editingTodo.value = null
  showModal.value = true
}

function openEditModal(todo) {
  editingTodo.value = { ...todo }
  showModal.value = true
}

function openDetailModal(todo) {
  detailTodo.value = { ...todo }
  showDetailModal.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  detailTodo.value = null
}

function closeModal() {
  showModal.value = false
  editingTodo.value = null
  modalLockedFields.value = []
}

/**
 * 从模板创建待办（ListView 版本）。
 * 加载模板的步骤、自定义字段默认值，通过 _templateData 传入 AddTodoModal。
 */
async function createFromTemplate(tpl) {
  const locked = safeJsonParseArray(tpl.locked_fields)
  modalLockedFields.value = locked

  const tagIds = safeJsonParseArray(tpl.tag_ids)

  let steps = []
  try {
    const tplSteps = await db.getTemplateSteps(tpl.id)
    steps = tplSteps.map(s => ({ title: s.title, completed: false }))
  } catch {
    steps = []
  }

  let customFieldValues = []
  try {
    customFieldValues = await db.getTemplateCustomFieldValues(tpl.id)
  } catch {
    customFieldValues = []
  }

  editingTodo.value = {
    title: tpl.title || '',
    priority: tpl.priority || 'medium',
    tags: tagIds.map(id => store.tags.find(t => t.id === id)).filter(Boolean),
    todo_date: new Date().toISOString().split('T')[0],
    _isNew: true,
    _templateData: {
      recurrence_type: tpl.recurrence_type || 'none',
      recurrence_config: tpl.recurrence_config || '{}',
      steps,
      customFieldValues,
    },
  }
  showModal.value = true
}

async function handleSubmit(data) {
  try {
    if (editingTodo.value) {
      await store.updateTodo(data)
    } else {
      await store.addTodo(data)
    }
    closeModal()
    await loadData()
  } catch (e) {
    console.error('Failed to save todo:', e)
  }
}

async function handleToggleStatus(todo) {
  const nextStatus = todo.status === 'pending' ? 'in_progress' : todo.status === 'in_progress' ? 'blocked' : todo.status === 'blocked' ? 'done' : 'pending'
  try {
    const { steps, ...rest } = todo
    await store.updateTodo({ ...rest, status: nextStatus })
    await loadData()
  } catch (e) {
    console.error('Failed to toggle status:', e)
  }
}

function statusTagBg(status) {
  switch (status) {
    case 'done': return 'bg-green-50/50 dark:bg-green-950/10'
    case 'in_progress': return 'bg-blue-50/50 dark:bg-blue-950/10'
    case 'blocked': return 'bg-red-50/50 dark:bg-red-950/10'
    default: return ''
  }
}

function getEnumValues(field) {
  try {
    const arr = JSON.parse(field.enum_values || '[]')
    return arr.map(item => {
      if (typeof item === 'string') return { value: item, note: '' }
      return { value: item.value || '', note: item.note || '' }
    })
  } catch {
    return []
  }
}

function getCustomFieldValue(todo, fieldId) {
  const cfv = (todo.customFieldValues || []).find(v => v.field_id === fieldId)
  return cfv ? cfv.value : ''
}

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').slice(0, 100)
}

onMounted(() => {
  // Sync initial sort criteria
  syncSortToFilter()
  loadData()
})
</script>
