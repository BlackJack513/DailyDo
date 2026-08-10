<template>
 <div class="h-full flex flex-col overflow-y-auto">
 <!-- Header -->
 <div class="px-8 pt-6 pb-4 flex items-center justify-between">
 <div>
 <h1 class="text-2xl font-bold text-content">统计分析</h1>
 <p class="text-sm text-content-tertiary mt-0.5">了解你的工作效率和任务分布</p>
 </div>
 <div class="flex gap-2">
 <button
 v-for="range in timeRanges"
 :key="range.value"
 @click="selectedRange = range.value"
 class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
 :class="selectedRange === range.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-content-tertiary hover:border-content-tertiary'"
>
 {{ range.label }}
 </button>
 </div>
 </div>

 <!-- Stats Cards -->
 <div class="px-8 pb-6 grid grid-cols-4 gap-4">
 <div v-for="stat in statsCards" :key="stat.label" class="card">
 <p class="text-xs font-medium text-content-tertiary mb-1">{{ stat.label }}</p>
 <p class="text-2xl font-bold text-content">{{ stat.value }}</p>
 <p v-if="stat.sub" class="text-xs text-content-tertiary mt-0.5">{{ stat.sub }}</p>
 </div>
 </div>

 <!-- Charts -->
 <div class="px-8 pb-6 grid grid-cols-2 gap-6">
 <!-- Pie Chart -->
 <div class="card">
 <h3 class="text-sm font-semibold text-content mb-4">标签分布</h3>
 <div ref="pieChartRef" class="w-full h-72"></div>
 </div>

 <!-- Priority Pie Chart -->
 <div class="card">
 <h3 class="text-sm font-semibold text-content mb-4">优先级分布</h3>
 <div ref="priorityChartRef" class="w-full h-72"></div>
 </div>
 </div>

 <!-- Charts Row 2: Task Count + Completion Rate -->
 <div class="px-8 pb-6 grid grid-cols-2 gap-6">
 <!-- Daily Task Count Chart -->
 <div class="card">
 <h3 class="text-sm font-semibold text-content mb-4">每日任务数量</h3>
 <div ref="countChartRef" class="w-full h-72"></div>
 </div>

 <!-- Completion Rate Chart -->
 <div class="card">
 <h3 class="text-sm font-semibold text-content mb-4">完成率趋势</h3>
 <div ref="rateChartRef" class="w-full h-72"></div>
 </div>
 </div>
 </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import { useAppStore } from '../stores/app'
import * as echarts from 'echarts'

const store = useAppStore()

const selectedRange = ref(7)
const pieChartRef = ref(null)
const priorityChartRef = ref(null)
const countChartRef = ref(null)
const rateChartRef = ref(null)
let pieChart = null
let priorityChart = null
let countChart = null
let rateChart = null

const timeRanges = [
 { value: 7, label: '近7天' },
 { value: 30, label: '近30天' },
 { value: 90, label: '近90天' },
]

const dateRange = computed(() => {
 const end = new Date()
 const start = new Date()
 start.setDate(start.getDate() - selectedRange.value + 1)
 return {
 start: formatDate(start),
 end: formatDate(end),
 }
})

const statsCards = computed(() => [
 { label: '本周完成', value: store.overviewStats.week_completed, sub: `共 ${store.overviewStats.week_total} 项` },
 { label: '今日完成', value: store.overviewStats.today_completed, sub: `共 ${store.overviewStats.today_total} 项` },
 { label: '待处理', value: store.overviewStats.pending_count },
 { label: '连续完成', value: `${store.overviewStats.streak_days} 天` },
])

const isDark = computed(() => store.theme === 'dark')

