<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>
      <div class="relative bg-surface dark:bg-gray-800 rounded-2xl shadow-2xl border border-border dark:border-gray-700 w-[380px] max-h-[80vh] flex flex-col">
        <!-- Header -->
        <div class="px-5 py-4 border-b border-border dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 class="text-base font-semibold text-content dark:text-gray-100">侧边栏设置</h2>
            <p class="text-xs text-content-tertiary dark:text-gray-500 mt-0.5">拖拽排序 · 勾选显示</p>
          </div>
          <button @click="handleClose" class="p-1.5 rounded-lg hover:bg-surface-tertiary dark:hover:bg-gray-700 text-content-tertiary hover:text-content dark:hover:text-gray-300 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Module List -->
        <div class="flex-1 overflow-y-auto px-4 py-3" data-sidebar-config-list>
          <div class="space-y-1.5">
            <div
              v-for="(item, index) in localConfig"
              :key="item.id"
              data-sidebar-config-item
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all select-none"
              :class="[
                dragState && dragState.index === index
                  ? 'opacity-40 border-dashed border-primary/40 bg-primary/5'
                  : 'border-border dark:border-gray-700 bg-surface-secondary dark:bg-gray-800/50 hover:border-primary/20',
                dragHoverIndex === index && dragState && dragState.index !== index
                  ? 'ring-2 ring-primary/30'
                  : ''
              ]"
            >
              <!-- Drag handle -->
              <div
                class="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded-md hover:bg-surface-tertiary dark:hover:bg-gray-700 text-content-tertiary dark:text-gray-500 transition-colors"
                @mousedown="onMouseDown($event, index)"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="9" cy="6" r="1.5" />
                  <circle cx="15" cy="6" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="18" r="1.5" />
                  <circle cx="15" cy="18" r="1.5" />
                </svg>
              </div>

              <!-- Icon -->
              <div class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" :style="{ backgroundColor: moduleMeta[item.id]?.color + '18' }">
                <component :is="moduleMeta[item.id]?.icon" class="w-4 h-4" :style="{ color: moduleMeta[item.id]?.color }" />
              </div>

              <!-- Label -->
              <span class="flex-1 text-sm font-medium text-content dark:text-gray-200">{{ moduleMeta[item.id]?.label }}</span>

              <!-- Visibility toggle -->
              <button
                @click="toggleVisibility(index)"
                class="flex-shrink-0 w-9 h-5 rounded-full transition-colors relative"
                :class="item.visible ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span
                  class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                  :class="item.visible ? 'left-[18px]' : 'left-0.5'"
                ></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-border dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <button @click="resetDefault" class="text-xs text-content-tertiary dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors">
            恢复默认
          </button>
          <div class="flex gap-2">
            <button @click="handleClose" class="px-4 py-1.5 rounded-lg text-sm text-content-tertiary dark:text-gray-400 hover:bg-surface-tertiary dark:hover:bg-gray-700 transition-colors">
              取消
            </button>
            <button @click="handleSave" class="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors">
              保存
            </button>
          </div>
        </div>

        <!-- Drag ghost -->
        <div
          v-if="dragState"
          class="fixed z-[9999] pointer-events-none"
          :style="{
            left: dragState.x + 'px',
            top: dragState.y + 'px',
            transform: 'translate(-50%, -50%)',
          }"
        >
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-primary bg-surface dark:bg-gray-800 shadow-2xl min-w-[260px]">
            <div class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" :style="{ backgroundColor: moduleMeta[dragState.item.id]?.color + '18' }">
              <component :is="moduleMeta[dragState.item.id]?.icon" class="w-4 h-4" :style="{ color: moduleMeta[dragState.item.id]?.color }" />
            </div>
            <span class="flex-1 text-sm font-medium text-content dark:text-gray-200">{{ moduleMeta[dragState.item.id]?.label }}</span>
            <span class="flex-shrink-0 w-9 h-5 rounded-full flex items-center px-0.5" :class="dragState.item.visible ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'">
              <span class="w-4 h-4 rounded-full bg-white shadow-sm" :class="dragState.item.visible ? 'ml-auto' : ''"></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, h, onUnmounted } from 'vue'
import { useAppStore } from '../stores/app'

const props = defineProps({
  show: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])
const store = useAppStore()

