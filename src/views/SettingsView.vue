<template>
  <div class="h-full flex flex-col overflow-y-auto">
    <PageHeader title="设置" subtitle="管理应用设置和数据" />

    <div class="flex-1 px-8 pb-6 space-y-6">
      <!-- Theme -->
      <div class="card">
        <h3 class="text-sm font-semibold text-content mb-4">外观</h3>
        <div>
          <p class="text-sm text-content-secondary mb-3">主题模式</p>
          <div class="grid grid-cols-6 gap-2">
            <div
              v-for="t in store.themes"
              :key="t.id"
              class="relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer"
              :class="
                store.theme === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-content-tertiary'
              "
              @click="handleSetTheme(t.id)"
            >
              <!-- Favorite toggle button -->
              <button
                @click.stop="store.toggleFavorite(t.id)"
                class="absolute top-1 right-1 p-0.5 rounded-full transition-colors"
                :class="store.isFavorite(t.id) ? 'text-amber-400 hover:text-amber-500' : 'text-content-tertiary/40 hover:text-content-tertiary'"
                :title="store.isFavorite(t.id) ? '取消收藏' : '收藏到侧边栏'"
              >
                <svg v-if="store.isFavorite(t.id)" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.293z"/>
                </svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
                </svg>
              </button>
              <span
                class="w-6 h-6 rounded-full shadow-sm border border-black/10"
                :style="{ backgroundColor: t.color }"
              ></span>
              <span class="text-xs font-medium text-content-secondary">{{ t.name }}</span>
            </div>
          </div>
          <p class="text-xs text-muted mt-2">选择应用的主题配色方案 · 点击星星可收藏到侧边栏快速切换</p>
        </div>
      </div>

      <!-- Background Image -->
      <div class="card">
        <h3 class="text-sm font-semibold text-content mb-4">自定义背景</h3>
        <div class="space-y-3">
          <!-- Preview -->
          <div v-if="store.backgroundImage" class="relative rounded-lg overflow-hidden h-32 border border-border">
            <div
              class="absolute inset-0"
              :class="store.backgroundMode === 'tile' ? 'bg-repeat' : 'bg-cover bg-center bg-no-repeat'"
              :style="{ backgroundImage: `url('${store.backgroundImage}')` }"
            ></div>
            <div class="absolute inset-0 flex items-center justify-center bg-black/20">
              <span class="text-white text-sm font-medium">当前背景预览</span>
            </div>
          </div>
          <!-- Background mode toggle -->
          <div v-if="store.backgroundImage" class="flex items-center gap-3">
            <p class="text-sm text-content-secondary">显示模式</p>
            <div class="flex gap-2">
              <button
                @click="store.setBackgroundMode('cover')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                :class="store.backgroundMode === 'cover' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-content-tertiary hover:border-content-tertiary'"
              >
                适应填充
              </button>
              <button
                @click="store.setBackgroundMode('tile')"
                class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                :class="store.backgroundMode === 'tile' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-content-tertiary hover:border-content-tertiary'"
              >
                平铺重复
              </button>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button @click="uploadBackground" class="btn-primary text-xs px-3 py-1.5 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {{ store.backgroundImage ? '更换背景' : '选择背景图片' }}
            </button>
            <button v-if="store.backgroundImage" @click="clearBackground" class="btn-secondary text-xs px-3 py-1.5">
              移除背景
            </button>
          </div>
          <p class="text-xs text-content-tertiary">支持 JPG、PNG、WebP 格式。大图片会自动压缩以适应背景显示</p>
        </div>
      </div>

      <!-- Mini Mode -->
      <div class="card">
        <h3 class="text-sm font-semibold text-content mb-4">迷你模式</h3>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-content-secondary">窗口迷你化</p>
            <p class="text-xs text-content-tertiary mt-0.5">将窗口缩小为悬浮小组件，固定显示在屏幕角落</p>
          </div>
          <button
            @click="toggleMiniMode"
            class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-2"
            :class="
              store.isMiniMode
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-content-tertiary hover:border-content-tertiary'
            "
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            {{ store.isMiniMode ? '退出迷你' : '进入迷你' }}
          </button>
        </div>
      </div>

      <!-- Data Export -->
      <div class="card">
        <h3 class="text-sm font-semibold text-content mb-4">数据导出</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 rounded-lg bg-surface-secondary">
            <div>
              <p class="text-sm font-medium text-content">导出为 JSON</p>
              <p class="text-xs text-content-tertiary mt-0.5">完整数据备份，可用于恢复</p>
            </div>
            <button @click="handleExportJSON" class="btn-primary text-xs px-3 py-1.5">导出</button>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-surface-secondary">
            <div>
              <p class="text-sm font-medium text-content">导出为 Markdown</p>
              <p class="text-xs text-content-tertiary mt-0.5">可读的待办报告</p>
            </div>
            <button @click="handleExportMarkdown" class="btn-primary text-xs px-3 py-1.5">导出</button>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-surface-secondary">
            <div>
              <p class="text-sm font-medium text-content">导出为 Excel</p>
              <p class="text-xs text-content-tertiary mt-0.5">表格格式，便于分析</p>
            </div>
            <button @click="handleExportExcel" class="btn-primary text-xs px-3 py-1.5">导出</button>
          </div>
        </div>
      </div>

      <!-- Data Import -->
      <div class="card">
        <h3 class="text-sm font-semibold text-content mb-4">数据导入</h3>
        <div class="flex items-center justify-between p-3 rounded-lg bg-surface-secondary">
          <div>
            <p class="text-sm font-medium text-content">从 JSON 导入</p>
            <p class="text-xs text-content-tertiary mt-0.5">从备份文件恢复数据（与现有数据合并）</p>
          </div>
          <button @click="handleImportJSON" class="btn-secondary text-xs px-3 py-1.5">导入</button>
        </div>
      </div>

      <!-- Data Storage Location -->
      <div class="card">
        <h3 class="text-sm font-semibold text-content mb-4">数据存储位置</h3>
        <div class="space-y-3">
          <div class="p-3 rounded-lg bg-surface-secondary">
            <p class="text-xs text-content-tertiary mb-1">当前数据目录</p>
            <p class="text-sm font-mono text-content break-all">{{ currentDataDir }}</p>
          </div>
          <div class="flex items-center gap-3">
            <button @click="changeDataDir" class="btn-primary text-xs px-3 py-1.5 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              更改位置
            </button>
            <button @click="resetDataDirConfirm" class="btn-secondary text-xs px-3 py-1.5">
              恢复默认
            </button>
          </div>
          <p class="text-xs text-content-tertiary">更改位置会将所有数据（数据库、附件、背景）迁移到新目录，需要重启应用生效</p>
        </div>
      </div>

      <!-- Date Range for Export -->
      <div class="card">
        <h3 class="text-sm font-semibold text-content mb-4">导出日期范围</h3>
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <label class="block text-xs text-content-tertiary mb-1">开始日期</label>
            <input v-model="exportStartDate" type="date" class="input-field" />
          </div>
          <div class="flex-1">
            <label class="block text-xs text-content-tertiary mb-1">结束日期</label>
            <input v-model="exportEndDate" type="date" class="input-field" />
          </div>
        </div>
        <p class="text-xs text-content-tertiary mt-2">留空则导出全部数据</p>
      </div>

      <!-- Toast -->
      <div
        v-if="toast"
        class="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 z-50"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ toast }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAppStore } from '../stores/app'
