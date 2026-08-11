<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-lg mx-4 bg-surface rounded-2xl shadow-2xl border border-border">
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

        <!-- Custom Fields -->
        <div v-if="store.customFields.length > 0">
          <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">自定义字段</label>
          <div class="space-y-3">
            <div v-for="field in store.customFields" :key="field.id">
              <label class="block text-xs text-content-tertiary mb-1">{{ field.name }}</label>
              <select
                v-if="field.field_type === 'enum'"
                v-model="form.customFieldValues[field.id]"
                class="input-field py-1.5 text-sm"
                :disabled="props.readonly"
              >
                <option value="">-- 请选择 --</option>
                <option
                  v-for="val in getEnumValues(field)"
                  :key="val"
                  :value="val"
                >{{ val }}</option>
              </select>
              <input
                v-else
                v-model="form.customFieldValues[field.id]"
                type="text"
                class="input-field py-1.5 text-sm"
                :placeholder="'输入' + field.name"
                :disabled="props.readonly"
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
            附件（单个，最大 10MB）
          </label>
          <div v-if="form.attachment_name" class="flex items-center gap-2 p-2 rounded-lg bg-surface-secondary">
            <svg class="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            <span class="text-sm text-content truncate flex-1">{{ form.attachment_name }}</span>
            <span class="text-xs text-content-tertiary">{{ formatSize(form.attachment_size) }}</span>
            <button
              v-if="!props.readonly"
              @click="removeAttachment"
              class="p-1 rounded hover:bg-red-50 hover:bg-red-50/20 text-red-400 hover:text-red-500"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            v-else-if="!props.readonly"
            @click="uploadAttachment"
            class="flex items-center gap-2 text-sm text-primary hover:text-primary-hover"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            上传附件
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
import { ref, reactive, watch, nextTick } from 'vue'
import { useAppStore } from '../stores/app'
import { open } from '@tauri-apps/api/dialog'
import { readBinaryFile } from '@tauri-apps/api/fs'
import { invoke } from '@tauri-apps/api/tauri'
import RichEditor from './RichEditor.vue'

const store = useAppStore()

const props = defineProps({
  show: Boolean,
  todo: { type: Object, default: null },
  lockedFields: { type: Array, default: () => [] },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'submit'])

function isLocked(field) {
  return props.readonly || props.lockedFields.includes(field)
}

const titleInput = ref(null)
const isEditing = ref(false)
const attachmentError = ref('')

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
  attachment_path: null,
  attachment_name: null,
  attachment_size: 0,
  steps: [],
  customFieldValues: {},
})

const form = reactive(defaultForm())

const priorities = [
  { value: 'high', label: '高', activeClass: 'border-red-500 bg-red-50 text-red-500' },
  { value: 'medium', label: '中', activeClass: 'border-amber-500 bg-amber-50 text-amber-500' },
  { value: 'low', label: '低', activeClass: 'border-green-500 bg-green-50 bg-green-50/20 text-green-500' },
]

const recurrenceOptions = [
  { value: 'none', label: '不重复' },
  { value: 'workday', label: '工作日' },
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
]

watch(
  () => props.show,
  async val => {
    if (val) {
      await nextTick()
      if (!props.readonly) {
        titleInput.value?.focus()
      }
      attachmentError.value = ''
      if (props.todo && !props.todo._isNew) {
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
        form.attachment_path = props.todo.attachment_path || null
        form.attachment_name = props.todo.attachment_name || null
        form.attachment_size = props.todo.attachment_size || 0
        // Load steps from existing todo
        form.steps = (props.todo.steps || []).map(s => ({ title: s.title, completed: !!s.completed }))
        // Load custom field values from existing todo
        form.customFieldValues = {}
        if (props.todo.customFieldValues) {
          for (const cfv of props.todo.customFieldValues) {
            form.customFieldValues[cfv.field_id] = cfv.value || ''
          }
        }
      } else {
        isEditing.value = false
        Object.assign(form, defaultForm())
        // Prefill from mini mode if available
        if (props.todo?._isNew) {
          form.title = props.todo.title || ''
          form.priority = props.todo.priority || 'medium'
          form.tagIds = (props.todo.tags || []).map(t => t.id)
          // Apply template data if present
          if (props.todo._templateData) {
            form.recurrence_type = props.todo._templateData.recurrence_type || 'none'
            form.recurrence_config = props.todo._templateData.recurrence_config || '{}'
            form.steps = (props.todo._templateData.steps || []).map(s => ({ title: s.title, completed: !!s.completed }))
          }
        }
      }
    }
  },
)

function toggleTag(tagId) {
  const idx = form.tagIds.indexOf(tagId)
  if (idx >= 0) {
    form.tagIds.splice(idx, 1)
  } else {
    form.tagIds.push(tagId)
  }
}

async function uploadAttachment() {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'All Files', extensions: ['*'] }],
    })
    if (!selected) return
    const filePath = typeof selected === 'string' ? selected : selected[0]
    // Read file to check size
    const contents = await readBinaryFile(filePath)
    const size = contents.byteLength
    if (size > 10 * 1024 * 1024) {
      attachmentError.value = '文件大小超过 10MB 限制'
      return
    }
    attachmentError.value = ''
    // Save to app data via Rust command
    const fileName = filePath.split(/[/\\]/).pop()
    const result = await invoke('save_attachment', { filePath, fileName })
    form.attachment_path = result.path
    form.attachment_name = result.name
    form.attachment_size = result.size
  } catch (e) {
    attachmentError.value = '上传失败: ' + e
  }
}

function removeAttachment() {
  form.attachment_path = null
  form.attachment_name = null
  form.attachment_size = 0
  attachmentError.value = ''
}

function addStep() {
  form.steps.push({ title: '', completed: false })
}

function removeStep(index) {
  form.steps.splice(index, 1)
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getEnumValues(field) {
  try {
    return JSON.parse(field.enum_values || '[]')
  } catch {
    return []
  }
}

function submit() {
  if (!form.title.trim()) return
  const reminderAt = form.reminder_enabled && form.reminder_at ? form.reminder_at + ':00' : null
  // Filter out empty steps
  const steps = form.steps.filter(s => s.title.trim()).map(s => ({ title: s.title.trim(), completed: !!s.completed }))
  // Build custom field values array
  const customFieldValues = Object.entries(form.customFieldValues)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([fieldId, value]) => ({ field_id: parseInt(fieldId), value }))
  emit('submit', {
    ...(props.todo || {}),
    title: form.title.trim(),
    notes: form.notes,
    priority: form.priority,
    tagIds: [...form.tagIds],
    due_date: form.due_date || null,
    todo_date: props.todo?.todo_date || store.currentDate,
    recurrence_type: form.recurrence_type,
    recurrence_config: form.recurrence_config,
    attachment_path: form.attachment_path,
    attachment_name: form.attachment_name,
    attachment_size: form.attachment_size,
    reminder_at: reminderAt,
    steps,
    customFieldValues,
  })
}
</script>
