/**
 * 模板领域服务 (Template Domain Service)
 *
 * 职责：封装模板相关的所有数据操作，包括模板 CRUD、关联数据（steps、tags、
 * customFieldValues）的批量加载与保存，以及"从模板创建待办"的完整流程。
 *
 * 为什么独立成服务：
 * 1. 模板的关联数据涉及三张表（template_steps、tag_ids JSON、template_custom_field_values），
 *    分散在组件中容易导致遗漏（如之前自定义字段就完全没有接入模板）。
 * 2. "从模板创建待办"需要跨多表协调，逻辑复杂，集中管理更可靠。
 * 3. 遵循 SRP —— store 负责全局状态，templateService 负责模板数据流。
 *
 * 使用方式：
 *   import { templateService } from '@/services/templateService'
 *   const tpl = await templateService.loadAll()
 */

import * as db from '../utils/db'
import { safeJsonParseArray } from '../utils/helpers'

/**
 * 模板领域服务单例 —— 提供模板相关的所有数据操作。
 */
export const templateService = {
  // ─── 模板 CRUD ───────────────────────────────────────────────

  /**
   * 加载所有模板并附带关联数据（steps、tags 名称解析、customFieldValues）。
   *
   * @param {Array} allTags - 全局标签列表（store.tags），用于解析 tag_ids 为名称
   * @returns {Promise<Array>} 附带完整关联数据的模板列表
   */
  async loadAll(allTags = []) {
    const templates = await db.getAllTemplates()
    for (const tpl of templates) {
      tpl.steps = await db.getTemplateSteps(tpl.id)
      tpl.customFieldValues = await db.getTemplateCustomFieldValues(tpl.id)
      // 解析 tag_ids 为标签名称列表，方便 UI 直接显示
      const tagIds = safeJsonParseArray(tpl.tag_ids)
      tpl.tagNames = tagIds
        .map(id => allTags.find(t => t.id === id))
        .filter(Boolean)
        .map(t => t.name)
    }
    return templates
  },

  /**
   * 创建新模板并保存其关联数据（steps、customFieldValues）。
   *
   * @param {Object} tplData - 模板表单数据
   * @param {Array} [tplData.steps] - 步骤列表
   * @param {Array} [tplData.customFieldValues] - 自定义字段默认值
   * @returns {Promise<Object>} 创建后的模板对象（含 id）
   */
  async create(tplData) {
    const created = await db.createTemplate(tplData)
    // 保存步骤
    if (tplData.steps && tplData.steps.length > 0) {
      await db.saveTemplateSteps(created.id, tplData.steps)
    }
    // 保存自定义字段默认值
    if (tplData.customFieldValues && tplData.customFieldValues.length > 0) {
      await db.setTemplateCustomFieldValues(created.id, tplData.customFieldValues)
    }
    return created
  },

  /**
   * 更新模板及其关联数据。
   *
   * @param {Object} tplData - 模板表单数据（必须包含 id）
   * @param {Array} [tplData.steps] - 步骤列表（undefined 则不更新）
   * @param {Array} [tplData.customFieldValues] - 自定义字段默认值（undefined 则不更新）
   */
  async update(tplData) {
    await db.updateTemplate(tplData)
    // 步骤：始终覆盖
    if (tplData.steps !== undefined) {
      await db.saveTemplateSteps(tplData.id, tplData.steps || [])
    }
    // 自定义字段：始终覆盖
    if (tplData.customFieldValues !== undefined) {
      await db.setTemplateCustomFieldValues(tplData.id, tplData.customFieldValues || [])
    }
  },

  /**
   * 删除模板（后端会自动级联删除 steps 和 customFieldValues）。
   * @param {number} id - 模板 ID
   */
  async remove(id) {
    await db.deleteTemplate(id)
  },

  // ─── 模板 → 待办转换 ────────────────────────────────────────

  /**
   * 将模板数据转换为待办创建所需的表单数据。
   *
   * 这是"从模板创建待办"的核心逻辑：把模板中存储的各字段（包括自定义字段）
   * 组装成 AddTodoModal 能识别的格式。
   *
   * @param {Object} template - 模板对象（需已通过 loadAll 附带关联数据）
   * @returns {Object} 可直接传给 AddTodoModal 的数据
   */
  toTodoFormData(template) {
    return {
      title: template.title,
      notes: template.notes || '',
      priority: template.priority || 'medium',
      recurrence_type: template.recurrence_type || 'none',
      recurrence_config: template.recurrence_config || '{}',
      tagIds: safeJsonParseArray(template.tag_ids),
      lockedFields: safeJsonParseArray(template.locked_fields),
      steps: (template.steps || []).map(s => ({
        title: s.title,
        completed: false,
      })),
      customFieldValues: (template.customFieldValues || []).map(cfv => ({
        field_id: cfv.field_id,
        value: cfv.value || '',
      })),
    }
  },

  // ─── 锁定字段辅助 ────────────────────────────────────────────

  /**
   * 获取模板的锁定字段列表（解析 JSON）。
   * @param {Object} template - 模板对象
   * @returns {string[]} 锁定字段名数组
   */
  getLockedFields(template) {
    return safeJsonParseArray(template.locked_fields)
  },

  /**
   * 判断模板是否锁定了某个标准字段。
   * @param {Object} template
   * @param {string} fieldName - 字段名（title/priority/tags/recurrence/steps）
   * @returns {boolean}
   */
  isFieldLocked(template, fieldName) {
    return this.getLockedFields(template).includes(fieldName)
  },

  /**
   * 判断模板是否锁定了某个自定义字段。
   * @param {Object} template
   * @param {number} fieldId - 自定义字段 ID
   * @returns {boolean}
   */
  isCustomFieldLocked(template, fieldId) {
    return this.getLockedFields(template).includes(`cf_${fieldId}`)
  },
}
