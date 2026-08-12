<template>
  <div class="h-full flex flex-col overflow-y-auto">
    <!-- Header -->
    <div class="px-8 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-content">自定义字段</h1>
        <p class="text-sm text-content-tertiary mt-0.5">
          管理待办的自定义字段，支持枚举和文本类型
          <span v-if="store.customFields.length > 0" class="ml-1 text-primary">· 共 {{ store.customFields.length }} 个字段</span>
        </p>
      </div>
      <button @click="startAddField" class="btn-primary text-sm px-4 py-2 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新建字段
      </button>
    </div>

    <div class="flex-1 px-8 pb-6 space-y-4">
      <!-- New Field Form (slide-down) -->
      <Transition name="slide">
        <div v-if="showForm" class="card border-2 border-primary/30 bg-primary/[0.02]">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-content flex items-center gap-2">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ editingField ? '编辑字段' : '新建字段' }}
            </h3>
            <button @click="cancelForm" class="p-1 rounded-lg hover:bg-surface-tertiary text-content-tertiary transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="space-y-4">
            <!-- Field name -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-content-tertiary mb-1.5">字段名称</label>
                <input
                  ref="fieldNameInput"
                  v-model="form.name"
                  type="text"
                  class="input-field text-sm"
                  placeholder="如：项目来源、优先级"
                  @keydown.enter="saveField"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-content-tertiary mb-1.5">字段类型</label>
                <div class="flex gap-2">
                  <button
                    @click="form.field_type = 'enum'"
                    class="flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all"
                    :class="form.field_type === 'enum'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-content-tertiary hover:border-content-tertiary'"
                  >
                    <span class="flex items-center justify-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      枚举
                    </span>
                  </button>
                  <button
                    @click="form.field_type = 'text'"
                    class="flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all"
                    :class="form.field_type === 'text'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-content-tertiary hover:border-content-tertiary'"
                  >
                    <span class="flex items-center justify-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
                      </svg>
                      文本
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Enum values editor -->
            <div v-if="form.field_type === 'enum'" class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-xs font-medium text-content-tertiary">枚举值管理</label>
                <button
                  @click="addEnumValue"
                  class="text-xs text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  添加值
                </button>
              </div>

              <!-- Empty state for enum values -->
              <div v-if="form.enumValues.length === 0" class="text-center py-4 text-content-tertiary text-xs bg-surface-secondary rounded-lg border border-dashed border-border">
                暂无枚举值，点击上方按钮添加
              </div>

              <!-- Enum value rows -->
              <div v-else class="space-y-2">
                <div
                  v-for="(ev, idx) in form.enumValues"
                  :key="idx"
                  class="flex items-start gap-2 group"
                >
                  <div class="flex-shrink-0 w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-medium flex items-center justify-center mt-1.5">
                    {{ idx + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <input
                      v-model="ev.value"
                      type="text"
                      class="input-field text-sm py-1.5"
                      placeholder="枚举值，如：高"
                      @keydown.enter="onEnumValueEnter(idx)"
                    />
                  </div>
                  <div class="flex-[1.5] min-w-0">
                    <input
                      v-model="ev.note"
                      type="text"
                      class="input-field text-sm py-1.5"
                      placeholder="备注说明（可选）"
                      @keydown.enter="onEnumValueEnter(idx)"
                    />
                  </div>
                  <button
                    @click="removeEnumValue(idx)"
                    class="flex-shrink-0 text-content-tertiary hover:text-red-500 p-1.5 mt-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                    title="删除此枚举值"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <p class="text-xs text-content-tertiary flex items-center gap-1">
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                备注用于解释枚举值的含义，在查看待办时可以快速复制
              </p>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-2 pt-2">
              <button @click="cancelForm" class="btn-secondary text-xs px-4 py-2">取消</button>
              <button @click="saveField" class="btn-primary text-xs px-4 py-2">
                {{ editingField ? '保存修改' : '创建字段' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Field list -->
      <template v-if="store.customFields.length > 0">
        <div
          v-for="field in store.customFields"
          :key="field.id"
          class="card group"
        >
          <!-- Field header -->
          <div class="flex items-center gap-3">
            <!-- Type icon -->
            <div
              class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              :class="field.field_type === 'enum' ? 'bg-amber-500/10' : 'bg-blue-500/10'"
            >
              <svg v-if="field.field_type === 'enum'" class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <svg v-else class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </div>

            <!-- Field info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold text-content">{{ field.name }}</h3>
                <span
                  class="text-[10px] font-medium px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                  :class="field.field_type === 'enum'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'"
                >
                  {{ field.field_type === 'enum' ? '枚举' : '文本' }}
                </span>
              </div>
              <p v-if="field.field_type === 'enum'" class="text-xs text-content-tertiary mt-0.5">
                {{ parseEnumValues(field.enum_values).length }} 个枚举值
              </p>
              <p v-else class="text-xs text-content-tertiary mt-0.5">
                自由输入任意文本
              </p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="startEditField(field)"
                class="p-2 rounded-lg hover:bg-surface-tertiary text-content-tertiary hover:text-primary transition-colors"
                title="编辑字段"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="deleteFieldConfirm(field)"
                class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-content-tertiary hover:text-red-500 transition-colors"
                title="删除字段"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Enum values display -->
          <div v-if="field.field_type === 'enum'" class="mt-3 pt-3 border-t border-border">
            <div class="flex flex-wrap gap-2">
              <div
                v-for="ev in parseEnumValues(field.enum_values)"
                :key="ev.value"
                class="group/chip relative"
              >
                <div
                  class="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-secondary border border-border hover:border-primary/30 transition-colors cursor-default"
                  :title="ev.note || ''"
                >
                  <span class="text-content">{{ ev.value }}</span>
                  <span v-if="ev.note" class="text-content-tertiary ml-1">· {{ ev.note }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else-if="!showForm" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-base font-semibold text-content mb-1">还没有自定义字段</h3>
        <p class="text-sm text-content-tertiary mb-4 max-w-xs">
          自定义字段可以为待办添加额外的结构化信息，如项目来源、优先级分类等
        </p>
        <button @click="startAddField" class="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          创建第一个字段
        </button>
      </div>

      <!-- Toast -->
      <Transition name="fade">
        <div
          v-if="toast"
          class="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 z-50"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ toast }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const showForm = ref(false)
const editingField = ref(null)
const fieldNameInput = ref(null)
const toast = ref('')

const form = ref({
  name: '',
  field_type: 'enum',
  enumValues: [],
})

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

/** Parse enum_values JSON string into [{value, note}] array, backward compatible */
function parseEnumValues(jsonStr) {
  try {
    const arr = JSON.parse(jsonStr || '[]')
    return arr.map(item => {
      if (typeof item === 'string') return { value: item, note: '' }
      return { value: item.value || '', note: item.note || '' }
    })
  } catch {
    return []
  }
}

function startAddField() {
  editingField.value = null
  form.value = { name: '', field_type: 'enum', enumValues: [] }
  showForm.value = true
  nextTick(() => {
    fieldNameInput.value?.focus()
  })
}

function startEditField(field) {
  editingField.value = field
  form.value = {
    name: field.name,
    field_type: field.field_type,
    enumValues: field.field_type === 'enum'
      ? parseEnumValues(field.enum_values)
      : [],
  }
  showForm.value = true
  nextTick(() => {
    fieldNameInput.value?.focus()
  })
}

function cancelForm() {
  showForm.value = false
  editingField.value = null
  form.value = { name: '', field_type: 'enum', enumValues: [] }
}

function addEnumValue() {
  form.value.enumValues.push({ value: '', note: '' })
}

function removeEnumValue(idx) {
  form.value.enumValues.splice(idx, 1)
}

function onEnumValueEnter(idx) {
  // If it's the last row, add a new one
  if (idx === form.value.enumValues.length - 1) {
    addEnumValue()
  }
}

async function saveField() {
  if (!form.value.name.trim()) {
    showToast('请输入字段名称')
    return
  }
  const fieldData = {
    name: form.value.name.trim(),
    field_type: form.value.field_type,
  }
  if (form.value.field_type === 'enum') {
    const values = form.value.enumValues
      .filter(v => v.value.trim())
      .map(v => ({ value: v.value.trim(), note: (v.note || '').trim() }))
    if (values.length === 0) {
      showToast('请至少添加一个枚举值')
      return
    }
    fieldData.enum_values = JSON.stringify(values)
  } else {
    fieldData.enum_values = '[]'
  }
  try {
    if (editingField.value) {
      await store.editCustomField({ ...editingField.value, ...fieldData })
      showToast('字段已更新')
    } else {
      await store.addCustomField(fieldData)
      showToast('字段已创建')
    }
    cancelForm()
  } catch (e) {
    showToast('保存失败: ' + e)
  }
}

async function deleteFieldConfirm(field) {
  if (!confirm(`确定要删除字段"${field.name}"吗？\n该字段关联的所有待办数据也会被清除。`)) return
  try {
    await store.removeCustomField(field.id)
    showToast('字段已删除')
  } catch (e) {
    showToast('删除失败: ' + e)
  }
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
