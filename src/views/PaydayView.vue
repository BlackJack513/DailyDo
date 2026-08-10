<template>
 <div class="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
 <!-- Confetti Canvas -->
 <canvas ref="confettiCanvas" class="absolute inset-0 z-10 pointer-events-none"></canvas>

 <!-- Content -->
 <div class="relative z-20 flex-1 flex flex-col items-center justify-center px-8 py-12">
 <!-- Emoji / Icon -->
 <div class="text-7xl mb-6 animate-bounce">
 {{ isPayday ? '💰' : '🎉' }}
 </div>

 <!-- Main heading -->
 <h1 class="text-3xl font-bold text-content mb-3 text-center">
 {{ mainHeading }}
 </h1>

 <!-- Sub message -->
 <p class="text-lg text-content-secondary text-muted text-center mb-8 max-w-md leading-relaxed">
 {{ subMessage }}
 </p>

 <!-- Countdown cards row -->
 <div class="flex flex-wrap justify-center gap-4 mb-8 w-full max-w-xl">
 <!-- Payday countdown card -->
 <div v-if="!isPayday" class="flex-1 min-w-[200px] bg-surface/80 backdrop-blur rounded-2xl shadow-lg border border-amber-200 border-divider px-6 py-5 text-center">
 <div class="flex items-center justify-center gap-1.5 mb-2">
 <span class="text-lg">💰</span>
 <p class="text-sm text-content-tertiary">距离发薪日还有</p>
 </div>
 <div class="flex items-baseline justify-center gap-1">
 <span class="text-5xl font-bold text-amber-500">{{ daysUntilPayday }}</span>
 <span class="text-lg text-content-secondary text-muted ml-1">天</span>
 </div>
 <p class="text-xs text-content-tertiary mt-2">
 每月 {{ paydayDay }} 号发工资
 </p>
 </div>

 <!-- Payday celebration card -->
 <div v-else class="flex-1 min-w-[200px] bg-surface/80 backdrop-blur rounded-2xl shadow-lg border border-green-200 border-divider px-6 py-5 text-center">
 <p class="text-xl font-bold text-green-500 mb-1">今天就是发薪日！</p>
 <p class="text-xs text-content-secondary text-muted">
 辛苦了一个月，劳自己吧
 </p>
 </div>

 <!-- Rest day countdown card -->
 <div class="flex-1 min-w-[200px] bg-surface/80 backdrop-blur rounded-2xl shadow-lg border border-blue-200 border-divider px-6 py-5 text-center">
 <div class="flex items-center justify-center gap-1.5 mb-2">
 <span class="text-lg">🏖️</span>
 <p class="text-sm text-content-tertiary">距离下一个休息日还有</p>
 </div>
 <div class="flex items-baseline justify-center gap-1">
 <span class="text-5xl font-bold text-blue-500">{{ daysUntilRestDay }}</span>
 <span class="text-lg text-content-secondary text-muted ml-1">天</span>
 </div>
 <p class="text-xs text-content-tertiary mt-2">
 {{ restDayLabel }}
 </p>
 </div>
 </div>

 <!-- Encouragement tips -->
 <div class="flex flex-wrap justify-center gap-2 max-w-lg">
 <span
 v-for="(tip, i) in tips"
 :key="i"
 class="px-3 py-1.5 rounded-full text-xs font-medium bg-surface/60 text-content-secondary text-muted border border-border/50 border-divider/50"
>
 {{ tip }}
 </span>
 </div>
 </div>

 <!-- Settings button (bottom-right corner) -->
 <button
 @click="showSettings = true"
 class="absolute bottom-5 right-5 z-30 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface/80 backdrop-blur border border-amber-200/60 border-divider/60 text-content-secondary text-muted hover:text-amber-600 hover:border-amber-300 hover:text-amber-400 transition-all shadow-md hover:shadow-lg text-sm font-medium"
 title="设置发薪日"
