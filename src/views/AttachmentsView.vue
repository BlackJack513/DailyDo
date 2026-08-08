<template>
  <div class="flex-1 flex flex-col h-full bg-surface-secondary dark:bg-gray-900">
    <!-- Header -->
    <div class="px-6 py-5 border-b border-border dark:border-gray-700 bg-surface dark:bg-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-content dark:text-gray-100">附件管理</h1>
          <p class="text-sm text-content-tertiary dark:text-gray-500 mt-1">管理待办附件，释放存储空间</p>
        </div>
        <div class="flex items-center gap-3">
          <div v-if="totalSize > 0" class="text-sm text-content-secondary dark:text-gray-400">
            已占用 <span class="font-semibold text-primary">{{ formatSize(totalSize) }}</span>
          </div>
          <button
            v-if="completedCount > 0"
            @click="showBulkConfirm = true"
            class="btn-secondary flex items-center gap-2 text-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清理已完成附件 ({{ completedCount }})
          </button>
        </div>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="px-6 py-3 border-b border-border dark:border-gray-700 bg-surface dark:bg-gray-800/50">
      <div class="flex gap-2">
        <button
          @click="filter = 'all'"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="filter === 'all' ? 'bg-primary/10 text-primary' : 'text-content-tertiary dark:text-gray-500 hover:text-content dark:hover:text-gray-300'"
        >
          全部 ({{ attachments.length }})
        </button>
        <button
          @click="filter = 'done'"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :class="filter === 'done' ? 'bg-primary/10 text-primary' : 'text-content-tertiary dark:text-gray-500 hover:text-content dark:hover:text-gray-300'"
        >
          已完成 ({{ completedAttachments.length }})
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <!-- Empty state -->
      <div v-if="filteredAttachments.length === 0 && !loading" class="flex flex-col items-center justify-center py-20 text-content-tertiary dark:text-gray-500">
        <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        <p class="text-lg font-medium mb-1">暂无附件</p>
        <p class="text-sm">待办中的附件会显示在这里</p>
      </div>

      <!-- Attachment list -->
      <div v-else class="space-y-3">
        <div
          v-for="att in filteredAttachments"
          :key="att.todo_id"
          class="bg-surface dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-4">
            <!-- File icon -->
            <div class="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>

            <!-- File info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-content dark:text-gray-100 truncate">{{ att.attachment_name }}</p>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-xs text-content-tertiary dark:text-gray-500">{{ formatSize(att.attachment_size) }}</span>
                <span class="text-xs text-content-tertiary dark:text-gray-500">·</span>
                <span class="text-xs text-content-tertiary dark:text-gray-500">{{ att.todo_date }}</span>
                <span class="text-xs text-content-tertiary dark:text-gray-500">·</span>
                <span class="text-xs" :class="statusClass(att.status)">{{ statusLabel(att.status) }}</span>
              </div>
              <p class="text-xs text-content-secondary dark:text-gray-400 truncate mt-0.5">来自：{{ att.todo_title }}</p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                @click="openFile(att.attachment_path)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                打开
              </button>
              <button
                @click="confirmDelete(att)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="deleteTarget = null"></div>
      <div class="relative w-full max-w-sm mx-4 bg-surface dark:bg-gray-800 rounded-2xl shadow-2xl border border-border dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-content dark:text-gray-100 mb-2">确认删除附件</h3>
        <p class="text-sm text-content-secondary dark:text-gray-400 mb-1">确定要删除附件「{{ deleteTarget.attachment_name }}」吗？</p>
        <p class="text-xs text-content-tertiary dark:text-gray-500 mb-5">文件将从磁盘删除，待办中的附件信息也会被清除。</p>
        <div class="flex justify-end gap-3">
          <button @click="deleteTarget = null" class="btn-secondary">取消</button>
          <button @click="doDelete" class="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">删除</button>
        </div>
      </div>
    </div>

    <!-- Bulk Clear Confirm -->
    <div v-if="showBulkConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showBulkConfirm = false"></div>
      <div class="relative w-full max-w-sm mx-4 bg-surface dark:bg-gray-800 rounded-2xl shadow-2xl border border-border dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-content dark:text-gray-100 mb-2">批量清理附件</h3>
        <p class="text-sm text-content-secondary dark:text-gray-400 mb-1">确定要清理所有已完成待办的附件吗？</p>
        <p class="text-xs text-content-tertiary dark:text-gray-500 mb-1">将删除 <span class="font-semibold text-red-500">{{ completedCount }}</span> 个附件，释放约 <span class="font-semibold text-primary">{{ formatSize(completedSize) }}</span> 空间。</p>
        <p class="text-xs text-red-400 dark:text-red-500 mb-5">此操作不可恢复，文件将从磁盘永久删除。</p>
        <div class="flex justify-end gap-3">
          <button @click="showBulkConfirm = false" class="btn-secondary">取消</button>
          <button @click="doBulkClear" class="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">确认清理</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as db from '../utils/db'

const attachments = ref([])
const loading = ref(true)
const filter = ref('all')
const deleteTarget = ref(null)
const showBulkConfirm = ref(false)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    attachments.value = await db.getAllAttachments('all')
  } finally {
    loading.value = false
  }
}

const completedAttachments = computed(() =>
  attachments.value.filter(a => a.status === 'done')
)

const filteredAttachments = computed(() => {
  if (filter.value === 'done') return completedAttachments.value
  return attachments.value
})

const totalSize = computed(() =>
  attachments.value.reduce((sum, a) => sum + (a.attachment_size || 0), 0)
)

const completedCount = computed(() => completedAttachments.value.length)

const completedSize = computed(() =>
  completedAttachments.value.reduce((sum, a) => sum + (a.attachment_size || 0), 0)
)

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function statusLabel(status) {
  const map = { pending: '待处理', in_progress: '进行中', done: '已完成' }
  return map[status] || status
}

function statusClass(status) {
  const map = {
    pending: 'text-amber-500',
    in_progress: 'text-blue-500',
    done: 'text-emerald-500',
  }
  return map[status] || 'text-content-tertiary'
}

async function openFile(filePath) {
  try {
    await db.openAttachment(filePath)
  } catch (e) {
    console.error('Failed to open attachment:', e)
  }
}

function confirmDelete(att) {
  deleteTarget.value = att
}

async function doDelete() {
  if (!deleteTarget.value) return
  try {
    await db.deleteAttachment(deleteTarget.value.todo_id)
    deleteTarget.value = null
    await loadData()
  } catch (e) {
    console.error('Failed to delete attachment:', e)
  }
}

async function doBulkClear() {
  try {
    await db.clearCompletedAttachments()
    showBulkConfirm.value = false
    await loadData()
  } catch (e) {
    console.error('Failed to bulk clear attachments:', e)
  }
}
</script>
