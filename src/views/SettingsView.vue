<template>
  <div class="h-full flex flex-col overflow-y-auto">
    <!-- Header -->
    <div class="px-8 pt-6 pb-4">
      <h1 class="text-2xl font-bold text-content">设置</h1>
      <p class="text-sm text-content-tertiary mt-0.5">管理应用设置和数据</p>
    </div>

    <div class="flex-1 px-8 pb-6 space-y-6">
      <!-- Theme -->
      <div class="card">
        <h3 class="text-sm font-semibold text-content mb-4">外观</h3>
        <div>
          <p class="text-sm text-content-secondary mb-3">主题模式</p>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="t in store.themes"
              :key="t.id"
              @click="handleSetTheme(t.id)"
              class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
              :class="
                store.theme === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-content-tertiary'
              "
            >
              <span
                class="w-6 h-6 rounded-full shadow-sm border border-black/10"
                :style="{ backgroundColor: t.color }"
              ></span>
              <span class="text-xs font-medium text-content-secondary">{{ t.name }}</span>
            </button>
          </div>
          <p class="text-xs text-muted mt-2">选择应用的主题配色方案</p>
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
          <p class="text-xs text-content-tertiary">支持 JPG、PNG、WebP 格式。大图片可裁剪调整，小图片自动平铺重复</p>
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

      <!-- Background Crop Modal -->
      <div
        v-if="showCropModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        @mousedown.self="cancelCrop"
      >
        <div class="bg-surface rounded-2xl shadow-2xl border border-border w-[640px] max-h-[90vh] flex flex-col">
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-content">裁剪背景图片</h2>
            <button @click="cancelCrop" class="p-1 rounded-lg hover:bg-surface-secondary transition-colors text-content-tertiary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <!-- Crop Area -->
          <div class="px-6 py-4 flex-1 overflow-hidden">
            <div
              ref="cropContainerRef"
              class="relative w-full bg-black rounded-lg overflow-hidden cursor-move select-none"
              style="height: 360px;"
              @mousedown="onCropDragStart"
            >
              <img
                ref="cropImgRef"
                :src="cropImageSrc"
                class="absolute select-none"
                draggable="false"
                :style="cropImgStyle"
                @load="onCropImageLoad"
              />
              <!-- Dimension info overlay -->
              <div class="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {{ cropImageNatW }} x {{ cropImageNatH }}
              </div>
            </div>
            <!-- Zoom slider -->
            <div class="flex items-center gap-3 mt-4">
              <svg class="w-4 h-4 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <input
                type="range"
                min="10"
                max="300"
                v-model.number="cropZoom"
                class="flex-1 h-1.5 rounded-full appearance-none bg-border accent-primary cursor-pointer"
              />
              <span class="text-xs text-content-tertiary w-10 text-right">{{ Math.round(cropZoom) }}%</span>
            </div>
          </div>
          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button @click="cancelCrop" class="btn-secondary text-xs px-4 py-2">取消</button>
            <button @click="confirmCrop" class="btn-primary text-xs px-4 py-2">确认裁剪</button>
          </div>
        </div>
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
import { ref, onMounted, computed, nextTick } from 'vue'
import { useAppStore } from '../stores/app'
import { exportToJSON, importFromJSON, exportToMarkdown, exportToExcel } from '../utils/export'
import { open } from '@tauri-apps/api/dialog'
import { writeBinaryFile } from '@tauri-apps/api/fs'
import { join } from '@tauri-apps/api/path'
import { appWindow } from '@tauri-apps/api/window'

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

    // Load image to check dimensions
    const img = new Image()
    img.src = filePath
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })

    const SMALL_THRESHOLD = 512
    const longestSide = Math.max(img.naturalWidth, img.naturalHeight)

    if (longestSide <= SMALL_THRESHOLD) {
      // Small image: auto-set to tile mode
      await store.setBackgroundImage(filePath, 'tile')
      showToast('小图片已自动设置为平铺模式')
    } else {
      // Large image: show crop modal
      cropOriginalPath = filePath
      cropImageSrc.value = filePath
      cropImageNatW.value = img.naturalWidth
      cropImageNatH.value = img.naturalHeight
      showCropModal.value = true
      // Reset crop state
      cropOffsetX.value = 0
      cropOffsetY.value = 0
      cropZoom.value = 100
      await nextTick()
      initCropPosition()
    }
  } catch (e) {
    showToast('设置背景失败: ' + e)
  }
}