>
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
 </svg>
 <span>设置发薪日</span>
 </button>

 <!-- Payday Settings Modal -->
 <div v-if="showSettings" class="fixed inset-0 z-50 flex items-center justify-center">
 <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showSettings = false"></div>
 <div class="relative bg-surface rounded-2xl shadow-2xl border border-border w-80 p-6">
 <h3 class="text-lg font-semibold text-content mb-4">设置发薪日</h3>
 <p class="text-sm text-content-secondary text-muted mb-3">每月几号发工资？</p>
 <div class="flex items-center gap-3 mb-4">
 <input
 v-model.number="settingsDay"
 type="number"
 min="1"
 max="31"
 class="input-field w-24 text-center text-lg font-bold"
 />
 <span class="text-content-secondary text-muted">号</span>
 </div>
 <div class="flex justify-end gap-2">
 <button @click="showSettings = false" class="btn-secondary">取消</button>
 <button @click="savePaydayDay" class="btn-primary">保存</button>
 </div>
 </div>
 </div>
 </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../stores/app'
import * as db from '../utils/db'

const store = useAppStore()
const confettiCanvas = ref(null)
const showSettings = ref(false)
const paydayDay = ref(5)
const settingsDay = ref(5)
const confettiActive = ref(true)
let animFrameId = null

// ─── Date helpers ───────────────────────────────────────
const today = new Date()
const todayStr = computed(() => formatDate(today))

function formatDate(d) {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, '0')
 const day = String(d.getDate()).padStart(2, '0')
 return `${y}-${m}-${day}`
}

function addDays(d, n) {
 const result = new Date(d)
 result.setDate(result.getDate() + n)
 return result
}

// ─── Payday calculation ─────────────────────────────────
const isPayday = computed(() => today.getDate() === paydayDay.value)

const daysUntilPayday = computed(() => {
 const now = new Date()
 const day = paydayDay.value
 let target = new Date(now.getFullYear(), now.getMonth(), day)
 if (target <= now) {
 target = new Date(now.getFullYear(), now.getMonth() + 1, day)
 }
 const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
 return diff
})

// ─── Rest day calculation ───────────────────────────────
const daysUntilRestDay = ref(0)
const restDayLabel = ref('')
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

async function calcNextRestDay() {
 const now = new Date()
 // Load calendar data for current and next month
 const year = now.getFullYear()
 const month = now.getMonth() + 1
 try {
 await store.loadCalendarDays(year, month)
 const nextMonth = month === 12 ? 1 : month + 1
 const nextYear = month === 12 ? year + 1 : year
 await store.loadCalendarDays(nextYear, nextMonth)
 } catch (e) {
 console.error('Failed to load calendar days:', e)
 }

 // Search from tomorrow up to 14 days ahead
 for (let i = 1; i <= 14; i++) {
 const d = addDays(now, i)
 const dateStr = formatDate(d)
 const dayType = store.getDayType(dateStr)
 if (dayType === 'rest') {
 daysUntilRestDay.value = i
 const m = d.getMonth() + 1
 const day = d.getDate()
 restDayLabel.value = `${m}月${day}日 ${weekdays[d.getDay()]}`
 return
 }
 }

 // Fallback: if no rest day found in 14 days (shouldn't happen normally)
 daysUntilRestDay.value = 0
 restDayLabel.value = '近期无休息日'
}

// ─── Messages ──────────────────────────────────────────
const mainHeading = computed(() => {
 if (isPayday.value) {
 return '发工资啦！'
 }
 const tips = [
 '今天也在努力上班呢',
 '每一份努力都不会白费',
 '坚持就是胜利',
 '你是最棒的打工人',
 '加油，离发薪日又近了一步',
 ]
 return tips[Math.floor(Math.random() * tips.length)]
})

const subMessage = computed(() => {
 if (isPayday.value) {
 return '辛苦了一个月，终于等到这一天！好好享受属于你的收获吧，你值得这一切。'
 }
 return '认真工作的你闪闪发光，再坚持一下，美好的事情正在路上。'
})

