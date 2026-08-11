<template>
  <div class="h-full flex flex-col overflow-y-auto">
    <!-- Header -->
    <div class="px-8 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-content">甘特图</h1>
        <p class="text-sm text-content-tertiary mt-0.5">可视化任务时间线，了解每日工作节奏</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Date picker -->
        <input
          type="date"
          :value="selectedDate"
          @change="onDateChange"
          class="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm text-content focus:outline-none focus:border-primary transition-colors"
        />
        <!-- Today button -->
        <button
          @click="goToday"
          class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
          :class="isToday ? 'border-primary bg-primary/10 text-primary' : 'border-border text-content-tertiary hover:border-content-tertiary'"
        >
          今天
        </button>
      </div>
    </div>

    <!-- Legend -->
    <div class="px-8 pb-3 flex items-center gap-5 flex-shrink-0">
      <div v-for="item in legendItems" :key="item.key" class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-sm" :style="{ backgroundColor: item.color }"></span>
        <span class="text-xs text-content-tertiary">{{ item.label }}</span>
      </div>
    </div>

    <!-- Chart -->
    <div class="px-8 pb-6 flex-1 min-h-0">
      <div class="card h-full relative">
        <!-- Chart container — always in DOM so ECharts always has dimensions -->
        <div ref="chartRef" class="w-full h-full"></div>
        <!-- Loading overlay -->
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-lg z-10">
          <div class="text-content-tertiary text-sm">加载中...</div>
        </div>
        <!-- Empty state overlay -->
        <div v-else-if="showEmpty" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/80 rounded-lg z-10">
          <svg class="w-16 h-16 text-content-tertiary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p class="text-content-tertiary text-sm">当日暂无任务数据</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import * as db from '../utils/db'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const selectedDate = ref(formatDate(new Date()))
const ganttData = ref([])
const loading = ref(false)
const chartRef = ref(null)
let chart = null

const isToday = computed(() => selectedDate.value === formatDate(new Date()))

const legendItems = [
  { key: 'pending', label: '待处理', color: '#94a3b8' },
  { key: 'in_progress', label: '进行中', color: '#3b82f6' },
  { key: 'done', label: '已完成', color: '#10b981' },
  { key: 'blocked', label: '等待中', color: '#f59e0b' },
]

