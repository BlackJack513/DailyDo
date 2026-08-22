<template>
  <div class="h-full flex flex-col">
    <PageHeader title="主题管理" subtitle="选择和管理主题配色方案">
      <template #actions>
        <button @click="openAdd" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建主题
        </button>
      </template>
    </PageHeader>

    <div class="flex-1 px-8 pb-6 overflow-y-auto space-y-6">
      <!-- Preset Themes -->
      <div>
        <h3 class="text-sm font-semibold text-content mb-3">预设主题</h3>
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="theme in store.themes"
            :key="theme.id"
            class="card group relative"
          >
            <!-- Preview bar -->
            <div class="h-16 rounded-lg mb-3 flex items-end justify-between p-3 border border-border" :style="{ backgroundColor: theme.color + '15' }">
              <span class="text-xs font-medium" :style="{ color: theme.color }">{{ theme.name }}</span>
              <div class="flex gap-1">
                <span class="w-3 h-3 rounded-full border border-black/10" :style="{ backgroundColor: theme.color }"></span>
              </div>
            </div>
            <!-- Info & actions -->
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-medium text-content">{{ theme.name }}</h4>
                <p class="text-xs text-content-tertiary mt-0.5">系统预设</p>
              </div>
              <div class="flex items-center gap-1">
                <!-- Favorite toggle -->
                <button
                  @click.stop="store.toggleFavorite(theme.id)"
                  class="p-1.5 rounded-lg transition-colors"
                  :class="store.isFavorite(theme.id) ? 'text-amber-400 hover:text-amber-500' : 'text-content-tertiary/40 hover:text-content-tertiary opacity-0 group-hover:opacity-100'"
                  :title="store.isFavorite(theme.id) ? '取消收藏' : '收藏到侧边栏'"
                >
                  <svg v-if="store.isFavorite(theme.id)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.293z"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
                  </svg>
                </button>
                <!-- Apply button -->
                <button
                  v-if="store.theme !== theme.id"
                  @click="applyPresetTheme(theme.id)"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100"
                >
                  应用
                </button>
                <span
                  v-else
                  class="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary text-white"
                >
                  使用中
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Themes -->
      <div>
        <h3 class="text-sm font-semibold text-content mb-3">自定义主题</h3>
        <div v-if="store.customThemes.length === 0" class="text-center py-12 text-content-tertiary">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <p class="text-sm">还没有自定义主题</p>
          <p class="text-xs mt-1">点击上方按钮创建你的第一个自定义主题</p>
        </div>
        <div v-else class="grid grid-cols-2 gap-4">
          <div
            v-for="theme in store.customThemes"
            :key="theme.id"
            class="card group relative"
          >
            <!-- Preview bar -->
            <div class="h-16 rounded-lg mb-3 flex items-end justify-between p-3 border border-border" :style="previewStyle(theme)">
              <span class="text-xs font-medium" :style="{ color: previewText(theme) }">{{ theme.name }}</span>
              <div class="flex gap-1">
                <span v-for="v in previewSwatches(theme)" :key="v" class="w-3 h-3 rounded-full border border-black/10" :style="{ backgroundColor: v }"></span>
              </div>
            </div>
            <!-- Info & actions -->
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-medium text-content">{{ theme.name }}</h4>
                <p class="text-xs text-content-tertiary mt-0.5">
                  {{ formatDate(theme.created_at) }}
                </p>
              </div>
              <div class="flex items-center gap-1">
                <!-- Favorite toggle -->
                <button
                  @click.stop="store.toggleFavorite('custom_' + theme.id)"
                  class="p-1.5 rounded-lg transition-colors"
                  :class="store.isFavorite('custom_' + theme.id) ? 'text-amber-400 hover:text-amber-500' : 'text-content-tertiary/40 hover:text-content-tertiary opacity-0 group-hover:opacity-100'"
                  :title="store.isFavorite('custom_' + theme.id) ? '取消收藏' : '收藏到侧边栏'"
                >
                  <svg v-if="store.isFavorite('custom_' + theme.id)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.293z"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
                  </svg>
                </button>
                <!-- Apply / Edit / Delete -->
                <button
                  v-if="store.theme !== 'custom_' + theme.id"
                  @click="applyTheme(theme)"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100"
                >
                  应用
                </button>
                <span
                  v-else
                  class="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary text-white"
                >
                  使用中
                </span>
                <button
                  @click="openEdit(theme)"
                  class="p-1.5 rounded-lg hover:bg-surface-tertiary text-content-tertiary hover:text-content opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="handleDelete(theme)"
                  class="p-1.5 rounded-lg hover:bg-red-50/20 text-content-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal"></div>
      <div class="relative w-[780px] max-h-[85vh] bg-surface rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border flex-shrink-0">
          <h3 class="text-lg font-semibold text-content">
            {{ editingTheme ? '编辑主题' : '新建主题' }}
          </h3>
        </div>

        <!-- Body: two columns -->
        <div class="flex-1 overflow-y-auto p-6 flex gap-6">
          <!-- Left: Color pickers -->
          <div class="flex-1 space-y-4">
            <!-- Theme name -->
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1.5">主题名称</label>
              <input v-model="themeName" class="input-field" placeholder="输入主题名称..." maxlength="20" />
            </div>

            <!-- Color variables grouped -->
            <div v-for="group in colorGroups" :key="group.label" class="space-y-2">
              <h4 class="text-xs font-semibold text-content-tertiary uppercase tracking-wider">{{ group.label }}</h4>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                <div v-for="cv in group.vars" :key="cv.key" class="flex items-center gap-2">
                  <input
                    type="color"
                    :value="rgbToHex(themeVars[cv.key])"
                    @input="setVarFromPicker(cv.key, $event)"
                    class="w-7 h-7 rounded border border-border cursor-pointer flex-shrink-0 p-0"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-content-secondary truncate">{{ cv.label }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Live preview -->
          <div class="w-[280px] flex-shrink-0 space-y-4">
            <h4 class="text-xs font-semibold text-content-tertiary uppercase tracking-wider">实时预览</h4>
            <div class="rounded-xl border border-border overflow-hidden" :style="previewContainerStyle">
              <!-- Preview sidebar -->
              <div class="flex">
                <div class="w-14 py-3 flex flex-col items-center gap-2" :style="{ backgroundColor: rgbToCss(themeVars['--color-sidebar']) }">
                  <div class="w-6 h-6 rounded" :style="{ backgroundColor: rgbToCss(themeVars['--color-primary']) }"></div>
                  <div class="w-8 h-1.5 rounded-full" :style="{ backgroundColor: rgbToCss(themeVars['--color-content'], 0.25) }"></div>
                  <div class="w-8 h-1.5 rounded-full" :style="{ backgroundColor: rgbToCss(themeVars['--color-content'], 0.15) }"></div>
                  <div class="w-8 h-1.5 rounded-full" :style="{ backgroundColor: rgbToCss(themeVars['--color-content'], 0.15) }"></div>
                </div>
                <!-- Preview content -->
                <div class="flex-1 p-3 space-y-2" :style="{ backgroundColor: rgbToCss(themeVars['--color-body']) }">
                  <!-- Title -->
                  <div class="h-3 w-20 rounded" :style="{ backgroundColor: rgbToCss(themeVars['--color-content'], 0.6) }"></div>
                  <!-- Cards -->
                  <div class="rounded-lg p-2 space-y-1.5" :style="{ backgroundColor: rgbToCss(themeVars['--color-surface']) }">
                    <div class="h-2 w-24 rounded" :style="{ backgroundColor: rgbToCss(themeVars['--color-content'], 0.4) }"></div>
                    <div class="h-2 w-16 rounded" :style="{ backgroundColor: rgbToCss(themeVars['--color-content-sec'], 0.3) }"></div>
                    <div class="flex gap-1 mt-1">
                      <span class="px-1.5 py-0.5 rounded text-[8px]" :style="badgeStyle">标签</span>
                    </div>
                  </div>
                  <div class="rounded-lg p-2 space-y-1.5" :style="{ backgroundColor: rgbToCss(themeVars['--color-surface']) }">
                    <div class="h-2 w-20 rounded" :style="{ backgroundColor: rgbToCss(themeVars['--color-content'], 0.4) }"></div>
                    <div class="flex gap-1">
                      <span class="px-1.5 py-0.5 rounded text-[8px]" :style="badgeStyle">进行中</span>
                      <span class="px-1.5 py-0.5 rounded text-[8px]" :style="{ backgroundColor: rgbToCss(themeVars['--color-surface-3']), color: rgbToCss(themeVars['--color-content-sec']) }">普通</span>
                    </div>
                  </div>
                  <!-- Button -->
                  <div class="rounded-md py-1.5 text-center text-[9px] font-medium" :style="{ backgroundColor: rgbToCss(themeVars['--color-primary']), color: '#fff' }">
                    新建待办
                  </div>
                </div>
              </div>
            </div>
            <!-- Color summary -->
            <div class="flex flex-wrap gap-1.5">
              <span v-for="cv in allColorVars" :key="cv.key" class="w-5 h-5 rounded-full border border-black/10" :style="{ backgroundColor: rgbToCss(themeVars[cv.key]) }" :title="cv.label"></span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-border flex justify-end gap-3 flex-shrink-0">
          <button @click="closeModal" class="btn-secondary">取消</button>
          <button @click="handleSave" class="btn-primary" :disabled="!themeName.trim()">
            {{ editingTheme ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import PageHeader from '@/components/PageHeader.vue'

const store = useAppStore()

const showModal = ref(false)
const editingTheme = ref(null)
const themeName = ref('')
const themeVars = reactive({})

// ── Color variable definitions ──────────────────────────────
const colorGroups = [
  {
    label: '背景色',
    vars: [
      { key: '--color-body', label: '页面背景' },
      { key: '--color-surface', label: '卡片背景' },
      { key: '--color-surface-2', label: '次级背景' },
      { key: '--color-surface-3', label: '三级背景' },
      { key: '--color-sidebar', label: '侧边栏' },
      { key: '--color-control', label: '控件背景' },
      { key: '--color-surface-hover', label: '悬停背景' },
    ],
  },
  {
    label: '文字色',
    vars: [
      { key: '--color-content', label: '主文字' },
      { key: '--color-content-sec', label: '次级文字' },
      { key: '--color-muted', label: '辅助文字' },
    ],
  },
  {
    label: '边框与分割',
    vars: [
      { key: '--color-divider', label: '分割线' },
    ],
  },
  {
    label: '主色调',
    vars: [
      { key: '--color-primary', label: '主色' },
      { key: '--color-primary-hover', label: '主色悬停' },
      { key: '--color-primary-light', label: '主色浅' },
    ],
  },
  {
    label: '徽章',
    vars: [
      { key: '--badge-bg', label: '徽章背景' },
      { key: '--badge-text', label: '徽章文字' },
    ],
  },
]

const allColorVars = colorGroups.flatMap(g => g.vars)

// ── Default theme values (based on light theme) ─────────────
const defaultVars = {
  '--color-body': '248 250 252',
  '--color-surface': '255 255 255',
  '--color-surface-2': '241 245 249',
  '--color-surface-3': '226 232 240',
  '--color-sidebar': '248 250 252',
  '--color-control': '241 245 249',
  '--color-surface-hover': '241 245 249',
  '--color-content': '15 23 42',
  '--color-content-sec': '71 85 105',
  '--color-muted': '148 163 184',
  '--color-divider': '226 232 240',
  '--color-primary': '99 102 241',
  '--color-primary-hover': '79 82 221',
  '--color-primary-light': '238 242 255',
  '--badge-bg': '238 242 255',
  '--badge-text': '99 102 241',
}

// ── Color conversion utilities ──────────────────────────────
function rgbToHex(rgbStr) {
  if (!rgbStr) return '#6366f1'
  const parts = rgbStr.split(/\s+/).map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return '#6366f1'
  const toHex = v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')
  return `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r} ${g} ${b}`
}

function rgbToCss(rgbStr, opacity) {
  if (!rgbStr) return 'transparent'
  if (opacity !== undefined) {
    const parts = rgbStr.split(/\s+/)
    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${opacity})`
  }
  return `rgb(${rgbStr})`
}

function setVarFromPicker(key, event) {
  themeVars[key] = hexToRgb(event.target.value)
}

// ── Preview helpers ─────────────────────────────────────────
function parseVars(theme) {
  try { return JSON.parse(theme.css_variables || '{}') } catch { return {} }
}

function previewStyle(theme) {
  const v = parseVars(theme)
  return {
    backgroundColor: rgbToCss(v['--color-surface']),
  }
}

function previewText(theme) {
  const v = parseVars(theme)
  return rgbToCss(v['--color-content'])
}

function previewSwatches(theme) {
  const v = parseVars(theme)
  return [v['--color-primary'], v['--color-body'], v['--color-surface-3']].filter(Boolean)
}

// ── Computed preview styles for modal ───────────────────────
const previewContainerStyle = computed(() => ({
  backgroundColor: rgbToCss(themeVars['--color-body']),
}))

const badgeStyle = computed(() => ({
  backgroundColor: rgbToCss(themeVars['--badge-bg']),
  color: rgbToCss(themeVars['--badge-text']),
}))

// ── CRUD operations ─────────────────────────────────────────
function resetToDefaults() {
  for (const [k, v] of Object.entries(defaultVars)) {
    themeVars[k] = v
  }
}

function openAdd() {
  editingTheme.value = null
  themeName.value = ''
  resetToDefaults()
  showModal.value = true
}

function openEdit(theme) {
  editingTheme.value = theme
  themeName.value = theme.name
  const vars = parseVars(theme)
  for (const cv of allColorVars) {
    themeVars[cv.key] = vars[cv.key] || defaultVars[cv.key]
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingTheme.value = null
}

async function handleSave() {
  if (!themeName.value.trim()) return
  const cssVariables = JSON.stringify({ ...themeVars })
  await store.saveCustomTheme({
    id: editingTheme.value?.id || null,
    name: themeName.value.trim(),
    css_variables: cssVariables,
  })
  closeModal()
}

async function applyPresetTheme(themeId) {
  await store.setTheme(themeId)
}

async function applyTheme(theme) {
  await store.setTheme(`custom_${theme.id}`)
}

async function handleDelete(theme) {
  if (confirm(`确定要删除主题「${theme.name}」吗？`)) {
    await store.removeCustomTheme(theme.id)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr.replace(' ', 'T'))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return dateStr.substring(0, 10)
  }
}

onMounted(() => {
  store.loadCustomThemes()
})
</script>