import { exportToJSON, importFromJSON, exportToMarkdown, exportToExcel } from '../utils/export'
import { open } from '@tauri-apps/api/dialog'
import { readBinaryFile } from '@tauri-apps/api/fs'
import { appWindow } from '@tauri-apps/api/window'
import PageHeader from '@/components/PageHeader.vue'

const store = useAppStore()

const exportStartDate = ref('')
const exportEndDate = ref('')
const toast = ref('')

// Data directory
const currentDataDir = ref('')
const defaultDataDir = ref('')
const isCustomDataDir = computed(() => currentDataDir.value !== defaultDataDir.value && currentDataDir.value !== '')

function showToast(msg) {
  toast.value = msg
  setTimeout(() => {
    toast.value = ''
  }, 3000)
}

async function loadDataDir() {
  try {
    currentDataDir.value = await store.getDataDir()
    defaultDataDir.value = await store.getDefaultDataDir()
  } catch (e) {
    console.error('Failed to load data dir:', e)
  }
}

async function changeDataDir() {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
    })
    if (!selected) return
    const newPath = typeof selected === 'string' ? selected : selected[0]
    if (newPath === currentDataDir.value) {
      showToast('新路径与当前相同')
      return
    }
    if (!confirm(`确定要将数据迁移到：\n${newPath}\n\n迁移后需要重启应用。`)) return
    await store.migrateDataDir(newPath)
    showToast('数据迁移成功，请重启应用')
    await loadDataDir()
  } catch (e) {
    showToast('更改数据目录失败: ' + e)
  }
}