function formatDate(d) {
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function loadCharts() {
 const { start, end } = dateRange.value

 // Tag distribution pie chart
 const tagDist = await store.getTagDistribution(start, end)
 if (pieChart) {
 pieChart.setOption({
 tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
 legend: {
 orient: 'vertical',
 right: 10,
 top: 'center',
 textStyle: { color: isDark.value ? '#9ca3af' : '#64748b', fontSize: 11 },
 },
 series: [
 {
 type: 'pie',
 radius: ['40%', '70%'],
 center: ['35%', '50%'],
 avoidLabelOverlap: false,
 itemStyle: { borderRadius: 6, borderColor: isDark.value ? '#1f2937' : '#fff', borderWidth: 2 },
 label: { show: true, fontSize: 11, formatter: '{b}: {c}' },
 emphasis: {
 label: { show: true, fontSize: 13, fontWeight: 'bold' },
 },
 data: tagDist.map((t) => ({
 name: t.tag_name,
 value: t.count,
 itemStyle: { color: t.color },
 })),
 },
 ],
 })
 }

 // Priority distribution pie chart
 const priorityDist = await store.getPriorityDistribution(start, end)
 if (priorityChart) {
 const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }
 priorityChart.setOption({
 tooltip: {
 trigger: 'item',
 formatter: (params) => {
 const item = priorityDist.find((d) => d.label === params.name)
 const completed = item ? item.completed : 0
 return `${params.name}<br/>总数: ${params.value}<br/>已完成: ${completed}<br/>占比: ${params.percent}%`
 },
 },
 legend: {
 orient: 'vertical',
 right: 10,
 top: 'center',
 textStyle: { color: isDark.value ? '#9ca3af' : '#64748b', fontSize: 11 },
 },
 series: [
 {
 type: 'pie',
 radius: ['40%', '70%'],
 center: ['35%', '50%'],
 avoidLabelOverlap: false,
 itemStyle: { borderRadius: 6, borderColor: isDark.value ? '#1f2937' : '#fff', borderWidth: 2 },
 label: { show: true, fontSize: 11, formatter: '{b}: {c}' },
 emphasis: {
 label: { show: true, fontSize: 13, fontWeight: 'bold' },
 },
 data: priorityDist.map((p) => ({
 name: p.label,
 value: p.count,
 itemStyle: { color: priorityColors[p.priority] || '#6366f1' },
 })),
 },
 ],
 })
 }

 // Daily task count bar chart
 const trend = await store.getCompletionTrend(start, end)
 if (countChart) {
 countChart.setOption({
 tooltip: {
 trigger: 'axis',
 formatter: (params) => {
 const date = params[0].axisValue
 const lines = [date]
 params.forEach((p) => {
 lines.push(`${p.marker} ${p.seriesName}: ${p.value} 项`)
 })
 return lines.join('<br>')
 },
 },
 legend: {
 data: ['已完成', '总数'],
 textStyle: { color: isDark.value ? '#9ca3af' : '#64748b', fontSize: 11 },
 top: 0,
 },
 grid: { left: 40, right: 20, top: 40, bottom: 20 },
 xAxis: {
 type: 'category',
 data: trend.map((t) => t.date.substring(5)),
 axisLabel: { color: isDark.value ? '#6b7280' : '#94a3b8', fontSize: 10 },
 axisLine: { lineStyle: { color: isDark.value ? '#374151' : '#e2e8f0' } },
 },
 yAxis: {
 type: 'value',
 axisLabel: { color: isDark.value ? '#6b7280' : '#94a3b8', fontSize: 10 },
 splitLine: { lineStyle: { color: isDark.value ? '#374151' : '#f1f5f9' } },
 },
 series: [
 {
 name: '总数',
 type: 'bar',
 data: trend.map((t) => t.total),
 itemStyle: { color: isDark.value ? '#374151' : '#e2e8f0', borderRadius: [4, 4, 0, 0] },
 barWidth: '35%',
 barGap: '20%',
 },
 {
 name: '已完成',
 type: 'bar',
 data: trend.map((t) => t.completed),
 itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
 barWidth: '35%',
 },
 ],
 })
 }

 // Completion rate line chart
 if (rateChart) {
 rateChart.setOption({
 tooltip: {
 trigger: 'axis',
 formatter: (params) => {
 const p = params[0]
 return `${p.axisValue}<br/>${p.marker} 完成率: ${p.value}%`
 },
 },
 grid: { left: 40, right: 20, top: 20, bottom: 20 },
 xAxis: {
 type: 'category',
 data: trend.map((t) => t.date.substring(5)),
 axisLabel: { color: isDark.value ? '#6b7280' : '#94a3b8', fontSize: 10 },
 axisLine: { lineStyle: { color: isDark.value ? '#374151' : '#e2e8f0' } },
 },
 yAxis: {
 type: 'value',
 max: 100,
 axisLabel: { color: isDark.value ? '#6b7280' : '#94a3b8', fontSize: 10, formatter: '{value}%' },
 splitLine: { lineStyle: { color: isDark.value ? '#374151' : '#f1f5f9' } },
 },
 series: [
 {
 type: 'line',
 data: trend.map((t) => t.rate),
 smooth: true,
 lineStyle: { color: '#10b981', width: 2.5 },
 itemStyle: { color: '#10b981' },
 areaStyle: {
 color: {
 type: 'linear',
 x: 0, y: 0, x2: 0, y2: 1,
 colorStops: [
 { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
 { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
 ],
 },
 },
 symbol: 'circle',
 symbolSize: 6,
 },
 ],
 })
 }
}

function handleResize() {
 pieChart?.resize()
 priorityChart?.resize()
 countChart?.resize()
 rateChart?.resize()
}

onMounted(async () => {
 await store.loadOverviewStats()
 await nextTick()
 if (pieChartRef.value) {
 pieChart = echarts.init(pieChartRef.value)
 }
 if (priorityChartRef.value) {
 priorityChart = echarts.init(priorityChartRef.value)
 }
 if (countChartRef.value) {
 countChart = echarts.init(countChartRef.value)
 }
 if (rateChartRef.value) {
 rateChart = echarts.init(rateChartRef.value)
 }
 window.addEventListener('resize', handleResize)
 await loadCharts()
})

watch([selectedRange, isDark], () => {
 loadCharts()
})

onBeforeUnmount(() => {
 window.removeEventListener('resize', handleResize)
 pieChart?.dispose()
 priorityChart?.dispose()
 countChart?.dispose()
 rateChart?.dispose()
})
</script>
