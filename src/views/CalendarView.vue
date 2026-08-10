<template>
 <div class="h-full flex flex-col">
 <!-- Header -->
 <div class="px-8 pt-6 pb-4 flex items-center justify-between">
 <div>
 <h1 class="text-2xl font-bold text-content">日历视图</h1>
 <p class="text-sm text-content-tertiary mt-0.5">查看每天的待办完成情况，管理工作日与休息日</p>
 </div>
 <div class="flex items-center gap-3">
 <!-- Management mode toggle -->
 <button
 @click="isManageMode = !isManageMode"
 class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
 :class="isManageMode ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-surface-tertiary text-content-secondary hover:bg-surface-hover'"
>
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
 </svg>
 {{ isManageMode ? '完成管理' : '管理日历' }}
 </button>
 <!-- Month navigation -->
 <button @click="prevMonth" class="p-2 rounded-lg hover:bg-surface-tertiary text-content-secondary">
 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
 </svg>
 </button>
 <span class="text-lg font-semibold text-content min-w-[140px] text-center">
 {{ currentYear }}年{{ currentMonth }}月
 </span>
 <button @click="nextMonth" class="p-2 rounded-lg hover:bg-surface-tertiary text-content-secondary">
 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
 </svg>
 </button>
 </div>
 </div>

 <!-- Manage mode hint -->
 <div v-if="isManageMode" class="mx-8 mb-3 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2">
 <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 <span class="text-xs text-primary">管理模式下，点击日期可切换工作日与休息日。点击"完成管理"退出管理模式。</span>
 </div>

 <!-- Calendar Grid -->
 <div class="flex-1 px-8 pb-6">
 <!-- Weekday headers -->
 <div class="grid grid-cols-7 mb-2">
 <div v-for="day in weekDays" :key="day" class="text-center text-xs font-semibold text-content-tertiary py-2">
 {{ day }}
 </div>
 </div>

 <!-- Days grid -->
 <div class="grid grid-cols-7 gap-1.5">
 <div
 v-for="(day, idx) in calendarDays"
 :key="idx"
 class="aspect-square rounded-xl border transition-all flex flex-col items-center justify-center relative overflow-hidden"
 :class="cellClasses(day)"
 @click="handleDayClick(day)"
>
 <!-- Day number -->
 <span class="text-sm font-medium leading-none" :class="day.isCurrentMonth ? '' : 'opacity-30'">
 {{ day.day }}
 </span>

 <!-- Day type icon (workday / rest) -->
 <div v-if="day.date && day.isCurrentMonth" class="mt-1 flex items-center justify-center">
 <!-- Workday icon: sun -->
 <svg v-if="getDayType(day.date) === 'workday'" class="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
 <circle cx="12" cy="12" r="4"/>
 <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
 </svg>
 <!-- Rest day icon: crescent moon -->
 <svg v-else class="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
 <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
 </svg>
 </div>

 <!-- Completion badge -->
 <div v-if="day.data" class="flex items-center gap-1 mt-0.5">
 <span class="text-[10px] font-medium px-1.5 py-0.5 rounded-full" :class="countBadgeClass(day.data, day.date)">
 {{ day.data.completed }}/{{ day.data.total }}
 </span>
 </div>

 <!-- Today indicator -->
 <div v-if="day.isToday" class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary"></div>

 <!-- Custom override indicator (small dot at bottom) -->
 <div v-if="day.date && store.calendarDays[day.date]" class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" :class="store.calendarDays[day.date] === 'workday' ? 'bg-blue-400' : 'bg-amber-400'"></div>
 </div>
 </div>

 <!-- Legend -->
 <div class="flex items-center gap-6 mt-6 justify-center flex-wrap">
 <div class="flex items-center gap-2">
 <div class="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500"></div>
 <span class="text-xs text-content-tertiary">工作日</span>
 </div>
 <div class="flex items-center gap-2">
 <div class="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500"></div>
 <span class="text-xs text-content-tertiary">休息日</span>
 </div>
 <div class="flex items-center gap-2">
 <div class="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
 <span class="text-xs text-content-tertiary">全部完成</span>
 </div>
 <div class="flex items-center gap-2">
 <div class="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
 <span class="text-xs text-content-tertiary">逾期未完成</span>
 </div>
 <div class="flex items-center gap-2">
 <div class="w-3 h-3 rounded-full bg-surface-tertiary border border-border"></div>
 <span class="text-xs text-content-tertiary">无待办</span>
 </div>
 </div>
 </div>

 <!-- Day Detail Modal (only in non-manage mode) -->
 <div v-if="selectedDate && !isManageMode" class="fixed inset-0 z-50 flex items-center justify-center">
 <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="selectedDate = null"></div>
 <div class="relative w-full max-w-md mx-4 bg-surface rounded-2xl shadow-2xl border border-border">
 <div class="flex items-center justify-between px-6 py-4 border-b border-border">
 <div class="flex items-center gap-2">
 <h3 class="text-lg font-semibold text-content">{{ selectedDate }} 的待办</h3>
 <span class="text-xs px-2 py-0.5 rounded-full" :class="selectedDateType === 'workday' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'">
 {{ selectedDateType === 'workday' ? '工作日' : '休息日' }}
 </span>
 </div>
 <button @click="selectedDate = null" class="p-1 rounded-lg hover:bg-surface-tertiary text-content-tertiary">
 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>
 <div class="px-6 py-4 max-h-80 overflow-y-auto space-y-2">
 <div v-if="selectedDateTodos.length === 0" class="text-center py-8 text-content-tertiary text-sm">
 当天没有待办事项
 </div>
 <div
 v-for="todo in selectedDateTodos"
 :key="todo.id"
 class="flex items-center gap-3 p-2.5 rounded-lg bg-surface-secondary"
