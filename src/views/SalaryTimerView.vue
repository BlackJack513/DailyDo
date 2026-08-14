<template>
  <div class="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
    <!-- Content -->
    <div class="relative z-20 flex-1 flex flex-col items-center justify-center px-8 py-12">
      <!-- Icon -->
      <div class="text-7xl mb-6"></div>

      <!-- Main heading -->
      <h1 class="text-3xl font-bold text-content mb-3 text-center">
        秒薪计时器
      </h1>

      <!-- Sub message -->
      <p class="text-lg text-content-secondary text-muted text-center mb-8 max-w-md leading-relaxed">
        看着你的收入每秒都在增长，感受赚钱的快乐
      </p>

      <!-- Salary input (when not set) -->
      <div v-if="!monthlySalary" class="w-full max-w-sm mb-6">
        <div class="bg-surface/80 backdrop-blur rounded-2xl shadow-lg border border-emerald-200 border-divider px-6 py-5 text-center">
          <p class="text-sm text-content-tertiary mb-3">设置你的月薪，开始计时</p>
          <div class="flex items-center justify-center gap-2 mb-4">
            <span class="text-2xl text-content-secondary">¥</span>
            <input
              v-model.number="inputSalary"
              type="number"
              min="0"
              step="100"
              placeholder="10000"
              class="w-40 text-center text-2xl font-bold text-emerald-600 bg-transparent border-b-2 border-emerald-300 focus:border-emerald-500 outline-none py-1"
              @keyup.enter="saveSalary"
            />
          </div>
          <button
            @click="saveSalary"
            class="px-6 py-2 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-md"
          >
            开始计时
          </button>
        </div>
      </div>

      <!-- Timer display (when salary is set) -->
      <div v-else class="w-full max-w-lg space-y-6">
        <!-- Per-second rate card -->
        <div class="bg-surface/80 backdrop-blur rounded-2xl shadow-lg border border-emerald-200 border-divider px-6 py-5 text-center">
          <div class="flex items-center justify-center gap-1.5 mb-2">
            <span class="text-lg">⚡</span>
            <p class="text-sm text-content-tertiary">每秒收入</p>
          </div>
          <div class="flex items-baseline justify-center gap-1">
            <span class="text-lg text-content-secondary">¥</span>
            <span class="text-4xl font-bold text-emerald-500">{{ perSecondRate }}</span>
          </div>
          <p class="text-xs text-content-tertiary mt-2">月薪 ¥{{ monthlySalary.toLocaleString() }} ÷ {{ daysInMonth }}天 ÷ 24h ÷ 60m ÷ 60s</p>
        </div>

        <!-- Accumulated earnings card -->
        <div class="bg-surface/80 backdrop-blur rounded-2xl shadow-lg border border-amber-200 border-divider px-6 py-5 text-center">
          <div class="flex items-center justify-center gap-1.5 mb-2">
            <span class="text-lg">💰</span>
            <p class="text-sm text-content-tertiary">本月已赚取</p>
          </div>
          <div class="flex items-baseline justify-center gap-1">
            <span class="text-lg text-content-secondary">¥</span>
            <span class="text-5xl font-bold text-amber-500 tabular-nums">{{ accumulatedEarnings }}</span>
          </div>
          <p class="text-xs text-content-tertiary mt-2">从 {{ monthStartLabel }} 开始累计</p>
        </div>

        <!-- Month progress -->
        <div class="bg-surface/80 backdrop-blur rounded-2xl shadow-lg border border-blue-200 border-divider px-6 py-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-content-tertiary">本月进度</span>
            <span class="text-sm font-medium text-blue-500">{{ monthProgress }}%</span>
          </div>
          <div class="w-full bg-control rounded-full h-2.5">
            <div
              class="bg-gradient-to-r from-blue-400 to-blue-500 h-2.5 rounded-full transition-all duration-1000"
              :style="{ width: monthProgress + '%' }"
            ></div>
          </div>
          <div class="flex justify-between mt-1.5">
            <span class="text-xs text-content-tertiary">{{ monthStartLabel }}</span>
            <span class="text-xs text-content-tertiary">{{ monthEndLabel }}</span>
          </div>
        </div>

        <!-- Stats row -->
        <div class="flex gap-3">
          <div class="flex-1 bg-surface/80 backdrop-blur rounded-xl shadow border border-green-200 border-divider px-4 py-3 text-center">
            <p class="text-xs text-content-tertiary mb-1">今日已赚</p>
            <p class="text-xl font-bold text-green-500 tabular-nums">¥{{ todayEarnings }}</p>
          </div>
          <div class="flex-1 bg-surface/80 backdrop-blur rounded-xl shadow border border-purple-200 border-divider px-4 py-3 text-center">
            <p class="text-xs text-content-tertiary mb-1">剩余天数</p>
            <p class="text-xl font-bold text-purple-500">{{ remainingDays }}<span class="text-sm ml-0.5">天</span></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings button (bottom-right corner) -->
    <button
      v-if="monthlySalary"
      @click="showSettings = true"
      class="absolute bottom-5 right-5 z-30 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface/80 backdrop-blur border border-emerald-200/60 border-divider/60 text-content-secondary text-muted hover:text-emerald-600 hover:border-emerald-300 hover:text-emerald-400 transition-all shadow-md hover:shadow-lg text-sm font-medium"
      title="修改月薪"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span>修改月薪</span>
    </button>

    <!-- Salary Settings Modal -->
    <div v-if="showSettings" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showSettings = false"></div>
      <div class="relative bg-surface rounded-2xl shadow-2xl border border-border w-80 p-6">
        <h3 class="text-lg font-semibold text-content mb-4">修改月薪</h3>
        <p class="text-sm text-content-secondary text-muted mb-3">输入你的税前月薪（元）</p>
        <div class="flex items-center gap-3 mb-4">
          <span class="text-xl text-content-secondary">¥</span>
          <input
            v-model.number="inputSalary"
            type="number"
            min="0"
            step="100"
            class="input-field flex-1 text-center text-lg font-bold"
            @keyup.enter="saveSalary"
          />
        </div>
        <div class="flex justify-end gap-2">
          <button @click="clearSalary" class="btn-secondary text-red-500 hover:text-red-600">清除</button>
          <button @click="showSettings = false" class="btn-secondary">取消</button>
          <button @click="saveSalary" class="btn-primary">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as db from '../utils/db'