// Module metadata (icons + colors + labels)
const moduleMeta = {
  today: {
    label: '待办列表',
    color: '#6366f1',
    icon: { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' })]) },
  },
  calendar: {
    label: '日历视图',
    color: '#3b82f6',
    icon: { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })]) },
  },
  analytics: {
    label: '统计分析',
    color: '#8b5cf6',
    icon: { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' }), h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' })]) },
  },
  tags: {
    label: '标签管理',
    color: '#f59e0b',
    icon: { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' })]) },
  },
  recurrences: {
    label: '周期任务',
    color: '#10b981',
    icon: { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })]) },
  },
  templates: {
    label: '待办模板',
    color: '#6366f1',
    icon: { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })]) },
  },
  attachments: {
    label: '附件管理',
    color: '#f97316',
    icon: { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' })]) },
  },
  payday: {
    label: '发薪倒计时',
    color: '#f59e0b',
    icon: { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })]) },
  },
  trash: {
    label: '回收站',
    color: '#ef4444',
    icon: { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' })]) },
  },
  settings: {
    label: '设置',
    color: '#6b7280',
    icon: { render: () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }), h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' })]) },
  },
}

// Local working copy of config
const localConfig = ref([])

watch(() => props.show, (val) => {
  if (val) {
    // Deep copy from store
    localConfig.value = store.sidebarConfig.map(item => ({ ...item }))
  }
})

function toggleVisibility(index) {
  localConfig.value[index] = {
    ...localConfig.value[index],
    visible: !localConfig.value[index].visible,
  }
}

function resetDefault() {
  const defaults = [
    { id: 'today', visible: true },
    { id: 'calendar', visible: true },
    { id: 'analytics', visible: true },
    { id: 'tags', visible: true },
    { id: 'recurrences', visible: true },
    { id: 'templates', visible: true },
    { id: 'attachments', visible: true },
    { id: 'payday', visible: false },
    { id: 'trash', visible: true },
    { id: 'settings', visible: true },
  ]
  localConfig.value = defaults.map(item => ({ ...item }))
}

function handleClose() {
  emit('close')
}

async function handleSave() {
  try {
    await store.saveSidebarConfig(localConfig.value.map(item => ({ ...item })))
    emit('save')
    emit('close')
  } catch (e) {
    console.error('Save sidebar config failed:', e)
    alert('保存侧边栏设置失败，请重试')
  }
}

// ─── Native mouse drag-to-reorder ─────────────────────
const dragState = ref(null) // { index, item, startY, y, active }
const dragHoverIndex = ref(-1)
const DRAG_THRESHOLD = 5
const itemRefs = ref([])

function onMouseDown(e, index) {
  if (e.button !== 0) return
  e.preventDefault()

  dragState.value = {
    index,
    item: { ...localConfig.value[index] },
    startX: e.clientX,
    startY: e.clientY,
    x: e.clientX,
    y: e.clientY,
    active: false,
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e) {
  if (!dragState.value) return

  const dx = e.clientX - dragState.value.startX
  const dy = e.clientY - dragState.value.startY

  if (!dragState.value.active && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
    dragState.value.active = true
  }

  if (dragState.value.active) {
    dragState.value.x = e.clientX
    dragState.value.y = e.clientY

    // Determine which item we're hovering over
    detectHoverIndex(e.clientY)
  }
}

function detectHoverIndex(clientY) {
  // Find the list container
  const listEl = document.querySelector('[data-sidebar-config-list]')
  if (!listEl) return

  const items = listEl.querySelectorAll('[data-sidebar-config-item]')
  let hoverIdx = -1

  items.forEach((el, idx) => {
    const rect = el.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    if (clientY < midY && hoverIdx === -1) {
      hoverIdx = idx
    }
  })

  // If below all items, set to last
  if (hoverIdx === -1 && items.length > 0) {
    const lastRect = items[items.length - 1].getBoundingClientRect()
    if (clientY > lastRect.top + lastRect.height / 2) {
      hoverIdx = items.length - 1
    }
  }

  dragHoverIndex.value = hoverIdx
}

function onMouseUp(e) {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)

  if (!dragState.value) return

  const wasActive = dragState.value.active
  const fromIndex = dragState.value.index

  dragState.value = null

  if (!wasActive || dragHoverIndex.value === -1 || dragHoverIndex.value === fromIndex) {
    dragHoverIndex.value = -1
    return
  }

  // Reorder
  const toIndex = dragHoverIndex.value
  const item = localConfig.value.splice(fromIndex, 1)[0]
  localConfig.value.splice(toIndex, 0, item)
  dragHoverIndex.value = -1
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>