const tips = computed(() => {
 const allTips = [
 '按时吃饭', '多喝水', '适当休息', '保持微笑',
 '今天也要开心', '努力会有回报', '你很棒', '坚持就是胜利',
 '劳逸结合', '保持好心情', '专注当下', '享受过程',
 ]
 const shuffled = [...allTips].sort(() => Math.random() - 0.5)
 return shuffled.slice(0, 4)
})

// ─── Confetti animation ─────────────────────────────────
const PARTICLE_COUNT = 120
const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316']

let particles = []

function createParticles() {
 const canvas = confettiCanvas.value
 if (!canvas) return
 const w = canvas.width
 const h = canvas.height
 particles = []
 for (let i = 0; i < PARTICLE_COUNT; i++) {
 particles.push({
 x: Math.random() * w,
 y: -20 - Math.random() * h * 0.5,
 vx: (Math.random() - 0.5) * 3,
 vy: 1 + Math.random() * 3,
 size: 4 + Math.random() * 6,
 color: COLORS[Math.floor(Math.random() * COLORS.length)],
 rotation: Math.random() * 360,
 rotationSpeed: (Math.random() - 0.5) * 10,
 shape: Math.random()> 0.5 ? 'rect' : 'circle',
 opacity: 1,
 })
 }
}

function drawConfetti() {
 const canvas = confettiCanvas.value
 if (!canvas) return
 const ctx = canvas.getContext('2d')
 const w = canvas.width
 const h = canvas.height

 ctx.clearRect(0, 0, w, h)

 let alive = false
 for (const p of particles) {
 p.x += p.vx
 p.y += p.vy
 p.vy += 0.04
 p.rotation += p.rotationSpeed
 p.vx *= 0.99

 if (p.y> h + 20) {
 p.opacity -= 0.02
 }

 if (p.opacity <= 0) continue
 alive = true

 ctx.save()
 ctx.translate(p.x, p.y)
 ctx.rotate((p.rotation * Math.PI) / 180)
 ctx.globalAlpha = Math.max(0, p.opacity)
 ctx.fillStyle = p.color

 if (p.shape === 'rect') {
 ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
 } else {
 ctx.beginPath()
 ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
 ctx.fill()
 }
 ctx.restore()
 }

 if (alive && confettiActive.value) {
 animFrameId = requestAnimationFrame(drawConfetti)
 } else {
 ctx.clearRect(0, 0, w, h)
 }
}

function resizeCanvas() {
 const canvas = confettiCanvas.value
 if (!canvas) return
 canvas.width = canvas.parentElement.clientWidth
 canvas.height = canvas.parentElement.clientHeight
}

function startConfetti() {
 resizeCanvas()
 createParticles()
 confettiActive.value = true
 drawConfetti()
}

function stopConfetti() {
 confettiActive.value = false
 if (animFrameId) {
 cancelAnimationFrame(animFrameId)
 animFrameId = null
 }
}

// ─── Payday settings persistence ────────────────────────
async function loadPaydayDay() {
 try {
 const raw = await db.getSetting('payday_day')
 if (raw) {
 const val = parseInt(JSON.parse(raw), 10)
 if (val>= 1 && val <= 31) {
 paydayDay.value = val
 settingsDay.value = val
 }
 }
 } catch { /* use default */ }
}

async function savePaydayDay() {
 let day = settingsDay.value
 if (day < 1) day = 1
 if (day> 31) day = 31
 settingsDay.value = day
 paydayDay.value = day
 await db.setSetting('payday_day', JSON.stringify(day))
 showSettings.value = false
 stopConfetti()
 setTimeout(startConfetti, 100)
}

// ─── Lifecycle ─────────────────────────────────────────
onMounted(async () => {
 await loadPaydayDay()
 await calcNextRestDay()
 startConfetti()
 window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
 stopConfetti()
 window.removeEventListener('resize', resizeCanvas)
})
</script>
