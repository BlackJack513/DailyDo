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
   <div class="grid grid-cols-5 gap-2">
     <button
       v-for="t in store.themes"
       :key="t.id"
       @click="handleSetTheme(t.id)"
       class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
       :class="store.theme === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-content-tertiary'"
     >
       <span class="w-6 h-6 rounded-full shadow-sm border border-black/10" :style="{ backgroundColor: t.color }"></span>
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
 <div class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url('${store.backgroundImage}')` }"></div>
 <div class="absolute inset-0 flex items-center justify-center bg-black/20">
 <span class="text-white text-sm font-medium">当前背景预览</span>
 </div>
 </div>
 <div class="flex items-center gap-3">
 <button @click="uploadBackground" class="btn-primary text-xs px-3 py-1.5 flex items-center gap-2">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
 </svg>
 {{ store.backgroundImage ? '更换背景' : '选择背景图片' }}
 </button>
 <button
 v-if="store.backgroundImage"
 @click="clearBackground"
 class="btn-secondary text-xs px-3 py-1.5"
>
 移除背景
 </button>
 </div>
 <p class="text-xs text-content-tertiary">支持 JPG、PNG、WebP 格式，建议选择 1920x1080 或更高分辨率的图片</p>
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
 :class="store.isMiniMode ? 'border-primary bg-primary/10 text-primary' : 'border-border text-content-tertiary hover:border-content-tertiary'"
>
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
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
 <div v-if="toast" class="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 z-50">
 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
 </svg>
 {{ toast }}
 </div>
 </div>
 </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { exportToJSON, importFromJSON, exportToMarkdown, exportToExcel } from '../utils/export'
import { open } from '@tauri-apps/api/dialog'
import { appWindow } from '@tauri-apps/api/window'

const store = useAppStore()

const exportStartDate = ref('')
const exportEndDate = ref('')
const toast = ref('')

function showToast(msg) {
 toast.value = msg
 setTimeout(() => { toast.value = '' }, 3000)
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
 filters: [
 { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] },
 ],
 })
 if (!selected) return
 const filePath = typeof selected === 'string' ? selected : selected[0]
 await store.setBackgroundImage(filePath)
 showToast('背景图片已更新')
 } catch (e) {
 showToast('设置背景失败: ' + e)
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
</script>
