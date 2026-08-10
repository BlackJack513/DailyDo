<template>
 <div class="h-full flex flex-col">
 <!-- Header -->
 <div class="px-8 pt-6 pb-4 flex items-center justify-between">
 <div>
 <h1 class="text-2xl font-bold text-content">标签管理</h1>
 <p class="text-sm text-content-tertiary mt-0.5">管理待办标签，预设标签不可删除</p>
 </div>
 <button @click="openAdd" class="btn-primary flex items-center gap-2">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
 </svg>
 新建标签
 </button>
 </div>

 <!-- Tags Grid -->
 <div class="flex-1 px-8 pb-6 overflow-y-auto">
 <!-- Preset Tags -->
 <div class="mb-8">
 <h3 class="text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-4">预设标签</h3>
 <div class="grid grid-cols-2 gap-3">
 <div
 v-for="tag in presetTags"
 :key="tag.id"
 class="card flex items-center justify-between"
>
 <div class="flex items-center gap-3">
 <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: tag.color }"></div>
 <span class="text-sm font-medium text-content">{{ tag.name }}</span>
 </div>
 <span class="text-xs text-content-tertiary">系统预设</span>
 </div>
 </div>
 </div>

 <!-- Custom Tags -->
 <div>
 <h3 class="text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-4">自定义标签</h3>
 <div v-if="customTags.length === 0" class="text-center py-12 text-content-tertiary">
 <p class="text-sm">还没有自定义标签</p>
 <p class="text-xs mt-1">点击上方按钮创建你的第一个标签</p>
 </div>
 <div v-else class="grid grid-cols-2 gap-3">
 <div
 v-for="tag in customTags"
 :key="tag.id"
 class="card flex items-center justify-between group"
>
 <div class="flex items-center gap-3">
 <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: tag.color }"></div>
 <span class="text-sm font-medium text-content">{{ tag.name }}</span>
 </div>
 <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button @click="openEdit(tag)" class="p-1.5 rounded-lg hover:bg-surface-tertiary text-content-tertiary hover:text-content">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
 </svg>
 </button>
 <button @click="handleDelete(tag)" class="p-1.5 rounded-lg hover:bg-red-50 hover:bg-red-50/20 text-content-tertiary hover:text-red-500">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
 </svg>
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>

 <!-- Add/Edit Modal -->
 <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
 <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal"></div>
 <div class="relative w-80 bg-surface rounded-2xl shadow-2xl border border-border p-6">
 <h3 class="text-lg font-semibold text-content mb-4">
 {{ editingTag ? '编辑标签' : '新建标签' }}
 </h3>
 <div class="space-y-4">
 <div>
 <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">标签名称</label>
 <input v-model="tagName" class="input-field" placeholder="输入标签名称..." @keydown.enter="handleSubmit" />
 </div>
 <div>
 <label class="block text-sm font-medium text-content-secondary text-muted mb-1.5">标签颜色</label>
 <div class="flex flex-wrap gap-2">
 <button
 v-for="color in colorOptions"
 :key="color"
 @click="tagColor = color"
 class="w-8 h-8 rounded-full transition-transform"
 :class="tagColor === color ? 'ring-2 ring-offset-2 ring-primary ring-offset-surface scale-110' : 'hover:scale-110'"
 :style="{ backgroundColor: color }"
></button>
 </div>
 </div>
 </div>
 <div class="flex justify-end gap-3 mt-6">
 <button @click="closeModal" class="btn-secondary">取消</button>
 <button @click="handleSubmit" class="btn-primary" :disabled="!tagName.trim()">
 {{ editingTag ? '保存' : '创建' }}
 </button>
 </div>
 </div>
 </div>
 </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const showModal = ref(false)
const editingTag = ref(null)
const tagName = ref('')
const tagColor = ref('#6366f1')

const colorOptions = [
 '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
 '#f59e0b', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
]

const presetTags = computed(() => store.tags.filter((t) => t.is_preset))
const customTags = computed(() => store.tags.filter((t) => !t.is_preset))

onMounted(() => {
 store.loadTags()
})

function openAdd() {
 editingTag.value = null
 tagName.value = ''
 tagColor.value = '#6366f1'
 showModal.value = true
}

function openEdit(tag) {
 editingTag.value = tag
 tagName.value = tag.name
 tagColor.value = tag.color || '#6366f1'
 showModal.value = true
}

function closeModal() {
 showModal.value = false
 editingTag.value = null
}

async function handleSubmit() {
 if (!tagName.value.trim()) return
 if (editingTag.value) {
 await store.editTag({ ...editingTag.value, name: tagName.value.trim(), color: tagColor.value })
 } else {
 await store.addTag({ name: tagName.value.trim(), color: tagColor.value })
 }
 closeModal()
}

async function handleDelete(tag) {
 if (confirm(`确定要删除标签「${tag.name}」吗？`)) {
 await store.removeTag(tag.id)
 }
}
</script>
