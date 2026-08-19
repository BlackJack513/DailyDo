/**
 * DailyDo 共享工具函数模块
 *
 * 设计目的：将散落在各组件中的重复逻辑（优先级映射、重复类型标签、
 * JSON 安全解析、日期格式化等）集中到一处，遵循 DRY 原则。
 *
 * 使用方式：import { priorityClass, safeJsonParse, ... } from '@/utils/helpers'
 */

// ─── JSON 安全解析 ────────────────────────────────────────────

/**
 * 安全地解析 JSON 字符串，失败时返回指定的默认值。
 *
 * 为什么需要：项目中大量设置和数据库字段以 JSON 字符串存储（tag_ids、
 * locked_fields、enum_values 等），每处都手写 try/catch 容易遗漏且不一致。
 *
 * @param {string} str - 待解析的 JSON 字符串
 * @param {*} fallback - 解析失败时的默认返回值
 * @returns {*} 解析后的值，或 fallback
 */
export function safeJsonParse(str, fallback = null) {
  if (!str) return fallback
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

/**
 * 安全解析 JSON 并确保结果为数组。
 * 适用于 tag_ids、locked_fields 等存储为 JSON 数组的字段。
 *
 * @param {string} str - JSON 数组字符串
 * @returns {Array} 解析后的数组，或空数组
 */
export function safeJsonParseArray(str) {
  const result = safeJsonParse(str, [])
  return Array.isArray(result) ? result : []
}

// ─── 优先级相关 ──────────────────────────────────────────────

/**
 * 优先级配置表 —— 统一管理三个优先级的显示文本和样式类。
 *
 * 为什么集中管理：TemplatesView、AddTodoModal、TodayView 等都需要渲染
 * 优先级按钮/标签，之前各自维护一套配置，修改时容易遗漏。
 */
export const PRIORITIES = [
  { value: 'high', label: '高', activeClass: 'border-red-500 bg-red-50 text-red-500' },
  { value: 'medium', label: '中', activeClass: 'border-amber-500 bg-amber-50 text-amber-500' },
  { value: 'low', label: '低', activeClass: 'border-green-500 bg-green-50 bg-green-50/20 text-green-500' },
]

/**
 * 获取优先级的 Tailwind 样式类（用于卡片/徽章展示）。
 * @param {string} priority - 'high' | 'medium' | 'low'
 * @returns {string} Tailwind CSS 类名
 */
export function priorityClass(priority) {
  if (priority === 'high') return 'bg-red-50 text-red-500'
  if (priority === 'low') return 'bg-green-50 bg-green-50/20 text-green-500'
  return 'bg-amber-50 text-amber-500'
}

/**
 * 获取优先级的中文标签。
 * @param {string} priority
 * @returns {string} '高优先级' | '中优先级' | '低优先级'
 */
export function priorityLabel(priority) {
  if (priority === 'high') return '高优先级'
  if (priority === 'low') return '低优先级'
  return '中优先级'
}

/**
 * 获取优先级颜色（用于小圆点等装饰元素）。
 * @param {string} priority
 * @returns {string} Tailwind 文本颜色类
 */
export function priorityColor(priority) {
  const map = { high: 'text-red-500', medium: 'text-amber-500', low: 'text-green-500' }
  return map[priority] || 'text-amber-500'
}

/**
 * 获取优先级圆点颜色（用于小圆点指示器）。
 * @param {string} priority
 * @returns {string} Tailwind 背景色类
 */
export function priorityDot(priority) {
  const map = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500' }
  return map[priority] || 'bg-amber-500'
}

// ─── 重复类型相关 ─────────────────────────────────────────────

/**
 * 重复类型选项列表 —— 用于表单中的按钮组渲染。
 */
export const RECURRENCE_OPTIONS = [
  { value: 'none', label: '不重复' },
  { value: 'workday', label: '工作日' },
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
]

/**
 * 获取重复类型的中文标签。
 * @param {string} type - 重复类型标识
 * @returns {string} 中文标签
 */
export function recurrenceLabel(type) {
  const map = { workday: '工作日', daily: '每日', weekly: '每周', monthly: '每月', yearly: '每年' }
  return map[type] || type || ''
}

// ─── 锁定字段相关 ─────────────────────────────────────────────

/**
 * 可锁定字段的标签映射 —— 用于模板编辑中显示锁定字段的中文名。
 * 新增自定义字段锁定时，只需在此处添加映射即可。
 */
export const LOCKED_FIELD_LABELS = {
  title: '标题',
  priority: '优先级',
  tags: '标签',
  recurrence: '重复',
  steps: '步骤',
  custom_fields: '自定义字段',
}

/**
 * 获取锁定字段的中文标签列表。
 * 对于 custom_fields 类型的锁定，会展开为各字段的实际名称。
 *
 * @param {string[]} lockedFields - 锁定的字段名数组
 * @param {Array} [customFields] - 自定义字段定义数组（可选，用于展开字段名）
 * @returns {string[]} 锁定字段的中文标签
 */
export function getLockedFieldLabels(lockedFields, customFields = []) {
  const fields = safeJsonParseArray(lockedFields)
  return fields.map(f => {
    // 以 "cf_" 为前缀的锁定项表示自定义字段，格式为 "cf_{fieldId}"
    if (f.startsWith('cf_')) {
      const fieldId = parseInt(f.replace('cf_', ''))
      const cf = customFields.find(c => c.id === fieldId)
      return cf ? cf.name : f
    }
    return LOCKED_FIELD_LABELS[f] || f
  })
}

/**
 * 判断某个字段是否被锁定。
 * 综合考虑 readonly 状态和 lockedFields 列表。
 *
 * @param {string} fieldName - 要检查的字段名
 * @param {string[]} lockedFields - 锁定的字段名数组
 * @param {boolean} [readonly=false] - 是否处于只读模式
 * @returns {boolean}
 */
export function isFieldLocked(fieldName, lockedFields, readonly = false) {
  return readonly || (Array.isArray(lockedFields) && lockedFields.includes(fieldName))
}

/**
 * 判断某个自定义字段是否被锁定。
 * 自定义字段的锁定标识格式为 "cf_{fieldId}"。
 *
 * @param {number} fieldId - 自定义字段的 ID
 * @param {string[]} lockedFields - 锁定的字段名数组
 * @returns {boolean}
 */
export function isCustomFieldLocked(fieldId, lockedFields) {
  return Array.isArray(lockedFields) && lockedFields.includes(`cf_${fieldId}`)
}

// ─── 标签解析 ─────────────────────────────────────────────────

/**
 * 从 tag_ids JSON 字符串解析出标签名称列表。
 *
 * @param {Object} item - 包含 tag_ids 字段的对象（模板或待办）
 * @param {Array} allTags - 全局标签列表（store.tags）
 * @returns {string[]} 标签名称数组
 */
export function resolveTagNames(item, allTags) {
  const ids = safeJsonParseArray(item.tag_ids)
  return ids
    .map(id => allTags.find(t => t.id === id))
    .filter(Boolean)
    .map(t => t.name)
}

// ─── 自定义字段枚举值解析 ─────────────────────────────────────

/**
 * 解析自定义字段的枚举值列表。
 *
 * 为什么要封装：enum_values 存在新旧两种格式：
 * - 旧格式：["值1", "值2"]（纯字符串数组）
 * - 新格式：[{"value":"值1","note":"备注1"}, ...]
 * 需要统一转换为 { value, note } 格式。
 *
 * @param {Object} field - 自定义字段定义对象
 * @returns {Array<{value: string, note: string}>}
 */
export function parseEnumValues(field) {
  const arr = safeJsonParseArray(field.enum_values)
  return arr.map(item => {
    if (typeof item === 'string') return { value: item, note: '' }
    return { value: item.value || '', note: item.note || '' }
  })
}

// ─── 日期格式化 ───────────────────────────────────────────────

/**
 * 将 Date 对象格式化为 YYYY-MM-DD 字符串。
 * DailyDo 数据库中统一使用此格式存储日期。
 *
 * @param {Date} d
 * @returns {string}
 */
export function formatDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ─── 文件大小格式化 ──────────────────────────────────────────

/**
 * 将字节数格式化为人类可读的文件大小字符串。
 * @param {number} bytes
 * @returns {string} 例如 "1.5 MB"
 */
export function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ─── 待办数据组装 ─────────────────────────────────────────────

/**
 * 将待办/模板中的关联数据（tags、steps、customFieldValues）批量加载。
 *
 * 为什么提取：多个地方（loadTodosForDate、loadIncompleteTodos、loadListTodos）
 * 都需要对每个待办执行相同的"加载关联"操作，之前每处都手写循环。
 *
 * @param {Array} todos - 待办列表
 * @param {Object} db - 数据库 API 模块
 * @returns {Promise<Array>} 附带关联数据的待办列表
 */
export async function enrichTodos(todos, db) {
  for (const todo of todos) {
    todo.tags = await db.getTodoTags(todo.id)
    todo.steps = await db.getStepsByTodoId(todo.id)
    todo.customFieldValues = await db.getCustomFieldValues(todo.id)
    todo.attachments = await db.getAttachmentsByTodoId(todo.id)
  }
  return todos
}
