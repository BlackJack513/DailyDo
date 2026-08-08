<template>
  <div class="flex-1 flex flex-col h-full bg-surface-secondary dark:bg-gray-900">
    <!-- Header -->
    <div class="px-6 py-5 border-b border-border dark:border-gray-700 bg-surface dark:bg-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-content dark:text-gray-100">待办模板</h1>
          <p class="text-sm text-content-tertiary dark:text-gray-500 mt-1">管理常用待办模板，快速创建相似任务</p>
        </div>
        <button @click="openCreateModal" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建模板
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <!-- Empty state -->
      <div v-if="templates.length === 0 && !loading" class="flex flex-col items-center justify-center py-20 text-content-tertiary dark:text-gray-500">
        <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-lg font-medium mb-1">暂无模板</p>
        <p class="text-sm">点击上方按钮创建第一个待办模板</p>
      </div>

      <!-- Template cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="tpl in templates"
          :key="tpl.id"
          class="bg-surface dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
        >
          <!-- Template header -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-content dark:text-gray-100 truncate">{{ tpl.name }}</h3>
              <p class="text-sm text-content-secondary dark:text-gray-400 truncate mt-0.5">{{ tpl.title }}</p>
            </div>
            <div class="flex items-center gap-1 ml-2 flex-shrink-0">
              <button @click="editTemplate(tpl)" class="p-1.5 rounded-lg hover:bg-surface-tertiary dark:hover:bg-gray-700 text-content-tertiary hover:text-primary transition-colors" title="编辑">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button @click="confirmDelete(tpl)" class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-content-tertiary hover:text-red-500 transition-colors" title="删除">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Meta info -->
          <div class="flex flex-wrap gap-2 mb-3">
            <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="priorityClass(tpl.priority)">{{ priorityLabel(tpl.priority) }}</span>
            <span v-if="tpl.recurrence_type && tpl.recurrence_type !== 'none'" class="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
              {{ recurrenceLabel(tpl.recurrence_type) }}
            </span>
          </div>

          <!-- Tags -->
          <div v-if="getTemplateTagNames(tpl).length > 0" class="flex flex-wrap gap-1.5 mb-3">
            <span
              v-for="tn in getTemplateTagNames(tpl)"
              :key="tn"
              class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-content-secondary dark:text-gray-400"
            >{{ tn }}</span>
          </div>

          <!-- Locked fields indicator -->
          <div v-if="getLockedFields(tpl).length > 0" class="flex flex-wrap gap-1.5 mb-3">
            <span
              v-for="lf in getLockedFields(tpl)"
              :key="lf"
              class="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium"
            >🔒 {{ lf }}</span>
          </div>

          <!-- Steps -->
          <div v-if="templateSteps[tpl.id] && templateSteps[tpl.id].length > 0" class="mt-2 pt-3 border-t border-border dark:border-gray-700">
            <p class="text-xs text-content-tertiary dark:text-gray-500 mb-1.5">{{ templateSteps[tpl.id].length }} 个步骤</p>
            <div class="space-y-1">
              <div
                v-for="(step, idx) in templateSteps[tpl.id].slice(0, 3)"
                :key="step.id || idx"
                class="flex items-center gap-2 text-sm text-content-secondary dark:text-gray-400"
              >
                <span class="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex items-center justify-center flex-shrink-0">{{ idx + 1 }}</span>
                <span class="truncate">{{ step.title }}</span>
              </div>
              <p v-if="templateSteps[tpl.id].length > 3" class="text-xs text-content-tertiary dark:text-gray-500 pl-6">+{{ templateSteps[tpl.id].length - 3 }} 更多...</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Template Edit/Create Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showModal = false"></div>
      <div class="relative w-full max-w-lg mx-4 bg-surface dark:bg-gray-800 rounded-2xl shadow-2xl border border-border dark:border-gray-700">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border dark:border-gray-700">
          <h3 class="text-lg font-semibold text-content dark:text-gray-100">
            {{ editingTemplate ? '编辑模板' : '新建模板' }}
          </h3>
          <button @click="showModal = false" class="p-1 rounded-lg hover:bg-surface-tertiary dark:hover:bg-gray-700 text-content-tertiary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Form -->
        <div class="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <!-- Template Name -->
          <div>
            <label class="block text-sm font-medium text-content-secondary dark:text-gray-400 mb-1.5">模板名称 *</label>
            <input
              ref="nameInput"
              v-model="tplForm.name"
              class="input-field"
              placeholder="例如：每日站会、周报..."
            />
          </div>

          <!-- Default Title -->
          <div>
            <label class="block text-sm font-medium text-content-secondary dark:text-gray-400 mb-1.5">默认标题 *</label>
            <input
              v-model="tplForm.title"
              class="input-field"
              placeholder="创建待办时的默认标题..."
            />
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-sm font-medium text-content-secondary dark:text-gray-400 mb-1.5">优先级</label>
            <div class="flex gap-2">
              <button
                v-for="p in priorities"
                :key="p.value"
                @click="tplForm.priority = p.value"
                class="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
                :class="tplForm.priority === p.value ? p.activeClass : 'border-border dark:border-gray-600 text-content-tertiary hover:border-content-tertiary'"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-sm font-medium text-content-secondary dark:text-gray-400 mb-1.5">标签</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in store.tags"
                :key="tag.id"
                @click="toggleTag(tag.id)"
                class="tag-badge cursor-pointer border transition-all"
                :class="tplForm.tagIds.includes(tag.id) ? 'border-current opacity-100' : 'border-transparent opacity-50 hover:opacity-75'"
                :style="{ backgroundColor: tag.color + '20', color: tag.color }"
              >
                {{ tag.name }}
              </button>
            </div>
          </div>

          <!-- Recurrence -->
          <div>
            <label class="block text-sm font-medium text-content-secondary dark:text-gray-400 mb-1.5">重复</label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="r in recurrenceOptions"
                :key="r.value"
                @click="tplForm.recurrence_type = r.value"
                class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
                :class="tplForm.recurrence_type === r.value ? 'border-primary bg-primary/10 text-primary' : 'border-border dark:border-gray-600 text-content-tertiary hover:border-content-tertiary'"
              >
                {{ r.label }}
              </button>
            </div>
          </div>

          <!-- Locked Fields -->
          <div>
            <label class="block text-sm font-medium text-content-secondary dark:text-gray-400 mb-1.5">
              锁定字段
              <span class="text-xs font-normal text-content-tertiary dark:text-gray-500 ml-1">（使用模板时这些字段不可修改）</span>
            </label>
            <div class="flex flex-wrap gap-3">
              <label class="flex items-center gap-1.5 text-sm text-content-secondary dark:text-gray-400 cursor-pointer select-none">
                <input type="checkbox" value="title" v-model="tplForm.lockedFields" class="rounded border-border dark:border-gray-600 text-primary focus:ring-primary" />
                标题
              </label>
              <label class="flex items-center gap-1.5 text-sm text-content-secondary dark:text-gray-400 cursor-pointer select-none">
                <input type="checkbox" value="priority" v-model="tplForm.lockedFields" class="rounded border-border dark:border-gray-600 text-primary focus:ring-primary" />
                优先级
              </label>
              <label class="flex items-center gap-1.5 text-sm text-content-secondary dark:text-gray-400 cursor-pointer select-none">
                <input type="checkbox" value="tags" v-model="tplForm.lockedFields" class="rounded border-border dark:border-gray-600 text-primary focus:ring-primary" />
                标签
              </label>
              <label class="flex items-center gap-1.5 text-sm text-content-secondary dark:text-gray-400 cursor-pointer select-none">
                <input type="checkbox" value="recurrence" v-model="tplForm.lockedFields" class="rounded border-border dark:border-gray-600 text-primary focus:ring-primary" />
                重复
              </label>
              <label class="flex items-center gap-1.5 text-sm text-content-secondary dark:text-gray-400 cursor-pointer select-none">
                <input type="checkbox" value="steps" v-model="tplForm.lockedFields" class="rounded border-border dark:border-gray-600 text-primary focus:ring-primary" />
                步骤
              </label>
            </div>
          </div>

          <!-- Steps -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-sm font-medium text-content-secondary dark:text-gray-400">默认步骤（选填）</label>
              <button @click="addStep" class="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                添加步骤
              </button>
            </div>
            <div v-if="tplForm.steps.length > 0" class="space-y-2">
              <div
                v-for="(step, index) in tplForm.steps"
                :key="index"
                class="flex items-center gap-2 group"
              >
                <span class="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center flex-shrink-0">
                  {{ index + 1 }}
                </span>
                <input
                  v-model="step.title"
                  class="flex-1 input-field py-1.5 text-sm"
                  placeholder="输入步骤内容..."
                  @keydown.enter.prevent="onStepEnter(index)"
                />
                <button
                  @click="removeStep(index)"
                  class="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-content-tertiary hover:text-red-500 transition-all"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p v-else class="text-xs text-content-tertiary dark:text-gray-500">使用此模板创建待办时，将自动包含这些步骤</p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border dark:border-gray-700">
          <button @click="showModal = false" class="btn-secondary">取消</button>
          <button @click="saveTemplate" class="btn-primary" :disabled="!tplForm.name.trim() || !tplForm.title.trim()">
            {{ editingTemplate ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="deleteTarget = null"></div>
      <div class="relative w-full max-w-sm mx-4 bg-surface dark:bg-gray-800 rounded-2xl shadow-2xl border border-border dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-content dark:text-gray-100 mb-2">确认删除</h3>
        <p class="text-sm text-content-secondary dark:text-gray-400 mb-5">确定要删除模板「{{ deleteTarget.name }}」吗？此操作不可恢复。</p>
        <div class="flex justify-end gap-3">
          <button @click="deleteTarget = null" class="btn-secondary">取消</button>
          <button @click="doDelete" class="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useAppStore } from '../stores/app'
import * as db from '../utils/db'

const store = useAppStore()

const templates = ref([])
const templateSteps = ref({})
const loading = ref(true)
const showModal = ref(false)
const editingTemplate = ref(null)
const deleteTarget = ref(null)
const nameInput = ref(null)

const defaultTplForm = () => ({
  name: '',
  title: '',
  priority: 'medium',
  tagIds: [],
  recurrence_type: 'none',
  lockedFields: [],
  steps: [],
})

const tplForm = reactive(defaultTplForm())

const priorities = [
  { value: 'high', label: '高', activeClass: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-500' },
  { value: 'medium', label: '中', activeClass: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-500' },
  { value: 'low', label: '低', activeClass: 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-500' },
]

const recurrenceOptions = [
  { value: 'none', label: '不重复' },
  { value: 'workday', label: '工作日' },
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
]

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    templates.value = await db.getAllTemplates()
    // Load steps for each template
    const stepsMap = {}
    for (const tpl of templates.value) {
      stepsMap[tpl.id] = await db.getTemplateSteps(tpl.id)
    }
    templateSteps.value = stepsMap
  } finally {
    loading.value = false
  }
}

function priorityClass(p) {
  if (p === 'high') return 'bg-red-50 dark:bg-red-900/20 text-red-500'
  if (p === 'low') return 'bg-green-50 dark:bg-green-900/20 text-green-500'
  return 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'
}

function priorityLabel(p) {
  if (p === 'high') return '高优先级'
  if (p === 'low') return '低优先级'
  return '中优先级'
}

function recurrenceLabel(r) {
  const map = { workday: '工作日', daily: '每日', weekly: '每周', monthly: '每月' }
  return map[r] || r
}

function getTemplateTagNames(tpl) {
  if (!tpl.tag_ids) return []
  try {
    const ids = JSON.parse(tpl.tag_ids)
    if (!Array.isArray(ids)) return []
    return ids
      .map(id => store.tags.find(t => t.id === id))
      .filter(Boolean)
      .map(t => t.name)
  } catch {
    return []
  }
}

const lockedFieldLabels = {
  title: '标题',
  priority: '优先级',
  tags: '标签',
  recurrence: '重复',
  steps: '步骤',
}

function getLockedFields(tpl) {
  if (!tpl.locked_fields) return []
  try {
    const fields = JSON.parse(tpl.locked_fields)
    if (!Array.isArray(fields)) return []
    return fields.map(f => lockedFieldLabels[f] || f)
  } catch {
    return []
  }
}

function openCreateModal() {
  editingTemplate.value = null
  Object.assign(tplForm, defaultTplForm())
  showModal.value = true
  nextTick(() => nameInput.value?.focus())
}

async function editTemplate(tpl) {
  editingTemplate.value = tpl
  tplForm.name = tpl.name
  tplForm.title = tpl.title
  tplForm.priority = tpl.priority || 'medium'
  tplForm.recurrence_type = tpl.recurrence_type || 'none'
  // Parse tag_ids
  try {
    tplForm.tagIds = JSON.parse(tpl.tag_ids || '[]')
  } catch {
    tplForm.tagIds = []
  }
  // Parse locked_fields
  try {
    tplForm.lockedFields = JSON.parse(tpl.locked_fields || '[]')
  } catch {
    tplForm.lockedFields = []
  }
  // Load steps
  const steps = await db.getTemplateSteps(tpl.id)
  tplForm.steps = steps.map(s => ({ title: s.title }))
  showModal.value = true
}

function toggleTag(tagId) {
  const idx = tplForm.tagIds.indexOf(tagId)
  if (idx >= 0) {
    tplForm.tagIds.splice(idx, 1)
  } else {
    tplForm.tagIds.push(tagId)
  }
}

function addStep() {
  tplForm.steps.push({ title: '' })
}

function removeStep(index) {
  tplForm.steps.splice(index, 1)
}

function onStepEnter(index) {
  if (!tplForm.steps[index].title.trim()) {
    if (tplForm.steps.length > 1) {
      tplForm.steps.splice(index, 1)
    }
  } else {
    tplForm.steps.splice(index + 1, 0, { title: '' })
  }
}

async function saveTemplate() {
  if (!tplForm.name.trim() || !tplForm.title.trim()) return

  const templateData = {
    ...(editingTemplate.value || {}),
    name: tplForm.name.trim(),
    title: tplForm.title.trim(),
    priority: tplForm.priority,
    recurrence_type: tplForm.recurrence_type,
    recurrence_config: '{}',
    tag_ids: JSON.stringify(tplForm.tagIds),
    locked_fields: JSON.stringify(tplForm.lockedFields),
  }

  let savedId
  if (editingTemplate.value) {
    await db.updateTemplate(templateData)
    savedId = editingTemplate.value.id
  } else {
    const created = await db.createTemplate(templateData)
    savedId = created.id
  }

  // Save steps
  const steps = tplForm.steps.filter(s => s.title.trim()).map(s => ({ title: s.title.trim() }))
  await db.saveTemplateSteps(savedId, steps)

  showModal.value = false
  await loadData()
}

function confirmDelete(tpl) {
  deleteTarget.value = tpl
}

async function doDelete() {
  if (!deleteTarget.value) return
  await db.deleteTemplate(deleteTarget.value.id)
  deleteTarget.value = null
  await loadData()
}
</script>
