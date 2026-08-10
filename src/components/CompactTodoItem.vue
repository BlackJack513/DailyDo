<template>
 <div
 @dblclick="$emit('detail', { todo, x: $event.clientX, y: $event.clientY })"
 @mousedown="dragMousedown ? dragMousedown($event, todo) : undefined"
 class="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface transition-colors"
 :class="[ { 'opacity-60': todo.status === 'done' }, dragging ? 'opacity-40 cursor-grabbing select-none' : (dragMousedown ? 'cursor-grab' : '') ]"
>
 <!-- Status toggle -->
 <button
 @click="$emit('toggle', todo)"
 class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
 :class="statusClass"
>
 <svg v-if="todo.status === 'done'" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
 <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
 </svg>
 <div v-else-if="todo.status === 'in_progress'" class="w-2 h-2 rounded-full bg-blue-500"></div>
 </button>

 <!-- Content -->
 <div class="flex-1 min-w-0">
 <p
 class="text-sm font-medium leading-tight truncate"
 :class="{ 'line-through text-content-tertiary': todo.status === 'done' }"
>
 {{ todo.title }}
 </p>
 <div class="flex items-center gap-1.5 mt-1">
 <!-- Priority dot -->
 <span class="w-1.5 h-1.5 rounded-full" :class="priorityDot"></span>
 <!-- Tags (max 2) -->
 <span
 v-for="tag in (todo.tags || []).slice(0, 2)"
 :key="tag.id"
 class="text-[10px] px-1.5 py-0.5 rounded-full"
 :style="{ backgroundColor: tag.color + '20', color: tag.color }"
>
 {{ tag.name }}
 </span>
 <span v-if="(todo.tags || []).length> 2" class="text-[10px] text-content-tertiary">
 +{{ todo.tags.length - 2 }}
 </span>
 <!-- Step progress -->
 <span v-if="todo.steps && todo.steps.length> 0" class="text-[10px] flex items-center gap-0.5">
 <svg class="w-3 h-3 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
 </svg>
 <span :class="stepProgressClass">{{ stepCompletedCount }}/{{ todo.steps.length }}</span>
 </span>
 </div>
 </div>

 <!-- Actions -->
 <div class="flex items-center gap-0.5">
 <button @click="$emit('edit', todo)" class="p-1 rounded-lg hover:bg-surface-tertiary text-content-tertiary hover:text-content transition-colors">
 <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
 </svg>
 </button>
 <button @click="$emit('delete', todo)" class="p-1 rounded-lg hover:bg-red-50 hover:bg-red-50/20 text-content-tertiary hover:text-red-500 transition-colors">
 <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
 </svg>
 </button>
 </div>
 </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
 todo: { type: Object, required: true },
 dragMousedown: { type: Function, default: null },
 dragging: { type: Boolean, default: false },
})

defineEmits(['toggle', 'edit', 'delete', 'detail'])

const statusClass = computed(() => {
 if (props.todo.status === 'done') return 'bg-green-500 border-green-500'
 if (props.todo.status === 'in_progress') return 'border-blue-400 bg-blue-50'
 return 'border-border hover:border-primary'
})

const priorityDot = computed(() => {
 const map = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500' }
 return map[props.todo.priority] || 'bg-amber-500'
})

const stepCompletedCount = computed(() => {
 if (!props.todo.steps) return 0
 return props.todo.steps.filter(s => s.completed).length
})

const stepProgressClass = computed(() => {
 if (!props.todo.steps || props.todo.steps.length === 0) return 'text-content-tertiary'
 const done = props.todo.steps.filter(s => s.completed).length
 if (done === props.todo.steps.length) return 'text-green-500'
 if (done> 0) return 'text-primary'
 return 'text-content-tertiary'
})
</script>