async function resetDataDirConfirm() {
  if (!confirm('确定要恢复默认数据目录吗？\n恢复后需要重启应用，当前自定义目录的数据不会自动删除。')) return
  try {
    await store.resetDataDir()
    showToast('已恢复默认，请重启应用')
    await loadDataDir()
  } catch (e) {
    showToast('恢复默认失败: ' + e)
  }
}

async function handleSetTheme(t) {
  if (store.theme !== t) {
    await store.setTheme(t)
  }
}

async function uploadBackground() {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }],
    })
    if (!selected) return
    const filePath = typeof selected === 'string' ? selected : selected[0]

    // Read file as binary and convert to data URL
    const fileData = await readBinaryFile(filePath)
    const base64 = arrayBufferToBase64(fileData)
    const fileExt = filePath.split('.').pop().toLowerCase()
    const mimeType = fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg' :
                     fileExt === 'png' ? 'image/png' :
                     fileExt === 'webp' ? 'image/webp' :
                     fileExt === 'bmp' ? 'image/bmp' : 'image/png'
    const dataUrl = `data:${mimeType};base64,${base64}`

    // Load image to check dimensions and resize if needed
    const img = new Image()
    img.src = dataUrl
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = () => reject(new Error('图片加载失败，请检查文件格式'))
    })

    const MAX_DIMENSION = 1920
    const longestSide = Math.max(img.naturalWidth, img.naturalHeight)

    let finalDataUrl = dataUrl
    if (longestSide > MAX_DIMENSION) {
      // Resize large images via canvas to avoid huge data URLs
      const scale = MAX_DIMENSION / longestSide
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      finalDataUrl = canvas.toDataURL('image/jpeg', 0.85)
    }

    await store.setBackgroundImage(finalDataUrl, 'cover')
    showToast('背景图片已设置')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    showToast('设置背景失败: ' + msg)
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function clearBackground() {
  await store.clearBackgroundImage()
  showToast('背景已移除')
}

let normalSize = null
let normalPos = null

async function toggleMiniMode() {
  try {
    if (!store.isMiniMode) {
      normalSize = await appWindow.innerSize()
      normalPos = await appWindow.outerPosition()
      store.isMiniMode = true
      await appWindow.setAlwaysOnTop(true)
      await appWindow.setResizable(false)
      const screenW = window.screen.availWidth
      const screenH = window.screen.availHeight
      await appWindow.setPosition({ type: 'Physical', x: screenW - 420, y: screenH - 560 })
      await appWindow.setSize({ type: 'Physical', width: 400, height: 540 })
    } else {
      store.isMiniMode = false
      await appWindow.setAlwaysOnTop(false)
      await appWindow.setResizable(true)
      if (normalSize) await appWindow.setSize(normalSize)
      if (normalPos) await appWindow.setPosition(normalPos)
    }
  } catch (e) {
    showToast('迷你模式切换失败: ' + e)
  }
}

async function handleExportJSON() {
  try {
    const ok = await exportToJSON()
    if (ok) showToast('JSON 导出成功')
  } catch (e) {
    showToast('导出失败: ' + e)
  }
}

async function handleExportMarkdown() {
  try {
    const start = exportStartDate.value || '2020-01-01'
    const end = exportEndDate.value || formatDate(new Date())
    const ok = await exportToMarkdown(start, end)
    if (ok) showToast('Markdown 导出成功')
  } catch (e) {
    showToast('导出失败: ' + e)
  }
}

async function handleExportExcel() {
  try {
    const start = exportStartDate.value || '2020-01-01'
    const end = exportEndDate.value || formatDate(new Date())
    const ok = await exportToExcel(start, end)
    if (ok) showToast('Excel 导出成功')
  } catch (e) {
    showToast('导出失败: ' + e)
  }
}

async function handleImportJSON() {
  try {
    const ok = await importFromJSON()
    if (ok) {
      showToast('导入成功，数据已合并')
      await store.loadTags()
      await store.loadTodosForDate(store.currentDate)
    }
  } catch (e) {
    showToast('导入失败: ' + e)
  }
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  loadDataDir()
})
</script>
