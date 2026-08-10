<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-md mx-4 bg-surface rounded-2xl shadow-2xl border border-divider">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-divider">
        <h3 class="text-base font-semibold text-body text-content">
          {{ isEditing ? '编辑待办' : '新建待办' }}
        </h3>
        <button
          @click="$emit('close')"
          class="p-1.5 rounded-lg hover:bg-surface-2 text-muted hover:text-content-secondary transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <div class="px-5 py-4 space-y-4">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-content-secondary mb-1.5">标题 *</label>
          <input
            ref="titleInput"
            v-model="form.title"
            class="w-full px-3 py-2 rounded-lg border border-divider bg-surface-2 text-sm text-body text-content placeholder-gray-400 placeholder-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            placeholder="输入待办事项..."
            @keydown.enter="submit"
          />
        </div>

        <!-- Priority -->
        <div>
          <label class="block text-sm font-medium text-content-secondary mb-1.5">优先级</label>
          <div class="flex gap-2">
            <button
              v-for="p in priorities"
              :key="p.value"
              @click="form.priority = p.value"
              class="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
              :class="form.priority === p.value ? p.activeClass : 'border-divider text-muted hover:border-divider'"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-sm font-medium text-content-secondary mb-1.5">标签</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in store.tags"
              :key="tag.id"
              @click="toggleTag(tag.id)"
              class="text-xs px-2.5 py-1 rounded-full font-medium border transition-all cursor-pointer"
              :class="
                form.tagIds.includes(tag.id)
                  ? 'border-current opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-75'
              "
              :style="{ backgroundColor: tag.color + '18', color: tag.color }"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-between px-5 py-3.5 border-t border-divider bg-surface-2/80 bg-surface/80 rounded-b-2xl"
      >
        <button
          @click="$emit('expand')"
          class="flex items-center gap-1.5 text-xs text-muted hover:text-primary hover:text-indigo-400 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          展开更多选项
        </button>
        <div class="flex items-center gap-2">
          <button
            @click="$emit('close')"
            class="px-3.5 py-1.5 rounded-lg text-sm text-muted hover:bg-surface-2 transition-colors"
          >
            取消
          </button>
          <button
            @click="submit"
            class="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="!form.title.trim()"
          >
            {{ isEditing ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const props = defineProps({
  show: Boolean,
  todo: { type: Object, default: null },
})

const emit = defineEmits(['close', 'submit', 'expand'])

const titleInput = ref(null)
const isEditing = ref(false)

const defaultForm = () => ({
  title: '',
  priority: 'medium',
  tagIds: [],
})

const form = reactive(defaultForm())

const priorities = [
  { value: 'high', label: '高', activeClass: 'border-red-500 bg-red-50 text-red-500' },
  { value: 'medium', label: '中', activeClass: 'border-amber-500 bg-amber-50 text-amber-500' },
  { value: 'low', label: '低', activeClass: 'border-green-500 bg-green-50 bg-green-50/20 text-green-500' },
]

watch(
  () => props.show,
  async val => {
    if (val) {
      await nextTick()
      titleInput.value?.focus()
      if (props.todo) {
        isEditing.value = true
        form.title = props.todo.title
        form.priority = props.todo.priority || 'medium'
        form.tagIds = (props.todo.tags || []).map(t => t.id)
      } else {
        isEditing.value = false
        Object.assign(form, defaultForm())
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

function submit() {
  if (!form.title.trim()) return
  emit('submit', {
    ...(props.todo || {}),
    title: form.title.trim(),
    priority: form.priority,
    tagIds: [...form.tagIds],
    todo_date: props.todo?.todo_date || store.currentDate,
  })
}
</script>