const statusColors = {
  pending: '#94a3b8',
  in_progress: '#3b82f6',
  done: '#10b981',
  blocked: '#f59e0b',
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function onDateChange(e) {
  selectedDate.value = e.target.value
}

function goToday() {
  selectedDate.value = formatDate(new Date())
}

// Parse "YYYY-MM-DDTHH:MM:SS" or "YYYY-MM-DD HH:MM:SS" to minutes since midnight
function toMinutes(ts) {
  if (!ts) return null
  // Support both "T" and space separators
  const tIdx = ts.indexOf('T')
  const spaceIdx = ts.indexOf(' ')
  const sepIdx = tIdx >= 0 ? tIdx : spaceIdx
  if (sepIdx < 0) return null
  const timeStr = ts.substring(sepIdx + 1)
  const timeParts = timeStr.split(':')
  if (timeParts.length < 2) return null
  const h = parseInt(timeParts[0], 10)
  const m = parseInt(timeParts[1], 10)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

// Build time segments from activity logs
// Returns null if the todo has no usable time data (skip it)
function buildSegments(todo) {
  const segments = []
  const logs = todo.logs || []

  // Filter logs to only include those matching the selected date
  const dateLogs = logs.filter(l => l.created_at && l.created_at.substring(0, 10) === selectedDate.value)

  // Filter to status-relevant logs for the selected date
  const statusLogs = dateLogs.filter(l => l.action === 'created' || l.action === 'status_changed')

  if (statusLogs.length === 0) {
    // No activity data for this date — only use created_at fallback if it matches the selected date
    if (!todo.created_at || todo.created_at.substring(0, 10) !== selectedDate.value) {
      return null // created_at is from a different date, skip
    }
    const startMin = toMinutes(todo.created_at)
    if (startMin === null) {
      // No usable time data at all — skip this todo
      return null
    }
    let endMin = null
    if (todo.status === 'done' && todo.completed_at) {
      endMin = toMinutes(todo.completed_at)
    }
    if (endMin === null) {
      // For non-done todos without completed_at, use created_at + 60min as fallback
      endMin = startMin + 60
    }
    segments.push({
      start: Math.min(startMin, 1440),
      end: Math.min(Math.max(endMin, startMin + 1), 1440),
      status: todo.status || 'pending',
    })
    return segments
  }

  for (let i = 0; i < statusLogs.length; i++) {
    const log = statusLogs[i]
    const startMin = toMinutes(log.created_at)
    if (startMin === null) continue

    // Determine status for this segment
    let status = 'pending'
    if (log.action === 'created') {
      status = log.new_status || 'pending'
    } else if (log.action === 'status_changed') {
      status = log.new_status || 'pending'
    }

    // Determine end time
    let endMin
    if (i + 1 < statusLogs.length) {
      endMin = toMinutes(statusLogs[i + 1].created_at)
    } else {
      // Last segment — ends at completed_at or now
      endMin = status === 'done' ? toMinutes(todo.completed_at) : null
      if (endMin === null) {
        // Use current time if it's today, otherwise end of day
        const today = formatDate(new Date())
        if (selectedDate.value === today) {
          const now = new Date()
          endMin = now.getHours() * 60 + now.getMinutes()
        } else {
          endMin = 1440 // end of day
        }
      }
    }

    if (endMin === null) endMin = startMin + 30 // fallback: 30 min duration

    segments.push({
      start: Math.min(startMin, 1440),
      end: Math.min(Math.max(endMin, startMin + 1), 1440),
      status,
    })
  }

  return segments.length > 0 ? segments : null
}

function renderChart() {
  try {
    if (!chartRef.value) return
    // Check container has actual dimensions
    const container = chartRef.value
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn('GanttView: chart container has zero dimensions, skipping render')
      return
    }

    if (chart) {
      chart.dispose()
      chart = null
    }
    chart = echarts.init(chartRef.value)

    const isDark = store.theme === 'dark'
    const textColor = isDark ? '#d1d5db' : '#374151'
    const subTextColor = isDark ? '#9ca3af' : '#64748b'
    const borderColor = isDark ? '#374151' : '#e5e7eb'

    // Build custom series data — skip todos with no valid time data
    const renderData = []
    const validTodos = []
    ganttData.value.forEach((todo, idx) => {
      const segments = buildSegments(todo)
      if (!segments) return // skip todos without usable time data
      const displayIdx = validTodos.length
      validTodos.push(todo)
      segments.forEach(seg => {
        renderData.push({
          name: todo.title,
          value: [displayIdx, seg.start, seg.end, seg.status],
          itemStyle: {
            color: statusColors[seg.status] || '#94a3b8',
          },
        })
      })
    })

    // If no todos have valid time data, show empty state via separate flag
    if (validTodos.length === 0) {
      showEmpty.value = true
      chart.dispose()
      chart = null
      return
    }
    showEmpty.value = false

    // Prepare yAxis categories from valid todos only
    const categories = validTodos.map(t => {
      return t.title.length > 16 ? t.title.slice(0, 15) + '...' : t.title
    })

    const option = {
      tooltip: {
        formatter(params) {
          const [catIdx, startMin, endMin, status] = params.value
          const title = validTodos[catIdx]?.title || ''
          const statusLabels = { pending: '待处理', in_progress: '进行中', done: '已完成', blocked: '等待中' }
          const startH = Math.floor(startMin / 60)
          const startM = startMin % 60
          const endH = Math.floor(endMin / 60)
          const endM = endMin % 60
          const duration = endMin - startMin
          const durH = Math.floor(duration / 60)
          const durM = duration % 60
          return `<strong>${title}</strong><br/>
            状态：${statusLabels[status] || status}<br/>
            时间：${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')} - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}<br/>
            时长：${durH > 0 ? durH + '小时' : ''}${durM > 0 ? durM + '分钟' : (durH === 0 ? '不到1分钟' : '')}`
        },
      },
      grid: {
        left: 160,
        right: 30,
        top: 20,
        bottom: 40,
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 1440,
        interval: 120,
        axisLabel: {
          formatter(val) {
            const h = Math.floor(val / 60)
            return `${String(h).padStart(2, '0')}:00`
          },
          color: subTextColor,
          fontSize: 11,
        },
        splitLine: {
          show: true,
          lineStyle: { color: borderColor, type: 'dashed' },
        },
        axisLine: { lineStyle: { color: borderColor } },
      },
      yAxis: {
        type: 'category',
        data: categories,
        inverse: true,
        axisLabel: {
          color: textColor,
          fontSize: 12,
          width: 140,
          overflow: 'truncate',
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'custom',
          renderItem(params, api) {
            const catIdx = api.value(0)
            const startMin = api.value(1)
            const endMin = api.value(2)

            const start = api.coord([startMin, catIdx])
            const end = api.coord([endMin, catIdx])
            const height = 20

            const rect = echarts.graphic.clipRectByRect(
              {
                x: start[0],
                y: start[1] - height / 2,
                width: Math.max(end[0] - start[0], 4),
                height,
              },
              {
                x: params.coordSys.x,
                y: params.coordSys.y,
                width: params.coordSys.width,
                height: params.coordSys.height,
              }
            )

            return (
              rect && {
                type: 'rect',
                transition: ['shape'],
                shape: rect,
                style: api.style({
                  fill: api.visual('color'),
                  stroke: 'none',
                }),
                styleEmphasis: {
                  stroke: isDark ? '#fff' : '#000',
                  lineWidth: 1,
                },
              }
            )
          },
          encode: {
            x: [1, 2],
            y: 0,
          },
          data: renderData,
        },
      ],
    }

    chart.setOption(option)
    // Force resize to ensure chart fills container
    setTimeout(() => {
      if (chart) chart.resize()
    }, 50)
  } catch (e) {
    console.error('GanttView renderChart error:', e)
  }
}

const showEmpty = ref(false)

async function loadData() {
  loading.value = true
  showEmpty.value = false
  try {
    const rawData = await db.getGanttData(selectedDate.value)
    // Filter to only todos that have valid time data on the selected date
    ganttData.value = rawData.filter(todo => {
      // Check if any activity log matches the selected date
      const hasMatchingLogs = (todo.logs || []).some(l =>
        l.created_at && l.created_at.substring(0, 10) === selectedDate.value
      )
      if (hasMatchingLogs) return true
      // Fallback: only use created_at if it matches the selected date
      if (todo.created_at && todo.created_at.substring(0, 10) === selectedDate.value) {
        return toMinutes(todo.created_at) !== null
      }
      return false
    })

    // Set loading false FIRST so overlay is removed before rendering
    loading.value = false

    if (ganttData.value.length === 0) {
      showEmpty.value = true
      return
    }

    // Wait for Vue to remove the overlay and update DOM
    await nextTick()
    // Double requestAnimationFrame to ensure browser has completed layout
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    renderChart()
    // Extra resize after a short delay as safety net
    setTimeout(() => {
      if (chart) chart.resize()
    }, 100)
  } catch (e) {
    console.error('Failed to load gantt data:', e)
    ganttData.value = []
    showEmpty.value = true
    loading.value = false
  }
}

// Resize handler
function handleResize() {
  if (chart) chart.resize()
}

watch(selectedDate, () => {
  loadData()
})

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>
