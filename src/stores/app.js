import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as db from '../utils/db'
import { formatDate, enrichTodos } from '../utils/helpers'

/**
 * DailyDo 全局状态管理（Pinia Store）
 *
 * 设计说明：
 * - 采用 Composition API 风格的 defineStore，所有状态和逻辑集中在一个 store 中
 * - 按业务领域分区组织：主题 → 标签 → 待办 → 步骤 → 回收站 → 日历 → 统计 → 自定义字段 → 列表视图
 * - 与 helpers.js 共享工具函数（formatDate、enrichTodos），避免 DRY 违规
 * - 与 templateService.js 分工：模板相关操作由 service 层处理，本 store 负责全局状态和待办 CRUD
 *
 * 状态持久化策略：
 * - 设置类状态（theme、sidebarConfig、backgroundImage 等）通过 db.setSetting/getSetting 持久化
 * - 业务数据（todos、tags 等）每次从 SQLite 重新加载，不做客户端缓存
 */
export const useAppStore = defineStore('app', () => {
  // ═══════════════════════════════════════════════════════════
  // 状态声明（State）
  // ═══════════════════════════════════════════════════════════

  // ─── 主题 & 外观 ──────────────────────────────────────────
  const theme = ref('light')
  const backgroundImage = ref('')
  const backgroundMode = ref('cover') // 'cover' | 'tile'

  // ─── 标签（Tags）──────────────────────────────────────────
  const tags = ref([])

  // ─── 待办事项（Todos）─────────────────────────────────────
  const currentTodos = ref([])      // 当前日期（currentDate）的待办列表
  const currentDate = ref(formatDate(new Date()))  // 当前选中日期，默认今天
  const incompleteTodos = ref([])   // 跨所有日期的未完成待办（用于"历史未完成"区域）

  // ─── 日历（Calendar）──────────────────────────────────────
  const calendarCounts = ref({})    // { 'YYYY-MM-DD': { total, completed } } 每日统计
  const calendarDays = ref({})      // { 'YYYY-MM-DD': 'workday'|'rest' } 仅存用户自定义覆盖项
  const holidays = ref({})          // { 'YYYY-MM-DD': { name, holiday, ... } } API 获取的节假日

  // ─── 回收站（Trash）───────────────────────────────────────
  const trashTodos = ref([])

  // ─── 自定义字段（Custom Fields）───────────────────────────
  const customFields = ref([])

  // ─── 列表视图（List View）─────────────────────────────────
  const listTodos = ref([])
  const listFilter = ref({
    search: '',
    status: '',
    tag_ids: [],
    date: new Date().toISOString().split('T')[0],
    custom_field_filters: [],
    sort_by: 'todo_date',
    sort_order: 'desc',
    sort_criteria: [{ field: 'todo_date', order: 'desc' }],
  })

  // ─── 小窗模式（Mini Mode）─────────────────────────────────
  const isMiniMode = ref(false)
  const pendingQuickAdd = ref(null)  // 从小窗"展开"时携带的新建待办数据
  const pendingEditTodo = ref(null)  // 从小窗"展开"时携带的编辑待办数据

  // ─── 休息提醒（Rest Reminder）─────────────────────────────
  const restReminderEnabled = ref(false)
  const restReminderInterval = ref(45)
  const lastRestReminderAt = ref(0)

  function resetRestReminderTimer() {
    lastRestReminderAt.value = Date.now()
  }

  // ─── 侧边栏配置（Sidebar）────────────────────────────────
  // 分组结构：每个 group 包含 { id, label, items: [{ id, visible }] }
  // 设计意图：支持用户自定义侧边栏模块的显示/隐藏和分组排列
  const defaultSidebarGroups = [
    {
      id: 'task_entry',
      label: '任务录入',
      items: [
        { id: 'today', visible: true },
        { id: 'list', visible: true },
        { id: 'recurrences', visible: true },
        { id: 'templates', visible: true },
      ],
    },
    {
      id: 'data_viz',
      label: '数据可视化',
      items: [
        { id: 'calendar', visible: true },
        { id: 'analytics', visible: true },
        { id: 'gantt', visible: true },
      ],
    },
    {
      id: 'time_tools',
      label: '时间工具',
      items: [
        { id: 'payday', visible: true },
        { id: 'salaryTimer', visible: true },
        { id: 'restReminder', visible: true },
      ],
    },
    {
      id: 'system',
      label: '系统管理',
      items: [
        { id: 'tags', visible: true },
        { id: 'attachments', visible: true },
        { id: 'customFields', visible: true },
        { id: 'trash', visible: true },
        { id: 'settings', visible: true },
      ],
    },
  ]
  const sidebarConfig = ref(defaultSidebarGroups.map(g => ({
    ...g,
    items: g.items.map(i => ({ ...i })),
  })))

  // ─── 设置加载状态 ─────────────────────────────────────────
  // 用于 App.vue 中的 v-if 判断：确保所有设置加载完毕后再渲染界面，
  // 避免主题闪烁（先显示默认主题再切换到用户选择的主题）
  const settingsLoaded = ref(false)

  // ─── 统计概览（Overview Stats）────────────────────────────
  const overviewStats = ref({
    today_total: 0,
    today_completed: 0,
    week_total: 0,
    week_completed: 0,
    pending_count: 0,
    streak_days: 0,
    trash_count: 0,
  })

  // ═══════════════════════════════════════════════════════════
  // 计算属性（Computed）
  // ═══════════════════════════════════════════════════════════

  /** 当前日期中未完成/已完成的待办 —— 用于 TodayView 的看板列渲染 */
  const pendingTodos = computed(() => currentTodos.value.filter(t => t.status !== 'done'))
  const doneTodos = computed(() => currentTodos.value.filter(t => t.status === 'done'))

  // ═══════════════════════════════════════════════════════════
  // 主题配置（Theme Configuration）
  // ═══════════════════════════════════════════════════════════

  /**
   * 全量主题列表 —— 用于设置页面中的主题选择网格。
   * 每个主题的 color 字段为预览色块颜色，id 对应 CSS data-theme 属性值。
   */
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
    { id: 'sunny', name: '暖阳', color: '#F59E0B' },
    { id: 'ocean', name: '海洋', color: '#0EA5E9' },
    { id: 'coral', name: '珊瑚', color: '#FB7150' },
    { id: 'mint', name: '薄荷', color: '#14B882' },
    { id: 'claude', name: 'Claude', color: '#C15F3C' },
    { id: 'rainblue', name: '天青', color: '#378287' },
    { id: 'moonwhite', name: '月白', color: '#506987' },
    { id: 'cinnabar', name: '朱砂', color: '#AF2D23' },
    { id: 'indigo', name: '黛蓝', color: '#8296C8' },
    { id: 'mist', name: '暮霭', color: '#D7824B' },
    { id: 'frost', name: '霜降', color: '#4682C3' },
    { id: 'aurora', name: '极光', color: '#5AC878' },
    { id: 'monsoon', name: '雨季', color: '#3A6E4B' },
  ]

  /**
   * 深色主题列表 —— 这些主题需要在 <html> 上添加 `dark` class，
   * 以便 Tailwind CSS 的 dark: 变体生效。
   * 新增深色主题时必须同步更新此数组。
   */
  const darkThemes = ['dark', 'ink', 'starry', 'indigo', 'aurora']

  /**
   * 收藏主题列表 —— 仅这些主题显示在侧边栏的快速切换下拉中。
   * 默认值 ['light', 'dark', 'ocean', 'claude'] 覆盖最常用的四个主题。
   * 持久化为 JSON 数组字符串（注意：数组类型设置必须 JSON.stringify/parse）。
   */
  const favoriteThemes = ref(['light', 'dark', 'ocean', 'claude'])
  const favoriteThemeIds = computed(() => new Set(favoriteThemes.value))
  const isFavorite = (themeId) => favoriteThemeIds.value.has(themeId)

  /**
   * 切换主题的收藏状态。
   * 使用不可变更新（filter/spread）触发 Vue 响应式，而非 push/splice。
   */
  async function toggleFavorite(themeId) {
    const idx = favoriteThemes.value.indexOf(themeId)
    if (idx > -1) {
      favoriteThemes.value = favoriteThemes.value.filter(id => id !== themeId)
    } else {
      favoriteThemes.value = [...favoriteThemes.value, themeId]
    }
    await db.setSetting('favorite_themes', JSON.stringify(favoriteThemes.value))
  }

  // ═══════════════════════════════════════════════════════════
  // 主题操作（Theme Operations）
  // ═══════════════════════════════════════════════════════════

  /**
   * 将当前主题应用到 DOM。
   * 通过 data-theme 属性驱动 CSS 变量切换，同时管理 Tailwind 的 dark class。
   * 注意：此函数直接操作 DOM，不依赖 Vue 响应式。
   */
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

  /**
   * 加载所有用户设置。
   *
   * 设计要点：
   * - 每个设置项独立 try/catch —— 某一项加载失败不能阻塞其他项
   * - 加载顺序有依赖：sidebarConfig 需在 customFields 之前加载
   * - 加载完成后设置 settingsLoaded = true，App.vue 据此决定是否渲染界面
   */
  async function loadSettings() {
    try {
      const t = await db.getSetting('theme')
      if (t) theme.value = t
    } catch (e) {
      console.error('Failed to load theme:', e)
    }

    try {
      const ft = await db.getSetting('favorite_themes')
      if (ft) {
        const parsed = JSON.parse(ft)
        if (Array.isArray(parsed) && parsed.length > 0) {
          favoriteThemes.value = parsed
        }
      }
    } catch (e) {
      console.error('Failed to load favorite_themes:', e)
    }

    try {
      const bg = await db.getSetting('background_image')
      if (bg) backgroundImage.value = JSON.parse(bg)
    } catch (e) {
      console.error('Failed to load background_image:', e)
    }

    try {
      const bm = await db.getSetting('background_mode')
      if (bm) backgroundMode.value = JSON.parse(bm)
    } catch (e) {
      console.error('Failed to load background_mode:', e)
    }

    await loadSidebarConfig()

    try {
      await loadCustomFields()
    } catch (e) {
      console.error('Failed to load custom fields:', e)
    }

    // Load rest reminder settings
    try {
      const rrEnabled = await db.getSetting('rest_reminder_enabled')
      if (rrEnabled !== null && rrEnabled !== undefined) {
        restReminderEnabled.value = rrEnabled === 'true'
      }
    } catch { /* use default */ }
    try {
      const rrInterval = await db.getSetting('rest_reminder_interval')
      if (rrInterval) {
        const val = parseInt(rrInterval, 10)
        if (val >= 15 && val <= 120) {
          restReminderInterval.value = val
        }
      }
    } catch { /* use default */ }

    settingsLoaded.value = true
  }

  // ═══════════════════════════════════════════════════════════
  // 侧边栏配置（Sidebar Config）
  // ═══════════════════════════════════════════════════════════

  /**
   * 加载侧边栏配置，兼容三种历史格式并自动迁移：
   *
   * 1. 新分组格式：[{ id, label, items: [{ id, visible }] }]  ← 当前格式
   * 2. 旧扁平格式：[{ id, visible }]  ← 需迁移为分组格式
   * 3. 无配置/无效格式：使用默认值并持久化
   *
   * 迁移策略（针对新分组格式）：
   * - 确保 'list' 模块存在于 task_entry 组（v2 新增模块）
   * - 确保 'customFields' 模块存在于 system 组（v3 新增模块）
   * - 将 'payday' 从 system 组迁移到 time_tools 组（v4 模块重组）
   * - 确保 'salaryTimer' 存在于 time_tools 组（v5 新增模块）
   *
   * 为什么迁移逻辑在这里：保持向后兼容，老用户升级后不会丢失侧边栏自定义配置。
   */
  async function loadSidebarConfig() {
    try {
      const raw = await db.getSetting('sidebar_config')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Detect format: new grouped format has { id, label, items }
          const isNewFormat = parsed[0] && Array.isArray(parsed[0].items)
          if (isNewFormat) {
            // Validate new format
            const valid = parsed.every(g =>
              g && typeof g.id === 'string' && typeof g.label === 'string' &&
              Array.isArray(g.items) && g.items.every(i => i && typeof i.id === 'string' && typeof i.visible === 'boolean')
            )
            if (valid) {
              // Migrate: ensure 'list' module exists in task_entry group
              let migrated = false
              for (const g of parsed) {
                if (g.id === 'task_entry') {
                  if (!g.items.find(i => i.id === 'list')) {
                    g.items.splice(1, 0, { id: 'list', visible: true })
                    migrated = true
                  }
                }
              }
              // Migrate: ensure 'customFields' module exists in system group
              for (const g of parsed) {
                if (g.id === 'system') {
                  if (!g.items.find(i => i.id === 'customFields')) {
                    // Insert before 'trash' if it exists, otherwise at end before 'settings'
                    const trashIdx = g.items.findIndex(i => i.id === 'trash')
                    const settingsIdx = g.items.findIndex(i => i.id === 'settings')
                    const insertIdx = trashIdx >= 0 ? trashIdx : settingsIdx >= 0 ? settingsIdx : g.items.length
                    g.items.splice(insertIdx, 0, { id: 'customFields', visible: true })
                    migrated = true
                  }
                  // Migrate: move 'payday' from system to time_tools group
                  const paydayIdx = g.items.findIndex(i => i.id === 'payday')
                  if (paydayIdx >= 0) {
                    const [paydayItem] = g.items.splice(paydayIdx, 1)
                    migrated = true
                    // Find or create time_tools group
                    let timeGroup = parsed.find(g2 => g2.id === 'time_tools')
                    if (!timeGroup) {
                      // Insert before 'system' group
                      const sysIdx = parsed.findIndex(g2 => g2.id === 'system')
                      timeGroup = { id: 'time_tools', label: '时间工具', items: [] }
                      parsed.splice(sysIdx >= 0 ? sysIdx : parsed.length, 0, timeGroup)
                    }
                    if (!timeGroup.items.find(i => i.id === 'payday')) {
                      timeGroup.items.push({ ...paydayItem, visible: true })
                    }
                  }
                }
              }
              // Migrate: ensure 'salaryTimer' exists in time_tools group
              for (const g of parsed) {
                if (g.id === 'time_tools') {
                  if (!g.items.find(i => i.id === 'salaryTimer')) {
                    g.items.push({ id: 'salaryTimer', visible: true })
                    migrated = true
                  }
                }
              }
              // Migrate: ensure 'restReminder' exists in time_tools group
              for (const g of parsed) {
                if (g.id === 'time_tools') {
                  if (!g.items.find(i => i.id === 'restReminder')) {
                    g.items.push({ id: 'restReminder', visible: true })
                    migrated = true
                  }
                }
              }
              sidebarConfig.value = parsed
              if (migrated) {
                await db.setSetting('sidebar_config', JSON.stringify(parsed))
              }
              return
            }
            console.warn('Sidebar config has invalid grouped format, resetting to defaults')
          } else {
            // Old flat format: [{ id, visible }, ...] — migrate to grouped
            const valid = parsed.every(item => item && typeof item.id === 'string' && typeof item.visible === 'boolean')
            if (valid) {
              const visibilityMap = {}
              for (const item of parsed) {
                visibilityMap[item.id] = item.visible
              }
              sidebarConfig.value = defaultSidebarGroups.map(g => ({
                ...g,
                items: g.items.map(i => ({
                  id: i.id,
                  visible: visibilityMap[i.id] !== undefined ? visibilityMap[i.id] : i.visible,
                })),
              }))
              await db.setSetting('sidebar_config', JSON.stringify(sidebarConfig.value))
              return
            }
            console.warn('Sidebar config has invalid format, resetting to defaults')
          }
        }
      }
      // No saved config or invalid — use defaults and persist them
      sidebarConfig.value = defaultSidebarGroups.map(g => ({
        ...g,
        items: g.items.map(i => ({ ...i })),
      }))
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

  // ═══════════════════════════════════════════════════════════
  // 标签管理（Tags）
  // ═══════════════════════════════════════════════════════════

  /** 每次 CRUD 操作后重新加载全量标签，保持与数据库同步 */
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

  // ═══════════════════════════════════════════════════════════
  // 待办事项操作（Todos）
  // ═══════════════════════════════════════════════════════════

  /**
   * 加载指定日期的所有待办事项，并附带关联数据（标签、步骤、自定义字段值）。
   *
   * 为什么用 enrichTodos：避免在每个加载函数中重复 3 行关联数据加载代码，
   * 统一由 helpers.js 的 enrichTodos 处理，确保新增关联字段时只需改一处。
   */
  async function loadTodosForDate(date) {
    currentDate.value = date
    currentTodos.value = await db.getTodosByDate(date)
    await enrichTodos(currentTodos.value, db)
  }

  /**
   * 创建新待办事项。
   *
   * 数据流：先创建主记录 → 再保存关联数据（标签、步骤、自定义字段值）→ 最后重载列表。
   * 为什么不在 createTodo 中一并保存关联数据：Tauri invoke 是逐个命令调用，
   * 没有事务支持，分步保存可以在中间失败时保持数据一致性（主记录已存在）。
   */
  async function addTodo(todo) {
    const created = await db.createTodo(todo)
    created.tags = []
    if (todo.tagIds && todo.tagIds.length > 0) {
      await db.setTodoTags(created.id, todo.tagIds)
      created.tags = await db.getTodoTags(created.id)
    }
    if (todo.steps && todo.steps.length > 0) {
      created.steps = await db.saveTodoSteps(created.id, todo.steps)
    } else {
      created.steps = []
    }
    if (todo.customFieldValues && todo.customFieldValues.length > 0) {
      await db.setCustomFieldValues(created.id, todo.customFieldValues)
      created.customFieldValues = await db.getCustomFieldValues(created.id)
    } else {
      created.customFieldValues = []
    }
    if (todo.recurrence_type && todo.recurrence_type !== 'none') {
      created.recurrence_type = todo.recurrence_type
      created.recurrence_config = todo.recurrence_config
    }
    await loadTodosForDate(currentDate.value)
    return created
  }

  /**
   * 更新待办事项。
   *
   * 关键逻辑：
   * - 记录旧状态（oldStatus），用于判断是否触发了"完成→重复"的链式创建
   * - 标签始终更新（todo.tagIds 存在时），修复了之前编辑时标签不更新的 bug
   * - 步骤和自定义字段值采用"有则覆盖"策略（undefined 表示未修改）
   */
  async function updateTodo(todo) {
    const oldStatus = currentTodos.value.find(t => t.id === todo.id)?.status
    await db.updateTodo(todo)
    if (todo.tagIds) {
      await db.setTodoTags(todo.id, todo.tagIds)
    }
    if (todo.steps !== undefined) {
      await db.saveTodoSteps(todo.id, todo.steps || [])
    }
    if (todo.customFieldValues !== undefined) {
      await db.setCustomFieldValues(todo.id, todo.customFieldValues || [])
    }
    // 完成重复任务时，自动创建下一次出现
    if (todo.status === 'done' && oldStatus !== 'done' && todo.recurrence_type && todo.recurrence_type !== 'none') {
      await createNextRecurrence(todo)
    }
    await loadTodosForDate(currentDate.value)
  }

  /** 软删除待办（移入回收站），而非物理删除 */
  async function removeTodo(id) {
    await db.deleteTodo(id)
    await loadTodosForDate(currentDate.value)
    await loadOverviewStats()
  }

  /**
   * 循环切换待办状态：pending → in_progress → blocked → done → pending。
   * 用于看板卡片上的快速状态切换（点击状态标签）。
   */
  async function toggleTodoStatus(todo) {
    const nextStatus = todo.status === 'pending' ? 'in_progress' : todo.status === 'in_progress' ? 'blocked' : todo.status === 'blocked' ? 'done' : 'pending'
    await updateTodo({ ...todo, status: nextStatus })
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤操作（Steps）
  // ═══════════════════════════════════════════════════════════

  /**
   * 切换步骤的完成状态。
   * 完成后需重载待办（可能触发自动完成）、历史未完成和统计数据。
   * 之所以三处重载：步骤完成可能使待办自动标记为 done，影响三个数据源。
   */
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
    await enrichTodos(incompleteTodos.value, db)
  }

  /**
   * 为重复任务创建下一次出现。
   *
   * 核心机制：
   * - 根据 recurrence_type 计算下一个日期（跳过非工作日 for workday 类型）
   * - 使用 recurrence_group_id 将同一链条上的所有出现关联起来
   * - 去重检查：如果下一日期的同标题+同组待办已存在，则跳过创建，
   *   但仍会补充缺失的标签/步骤/自定义字段值（处理部分数据丢失的场景）
   *
   * 触发时机：updateTodo 中状态从非 done 变为 done 时自动触发。
   */
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
      // Copy custom field values to duplicate if it doesn't have any yet
      if (todo.customFieldValues && todo.customFieldValues.length > 0) {
        const existingCfv = await db.getCustomFieldValues(duplicate.id)
        if (existingCfv.length === 0) {
          await db.setCustomFieldValues(duplicate.id, todo.customFieldValues)
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

    // Copy custom field values
    if (todo.customFieldValues && todo.customFieldValues.length > 0) {
      await db.setCustomFieldValues(created.id, todo.customFieldValues)
    }
  }

  /**
   * 检查并补全遗漏的重复任务（应用启动时调用）。
   *
   * 为什么需要：用户可能多天不打开应用，导致重复链条断裂。
   * 此函数扫描所有重复任务组，找到最新一条已完成的记录，
   * 如果它的下一次出现不存在，则自动补创建。
   *
   * 安全策略：只触发最新一条状态为 done 的组，避免批量创建大量历史待办。
   */
  async function checkOverdueRecurrences() {
    try {
      const allTodos = await db.getAllTodos()
      const recurring = allTodos.filter(
        t => t.recurrence_type && t.recurrence_type !== 'none' && !t.deleted_at,
      )

      // Group by recurrence_group_id
      const groupMap = {}
      for (const todo of recurring) {
        const gid = todo.recurrence_group_id || `single_${todo.id}`
        if (!groupMap[gid]) groupMap[gid] = []
        groupMap[gid].push(todo)
      }

      for (const [gid, items] of Object.entries(groupMap)) {
        // Skip disabled groups
        if (items.length > 0 && items[0].recurrence_enabled === false) continue

        // Find the item with the latest todo_date (the most recent occurrence)
        const sorted = [...items].sort((a, b) => (b.todo_date || '').localeCompare(a.todo_date || ''))
        const latest = sorted[0]
        if (!latest) continue

        // Only trigger if the latest occurrence is done (chain wasn't broken by user skipping)
        if (latest.status !== 'done') continue

        // Check if the next occurrence already exists
        const nextDate = new Date(latest.todo_date)
        switch (latest.recurrence_type) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1)
            break
          case 'workday':
            nextDate.setDate(nextDate.getDate() + 1)
            while (!(await db.isWorkday(formatDate(nextDate)))) {
              nextDate.setDate(nextDate.getDate() + 1)
            }
            break
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7)
            break
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1)
            break
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1)
            break
        }

        const nextDateStr = formatDate(nextDate)
        const groupId = latest.recurrence_group_id || `single_${latest.id}`

        // Check if next occurrence already exists
        const existingTodos = await db.getTodosByDate(nextDateStr)
        const exists = existingTodos.find(
          t => t.title === latest.title && t.recurrence_group_id === groupId && !t.deleted_at,
        )
        if (exists) continue

        // Load tags and steps for the template todo
        latest.tags = await db.getTodoTags(latest.id)
        latest.steps = await db.getStepsByTodoId(latest.id)

        // Create the missing occurrence
        await createNextRecurrence(latest)
        console.log(`[DailyDo] Created overdue recurrence: "${latest.title}" for ${nextDateStr}`)
      }
    } catch (e) {
      console.error('Failed to check overdue recurrences:', e)
    }
  }

  // Manually trigger a recurrence group to create the next occurrence
  async function triggerRecurrenceManually(groupId) {
    try {
      const allTodos = await db.getAllTodos()
      const items = allTodos.filter(
        t => {
          const gid = t.recurrence_group_id || `single_${t.id}`
          return gid === groupId && t.recurrence_type && t.recurrence_type !== 'none' && !t.deleted_at
        },
      )
      if (items.length === 0) return { success: false, message: '未找到该周期任务的记录' }

      // Find the latest item by todo_date
      const sorted = [...items].sort((a, b) => (b.todo_date || '').localeCompare(a.todo_date || ''))
      const latest = sorted[0]

      // Load tags and steps
      latest.tags = await db.getTodoTags(latest.id)
      latest.steps = await db.getStepsByTodoId(latest.id)

      await createNextRecurrence(latest)
      await loadTodosForDate(currentDate.value)
      return { success: true, message: '已成功创建下一次周期任务' }
    } catch (e) {
      console.error('Failed to trigger recurrence:', e)
      return { success: false, message: '创建失败: ' + e }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 回收站（Trash）
  // ═══════════════════════════════════════════════════════════

  /**
   * 加载回收站中的待办。
   * 注意：回收站只需加载标签（用于显示），不需要步骤和自定义字段值，
   * 因此不使用 enrichTodos，避免多余的数据库查询。
   */
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

  // ═══════════════════════════════════════════════════════════
  // 日历（Calendar）
  // ═══════════════════════════════════════════════════════════

  /**
   * 加载指定月份的每日待办统计（用于日历上的数量标记）。
   * 同时触发加载该月的自定义日期类型（calendarDays）。
   */
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

  /**
   * 获取指定日期的类型（工作日/休息日）。
   *
   * 优先级（从高到低）：
   * 1. 用户自定义覆盖（calendarDays）—— 最高优先级
   * 2. 法定节假日数据（holidays）—— 来自 API
   * 3. 默认规则：周一至周五=工作日，周六日=休息日
   *
   * 为什么这样设计：calendarDays 表只存覆盖项，默认值不入库，节省存储空间。
   */
  function getDayType(dateStr) {
    // 1. Custom override takes highest priority
    if (calendarDays.value[dateStr]) {
      return calendarDays.value[dateStr]
    }
    // 2. Check holiday data
    if (holidays.value[dateStr]) {
      return 'rest'
    }
    // 3. Default: Mon-Fri = workday, Sat-Sun = rest
    const d = new Date(dateStr)
    const day = d.getDay() // 0=Sun, 6=Sat
    return day === 0 || day === 6 ? 'rest' : 'workday'
  }

  // Load holidays for the given year from API (only if not already stored)
  async function loadHolidaysIfNeeded(year) {
    try {
      const count = await db.fetchHolidays(year)
      // Load the holiday data into state for calendar display
      const list = await db.getHolidaysForYear(year)
      const map = {}
      for (const h of list) {
        map[h.date] = h
      }
      holidays.value = { ...holidays.value, ...map }
      return count
    } catch (e) {
      console.warn('加载节假日数据失败:', e)
      return 0
    }
  }

  /**
   * 切换指定日期的工作日/休息日类型。
   *
   * 副作用处理（当切换的是"今天"时）：
   * - 工作日→休息日：软删除今天所有 workday 类型的重复待办（今天不用做）
   * - 休息日→工作日：为所有 workday 重复任务组创建今天的待办（补回来）
   *
   * 为什么需要这些副作用：确保 workday 类型的重复任务与实际工作日状态同步。
   */
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

  // ═══════════════════════════════════════════════════════════
  // 统计概览（Stats）
  // ═══════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════
  // 历史待办迁移（Historical Todo Move）
  // ═══════════════════════════════════════════════════════════

  /**
   * 将历史未完成待办移动到"今天"。
   * 通过修改 todo_date 实现日期迁移，同时可指定新状态。
   */
  async function moveHistoricalTodoToToday(todoId, newStatus) {
    const todo = incompleteTodos.value.find(t => t.id === todoId)
    if (!todo) return
    const today = formatDate(new Date())
    await updateTodo({ ...todo, todo_date: today, status: newStatus })
    await loadOverviewStats()
    await loadIncompleteTodos()
  }

  // ═══════════════════════════════════════════════════════════
  // 背景图片（Background）
  // ═══════════════════════════════════════════════════════════

  async function setBackgroundImage(path, mode) {
    backgroundImage.value = path
    await db.setSetting('background_image', JSON.stringify(path))
    if (mode) {
      backgroundMode.value = mode
      await db.setSetting('background_mode', JSON.stringify(mode))
    }
  }

  async function setBackgroundMode(mode) {
    backgroundMode.value = mode
    await db.setSetting('background_mode', JSON.stringify(mode))
  }

  async function clearBackgroundImage() {
    backgroundImage.value = ''
    backgroundMode.value = 'cover'
    await db.setSetting('background_image', '""')
    await db.setSetting('background_mode', JSON.stringify('cover'))
  }

  // ═══════════════════════════════════════════════════════════
  // 自定义字段（Custom Fields）
  // ═══════════════════════════════════════════════════════════

  /** 每次 CRUD 操作后重新加载全量自定义字段，保持与数据库同步 */
  async function loadCustomFields() {
    customFields.value = await db.getCustomFields()
  }

  async function addCustomField(field) {
    const created = await db.createCustomField(field)
    await loadCustomFields()
    return created
  }

  async function editCustomField(field) {
    await db.updateCustomField(field)
    await loadCustomFields()
  }

  async function removeCustomField(id) {
    await db.deleteCustomField(id)
    await loadCustomFields()
  }

  // ═══════════════════════════════════════════════════════════
  // 列表视图（List View）
  // ═══════════════════════════════════════════════════════════

  /**
   * 加载列表视图的待办数据（支持搜索、筛选、排序）。
   *
   * 注意：后端 getFilteredTodos 接受 start_date/end_date 而非单个 date，
   * 因此这里将 filter.date 转换为日期区间。
   */
  async function loadListTodos() {
    const filter = { ...listFilter.value }
    if (filter.date) {
      filter.start_date = filter.date
      filter.end_date = filter.date
    }
    delete filter.date
    listTodos.value = await db.getFilteredTodos(filter)
    await enrichTodos(listTodos.value, db)
  }

  // ═══════════════════════════════════════════════════════════
  // 数据目录管理（Data Directory）
  // ═══════════════════════════════════════════════════════════
  async function getDataDir() {
    return await db.getDataDir()
  }

  async function getDefaultDataDir() {
    return await db.getDefaultDataDir()
  }

  async function migrateDataDir(newPath) {
    return await db.migrateDataDir(newPath)
  }

  async function resetDataDir() {
    return await db.deleteDataPathOverride()
  }

  return {
    theme,
    themes,
    isDarkTheme,
    favoriteThemes,
    isFavorite,
    toggleFavorite,
    tags,
    currentTodos,
    currentDate,
    calendarCounts,
    calendarDays,
    holidays,
    overviewStats,
    trashTodos,
    incompleteTodos,
    isMiniMode,
    pendingQuickAdd,
    pendingEditTodo,
    restReminderEnabled,
    restReminderInterval,
    lastRestReminderAt,
    resetRestReminderTimer,
    backgroundImage,
    backgroundMode,
    sidebarConfig,
    settingsLoaded,
    pendingTodos,
    doneTodos,
    customFields,
    listTodos,
    listFilter,
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
    loadHolidaysIfNeeded,
    loadOverviewStats,
    getTagDistribution,
    getCompletionTrend,
    getPriorityDistribution,
    setBackgroundImage,
    setBackgroundMode,
    clearBackgroundImage,
    saveSidebarConfig,
    moveHistoricalTodoToToday,
    checkOverdueRecurrences,
    triggerRecurrenceManually,
    loadCustomFields,
    addCustomField,
    editCustomField,
    removeCustomField,
    loadListTodos,
    getDataDir,
    getDefaultDataDir,
    migrateDataDir,
    resetDataDir,
  }
})