// ─── Crop Modal State ─────────────────────────────
const showCropModal = ref(false)
const cropImageSrc = ref('')
const cropImageNatW = ref(0)
const cropImageNatH = ref(0)
const cropOffsetX = ref(0)
const cropOffsetY = ref(0)
const cropZoom = ref(100)
const cropContainerRef = ref(null)
const cropImgRef = ref(null)
let cropOriginalPath = ''
let cropDragging = false
let cropDragStartX = 0
let cropDragStartY = 0
let cropDragStartOffsetX = 0
let cropDragStartOffsetY = 0

const cropImgStyle = computed(() => {
  const scale = cropZoom.value / 100
  const w = cropImageNatW.value * scale
  const h = cropImageNatH.value * scale
  return {
    width: w + 'px',
    height: h + 'px',
    transform: `translate(${cropOffsetX.value}px, ${cropOffsetY.value}px)`,
  }
})

function initCropPosition() {
  if (!cropContainerRef.value) return
  const containerW = cropContainerRef.value.clientWidth
  const containerH = cropContainerRef.value.clientHeight
  const scale = cropZoom.value / 100
  const imgW = cropImageNatW.value * scale
  const imgH = cropImageNatH.value * scale
  // Center the image
  cropOffsetX.value = (containerW - imgW) / 2
  cropOffsetY.value = (containerH - imgH) / 2
}

function onCropImageLoad() {
  initCropPosition()
}

function onCropDragStart(e) {
  cropDragging = true
  cropDragStartX = e.clientX
  cropDragStartY = e.clientY
  cropDragStartOffsetX = cropOffsetX.value
  cropDragStartOffsetY = cropOffsetY.value
  document.addEventListener('mousemove', onCropDragMove)
  document.addEventListener('mouseup', onCropDragEnd)
  e.preventDefault()
}

function onCropDragMove(e) {
  if (!cropDragging) return
  const dx = e.clientX - cropDragStartX
  const dy = e.clientY - cropDragStartY
  cropOffsetX.value = cropDragStartOffsetX + dx
  cropOffsetY.value = cropDragStartOffsetY + dy
}

function onCropDragEnd() {
  cropDragging = false
  document.removeEventListener('mousemove', onCropDragMove)
  document.removeEventListener('mouseup', onCropDragEnd)
}

function cancelCrop() {
  showCropModal.value = false
  cropImageSrc.value = ''
  cropOriginalPath = ''
}

async function confirmCrop() {
  try {
    if (!cropContainerRef.value || !cropImgRef.value) return

    const containerW = cropContainerRef.value.clientWidth
    const containerH = cropContainerRef.value.clientHeight
    const scale = cropZoom.value / 100
    const imgW = cropImageNatW.value * scale
    const imgH = cropImageNatH.value * scale

    // Calculate the source rectangle in original image coordinates
    // The visible area is the container (containerW x containerH)
    // The image is at offset (cropOffsetX, cropOffsetY) with size (imgW, imgH)
    // We need to map the container bounds back to original image coordinates

    // Visible area in scaled image coords:
    const visLeft = -cropOffsetX.value
    const visTop = -cropOffsetY.value
    const visRight = visLeft + containerW
    const visBottom = visTop + containerH

    // Map to original image coordinates
    const srcLeft = Math.max(0, visLeft / scale)
    const srcTop = Math.max(0, visTop / scale)
    const srcRight = Math.min(cropImageNatW.value, visRight / scale)
    const srcBottom = Math.min(cropImageNatH.value, visBottom / scale)

    const srcW = srcRight - srcLeft
    const srcH = srcBottom - srcTop

    if (srcW <= 0 || srcH <= 0) {
      showToast('裁剪区域无效')
      return
    }

    // Use canvas to crop
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(srcW)
    canvas.height = Math.round(srcH)
    const ctx = canvas.getContext('2d')

    const img = new Image()
    img.src = cropOriginalPath
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })

    ctx.drawImage(img, srcLeft, srcTop, srcW, srcH, 0, 0, canvas.width, canvas.height)

    // Convert to blob and save
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    const arrayBuffer = await blob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Save to app data dir
    const dataDir = await store.getDataDir()
    const bgPath = await join(dataDir, 'background.png')
    await writeBinaryFile(bgPath, uint8Array)

    await store.setBackgroundImage(bgPath, 'cover')
    showCropModal.value = false
    cropImageSrc.value = ''
    cropOriginalPath = ''
    showToast('背景图片已裁剪并更新')
  } catch (e) {
    showToast('裁剪失败: ' + e)
  }
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
      const screenW = window.screen.availWidth
      const screenH = window.screen.availHeight
      await appWindow.setPosition({ type: 'Physical', x: screenW - 420, y: screenH - 560 })
      await appWindow.setSize({ type: 'Physical', width: 400, height: 540 })
    } else {
      store.isMiniMode = false
      await appWindow.setAlwaysOnTop(false)
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
