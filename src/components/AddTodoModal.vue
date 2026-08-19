<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
    <div class="relative w-full max-w-lg mx-4 bg-surface rounded-2xl shadow-2xl border border-border">
      <!-- 拖拽文件悬停覆盖层 -->
      <div
        v-if="isDragOver"
        class="drag-overlay"
      >
        <div class="drag-overlay-content">
          <svg class="drag-overlay-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>释放以上传附件</span>
        </div>
      </div>
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 class="text-lg font-semibold text-content">
          {{ props.readonly ? '查看待办' : isEditing ? '编辑待办' : '新建待办' }}
        </h3>
        <button @click="$emit('close')" class="p-1 rounded-lg hover:bg-surface-tertiary text-content-tertiary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <div class="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">
            标题 *
            <span
              v-if="isLocked('title')"
              class="inline-flex items-center gap-0.5 text-xs text-purple-500 font-normal ml-1"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
              已锁定
            </span>
          </label>
          <input
            ref="titleInput"
            v-model="form.title"
            class="input-field"
            :class="isLocked('title') ? 'opacity-60 cursor-not-allowed bg-surface-2 bg-surface-2' : ''"
            placeholder="输入待办事项..."
            :disabled="isLocked('title')"
            @keydown.enter="submit"
          />
        </div>

        <!-- Priority -->
        <div>
          <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">
            优先级
            <span
              v-if="isLocked('priority')"
              class="inline-flex items-center gap-0.5 text-xs text-purple-500 font-normal ml-1"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
              已锁定
            </span>
          </label>
          <div class="flex gap-2" :class="isLocked('priority') ? 'opacity-60 pointer-events-none' : ''">
            <button
              v-for="p in priorities"
              :key="p.value"
              @click="form.priority = p.value"
              class="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
              :class="
                form.priority === p.value
                  ? p.activeClass
                  : 'border-border text-content-tertiary hover:border-content-tertiary'
              "
              :disabled="isLocked('priority')"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">
            标签
            <span
              v-if="isLocked('tags')"
              class="inline-flex items-center gap-0.5 text-xs text-purple-500 font-normal ml-1"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
              已锁定
            </span>
          </label>
          <div class="flex flex-wrap gap-2" :class="isLocked('tags') ? 'opacity-60 pointer-events-none' : ''">
            <button
              v-for="tag in store.tags"
              :key="tag.id"
              @click="toggleTag(tag.id)"
              class="tag-badge border transition-all"
              :class="[
                form.tagIds.includes(tag.id)
                  ? 'border-current opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-75',
                isLocked('tags') ? 'cursor-not-allowed' : 'cursor-pointer',
              ]"
              :style="{ backgroundColor: tag.color + '20', color: tag.color }"
              :disabled="isLocked('tags')"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>

        <!-- Due Date -->
        <div>
          <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">截止日期</label>
          <input v-model="form.due_date" type="date" class="input-field" :disabled="props.readonly" />
        </div>

        <!-- Reminder -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-content-secondary text-muted">提醒</label>
            <button
              type="button"
              @click="form.reminder_enabled = !form.reminder_enabled"
              class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              :class="[form.reminder_enabled ? 'bg-primary' : 'bg-control', props.readonly ? 'opacity-60 cursor-not-allowed' : '']"
              :disabled="props.readonly"
            >
              <span
                class="inline-block h-3.5 w-3.5 transform rounded-full bg-surface transition-transform shadow"
                :class="form.reminder_enabled ? 'translate-x-4.5' : 'translate-x-0.5'"
              />
            </button>
          </div>
          <div v-if="form.reminder_enabled">
            <input v-model="form.reminder_at" type="datetime-local" class="input-field" :disabled="props.readonly" />
          </div>
        </div>

        <!-- Recurrence -->
        <div>
          <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">
            重复
            <span
              v-if="isLocked('recurrence')"
              class="inline-flex items-center gap-0.5 text-xs text-purple-500 font-normal ml-1"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
              已锁定
            </span>
          </label>
          <div class="flex gap-2 flex-wrap" :class="isLocked('recurrence') ? 'opacity-60 pointer-events-none' : ''">
            <button
              v-for="r in recurrenceOptions"
              :key="r.value"
              @click="form.recurrence_type = r.value"
              class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
              :class="
                form.recurrence_type === r.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-content-tertiary hover:border-content-tertiary'
              "
              :disabled="isLocked('recurrence')"
            >
              {{ r.label }}
            </button>
          </div>
        </div>

        <!--
          自定义字段区域
          支持两种字段类型：enum（下拉选择）和 text（自由输入）。
          每个字段可被模板单独锁定（lockedFields 中包含 "cf_{fieldId}"），
          锁定后该字段不可编辑，并显示锁定图标。
        -->
        <div v-if="store.customFields.length > 0">
          <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">
            自定义字段
            <span
              v-if="isCustomFieldAllLocked"
              class="inline-flex items-center gap-0.5 text-xs text-purple-500 font-normal ml-1"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
              已锁定
            </span>
          </label>
          <div class="space-y-3">
            <div v-for="field in store.customFields" :key="field.id">
              <label class="block text-xs text-content-tertiary mb-1">
                {{ field.name }}
                <span
                  v-if="isCfLocked(field.id)"
                  class="inline-flex items-center gap-0.5 text-xs text-purple-500 font-normal ml-1"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  已锁定
                </span>
              </label>
              <select
                v-if="field.field_type === 'enum'"
                v-model="form.customFieldValues[field.id]"
                class="input-field py-1.5 text-sm"
                :class="isCfLocked(field.id) ? 'opacity-60 cursor-not-allowed bg-surface-2' : ''"
                :disabled="props.readonly || isCfLocked(field.id)"
              >
                <option value="">-- 请选择 --</option>
                <option
                  v-for="ev in parseEnumValues(field)"
                  :key="ev.value"
                  :value="ev.value"
                >{{ ev.note ? `${ev.value}（${ev.note}）` : ev.value }}</option>
              </select>
              <input
                v-else
                v-model="form.customFieldValues[field.id]"
                type="text"
                class="input-field py-1.5 text-sm"
                :class="isCfLocked(field.id) ? 'opacity-60 cursor-not-allowed bg-surface-2' : ''"
                :placeholder="'输入' + field.name"
                :disabled="props.readonly || isCfLocked(field.id)"
              />
            </div>
          </div>
        </div>

        <!-- Steps -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-content-secondary text-muted">
              任务步骤（选填）
              <span
                v-if="isLocked('steps')"
                class="inline-flex items-center gap-0.5 text-xs text-purple-500 font-normal ml-1"
              >
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                已锁定
              </span>
            </label>
            <button
              v-if="!isLocked('steps')"
              @click="addStep"
              class="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              添加步骤
            </button>
          </div>
          <div
            v-if="form.steps.length > 0"
            class="space-y-2"
            :class="isLocked('steps') ? 'opacity-60 pointer-events-none' : ''"
          >
            <div v-for="(step, index) in form.steps" :key="index" class="flex items-center gap-2 group">
              <span
                class="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center flex-shrink-0"
              >
                {{ index + 1 }}
              </span>
              <input
                v-model="step.title"
                class="flex-1 input-field py-1.5 text-sm"
                placeholder="输入步骤内容..."
                :disabled="isLocked('steps')"
              />
              <button
                v-if="!isLocked('steps')"
                @click="removeStep(index)"
                class="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:bg-red-50/20 text-content-tertiary hover:text-red-500 transition-all"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p v-else class="text-xs text-content-tertiary">添加步骤后，可在待办进行中逐项勾选完成</p>
        </div>

        <!-- Attachment -->
        <div>
          <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">
            附件（可多个，每个最大 10MB）
          </label>
          <div v-if="form.attachments.length > 0" class="space-y-2">
            <div
              v-for="(att, index) in form.attachments"
              :key="att.id || index"
              class="flex items-center gap-2 p-2 rounded-lg bg-surface-secondary"
            >
              <svg class="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              <span class="text-sm text-content truncate flex-1">{{ att.file_name || att.name }}</span>
              <span class="text-xs text-content-tertiary">{{ formatFileSize(att.file_size || att.size) }}</span>
              <button
                v-if="!props.readonly"
                @click="removeAttachment(index)"
                class="p-1 rounded hover:bg-red-50 hover:bg-red-50/20 text-red-400 hover:text-red-500"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <button
            v-if="!props.readonly"
            @click="uploadAttachment"
            class="flex items-center gap-2 text-sm text-primary hover:text-primary-hover mt-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            添加附件
          </button>
          <p v-if="attachmentError" class="text-xs text-red-500 mt-1">{{ attachmentError }}</p>
        </div>

        <!-- Notes (Rich Text) -->
        <div>
          <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">备注（选填）</label>
          <div :class="props.readonly ? 'pointer-events-none opacity-60' : ''">
            <RichEditor v-model="form.notes" />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
        <template v-if="props.readonly">
          <button @click="$emit('close')" class="btn-secondary">关闭</button>
        </template>
        <template v-else>
          <button @click="$emit('close')" class="btn-secondary">取消</button>
          <button @click="submit" class="btn-primary" :disabled="!form.title.trim()">
            {{ isEditing ? '保存' : '创建' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * AddTodoModal — 待办新建/编辑/查看弹窗组件
 *
 * 职责：
 *   1. 提供统一的待办表单界面，支持新建、编辑、只读查看三种模式
 *   2. 根据模板数据预填表单，并正确应用字段锁定（含自定义字段逐个锁定）
 *   3. 收集表单数据后通过 submit 事件传递给父组件
 *
 * 设计要点：
 *   - 所有共享常量（优先级、重复类型等）统一从 helpers.js 引入，避免 DRY 违反
 *   - 字段锁定分两层：标准字段用 isFieldLocked，自定义字段用 isCfLocked
 *   - 模板预填数据通过 todo._templateData 传入，包含 customFieldValues
 */
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useAppStore } from '../stores/app'
import { open } from '@tauri-apps/api/dialog'
import { readBinaryFile } from '@tauri-apps/api/fs'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import RichEditor from './RichEditor.vue'
import * as db from '../utils/db'

// ─── 共享工具导入 ─────────────────────────────────────────────
// 从 helpers.js 引入统一的常量和工具函数，消除各组件间的重复定义
import {
  PRIORITIES,
  RECURRENCE_OPTIONS,
  parseEnumValues,
  formatFileSize,
  isFieldLocked,
  isCustomFieldLocked,
} from '../utils/helpers'

const store = useAppStore()

// ─── Props & Emits ────────────────────────────────────────────

const props = defineProps({
  /** 控制弹窗显示/隐藏 */
  show: Boolean,
  /**
   * 待办数据对象：
   * - 编辑模式：传入已有待办（含 id）
   * - 新建模式：传 null 或 { _isNew: true } 对象
   * - 模板预填：_isNew 对象上附带 _templateData
   */
  todo: { type: Object, default: null },
  /**
   * 被锁定的字段名数组。
   * 标准字段：['title', 'priority', 'tags', 'recurrence', 'steps']
   * 自定义字段：['cf_1', 'cf_3']（cf_ 前缀 + 字段 ID）
   */
  lockedFields: { type: Array, default: () => [] },
  /** 是否处于只读查看模式 */
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'submit'])

// ─── 锁定状态判断 ─────────────────────────────────────────────

/**
 * 判断标准字段是否被锁定。
 * 委托给 helpers.js 的 isFieldLocked，统一处理 readonly + lockedFields 逻辑。
 *
 * @param {string} field - 字段名（title/priority/tags/recurrence/steps）
 * @returns {boolean}
 */
function isLocked(field) {
  return isFieldLocked(field, props.lockedFields, props.readonly)
}

/**
 * 判断指定自定义字段是否被锁定。
 * 锁定标识格式为 "cf_{fieldId}"，存储在 lockedFields 数组中。
 *
 * @param {number} fieldId - 自定义字段 ID
 * @returns {boolean}
 */
function isCfLocked(fieldId) {
  return isCustomFieldLocked(fieldId, props.lockedFields)
}

/**
 * 计算是否所有自定义字段都被锁定。
 * 用于在自定义字段区域标题显示锁定图标。
 */
const isCustomFieldAllLocked = computed(() => {
  if (store.customFields.length === 0) return false
  return store.customFields.every(cf => isCfLocked(cf.id))
})

// ─── 响应式状态 ───────────────────────────────────────────────

const titleInput = ref(null)   // 标题输入框引用，用于自动聚焦
const isEditing = ref(false)   // 当前是否为编辑模式
const attachmentError = ref('') // 附件上传错误信息
const isDragOver = ref(false)  // 拖拽文件悬停状态

// Tauri 拖拽事件取消订阅函数
let unlistenFileDrop = null
let unlistenFileDropHover = null
let unlistenFileDropCancelled = null

// ─── 表单数据模型 ─────────────────────────────────────────────

/**
 * 生成表单默认值。
 * 使用函数返回新对象，确保每次重置时不会引用同一对象。
 */
const defaultForm = () => ({
  title: '',
  notes: '',
  priority: 'medium',
  tagIds: [],
  due_date: '',
  reminder_enabled: false,
  reminder_at: '',
  recurrence_type: 'none',
  recurrence_config: '{}',
  attachments: [],
  steps: [],
  /**
   * 自定义字段值，以 { fieldId: value } 形式存储。
   * 使用 Map 结构便于 v-model 双向绑定，提交时转换为数组格式。
   */
  customFieldValues: {},
})

const form = reactive(defaultForm())

// ─── 共享常量引用 ─────────────────────────────────────────────
// 直接使用 helpers.js 中的统一配置，不再本地维护副本
const priorities = PRIORITIES
const recurrenceOptions = RECURRENCE_OPTIONS

// ─── 弹窗打开时的数据初始化 ───────────────────────────────────

/**
 * 监听弹窗打开事件，根据传入的 todo 对象初始化表单。
 *
 * 三种场景：
 *   1. 编辑已有待办（!_isNew）：从 todo 对象加载所有字段
 *   2. 从模板新建（_isNew + _templateData）：预填模板数据 + 应用字段锁定
 *   3. 普通新建（_isNew 或 null）：使用默认空表单
 */
watch(
  () => props.show,
  async val => {
    if (!val) {
      // 弹窗关闭时重置拖拽状态
      isDragOver.value = false
      return
    }

    await nextTick()
    if (!props.readonly) {
      titleInput.value?.focus()
    }
    attachmentError.value = ''

    // ── 注册 Tauri 文件拖拽事件（仅在弹窗打开时监听）──
    // 清理旧的监听器
    if (unlistenFileDrop) { await unlistenFileDrop(); unlistenFileDrop = null }
    if (unlistenFileDropHover) { await unlistenFileDropHover(); unlistenFileDropHover = null }
    if (unlistenFileDropCancelled) { await unlistenFileDropCancelled(); unlistenFileDropCancelled = null }

    unlistenFileDropHover = await listen('tauri://file-drop-hover', () => {
      if (props.show && !props.readonly) {
        isDragOver.value = true
      }
    })

    unlistenFileDropCancelled = await listen('tauri://file-drop-cancelled', () => {
      isDragOver.value = false
    })

    unlistenFileDrop = await listen('tauri://file-drop', async (event) => {
      isDragOver.value = false
      // 仅在弹窗打开且非只读时处理
      if (!props.show || props.readonly) return

      // Tauri v1 payload 可能是 string[] 或 { paths: string[] }
      let filePaths = []
      if (Array.isArray(event.payload)) {
        filePaths = event.payload
      } else if (event.payload && Array.isArray(event.payload.paths)) {
        filePaths = event.payload.paths
      }
      if (filePaths.length === 0) return

      try {
        for (const filePath of filePaths) {
          const fileName = filePath.split(/[/\\]/).pop()
          // 通过 Rust 命令获取文件大小（避免前端 readBinaryFile 大文件）
          const result = await invoke('save_attachment', { filePath, fileName })
          if (result.size > 10 * 1024 * 1024) {
            attachmentError.value = `文件 ${fileName} 超过 10MB 限制`
            continue
          }

          if (isEditing.value && props.todo && !props.todo._isNew) {
            const att = await db.addAttachmentToTodo(props.todo.id, result.path, result.name, result.size)
            form.attachments.push({
              id: att.id,
              file_path: att.file_path,
              file_name: att.file_name,
              file_size: att.file_size,
            })
          } else {
            form.attachments.push({
              path: result.path,
              name: result.name,
              size: result.size,
            })
          }
        }
        attachmentError.value = ''
      } catch (e) {
        attachmentError.value = '拖拽上传失败: ' + e
      }
    })

    if (props.todo && !props.todo._isNew) {
      // ── 场景 1：编辑已有待办 ──
      isEditing.value = true
      form.title = props.todo.title
      form.notes = props.todo.notes || ''
      form.priority = props.todo.priority || 'medium'
      form.tagIds = (props.todo.tags || []).map(t => t.id)
      form.due_date = props.todo.due_date || ''
      form.reminder_enabled = !!props.todo.reminder_at
      form.reminder_at = props.todo.reminder_at ? props.todo.reminder_at.slice(0, 16) : ''
      form.recurrence_type = props.todo.recurrence_type || 'none'
      form.recurrence_config = props.todo.recurrence_config || '{}'
      // Load existing attachments
      form.attachments = (props.todo.attachments || []).map(a => ({
        id: a.id,
        file_path: a.file_path,
        file_name: a.file_name,
        file_size: a.file_size,
      }))
      form.steps = (props.todo.steps || []).map(s => ({ title: s.title, completed: !!s.completed }))

      // 加载自定义字段值：从数组格式 [{field_id, value}] 转为 Map 格式 {fieldId: value}
      form.customFieldValues = {}
      if (props.todo.customFieldValues) {
        for (const cfv of props.todo.customFieldValues) {
          form.customFieldValues[cfv.field_id] = cfv.value || ''
        }
      }
    } else {
      // ── 场景 2/3：新建模式 ──
      isEditing.value = false
      Object.assign(form, defaultForm())

      if (props.todo?._isNew) {
        // 小窗模式传入的基础预填
        form.title = props.todo.title || ''
        form.priority = props.todo.priority || 'medium'
        form.tagIds = (props.todo.tags || []).map(t => t.id)

        // 模板预填数据：包含重复类型、步骤、自定义字段值
        if (props.todo._templateData) {
          const tpl = props.todo._templateData
          form.recurrence_type = tpl.recurrence_type || 'none'
          form.recurrence_config = tpl.recurrence_config || '{}'
          form.steps = (tpl.steps || []).map(s => ({ title: s.title, completed: !!s.completed }))

          // 预填模板中的自定义字段默认值
          if (tpl.customFieldValues) {
            for (const cfv of tpl.customFieldValues) {
              form.customFieldValues[cfv.field_id] = cfv.value || ''
            }
          }
        }
      }
    }
  },
)

// ─── 表单操作方法 ─────────────────────────────────────────────

/**
 * 切换标签的选中状态。
 * 已选则移除，未选则加入。
 */
function toggleTag(tagId) {
  const idx = form.tagIds.indexOf(tagId)
  if (idx >= 0) {
    form.tagIds.splice(idx, 1)
  } else {
    form.tagIds.push(tagId)
  }
}

/**
 * 上传附件。
 * 流程：打开文件选择器 → 读取文件检查大小 → 调用 Rust 命令保存到应用数据目录。
 * 限制：单文件最大 10MB。支持多文件选择。
 */
async function uploadAttachment() {
  try {
    const selected = await open({
      multiple: true,
      filters: [{ name: 'All Files', extensions: ['*'] }],
    })
    if (!selected || (Array.isArray(selected) && selected.length === 0)) return
    const files = Array.isArray(selected) ? selected : [selected]

    for (const filePath of files) {
      // 读取文件以检查大小（避免上传超大文件）
      const contents = await readBinaryFile(filePath)
      const size = contents.byteLength
      if (size > 10 * 1024 * 1024) {
        attachmentError.value = `文件 ${filePath.split(/[/\\]/).pop()} 超过 10MB 限制`
        continue
      }

      // 调用 Rust 端命令将文件复制到应用数据目录的 attachments 子目录
      const fileName = filePath.split(/[/\\]/).pop()
      const result = await invoke('save_attachment', { filePath, fileName })

      // If editing an existing todo, add to DB immediately
      if (isEditing.value && props.todo && !props.todo._isNew) {
        const att = await db.addAttachmentToTodo(props.todo.id, result.path, result.name, result.size)
        form.attachments.push({
          id: att.id,
          file_path: att.file_path,
          file_name: att.file_name,
          file_size: att.file_size,
        })
      } else {
        // New todo: just store in form for later submission
        form.attachments.push({
          path: result.path,
          name: result.name,
          size: result.size,
        })
      }
    }
    attachmentError.value = ''
  } catch (e) {
    attachmentError.value = '上传失败: ' + e
  }
}

/** 移除指定索引的附件。如果是已有附件（有id），同时从数据库删除。 */
async function removeAttachment(index) {
  const att = form.attachments[index]
  if (att.id) {
    // Existing attachment in DB - delete it
    try {
      await db.deleteSingleAttachment(att.id)
    } catch (e) {
      console.error('Failed to delete attachment:', e)
    }
  }
  form.attachments.splice(index, 1)
}

/** 添加一个空白步骤。 */
function addStep() {
  form.steps.push({ title: '', completed: false })
}

/** 删除指定索引的步骤。 */
function removeStep(index) {
  form.steps.splice(index, 1)
}

// ─── 提交 ─────────────────────────────────────────────────────

/**
 * 提交表单数据。
 *
 * 数据转换：
 *   - steps：过滤掉空白步骤
 *   - customFieldValues：从 Map {fieldId: value} 转为数组 [{field_id, value}]
 *   - reminder_at：仅在启用提醒时附加秒数后缀
 */
function submit() {
  if (!form.title.trim()) return

  const reminderAt = form.reminder_enabled && form.reminder_at ? form.reminder_at + ':00' : null

  // 过滤空白步骤，只保留有内容的
  const steps = form.steps.filter(s => s.title.trim()).map(s => ({ title: s.title.trim(), completed: !!s.completed }))

  // 将 Map 格式的自定义字段值转换为后端需要的数组格式
  const customFieldValues = Object.entries(form.customFieldValues)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([fieldId, value]) => ({ field_id: parseInt(fieldId), value }))

  // For new todos, include attachments array; for editing, attachments are already in DB
  const submitData = {
    ...(props.todo || {}),
    title: form.title.trim(),
    notes: form.notes,
    priority: form.priority,
    tagIds: [...form.tagIds],
    due_date: form.due_date || null,
    todo_date: props.todo?.todo_date || store.currentDate,
    recurrence_type: form.recurrence_type,
    recurrence_config: form.recurrence_config,
    reminder_at: reminderAt,
    steps,
    customFieldValues,
  }

  // Only include attachments for new todos (editing handles attachments in real-time)
  if (!isEditing.value || !props.todo || props.todo._isNew) {
    submitData.attachments = form.attachments.map(a => ({
      path: a.path,
      name: a.name,
      size: a.size,
    }))
  }

  emit('submit', submitData)
}
</script>

<style scoped>
/* 拖拽文件悬停覆盖层 — 覆盖整个弹窗，pointer-events: none 确保不阻挡表单交互 */
.drag-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(59, 130, 246, 0.08);
  border: 2px dashed rgba(59, 130, 246, 0.5);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  animation: dragPulse 1.5s ease-in-out infinite;
}

.drag-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: rgba(59, 130, 246, 0.85);
  font-size: 1rem;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
}

.drag-overlay-icon {
  width: 3rem;
  height: 3rem;
  opacity: 0.8;
}

@keyframes dragPulse {
  0%, 100% {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.05);
  }
  50% {
    border-color: rgba(59, 130, 246, 0.6);
    background: rgba(59, 130, 246, 0.12);
  }
}
</style>
