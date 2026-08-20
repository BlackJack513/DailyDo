<!--
  TemplateDropdown.vue — 从模板创建待办的下拉菜单

  用法：
  <TemplateDropdown @create="createFromTemplate" />

  点击按钮后展开下拉列表，显示所有可用模板，点击模板后触发 create 事件并自动关闭。
-->
<template>
  <div class="relative" ref="dropdownRef">
    <button @click="toggleDropdown" class="btn-secondary flex items-center gap-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      </svg>
      从模板创建
      <svg
        class="w-3.5 h-3.5 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-72 bg-surface rounded-xl shadow-xl border border-border z-50 overflow-hidden"
      >
        <div class="px-3 py-2 border-b border-border">
          <span class="text-xs font-medium text-content-tertiary">选择模板</span>
        </div>
        <div class="max-h-64 overflow-y-auto py-1">
          <div v-if="loading" class="px-3 py-4 text-center text-content-tertiary text-sm">
            加载中...
          </div>
          <div v-else-if="templates.length === 0" class="px-3 py-4 text-center text-content-tertiary text-sm">
            暂无模板
            <p class="text-xs mt-1">请先在「待办模板」中创建</p>
          </div>
          <button
            v-else
            v-for="tpl in templates"
            :key="tpl.id"
            @click="selectTemplate(tpl)"
            class="w-full text-left px-3 py-2.5 hover:bg-primary/5 transition-colors group"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium text-content text-sm truncate">{{ tpl.name }}</span>
              <svg
                class="w-4 h-4 text-content-tertiary group-hover:text-primary transition-colors flex-shrink-0 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p class="text-xs text-content-secondary text-muted truncate mt-0.5">{{ tpl.title }}</p>
            <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span class="text-xs px-1.5 py-0.5 rounded font-medium" :class="priorityClass(tpl.priority)">
                {{ priorityLabel(tpl.priority) }}
              </span>
              <span
                v-if="tpl.recurrence_type && tpl.recurrence_type !== 'none'"
                class="text-xs px-1.5 py-0.5 rounded bg-blue-50/20 text-blue-500 font-medium"
              >
                {{ recurrenceLabel(tpl.recurrence_type) }}
              </span>
              <span
                v-if="getLockedCount(tpl) > 0"
                class="text-xs px-1.5 py-0.5 rounded bg-purple-50/20 text-purple-500 font-medium"
              >
                {{ getLockedCount(tpl) }} 个锁定字段
              </span>
            </div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as db from '../utils/db'
import { priorityClass, priorityLabel, recurrenceLabel, safeJsonParseArray } from '../utils/helpers'

const emit = defineEmits(['create'])

const isOpen = ref(false)
const templates = ref([])
const loading = ref(false)
const dropdownRef = ref(null)

async function loadTemplates() {
  if (templates.value.length > 0) return
  loading.value = true
  try {
    templates.value = await db.getAllTemplates()
  } catch {
    templates.value = []
  } finally {
    loading.value = false
  }
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    loadTemplates()
  }
}

function selectTemplate(tpl) {
  isOpen.value = false
  emit('create', tpl)
}

function getLockedCount(tpl) {
  return safeJsonParseArray(tpl.locked_fields).length
}

function handleClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
