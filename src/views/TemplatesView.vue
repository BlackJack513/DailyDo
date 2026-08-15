<!--
  TemplatesView.vue — 待办模板管理页面

  功能：
  1. 展示所有模板卡片（含优先级、标签、重复类型、锁定字段、步骤、自定义字段）
  2. 创建/编辑模板（支持设置自定义字段默认值 + 锁定自定义字段）
  3. 删除模板

  重构说明：
  - 使用 templateService 封装所有模板数据操作（CRUD + 关联数据加载）
  - 使用 helpers.js 共享函数消除重复代码（priorityClass、recurrenceLabel 等）
  - 新增自定义字段集成：表单中可设置各自定义字段的默认值，并可选择锁定
-->
<template>
  <div class="flex-1 flex flex-col h-full bg-surface-secondary bg-body">
    <!-- Header -->
    <div class="px-6 py-5 border-b border-border bg-surface">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-content">待办模板</h1>
          <p class="text-sm text-content-tertiary mt-1">管理常用待办模板，快速创建相似任务</p>
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
      <div
        v-if="templates.length === 0 && !loading"
        class="flex flex-col items-center justify-center py-20 text-content-tertiary"
      >
        <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p class="text-lg font-medium mb-1">暂无模板</p>
        <p class="text-sm">点击上方按钮创建第一个待办模板</p>
      </div>

      <!-- Template cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="tpl in templates"
          :key="tpl.id"
          class="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
        >
          <!-- Template header -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-content truncate">{{ tpl.name }}</h3>
              <p class="text-sm text-content-secondary text-muted truncate mt-0.5">{{ tpl.title }}</p>
            </div>
            <div class="flex items-center gap-1 ml-2 flex-shrink-0">
              <button
                @click="editTemplate(tpl)"
                class="p-1.5 rounded-lg hover:bg-surface-tertiary text-content-tertiary hover:text-primary transition-colors"
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
                @click="confirmDelete(tpl)"
                class="p-1.5 rounded-lg hover:bg-red-50 hover:bg-red-50/20 text-content-tertiary hover:text-red-500 transition-colors"
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

          <!-- Meta info: priority + recurrence -->
          <div class="flex flex-wrap gap-2 mb-3">
            <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="priorityClass(tpl.priority)">
              {{ priorityLabel(tpl.priority) }}
            </span>
            <span
              v-if="tpl.recurrence_type && tpl.recurrence_type !== 'none'"
              class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-blue-400 font-medium"
            >
              {{ recurrenceLabel(tpl.recurrence_type) }}
            </span>
          </div>

          <!-- Tags -->
          <div v-if="tpl.tagNames && tpl.tagNames.length > 0" class="flex flex-wrap gap-1.5 mb-3">
            <span
              v-for="tn in tpl.tagNames"
              :key="tn"
              class="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-content-secondary text-muted"
            >
              {{ tn }}
            </span>
          </div>

          <!-- Locked fields indicator (使用 getLockedFieldLabels 支持自定义字段名展开) -->
          <div v-if="getLockedLabels(tpl).length > 0" class="flex flex-wrap gap-1.5 mb-3">
            <span
              v-for="lf in getLockedLabels(tpl)"
              :key="lf"
              class="text-xs px-2 py-0.5 rounded-full bg-purple-50 bg-purple-50/20 text-purple-600 text-purple-400 font-medium"
            >
              🔒 {{ lf }}
            </span>
          </div>

          <!-- Custom field values preview (显示模板中设置的自定义字段默认值) -->
          <div v-if="getCustomFieldPreview(tpl).length > 0" class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="cfv in getCustomFieldPreview(tpl)"
              :key="cfv.fieldId"
              class="text-xs px-2 py-0.5 rounded-full bg-cyan-50 bg-cyan-50/20 text-cyan-600 text-cyan-500 font-medium"
            >
              {{ cfv.fieldName }}: {{ cfv.displayValue }}
            </span>
          </div>

          <!-- Steps -->
          <div
            v-if="tpl.steps && tpl.steps.length > 0"
            class="mt-2 pt-3 border-t border-border"
          >
            <p class="text-xs text-content-tertiary mb-1.5">{{ tpl.steps.length }} 个步骤</p>
            <div class="space-y-1">
              <div
                v-for="(step, idx) in tpl.steps.slice(0, 3)"
                :key="step.id || idx"
                class="flex items-center gap-2 text-sm text-content-secondary text-muted"
              >
                <span
                  class="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex items-center justify-center flex-shrink-0"
                >
                  {{ idx + 1 }}
                </span>
                <span class="truncate">{{ step.title }}</span>
              </div>
              <p v-if="tpl.steps.length > 3" class="text-xs text-content-tertiary pl-6">
                +{{ tpl.steps.length - 3 }} 更多...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Template Edit/Create Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showModal = false"></div>
      <div class="relative w-full max-w-lg mx-4 bg-surface rounded-2xl shadow-2xl border border-border">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 class="text-lg font-semibold text-content">
            {{ editingTemplate ? '编辑模板' : '新建模板' }}
          </h3>
          <button @click="showModal = false" class="p-1 rounded-lg hover:bg-surface-tertiary text-content-tertiary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Form -->
        <div class="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <!-- Template Name -->
          <div>
            <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">模板名称 *</label>
            <input
              ref="nameInput"
              v-model="tplForm.name"
              @input="formError = ''"
              class="input-field"
              placeholder="例如：每日站会、周报..."
            />
          </div>

          <!-- Default Title -->
          <div>
            <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">默认标题 *</label>
            <input
              v-model="tplForm.title"
              @input="formError = ''"
              class="input-field"
              placeholder="创建待办时的默认标题..."
            />
          </div>

          <!-- Priority (使用 PRIORITIES 常量，不再本地维护) -->
          <div>
            <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">优先级</label>
            <div class="flex gap-2">
              <button
                v-for="p in PRIORITIES"
                :key="p.value"
                @click="tplForm.priority = p.value"
                class="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
                :class="
                  tplForm.priority === p.value
                    ? p.activeClass
                    : 'border-border text-content-tertiary hover:border-content-tertiary'
                "
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">标签</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in store.tags"
                :key="tag.id"
                @click="toggleTag(tag.id)"
                class="tag-badge cursor-pointer border transition-all"
                :class="
                  tplForm.tagIds.includes(tag.id)
                    ? 'border-current opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-75'
                "
                :style="{ backgroundColor: tag.color + '20', color: tag.color }"
              >
                {{ tag.name }}
              </button>
            </div>
          </div>

          <!-- Recurrence (使用 RECURRENCE_OPTIONS 常量) -->
          <div>
            <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">重复</label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="r in RECURRENCE_OPTIONS"
                :key="r.value"
                @click="tplForm.recurrence_type = r.value"
                class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
                :class="
                  tplForm.recurrence_type === r.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-content-tertiary hover:border-content-tertiary'
                "
              >
                {{ r.label }}
              </button>
            </div>
          </div>

          <!-- Locked Fields (标准字段 + 自定义字段均可锁定) -->
          <div>
            <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">
              锁定字段
              <span class="text-xs font-normal text-content-tertiary ml-1">（使用模板时这些字段不可修改）</span>
            </label>
            <div class="flex flex-wrap gap-3">
              <!-- 标准字段锁定 -->
              <label
                v-for="lf in standardLockableFields"
                :key="lf.value"
                class="flex items-center gap-1.5 text-sm text-content-secondary text-muted cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  :value="lf.value"
                  v-model="tplForm.lockedFields"
                  class="rounded border-border text-primary focus:ring-primary"
                />
                {{ lf.label }}
              </label>
              <!-- 自定义字段锁定（每个自定义字段独立锁定，标识为 "cf_{id}"） -->
              <label
                v-for="cf in store.customFields"
                :key="'lock_cf_' + cf.id"
                class="flex items-center gap-1.5 text-sm text-content-secondary text-muted cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  :value="'cf_' + cf.id"
                  v-model="tplForm.lockedFields"
                  class="rounded border-border text-primary focus:ring-primary"
                />
                {{ cf.name }}
              </label>
            </div>
          </div>

          <!-- Custom Fields Default Values (新增：设置各自定义字段的默认值) -->
          <div v-if="store.customFields.length > 0">
            <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">
              自定义字段默认值
              <span class="text-xs font-normal text-content-tertiary ml-1">（使用模板时自动填入）</span>
            </label>
            <div class="space-y-3">
              <div v-for="cf in store.customFields" :key="'cf_' + cf.id">
                <label class="block text-xs text-content-tertiary mb-1">{{ cf.name }}</label>
                <!-- enum 类型：下拉选择 -->
                <select
                  v-if="cf.field_type === 'enum'"
                  v-model="tplForm.customFieldValues[cf.id]"
                  class="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm text-content outline-none focus:border-primary"
                >
                  <option value="">不设置</option>
                  <option
                    v-for="opt in getEnumOptions(cf)"
                    :key="opt.value"
                    :value="opt.value"
                    :title="opt.note"
                  >
                    {{ opt.value }}<span v-if="opt.note"> ({{ opt.note }})</span>
                  </option>
                </select>
                <!-- text 类型：文本输入 -->
                <input
                  v-else
                  v-model="tplForm.customFieldValues[cf.id]"
                  class="input-field text-sm"
                  :placeholder="'输入' + cf.name + '默认值...'"
                />
              </div>
            </div>
          </div>

          <!-- Steps -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-sm font-medium text-content-secondary text-muted">默认步骤（选填）</label>
              <button
                @click="addStep"
                class="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                添加步骤
              </button>
            </div>
            <div v-if="tplForm.steps.length > 0" class="space-y-2">
              <div v-for="(step, index) in tplForm.steps" :key="index" class="flex items-center gap-2 group">
                <span
                  class="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center flex-shrink-0"
                >
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
                  class="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:bg-red-50/20 text-content-tertiary hover:text-red-500 transition-all"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p v-else class="text-xs text-content-tertiary">使用此模板创建待办时，将自动包含这些步骤</p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <span v-if="formError" class="flex-1 text-sm text-red-500">{{ formError }}</span>
          <button @click="showModal = false" class="btn-secondary">取消</button>
          <button @click="saveTemplate" class="btn-primary">
            {{ editingTemplate ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="deleteTarget = null"></div>
      <div class="relative w-full max-w-sm mx-4 bg-surface rounded-2xl shadow-2xl border border-border p-6">
        <h3 class="text-lg font-semibold text-content mb-2">确认删除</h3>
        <p class="text-sm text-content-secondary text-muted mb-5">
          确定要删除模板「{{ deleteTarget.name }}」吗？此操作不可恢复。
        </p>
        <div class="flex justify-end gap-3">
          <button @click="deleteTarget = null" class="btn-secondary">取消</button>
          <button
            @click="doDelete"
            class="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * TemplatesView 脚本部分
 *
 * 重构要点：
 * 1. 使用 templateService 封装模板 CRUD 和关联数据加载
 * 2. 使用 helpers.js 共享函数替代本地重复定义
 * 3. 新增自定义字段表单支持（默认值 + 锁定）
 * 4. 表单数据模型增加 customFieldValues 字段
 */
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useAppStore } from '../stores/app'
import { templateService } from '../services/templateService'
import {
  PRIORITIES,
  RECURRENCE_OPTIONS,
  priorityClass,
  priorityLabel,
  recurrenceLabel,
  safeJsonParseArray,
  getLockedFieldLabels,
  parseEnumValues,
} from '../utils/helpers'

const store = useAppStore()

// ─── 状态 ──────────────────────────────────────────────────────

/** 模板列表（通过 templateService 加载，含关联数据） */
const templates = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingTemplate = ref(null)
const deleteTarget = ref(null)
const nameInput = ref(null)
const formError = ref('')

/**
 * 标准可锁定字段列表 —— 用于表单中渲染锁定字段的 checkbox。
 * 自定义字段的 checkbox 在模板中通过 store.customFields 动态渲染。
 */
const standardLockableFields = [
  { value: 'title', label: '标题' },
  { value: 'priority', label: '优先级' },
  { value: 'tags', label: '标签' },
  { value: 'recurrence', label: '重复' },
  { value: 'steps', label: '步骤' },
]

/**
 * 模板表单默认值工厂。
 * customFieldValues 使用 { [fieldId]: value } 的 Map 结构，
 * 方便通过 v-model 直接绑定到各字段的输入控件。
 */
const defaultTplForm = () => ({
  name: '',
  title: '',
  priority: 'medium',
  tagIds: [],
  recurrence_type: 'none',
  lockedFields: [],
  steps: [],
  customFieldValues: {}, // { fieldId: value }
})

const tplForm = reactive(defaultTplForm())

// ─── 生命周期 ──────────────────────────────────────────────────

onMounted(async () => {
  await loadData()
})

// ─── 数据加载 ──────────────────────────────────────────────────

/**
 * 加载所有模板及其关联数据（steps、tags、customFieldValues）。
 * 委托给 templateService.loadAll，避免在组件中手动循环加载。
 */
async function loadData() {
  loading.value = true
  try {
    templates.value = await templateService.loadAll(store.tags)
  } finally {
    loading.value = false
  }
}

// ─── 显示辅助函数 ──────────────────────────────────────────────

/**
 * 获取模板锁定字段的中文标签列表（支持自定义字段名展开）。
 * 使用 helpers.js 的 getLockedFieldLabels，传入 store.customFields 以展开 cf_{id}。
 */
function getLockedLabels(tpl) {
  return getLockedFieldLabels(tpl.locked_fields, store.customFields)
}

/**
 * 获取模板自定义字段预设值的预览列表，用于卡片展示。
 * @returns {Array<{fieldId: number, fieldName: string, displayValue: string}>}
 */
function getCustomFieldPreview(tpl) {
  if (!tpl.customFieldValues || tpl.customFieldValues.length === 0) return []
  return tpl.customFieldValues
    .map(cfv => {
      const cf = store.customFields.find(f => f.id === cfv.field_id)
      if (!cf || !cfv.value) return null
      return {
        fieldId: cfv.field_id,
        fieldName: cf.name,
        displayValue: cfv.value,
      }
    })
    .filter(Boolean)
}

/**
 * 获取自定义字段的枚举选项列表。
 * 使用 helpers.js 的 parseEnumValues 统一处理新旧格式。
 */
function getEnumOptions(field) {
  return parseEnumValues(field)
}

// ─── 表单操作 ──────────────────────────────────────────────────

/** 打开新建模板弹窗 */
function openCreateModal() {
  editingTemplate.value = null
  Object.assign(tplForm, defaultTplForm())
  formError.value = ''
  showModal.value = true
  nextTick(() => nameInput.value?.focus())
}

/**
 * 打开编辑模板弹窗 —— 加载模板数据到表单。
 * 包含自定义字段默认值的加载。
 */
async function editTemplate(tpl) {
  editingTemplate.value = tpl
  formError.value = ''
  tplForm.name = tpl.name
  tplForm.title = tpl.title
  tplForm.priority = tpl.priority || 'medium'
  tplForm.recurrence_type = tpl.recurrence_type || 'none'
  tplForm.tagIds = safeJsonParseArray(tpl.tag_ids)
  tplForm.lockedFields = safeJsonParseArray(tpl.locked_fields)
  tplForm.steps = (tpl.steps || []).map(s => ({ title: s.title }))

  // 加载自定义字段默认值：从数组格式转为 { fieldId: value } 的 Map
  const cfMap = {}
  if (tpl.customFieldValues) {
    for (const cfv of tpl.customFieldValues) {
      cfMap[cfv.field_id] = cfv.value || ''
    }
  }
  tplForm.customFieldValues = cfMap

  showModal.value = true
}

/** 切换标签选中状态 */
function toggleTag(tagId) {
  const idx = tplForm.tagIds.indexOf(tagId)
  if (idx >= 0) {
    tplForm.tagIds.splice(idx, 1)
  } else {
    tplForm.tagIds.push(tagId)
  }
}

/** 添加新步骤行 */
function addStep() {
  tplForm.steps.push({ title: '' })
}

/** 删除指定步骤行 */
function removeStep(index) {
  tplForm.steps.splice(index, 1)
}

/**
 * 步骤输入框回车处理：
 * - 空内容时删除该行（至少保留一行）
 * - 有内容时在下方插入新行
 */
function onStepEnter(index) {
  if (!tplForm.steps[index].title.trim()) {
    if (tplForm.steps.length > 1) {
      tplForm.steps.splice(index, 1)
    }
  } else {
    tplForm.steps.splice(index + 1, 0, { title: '' })
  }
}

// ─── 保存 ──────────────────────────────────────────────────────

/**
 * 保存模板（创建或更新）。
 * 将表单中的 customFieldValues Map 转为数组格式传给 templateService。
 */
async function saveTemplate() {
  if (!tplForm.name.trim() && !tplForm.title.trim()) {
    formError.value = '请填写模板名称和默认标题'
    return
  }
  if (!tplForm.name.trim()) {
    formError.value = '请填写模板名称'
    return
  }
  if (!tplForm.title.trim()) {
    formError.value = '请填写默认标题'
    return
  }
  formError.value = ''

  // 将 customFieldValues Map 转为 [{ field_id, value }] 数组
  const customFieldValues = Object.entries(tplForm.customFieldValues)
    .filter(([, v]) => v !== '' && v !== undefined)
    .map(([fieldId, value]) => ({
      field_id: parseInt(fieldId),
      value,
    }))

  const templateData = {
    ...(editingTemplate.value || {}),
    name: tplForm.name.trim(),
    title: tplForm.title.trim(),
    priority: tplForm.priority,
    recurrence_type: tplForm.recurrence_type,
    recurrence_config: '{}',
    tag_ids: JSON.stringify(tplForm.tagIds),
    locked_fields: JSON.stringify(tplForm.lockedFields),
    steps: tplForm.steps.filter(s => s.title.trim()).map(s => ({ title: s.title.trim() })),
    customFieldValues,
  }

  if (editingTemplate.value) {
    await templateService.update(templateData)
  } else {
    await templateService.create(templateData)
  }

  showModal.value = false
  await loadData()
}

// ─── 删除 ──────────────────────────────────────────────────────

/** 弹出删除确认 */
function confirmDelete(tpl) {
  deleteTarget.value = tpl
}

/** 执行删除 */
async function doDelete() {
  if (!deleteTarget.value) return
  await templateService.remove(deleteTarget.value.id)
  deleteTarget.value = null
  await loadData()
}
</script>
