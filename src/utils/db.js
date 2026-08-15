import { invoke } from '@tauri-apps/api/tauri'

export async function createTodo(todo) {
  return await invoke('create_todo', { todo })
}

export async function updateTodo(todo) {
  return await invoke('update_todo', { todo })
}

export async function deleteTodo(id) {
  return await invoke('delete_todo', { id })
}

export async function getTodosByDate(date) {
  return await invoke('get_todos_by_date', { date })
}

export async function getTodosByDateRange(startDate, endDate) {
  return await invoke('get_todos_by_date_range', { startDate, endDate })
}

export async function getAllTodos() {
  return await invoke('get_all_todos')
}

export async function getIncompleteTodos() {
  return await invoke('get_incomplete_todos')
}

export async function getDailyCounts(startDate, endDate) {
  return await invoke('get_daily_counts', { startDate, endDate })
}

// Trash
export async function getTrashTodos() {
  return await invoke('get_trash_todos')
}

export async function restoreTodo(id) {
  return await invoke('restore_todo', { id })
}

export async function permanentDeleteTodo(id) {
  return await invoke('permanent_delete_todo', { id })
}

export async function clearTrash() {
  return await invoke('clear_trash')
}

export async function cleanExpiredTrash() {
  return await invoke('clean_expired_trash')
}

// Tags
export async function getAllTags() {
  return await invoke('get_all_tags')
}

export async function createTag(tag) {
  return await invoke('create_tag', { tag })
}

export async function updateTag(tag) {
  return await invoke('update_tag', { tag })
}

export async function deleteTag(id) {
  return await invoke('delete_tag', { id })
}

export async function setTodoTags(todoId, tagIds) {
  return await invoke('set_todo_tags', { todoId, tagIds })
}

export async function getTodoTags(todoId) {
  return await invoke('get_todo_tags', { todoId })
}

// Statistics
export async function getTagDistribution(startDate, endDate) {
  return await invoke('get_tag_distribution', { startDate, endDate })
}

export async function getCompletionTrend(startDate, endDate) {
  return await invoke('get_completion_trend', { startDate, endDate })
}

export async function getPriorityDistribution(startDate, endDate) {
  return await invoke('get_priority_distribution', { startDate, endDate })
}

export async function getOverviewStats() {
  return await invoke('get_overview_stats')
}

// Settings
export async function getSetting(key) {
  return await invoke('get_setting', { key })
}

export async function setSetting(key, value) {
  return await invoke('set_setting', { key, value })
}

export async function getAllSettings() {
  return await invoke('get_all_settings')
}

// Calendar days
export async function getCalendarDays(startDate, endDate) {
  return await invoke('get_calendar_days', { startDate, endDate })
}

export async function setDayType(date, dayType) {
  return await invoke('set_day_type', { date, dayType })
}

export async function removeDayType(date) {
  return await invoke('remove_day_type', { date })
}

export async function isWorkday(date) {
  return await invoke('is_workday', { date })
}

// Holidays
export async function fetchHolidays(year) {
  return await invoke('fetch_holidays', { year })
}

export async function getHolidaysForYear(year) {
  return await invoke('get_holidays_for_year', { year })
}

// Reminders
export async function getPendingReminders() {
  return await invoke('get_pending_reminders')
}

// Recurrence groups
export async function toggleRecurrenceEnabled(groupId, enabled) {
  return await invoke('toggle_recurrence_enabled', { groupId, enabled })
}

export async function deleteRecurrenceGroup(groupId) {
  return await invoke('delete_recurrence_group', { groupId })
}

// Todo steps
export async function getStepsByTodoId(todoId) {
  return await invoke('get_steps_by_todo_id', { todoId })
}

export async function saveTodoSteps(todoId, steps) {
  return await invoke('save_todo_steps', { todoId, steps })
}

export async function toggleStepCompleted(stepId) {
  return await invoke('toggle_step_completed', { stepId })
}

// Templates
export async function getAllTemplates() {
  return await invoke('get_all_templates')
}

export async function createTemplate(template) {
  return await invoke('create_template', { template })
}

export async function updateTemplate(template) {
  return await invoke('update_template', { template })
}

export async function deleteTemplate(id) {
  return await invoke('delete_template', { id })
}

export async function getTemplateSteps(templateId) {
  return await invoke('get_template_steps', { templateId })
}

export async function saveTemplateSteps(templateId, steps) {
  return await invoke('save_template_steps', { templateId, steps })
}

// Template custom field values
export async function getTemplateCustomFieldValues(templateId) {
  return await invoke('get_template_custom_field_values', { templateId })
}

export async function setTemplateCustomFieldValues(templateId, values) {
  return await invoke('set_template_custom_field_values', { templateId, values })
}

// Attachments
export async function getAllAttachments(statusFilter) {
  return await invoke('get_all_attachments', { statusFilter })
}

export async function deleteAttachment(todoId) {
  return await invoke('delete_attachment', { todoId })
}

export async function clearCompletedAttachments() {
  return await invoke('clear_completed_attachments')
}

export async function openAttachment(filePath) {
  return await invoke('open_attachment', { filePath })
}

export async function showAttachmentInExplorer(filePath) {
  return await invoke('show_attachment_in_explorer', { filePath })
}

// Gantt chart
export async function getGanttData(date) {
  return await invoke('get_gantt_data', { date })
}

// Activity log
export async function getActivityLogsByTodoId(todoId) {
  return await invoke('get_activity_logs_by_todo_id', { todoId })
}

export async function addActivityLog(log) {
  return await invoke('add_activity_log', { log })
}

// Data directory
export async function getDataDir() {
  return await invoke('get_data_dir')
}

export async function getDefaultDataDir() {
  return await invoke('get_default_data_dir')
}

export async function migrateDataDir(newPath) {
  return await invoke('migrate_data_dir', { newPath })
}

export async function deleteDataPathOverride() {
  return await invoke('delete_data_path_override')
}

// Custom fields
export async function getCustomFields() {
  return await invoke('get_custom_fields')
}

export async function createCustomField(field) {
  return await invoke('create_custom_field', { field })
}

export async function updateCustomField(field) {
  return await invoke('update_custom_field', { field })
}

export async function deleteCustomField(id) {
  return await invoke('delete_custom_field', { id })
}

export async function getCustomFieldValues(todoId) {
  return await invoke('get_custom_field_values', { todoId })
}

export async function setCustomFieldValues(todoId, values) {
  return await invoke('set_custom_field_values', { todoId, values })
}

// Filtered todos (list view)
export async function getFilteredTodos(filter) {
  return await invoke('get_filtered_todos', { filter })
}
