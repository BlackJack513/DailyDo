import { save } from '@tauri-apps/api/dialog'
import { open } from '@tauri-apps/api/dialog'
import { writeTextFile, readTextFile, writeBinaryFile } from '@tauri-apps/api/fs'
import * as db from './db'
import * as XLSX from 'xlsx'

export async function exportToJSON() {
  const todos = await db.getAllTodos()
  const tags = await db.getAllTags()

  // Get tags for each todo
  for (const todo of todos) {
    todo.tags = await db.getTodoTags(todo.id)
  }

  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    todos,
    tags,
  }

  const filePath = await save({
    defaultPath: `dailydo-backup-${formatDate(new Date())}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })

  if (filePath) {
    await writeTextFile(filePath, JSON.stringify(data, null, 2))
    return true
  }
  return false
}

export async function importFromJSON() {
  const filePath = await open({
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })

  if (!filePath) return false

  const content = await readTextFile(filePath)
  const data = JSON.parse(content)

  if (!data.todos || !data.tags) {
    throw new Error('无效的备份文件格式')
  }

  // Import tags first
  for (const tag of data.tags) {
    if (!tag.is_preset) {
      try {
        await db.createTag({ name: tag.name, color: tag.color })
      } catch (e) {
        // Tag might already exist, skip
      }
    }
  }

  // Get all tags to map names to IDs
  const allTags = await db.getAllTags()
  const tagNameToId = {}
  allTags.forEach(t => {
    tagNameToId[t.name] = t.id
  })

  // Import todos
  for (const todo of data.todos) {
    const tagIds = (todo.tags || []).map(t => tagNameToId[t.name]).filter(Boolean)

    const created = await db.createTodo({
      title: todo.title,
      notes: todo.notes || '',
      status: todo.status || 'pending',
      priority: todo.priority || 'medium',
      due_date: todo.due_date || null,
      todo_date: todo.todo_date,
      recurrence_type: todo.recurrence_type || 'none',
      recurrence_config: todo.recurrence_config || '{}',
      recurrence_group_id: todo.recurrence_group_id || null,
    })

    if (tagIds.length > 0) {
      await db.setTodoTags(created.id, tagIds)
    }
  }

  return true
}

export async function exportToMarkdown(startDate, endDate) {
  const todos = await db.getTodosByDateRange(startDate, endDate)
  const allTags = await db.getAllTags()

  let md = `# DailyDo 待办报告\n\n`
  md += `**导出时间**: ${new Date().toLocaleString('zh-CN')}\n`
  md += `**日期范围**: ${startDate} ~ ${endDate}\n\n`

  // Group by date
  const grouped = {}
  for (const todo of todos) {
    if (!grouped[todo.todo_date]) grouped[todo.todo_date] = []
    todo.tags = await db.getTodoTags(todo.id)
    grouped[todo.todo_date].push(todo)
  }

  const dates = Object.keys(grouped).sort()
  for (const date of dates) {
    const items = grouped[date]
    const done = items.filter(t => t.status === 'done').length
    md += `## ${date} (${done}/${items.length} 已完成)\n\n`
    for (const item of items) {
      const statusIcon = item.status === 'done' ? '[x]' : item.status === 'in_progress' ? '[~]' : '[ ]'
      const priorityIcon = item.priority === 'high' ? ' 🔴' : item.priority === 'medium' ? ' 🟡' : ' 🟢'
      const tagStr = (item.tags || []).map(t => `\`${t.name}\``).join(' ')
      md += `- ${statusIcon} **${item.title}**${priorityIcon}${tagStr ? ' ' + tagStr : ''}\n`
      if (item.notes && item.notes !== '<p><br></p>' && item.notes !== '') {
        md += `  ${item.notes.replace(/<[^>]*>/g, '').substring(0, 100)}\n`
      }
    }
    md += '\n'
  }

  const filePath = await save({
    defaultPath: `dailydo-report-${formatDate(new Date())}.md`,
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  })

  if (filePath) {
    await writeTextFile(filePath, md)
    return true
  }
  return false
}

export async function exportToExcel(startDate, endDate) {
  const todos = await db.getTodosByDateRange(startDate, endDate)

  // Get tags for each todo
  for (const todo of todos) {
    todo.tags = await db.getTodoTags(todo.id)
  }

  const statusMap = { pending: '待处理', in_progress: '进行中', done: '已完成' }
  const priorityMap = { high: '高', medium: '中', low: '低' }

  const rows = todos.map(todo => ({
    日期: todo.todo_date,
    标题: todo.title,
    状态: statusMap[todo.status] || todo.status,
    优先级: priorityMap[todo.priority] || todo.priority,
    标签: (todo.tags || []).map(t => t.name).join(', '),
    备注: (todo.notes || '').replace(/<[^>]*>/g, ''),
    完成时间: todo.completed_at || '',
    创建时间: todo.created_at || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '待办数据')

  // Set column widths
  ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 8 }, { wch: 6 }, { wch: 20 }, { wch: 40 }, { wch: 20 }, { wch: 20 }]

  const filePath = await save({
    defaultPath: `dailydo-report-${formatDate(new Date())}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }],
  })

  if (filePath) {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    await writeBinaryFile(filePath, new Uint8Array(wbout))
    return true
  }
  return false
}

function formatDate(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}