>
 <div class="w-2 h-2 rounded-full flex-shrink-0" :class="todo.status === 'done' ? 'bg-green-500' : todo.status === 'in_progress' ? 'bg-primary' : 'bg-control'"></div>
 <span class="text-sm flex-1" :class="todo.status === 'done' ? 'line-through text-content-tertiary' : 'text-content'">{{ todo.title }}</span>
 <div class="flex gap-1">
 <span v-for="tag in todo.tags || []" :key="tag.id" class="tag-badge text-[10px]" :style="{ backgroundColor: tag.color + '20', color: tag.color }">{{ tag.name }}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '../stores/app'
import * as db from '../utils/db'

const store = useAppStore()

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const selectedDate = ref(null)
const selectedDateTodos = ref([])
const isManageMode = ref(false)

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const todayStr = computed(() => {
 const today = new Date()
 return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
})

const calendarDays = computed(() => {
 const year = currentYear.value
 const month = currentMonth.value
 const firstDay = new Date(year, month - 1, 1)
 const lastDay = new Date(year, month, 0)
 const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
 const daysInMonth = lastDay.getDate()

 const days = []

 // Previous month padding
 const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
 for (let i = startWeekday - 1; i>= 0; i--) {
 days.push({ day: prevMonthLastDay - i, date: null, isCurrentMonth: false, isToday: false })
 }

 // Current month
 for (let d = 1; d <= daysInMonth; d++) {
 const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
 days.push({
 day: d,
 date: dateStr,
 isCurrentMonth: true,
 isToday: dateStr === todayStr.value,
 data: store.calendarCounts[dateStr] || null,
 })
 }

 // Next month padding
 const remaining = 7 - (days.length % 7)
 if (remaining < 7) {
 for (let i = 1; i <= remaining; i++) {
 days.push({ day: i, date: null, isCurrentMonth: false, isToday: false })
 }
 }

 return days
})

function getDayType(dateStr) {
 return store.getDayType(dateStr)
}

function cellClasses(day) {
 if (!day.date) return 'border-transparent'

 const dayType = day.isCurrentMonth ? getDayType(day.date) : null
 const base = 'cursor-pointer hover:shadow-md'

 if (!day.isCurrentMonth) {
 return 'border-transparent opacity-30'
 }

 // Manage mode: highlight hover
 const manageHover = isManageMode.value
 ? 'hover:border-primary/50 hover:ring-2 hover:ring-primary/20'
 : 'hover:border-primary/30'

 // Completion-based classes
 let completionClass = ''
 if (day.data) {
 if (day.data.completed === day.data.total) {
 completionClass = 'bg-green-500/10 border-green-500/30'
 } else if (day.data.completed> 0) {
 completionClass = 'bg-amber-500/10 border-amber-500/30'
 } else {
 completionClass = dayType === 'rest'
 ? 'bg-amber-50 border-amber-200'
 : 'bg-blue-50 border-blue-200'
 }
 } else {
 completionClass = dayType === 'rest'
 ? 'bg-amber-50/50 border-amber-200/50'
 : 'bg-blue-50/50 border-blue-200/50'
 }

 // Overdue: past date with incomplete todos → vivid red
 const isOverdue = day.date < todayStr.value && day.data && day.data.completed < day.data.total
 if (isOverdue) {
 completionClass = 'bg-red-500/20 border-red-500/50'
 }

 // Manage mode: if custom override, add ring
 const overrideRing = isManageMode.value && store.calendarDays[day.date]
 ? 'ring-2 ring-primary/30'
 : ''

 return `${base} ${manageHover} ${completionClass} ${overrideRing} border`
}

function countBadgeClass(data, dateStr) {
 if (!data) return ''
 if (dateStr && dateStr < todayStr.value && data.completed < data.total) {
 return 'bg-red-500/30 text-red-600 text-red-400'
 }
 if (data.completed === data.total) return 'bg-green-500/20 text-green-600 text-green-400'
 if (data.completed> 0) return 'bg-amber-500/20 text-amber-600 text-amber-400'
 return 'bg-surface-tertiary bg-control text-content-tertiary'
}

function prevMonth() {
 if (currentMonth.value === 1) {
 currentMonth.value = 12
 currentYear.value--
 } else {
 currentMonth.value--
 }
}

function nextMonth() {
 if (currentMonth.value === 12) {
 currentMonth.value = 1
 currentYear.value++
 } else {
 currentMonth.value++
 }
}

async function handleDayClick(day) {
 if (!day.date || !day.isCurrentMonth) return

 if (isManageMode.value) {
 await store.toggleDayType(day.date)
 } else {
 await selectDate(day.date)
 }
}

async function selectDate(date) {
 selectedDate.value = date
 const todos = await db.getTodosByDate(date)
 for (const todo of todos) {
 todo.tags = await db.getTodoTags(todo.id)
 }
 selectedDateTodos.value = todos
}

const selectedDateType = computed(() => {
 if (!selectedDate.value) return 'workday'
 return getDayType(selectedDate.value)
})

onMounted(() => {
 store.loadCalendarCounts(currentYear.value, currentMonth.value)
})

watch([currentYear, currentMonth], () => {
 store.loadCalendarCounts(currentYear.value, currentMonth.value)
})
</script>
