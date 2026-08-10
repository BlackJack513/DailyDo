<template>
  <aside
    class="w-56 flex-shrink-0 border-r border-border flex flex-col bg-sidebar h-full"
    :class="{ 'bg-opacity-90': store.isMiniMode }"
  >
    <!-- Logo -->
    <div class="px-5 py-5 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <span class="text-lg font-bold text-content">DailyDo</span>
    </div>

    <!-- Navigation -->
    <nav v-if="store.settingsLoaded" class="flex-1 px-3 space-y-1 overflow-y-auto">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-item"
        :class="{ active: $route.path === item.path }"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span>{{ item.label }}</span>
        <span
          v-if="item.badge && item.badge > 0"
          class="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
        >
          {{ item.badge }}
        </span>
      </router-link>
    </nav>
    <nav v-else class="flex-1 px-3 space-y-1 overflow-y-auto">
      <!-- Skeleton loading -->
      <div v-for="i in 6" :key="i" class="h-9 rounded-lg bg-surface-tertiary animate-pulse"></div>
    </nav>

    <!-- Bottom actions -->
    <div class="px-3 py-4 border-t border-border space-y-1">
      <!-- Sidebar config -->
      <button class="sidebar-item w-full" @click="showConfigModal = true">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span>自定义侧边栏</span>
      </button>
      <!-- Mini mode toggle -->
      <button class="sidebar-item w-full" @click="toggleMiniMode">
        <svg v-if="!store.isMiniMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
          />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5l4-2v12l-4-2" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18H18M6 18L4 20M6 18L4 16M18 6l2-2M18 6l2 2M18 6L16 4M18 6l-2 2"
          />
        </svg>
        <span>{{ store.isMiniMode ? '退出小窗' : '小窗模式' }}</span>
      </button>
      <!-- Theme selector -->
      <div class="relative">
        <button class="sidebar-item w-full" @click="showThemeDropdown = !showThemeDropdown">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
          <span class="flex-1 text-left">{{ currentThemeName }}</span>
          <span
            class="w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
            :style="{ backgroundColor: currentThemeColor }"
          ></span>
        </button>
        <div
          v-if="showThemeDropdown"
          class="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50"
        >
          <button
            v-for="t in store.themes"
            :key="t.id"
            @click="selectTheme(t.id)"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-tertiary transition-colors"
            :class="store.theme === t.id ? 'text-primary font-medium' : 'text-content-secondary'"
          >
            <span
              class="w-3 h-3 rounded-full flex-shrink-0 border border-black/10"
              :style="{ backgroundColor: t.color }"
            ></span>
            <span>{{ t.name }}</span>
            <svg
              v-if="store.theme === t.id"
              class="w-4 h-4 ml-auto text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Status bar -->
    <div class="px-5 py-3 border-t border-border">
      <p class="text-xs text-muted">
        今日 {{ store.overviewStats.today_total }} 项待办 · 已完成 {{ store.overviewStats.today_completed }} 项
      </p>
    </div>

    <!-- Sidebar Config Modal -->
    <SidebarConfigModal :show="showConfigModal" @close="showConfigModal = false" @save="showConfigModal = false" />
  </aside>
</template>

<script setup>
import { useAppStore } from '../stores/app'
import { h, ref, computed, onMounted } from 'vue'
import { appWindow } from '@tauri-apps/api/window'
import SidebarConfigModal from './SidebarConfigModal.vue'

const store = useAppStore()
const showConfigModal = ref(false)
const showThemeDropdown = ref(false)

const currentThemeName = computed(() => {
  const t = store.themes.find(t => t.id === store.theme)
  return t ? t.name : '主题'
})

const currentThemeColor = computed(() => {
  const t = store.themes.find(t => t.id === store.theme)
  return t ? t.color : '#6366f1'
})

async function selectTheme(id) {
  await store.setTheme(id)
  showThemeDropdown.value = false
}

// Simple SVG icon components
const TodayIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      }),
    ])
  },
}

const CalendarIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      }),
    ])
  },
}

const ChartIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z',
      }),
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
      }),
    ])
  },
}

const TagIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
      }),
    ])
  },
}

const RecurrenceIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      }),
    ])
  },
}

const TemplateIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      }),
    ])
  },
}

const AttachmentIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
      }),
    ])
  },
}

const TrashIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      }),
    ])
  },
}

const SettingsIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      }),
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      }),
    ])
  },
}

const CountdownIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      }),
    ])
  },
}

const allNavItems = {
  today: { path: '/today', label: '待办列表', icon: TodayIcon, id: 'today' },
  calendar: { path: '/calendar', label: '日历视图', icon: CalendarIcon, id: 'calendar' },
  analytics: { path: '/analytics', label: '统计分析', icon: ChartIcon, id: 'analytics' },
  tags: { path: '/tags', label: '标签管理', icon: TagIcon, id: 'tags' },
  recurrences: { path: '/recurrences', label: '周期任务', icon: RecurrenceIcon, id: 'recurrences' },
  templates: { path: '/templates', label: '待办模板', icon: TemplateIcon, id: 'templates' },
  attachments: { path: '/attachments', label: '附件管理', icon: AttachmentIcon, id: 'attachments' },
  payday: { path: '/payday', label: '倒计时', icon: CountdownIcon, id: 'payday' },
  trash: { path: '/trash', label: '回收站', icon: TrashIcon, id: 'trash', badge: store.overviewStats.trash_count },
  settings: { path: '/settings', label: '设置', icon: SettingsIcon, id: 'settings' },
}

const navItems = computed(() => {
  const config = store.sidebarConfig
  if (!config || config.length === 0) {
    return Object.values(allNavItems)
  }
  return config
    .filter(item => item.visible)
    .map(item => allNavItems[item.id])
    .filter(Boolean)
})

// Mini mode
let normalSize = null
let normalPos = null

async function toggleMiniMode() {
  if (!store.isMiniMode) {
    // Enter mini mode: save current size/pos, shrink
    normalSize = await appWindow.innerSize()
    normalPos = await appWindow.outerPosition()
    store.isMiniMode = true
    await appWindow.setAlwaysOnTop(true)
    // Position at bottom-right corner
    const screenW = window.screen.availWidth
    const screenH = window.screen.availHeight
    await appWindow.setPosition({ type: 'Physical', x: screenW - 420, y: screenH - 560 })
    await appWindow.setSize({ type: 'Physical', width: 400, height: 540 })
  } else {
    // Exit mini mode: restore
    store.isMiniMode = false
    await appWindow.setAlwaysOnTop(false)
    if (normalSize) {
      await appWindow.setSize(normalSize)
    } else {
      await appWindow.setSize({ type: 'Physical', width: 1200, height: 800 })
    }
    if (normalPos) {
      await appWindow.setPosition(normalPos)
    } else {
      await appWindow.center()
    }
  }
}

onMounted(async () => {
  await store.loadOverviewStats()
})
</script>