const showSettings = ref(false)
const monthlySalary = ref(0)
const inputSalary = ref(10000)
const now = ref(new Date())
let timerId = null

// ─── Date helpers ───────────────────────────────────────
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

const currentYear = computed(() => now.value.getFullYear())
const currentMonth = computed(() => now.value.getMonth() + 1)
const daysInMonth = computed(() => getDaysInMonth(currentYear.value, currentMonth.value))

const monthStartLabel = computed(() => `${currentYear.value}年${currentMonth.value}月1日`)
const monthEndLabel = computed(() => `${currentYear.value}年${currentMonth.value}月${daysInMonth.value}日`)

// ─── Per-second rate ────────────────────────────────────
const perSecondRate = computed(() => {
  if (!monthlySalary.value) return '0.000'
  const rate = monthlySalary.value / daysInMonth.value / 24 / 60 / 60
  return rate.toFixed(3)
})

// ── Accumulated earnings ───────────────────────────────
const accumulatedEarnings = computed(() => {
  if (!monthlySalary.value) return '0.000'
  const nowDate = now.value
  const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1, 0, 0, 0)
  const elapsedSeconds = (nowDate - monthStart) / 1000
  const rate = monthlySalary.value / daysInMonth.value / 24 / 60 / 60
  const earned = elapsedSeconds * rate
  return earned.toFixed(3)
})

// ─── Today earnings ─────────────────────────────────────
const todayEarnings = computed(() => {
  if (!monthlySalary.value) return '0.000'
  const nowDate = now.value
  const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0)
  const elapsedToday = (nowDate - todayStart) / 1000
  const rate = monthlySalary.value / daysInMonth.value / 24 / 60 / 60
  return (elapsedToday * rate).toFixed(3)
})

// ─── Month progress ─────────────────────────────────────
const monthProgress = computed(() => {
  const nowDate = now.value
  const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1, 0, 0, 0)
  const monthEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0, 23, 59, 59)
  const totalSeconds = (monthEnd - monthStart) / 1000
  const elapsedSeconds = (nowDate - monthStart) / 1000
  return Math.min(100, (elapsedSeconds / totalSeconds * 100)).toFixed(1)
})

// ─── Remaining days ─────────────────────────────────────
const remainingDays = computed(() => {
  const nowDate = now.value
  const lastDay = getDaysInMonth(nowDate.getFullYear(), nowDate.getMonth() + 1)
  return lastDay - nowDate.getDate()
})

// ─── Salary persistence ─────────────────────────────────
async function loadSalary() {
  try {
    const raw = await db.getSetting('salary_timer_monthly')
    if (raw) {
      const val = parseFloat(JSON.parse(raw))
      if (val > 0) {
        monthlySalary.value = val
        inputSalary.value = val
      }
    }
  } catch {
    /* use default */
  }
}

async function saveSalary() {
  let salary = inputSalary.value
  if (!salary || salary <= 0) {
    salary = 10000
  }
  inputSalary.value = salary
  monthlySalary.value = salary
  await db.setSetting('salary_timer_monthly', JSON.stringify(salary))
  showSettings.value = false
}

async function clearSalary() {
  monthlySalary.value = 0
  inputSalary.value = 10000
  try {
    await db.setSetting('salary_timer_monthly', JSON.stringify(0))
  } catch {
    /* ignore */
  }
  showSettings.value = false
}

// ─── Timer tick ─────────────────────────────────────────
function tick() {
  now.value = new Date()
}

// ─── Lifecycle ─────────────────────────────────────────
onMounted(async () => {
  await loadSalary()
  tick()
  timerId = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
})
</script>
