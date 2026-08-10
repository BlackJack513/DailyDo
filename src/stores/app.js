import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as db from '../utils/db'

export const useAppStore = defineStore('app', () => {
  // Theme
  const theme = ref('light')

  // Tags
  const tags = ref([])

  // Todos for current date
  const currentTodos = ref([])
  const currentDate = ref(formatDate(new Date()))

  // Calendar data
  const calendarCounts = ref({})
  const calendarDays = ref({}) // { 'YYYY-MM-DD': 'workday'|'rest' } — only custom overrides

  // Trash
  const trashTodos = ref([])

  // Incomplete todos (across all dates)
  const incompleteTodos = ref([])

  // Mini mode
  const isMiniMode = ref(false)
  const pendingQuickAdd = ref(null) // { title, priority, tagIds } from mini mode expand
  const pendingEditTodo = ref(null) // todo object from mini mode edit

  // Background image
  const backgroundImage = ref('')

  // Settings loaded flag
  const settingsLoaded = ref(false)

  // Sidebar config: ordered array of { id, visible }
  const defaultSidebarModules = [
    { id: 'today', visible: true },
    { id: 'calendar', visible: true },
    { id: 'analytics', visible: true },
    { id: 'gantt', visible: true },
    { id: 'tags', visible: true },
    { id: 'recurrences', visible: true },
    { id: 'templates', visible: true },
    { id: 'attachments', visible: true },
    { id: 'payday', visible: false },
    { id: 'trash', visible: true },
    { id: 'settings', visible: true },
  ]
  const sidebarConfig = ref(defaultSidebarModules.map(item => ({ ...item })))

  // Stats
  const overviewStats = ref({
    today_total: 0,
    today_completed: 0,
    week_total: 0,
    week_completed: 0,
    pending_count: 0,
    streak_days: 0,
    trash_count: 0,
  })

  // Computed
  const pendingTodos = computed(() => currentTodos.value.filter(t => t.status !== 'done'))
  const doneTodos = computed(() => currentTodos.value.filter(t => t.status === 'done'))

  // Available themes
  const themes = [
    { id: 'light', name: '默认浅色', color: '#6366f1' },
    { id: 'dark', name: '默认深色', color: '#818cf8' },
    { id: 'forest', name: '翠影', color: '#16a34a' },
    { id: 'twilight', name: '紫韵', color: '#9333ea' },
    { id: 'blossom', name: '粉黛', color: '#ec4899' },
    { id: 'ink', name: '墨染', color: '#52AAB6' },
    { id: 'dawn', name: '晨曦', color: '#E88C26' },
    { id: 'seafoam', name: '海雾', color: '#4882AA' },
    { id: 'bamboo', name: '竹影', color: '#628C4E' },
    { id: 'starry', name: '星夜', color: '#9B87EB' },
    { id: 'coffee', name: '咖啡时光', color: '#A56937' },
  ]

  // Dark themes that need the `dark` class for Tailwind
  const darkThemes = ['dark', 'ink', 'starry']

  // ─── Theme ──────────────────────────────────────────
  function applyTheme() {
    const isDarkTheme = darkThemes.includes(theme.value)
    document.documentElement.setAttribute('data-theme', theme.value)
    if (isDarkTheme) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const isDarkTheme = computed(() => darkThemes.includes(theme.value))

  async function setTheme(newTheme) {
    theme.value = newTheme
    applyTheme()
    await db.setSetting('theme', theme.value)
  }

  async function toggleTheme() {
    const next = theme.value === 'dark' ? 'light' : 'dark'
    await setTheme(next)
  }

  async function loadSettings() {
    // Load each setting independently — one failure must not block others
    try {
      const t = await db.getSetting('theme')
      if (t) theme.value = JSON.parse(t)
    } catch (e) {
      console.error('Failed to load theme:', e)
    }

    try {
      const bg = await db.getSetting('background_image')
      if (bg) backgroundImage.value = JSON.parse(bg)
    } catch (e) {
      console.error('Failed to load background_image:', e)
    }

    await loadSidebarConfig()
    settingsLoaded.value = true
  }

  // ─── Sidebar Config ─────────────────────────────────
  async function loadSidebarConfig() {
    try {
      const raw = await db.getSetting('sidebar_config')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Validate items have { id, visible } shape
          const valid = parsed.every(item => item && typeof item.id === 'string' && typeof item.visible === 'boolean')
          if (valid) {
            // Merge: add any default modules missing from saved config (e.g. new modules)
            const existingIds = new Set(parsed.map(item => item.id))
            const merged = [...parsed]
            for (const def of defaultSidebarModules) {
              if (!existingIds.has(def.id)) {
                merged.push({ id: def.id, visible: def.visible })
              }
            }
            sidebarConfig.value = merged
            return
          } else {
            console.warn('Sidebar config has invalid format, resetting to defaults')
          }
        }
      }
      // No saved config or invalid — use defaults and persist them
      sidebarConfig.value = defaultSidebarModules.map(item => ({ ...item }))
      await db.setSetting('sidebar_config', JSON.stringify(sidebarConfig.value))
    } catch (e) {
      console.error('Failed to load sidebar config:', e)
      // Keep defaults on error
    }
  }

  async function saveSidebarConfig(config) {
    sidebarConfig.value = config
    try {
      await db.setSetting('sidebar_config', JSON.stringify(config))
    } catch (e) {
      console.error('Failed to save sidebar config:', e)
      throw e
    }
  }

  // ─── Tags ───────────────────────────────────────────
  async function loadTags() {
    tags.value = await db.getAllTags()
  }

  async function addTag(tag) {
    const created = await db.createTag(tag)
    await loadTags()
    return created
  }

  async function editTag(tag) {
    await db.updateTag(tag)
    await loadTags()
  }

  async function removeTag(id) {
    await db.deleteTag(id)
    await loadTags()
  }

  // ─── Todos ──────────────────────────────────────────
  async function loadTodosForDate(date) {
    currentDate.value = date
    currentTodos.value = await db.getTodosByDate(date)
    // Load tags and steps for each todo
    for (const todo of currentTodos.value) {
      todo.tags = await db.getTodoTags(todo.id)
      todo.steps = await db.getStepsByTodoId(todo.id)
    }
  }

  async function addTodo(todo) {
    const created = await db.createTodo(todo)
    created.tags = []
    if (todo.tagIds && todo.tagIds.length > 0) {
      await db.setTodoTags(created.id, todo.tagIds)
      created.tags = await db.getTodoTags(created.id)
    }
    // Save steps if provided
    if (todo.steps && todo.steps.length > 0) {
      created.steps = await db.saveTodoSteps(created.id, todo.steps)
    } else {
      created.steps = []
    }
    // Handle recurrence
    if (todo.recurrence_type && todo.recurrence_type !== 'none') {
      created.recurrence_type = todo.recurrence_type
      created.recurrence_config = todo.recurrence_config
    }
    await loadTodosForDate(currentDate.value)
    return created
  }

  async function updateTodo(todo) {
    const oldStatus = currentTodos.value.find(t => t.id === todo.id)?.status
    await db.updateTodo(todo)
    // BUG FIX: Always update tags when editing a todo
    if (todo.tagIds) {
      await db.setTodoTags(todo.id, todo.tagIds)
    }
    // Save steps if provided (always overwrite)
    if (todo.steps !== undefined) {
      await db.saveTodoSteps(todo.id, todo.steps || [])
    }
    // Handle recurrence: if status changed to done and it's recurring
    if (todo.status === 'done' && oldStatus !== 'done' && todo.recurrence_type && todo.recurrence_type !== 'none') {
      await createNextRecurrence(todo)
    }
    await loadTodosForDate(currentDate.value)
  }

  async function removeTodo(id) {
    // Soft delete: move to trash
    await db.deleteTodo(id)
    await loadTodosForDate(currentDate.value)
    await loadOverviewStats()
  }

  async function toggleTodoStatus(todo) {
    const nextStatus = todo.status === 'pending' ? 'in_progress' : todo.status === 'in_progress' ? 'blocked' : todo.status === 'blocked' ? 'done' : 'pending'
    await updateTodo({ ...todo, status: nextStatus })
  }

  // ─── Steps ─────────────────────────────────────────
  async function toggleStep(stepId) {
    const result = await db.toggleStepCompleted(stepId)
    // Reload todos to reflect status changes (auto-complete)
    await loadTodosForDate(currentDate.value)
    await loadIncompleteTodos()
    await loadOverviewStats()
    return result
  }

  async function loadIncompleteTodos() {
    incompleteTodos.value = await db.getIncompleteTodos()
    for (const todo of incompleteTodos.value) {
      todo.tags = await db.getTodoTags(todo.id)
      todo.steps = await db.getStepsByTodoId(todo.id)
    }
  }

  async function createNextRecurrence(todo) {
    // Check if recurrence is enabled for this group
    if (todo.recurrence_enabled === false) return

    const config =
      typeof todo.recurrence_config === 'string'
        ? JSON.parse(todo.recurrence_config || '{}')
        : todo.recurrence_config || {}
    const currentDateObj = new Date(todo.todo_date)
    let nextDate = new Date(currentDateObj)

    switch (todo.recurrence_type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1)
        break
      case 'workday': {
        nextDate.setDate(nextDate.getDate() + 1)
        // Skip non-workdays using custom calendar
        while (!(await db.isWorkday(formatDate(nextDate)))) {
          nextDate.setDate(nextDate.getDate() + 1)
        }
        break
      }
      case 'weekly': {
        nextDate.setDate(nextDate.getDate() + 7)
        break
      }
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
    }

    const nextDateStr = formatDate(nextDate)
    const groupId = todo.recurrence_group_id || `rec_${Date.now()}`

    // IMPORTANT: Update the original todo to have the group_id
    // This ensures the original is linked to the group and can be toggled/deleted
    if (!todo.recurrence_group_id) {
      await db.updateTodo({
        ...todo,
        recurrence_group_id: groupId,
      })
    }

    // Deduplication: check if a todo with same title+date+group already exists
    const existingTodos = await db.getTodosByDate(nextDateStr)
    const duplicate = existingTodos.find(
      t => t.title === todo.title && t.recurrence_group_id === groupId && t.deleted_at == null,
    )
    if (duplicate) {
      // Already exists, skip creation but still copy tags if needed
      if (todo.tags && todo.tags.length > 0) {
        const existingTags = await db.getTodoTags(duplicate.id)
        const existingTagIds = existingTags.map(t => t.id)
        const newTagIds = todo.tags.map(t => t.id).filter(id => !existingTagIds.includes(id))
        if (newTagIds.length > 0) {
          await db.setTodoTags(duplicate.id, [...existingTagIds, ...newTagIds])
        }
      }
      // Copy steps to duplicate if it doesn't have any yet
      if (todo.steps && todo.steps.length > 0) {
        const existingSteps = await db.getStepsByTodoId(duplicate.id)
        if (existingSteps.length === 0) {
          const newSteps = todo.steps.map(s => ({
            title: s.title,
            completed: false,
            sort_order: s.sort_order || 0,
          }))
          await db.saveTodoSteps(duplicate.id, newSteps)
        }
      }
      return
    }

    // Create the next occurrence
    const created = await db.createTodo({
      title: todo.title,
      notes: todo.notes || '',
      status: 'pending',
      priority: todo.priority || 'medium',
      due_date: todo.due_date || null,
      todo_date: nextDateStr,
      recurrence_type: todo.recurrence_type,
      recurrence_config: JSON.stringify(config),
      recurrence_group_id: groupId,
      recurrence_enabled: todo.recurrence_enabled !== false,
    })

    // Copy tags
    if (todo.tags && todo.tags.length > 0) {
      const tagIds = todo.tags.map(t => t.id)
      await db.setTodoTags(created.id, tagIds)
    }

    // Copy steps (reset completed to false for the new occurrence)
    if (todo.steps && todo.steps.length > 0) {
      const newSteps = todo.steps.map(s => ({
        title: s.title,
        completed: false,
        sort_order: s.sort_order || 0,
      }))
      await db.saveTodoSteps(created.id, newSteps)
    }
  }

  // ─── Trash ──────────────────────────────────────────
  async function loadTrash() {
    trashTodos.value = await db.getTrashTodos()
    for (const todo of trashTodos.value) {
      todo.tags = await db.getTodoTags(todo.id)
    }
  }

  async function restoreFromTrash(id) {
    await db.restoreTodo(id)
    await loadTrash()
    await loadOverviewStats()
    await loadTodosForDate(currentDate.value)
  }

  async function permanentDelete(id) {
    await db.permanentDeleteTodo(id)
    await loadTrash()
    await loadOverviewStats()
  }

  async function emptyTrash() {
    await db.clearTrash()
    await loadTrash()
    await loadOverviewStats()
  }

  // ─── Calendar ───────────────────────────────────────
  async function loadCalendarCounts(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const counts = await db.getDailyCounts(startDate, endDate)
    const map = {}
    counts.forEach(c => {
      map[c.date] = { total: c.total, completed: c.completed }
    })
    calendarCounts.value = map
    // Also load custom day types for the same range
    await loadCalendarDays(year, month)
  }

  async function loadCalendarDays(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const days = await db.getCalendarDays(startDate, endDate)
    const map = {}
    days.forEach(d => {
      map[d.date] = d.day_type
    })
    calendarDays.value = map
  }

  // Get effective day type: custom override or default (Mon-Fri=workday, Sat-Sun=rest)
  function getDayType(dateStr) {
    if (calendarDays.value[dateStr]) {
      return calendarDays.value[dateStr]
    }
    const d = new Date(dateStr)
    const day = d.getDay() // 0=Sun, 6=Sat
    return day === 0 || day === 6 ? 'rest' : 'workday'
  }

  async function toggleDayType(dateStr) {
    const current = getDayType(dateStr)
    const newType = current === 'workday' ? 'rest' : 'workday'
    await db.setDayType(dateStr, newType)
    calendarDays.value[dateStr] = newType

    // If toggling today's date, handle workday recurrence todos
    const todayStr = formatDate(new Date())
    if (dateStr === todayStr) {
      if (current === 'workday' && newType === 'rest') {
        // Switching today from workday → rest: soft-delete workday recurrence todos
        const todos = await db.getTodosByDate(dateStr)
        for (const todo of todos) {
          if (todo.recurrence_type === 'workday' && todo.deleted_at == null) {
            await db.deleteTodo(todo.id)
          }
        }
      } else if (current === 'rest' && newType === 'workday') {
        // Switching today from rest → workday: create workday recurrence todos
        const allTodos = await db.getAllTodos()
        const workdayGroups = {}
        for (const t of allTodos) {
          if (t.recurrence_type === 'workday' && t.recurrence_enabled !== false && t.deleted_at == null) {
            const gid = t.recurrence_group_id || `single_${t.id}`
            if (!workdayGroups[gid]) {
              workdayGroups[gid] = t
            }
          }
        }

        const existingTodos = await db.getTodosByDate(dateStr)
        for (const gid of Object.keys(workdayGroups)) {
          const template = workdayGroups[gid]
          const alreadyExists = existingTodos.some(
            t => (t.recurrence_group_id === gid || `single_${t.id}` === gid) && t.deleted_at == null,
          )
          if (!alreadyExists) {
            const created = await db.createTodo({
              title: template.title,
              notes: template.notes || '',
              status: 'pending',
              priority: template.priority || 'medium',
              due_date: template.due_date || null,
              todo_date: dateStr,
              recurrence_type: 'workday',
              recurrence_config: template.recurrence_config || '{}',
              recurrence_group_id: template.recurrence_group_id || gid,
              recurrence_enabled: true,
            })
            // Copy tags from template
            if (template.tags && template.tags.length > 0) {
              const tagIds = template.tags.map(t => t.id)
              await db.setTodoTags(created.id, tagIds)
            }
            // Copy steps from template (reset completed)
            if (template.steps && template.steps.length > 0) {
              const newSteps = template.steps.map(s => ({
                title: s.title,
                completed: false,
                sort_order: s.sort_order || 0,
              }))
              await db.saveTodoSteps(created.id, newSteps)
            }
          }
        }
      }
      // Reload current day's todos to reflect changes
      if (currentDate.value === dateStr) {
        await loadTodosForDate(dateStr)
      }
      await loadOverviewStats()
    }
  }

  // ─── Stats ──────────────────────────────────────────
  async function loadOverviewStats() {
    overviewStats.value = await db.getOverviewStats()
  }

  async function getTagDistribution(startDate, endDate) {
    return await db.getTagDistribution(startDate, endDate)
  }

  async function getCompletionTrend(startDate, endDate) {
    return await db.getCompletionTrend(startDate, endDate)
  }

  async function getPriorityDistribution(startDate, endDate) {
    return await db.getPriorityDistribution(startDate, endDate)
  }

  // ─── Historical Todo Move to Today ──────────────────
  async function moveHistoricalTodoToToday(todoId, newStatus) {
    const todo = incompleteTodos.value.find(t => t.id === todoId)
    if (!todo) return
    const today = formatDate(new Date())
    await updateTodo({ ...todo, todo_date: today, status: newStatus })
    await loadOverviewStats()
    await loadIncompleteTodos()
  }

  // ─── Background ─────────────────────────────────────
  async function setBackgroundImage(path) {
    backgroundImage.value = path
    await db.setSetting('background_image', JSON.stringify(path))
  }

  async function clearBackgroundImage() {
    backgroundImage.value = ''
    await db.setSetting('background_image', '""')
  }

  return {
    theme,
    themes,
    isDarkTheme,
    tags,
    currentTodos,
    currentDate,
    calendarCounts,
    calendarDays,
    overviewStats,
    trashTodos,
    incompleteTodos,
    isMiniMode,
    pendingQuickAdd,
    pendingEditTodo,
    backgroundImage,
    sidebarConfig,
    settingsLoaded,
    pendingTodos,
    doneTodos,
    applyTheme,
    setTheme,
    toggleTheme,
    loadSettings,
    loadTags,
    addTag,
    editTag,
    removeTag,
    loadTodosForDate,
    addTodo,
    updateTodo,
    removeTodo,
    toggleTodoStatus,
    toggleStep,
    loadIncompleteTodos,
    loadTrash,
    restoreFromTrash,
    permanentDelete,
    emptyTrash,
    loadCalendarCounts,
    loadCalendarDays,
    getDayType,
    toggleDayType,
    loadOverviewStats,
    getTagDistribution,
    getCompletionTrend,
    getPriorityDistribution,
    setBackgroundImage,
    clearBackgroundImage,
    saveSidebarConfig,
    moveHistoricalTodoToToday,
  }
})

function formatDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
