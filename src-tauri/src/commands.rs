use crate::AppState;
use chrono::Datelike;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Todo {
    pub id: Option<i64>,
    pub title: String,
    pub notes: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub due_date: Option<String>,
    pub todo_date: String,
    pub recurrence_type: Option<String>,
    pub recurrence_config: Option<String>,
    pub recurrence_group_id: Option<String>,
    pub recurrence_enabled: Option<bool>,
    pub completed_at: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub deleted_at: Option<String>,
    pub attachment_path: Option<String>,
    pub attachment_name: Option<String>,
    pub attachment_size: Option<i64>,
    pub reminder_at: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Tag {
    pub id: Option<i64>,
    pub name: String,
    pub color: Option<String>,
    pub is_preset: Option<bool>,
    pub created_at: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DailyCount {
    pub date: String,
    pub total: i32,
    pub completed: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TagDistribution {
    pub tag_name: String,
    pub color: String,
    pub count: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CompletionTrend {
    pub date: String,
    pub total: i32,
    pub completed: i32,
    pub rate: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PriorityDistribution {
    pub priority: String,
    pub label: String,
    pub count: i32,
    pub completed: i32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CalendarDay {
    pub date: String,
    pub day_type: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TodoStep {
    pub id: Option<i64>,
    pub todo_id: Option<i64>,
    pub title: String,
    pub completed: Option<bool>,
    pub sort_order: Option<i32>,
    pub created_at: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Template {
    pub id: Option<i64>,
    pub name: String,
    pub title: String,
    pub notes: Option<String>,
    pub priority: Option<String>,
    pub recurrence_type: Option<String>,
    pub recurrence_config: Option<String>,
    pub tag_ids: Option<String>,
    pub locked_fields: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TemplateStep {
    pub id: Option<i64>,
    pub template_id: Option<i64>,
    pub title: String,
    pub sort_order: Option<i32>,
    pub created_at: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ActivityLog {
    pub id: Option<i64>,
    pub todo_id: i64,
    pub action: String,
    pub old_status: Option<String>,
    pub new_status: Option<String>,
    pub detail: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct OverviewStats {
    pub today_total: i32,
    pub today_completed: i32,
    pub week_total: i32,
    pub week_completed: i32,
    pub pending_count: i32,
    pub streak_days: i32,
    pub trash_count: i32,
}

fn now_string() -> String {
    chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string()
}

fn today_string() -> String {
    chrono::Local::now().format("%Y-%m-%d").to_string()
}

const TODO_COLUMNS: &str = "id, title, notes, status, priority, due_date, todo_date, recurrence_type, recurrence_config, recurrence_group_id, recurrence_enabled, completed_at, created_at, updated_at, deleted_at, attachment_path, attachment_name, attachment_size, reminder_at";

fn row_to_todo(row: &rusqlite::Row) -> rusqlite::Result<Todo> {
    Ok(Todo {
        id: row.get(0)?,
        title: row.get(1)?,
        notes: row.get(2)?,
        status: row.get(3)?,
        priority: row.get(4)?,
        due_date: row.get(5)?,
        todo_date: row.get(6)?,
        recurrence_type: row.get(7)?,
        recurrence_config: row.get(8)?,
        recurrence_group_id: row.get(9)?,
        recurrence_enabled: row.get::<_, i32>(10).map(|v| v != 0).ok(),
        completed_at: row.get(11)?,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
        deleted_at: row.get(14)?,
        attachment_path: row.get(15)?,
        attachment_name: row.get(16)?,
        attachment_size: row.get(17)?,
        reminder_at: row.get(18)?,
    })
}

// ─── Todo Commands ────────────────────────────────────────────

#[tauri::command]
pub fn create_todo(state: State<AppState>, todo: Todo) -> Result<Todo, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();
    let status = todo.status.clone().unwrap_or_else(|| "pending".to_string());
    let priority = todo.priority.clone().unwrap_or_else(|| "medium".to_string());
    let recurrence_type = todo.recurrence_type.clone().unwrap_or_else(|| "none".to_string());
    let recurrence_config = todo.recurrence_config.clone().unwrap_or_else(|| "{}".to_string());
    let recurrence_enabled = todo.recurrence_enabled.unwrap_or(true);
    let notes = todo.notes.clone().unwrap_or_default();
    let completed_at = if status == "done" { Some(now.clone()) } else { None };

    db.execute(
        "INSERT INTO todos (title, notes, status, priority, due_date, todo_date, recurrence_type, recurrence_config, recurrence_group_id, recurrence_enabled, completed_at, created_at, updated_at, attachment_path, attachment_name, attachment_size, reminder_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
        params![
            todo.title,
            notes,
            status,
            priority,
            todo.due_date,
            todo.todo_date,
            recurrence_type,
            recurrence_config,
            todo.recurrence_group_id,
            recurrence_enabled as i32,
            completed_at,
            &now,
            &now,
            todo.attachment_path,
            todo.attachment_name,
            todo.attachment_size.unwrap_or(0),
            todo.reminder_at,
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = db.last_insert_rowid();

    // Log activity
    let _ = db.execute(
        "INSERT INTO todo_activity_log (todo_id, action, new_status, created_at) VALUES (?1, 'created', ?2, ?3)",
        params![id, status, &now],
    );

    Ok(Todo {
        id: Some(id),
        title: todo.title,
        notes: todo.notes,
        status: Some(status),
        priority: Some(priority),
        due_date: todo.due_date,
        todo_date: todo.todo_date,
        recurrence_type: Some(recurrence_type),
        recurrence_config: Some(recurrence_config),
        recurrence_group_id: todo.recurrence_group_id,
        recurrence_enabled: Some(recurrence_enabled),
        completed_at,
        created_at: Some(now.clone()),
        updated_at: Some(now),
        deleted_at: None,
        attachment_path: todo.attachment_path,
        attachment_name: todo.attachment_name,
        attachment_size: todo.attachment_size,
        reminder_at: todo.reminder_at,
    })
}

#[tauri::command]
pub fn update_todo(state: State<AppState>, todo: Todo) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();
    let status = todo.status.clone().unwrap_or_else(|| "pending".to_string());
    let priority = todo.priority.clone().unwrap_or_else(|| "medium".to_string());
    let recurrence_type = todo.recurrence_type.clone().unwrap_or_else(|| "none".to_string());
    let recurrence_config = todo.recurrence_config.clone().unwrap_or_else(|| "{}".to_string());
    let recurrence_enabled = todo.recurrence_enabled.unwrap_or(true);
    let notes = todo.notes.clone().unwrap_or_default();
    let completed_at = if status == "done" {
        Some(now.clone())
    } else {
        None
    };

    // Query old status for activity logging
    let old_status: Option<String> = db
        .prepare("SELECT status FROM todos WHERE id=?1")
        .map_err(|e| e.to_string())?
        .query_row(params![todo.id.unwrap()], |row| row.get(0))
        .ok();

    db.execute(
        "UPDATE todos SET title=?1, notes=?2, status=?3, priority=?4, due_date=?5, todo_date=?6,
         recurrence_type=?7, recurrence_config=?8, recurrence_group_id=?9, recurrence_enabled=?10, completed_at=?11, updated_at=?12,
         attachment_path=?13, attachment_name=?14, attachment_size=?15, reminder_at=?16
         WHERE id=?17 AND deleted_at IS NULL",
        params![
            todo.title,
            notes,
            status,
            priority,
            todo.due_date,
            todo.todo_date,
            recurrence_type,
            recurrence_config,
            todo.recurrence_group_id,
            recurrence_enabled as i32,
            completed_at,
            &now,
            todo.attachment_path,
            todo.attachment_name,
            todo.attachment_size.unwrap_or(0),
            todo.reminder_at,
            todo.id.unwrap(),
        ],
    )
    .map_err(|e| e.to_string())?;

    // Log activity: status change
    let todo_id = todo.id.unwrap();
    let old_st = old_status.clone().unwrap_or_else(|| "pending".to_string());
    if old_st != status {
        let _ = db.execute(
            "INSERT INTO todo_activity_log (todo_id, action, old_status, new_status, created_at) VALUES (?1, 'status_changed', ?2, ?3, ?4)",
            params![todo_id, old_status, &status, &now],
        );
    }

    Ok(())
}

#[tauri::command]
pub fn delete_todo(state: State<AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();
    // Soft delete: set deleted_at timestamp
    db.execute(
        "UPDATE todos SET deleted_at=?1, updated_at=?1 WHERE id=?2",
        params![&now, id],
    )
    .map_err(|e| e.to_string())?;

    // Log activity
    let _ = db.execute(
        "INSERT INTO todo_activity_log (todo_id, action, created_at) VALUES (?1, 'deleted', ?2)",
        params![id, &now],
    );

    Ok(())
}

#[tauri::command]
pub fn get_todos_by_date(state: State<AppState>, date: String) -> Result<Vec<Todo>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let query = format!(
        "SELECT {} FROM todos WHERE todo_date=?1 AND deleted_at IS NULL ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC",
        TODO_COLUMNS
    );
    let mut stmt = db.prepare(&query).map_err(|e| e.to_string())?;

    let todos = stmt
        .query_map(params![date], row_to_todo)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(todos)
}

#[tauri::command]
pub fn get_todos_by_date_range(
    state: State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<Todo>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let query = format!(
        "SELECT {} FROM todos WHERE todo_date BETWEEN ?1 AND ?2 AND deleted_at IS NULL ORDER BY todo_date DESC, created_at DESC",
        TODO_COLUMNS
    );
    let mut stmt = db.prepare(&query).map_err(|e| e.to_string())?;

    let todos = stmt
        .query_map(params![start_date, end_date], row_to_todo)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(todos)
}

#[tauri::command]
pub fn get_all_todos(state: State<AppState>) -> Result<Vec<Todo>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let query = format!(
        "SELECT {} FROM todos WHERE deleted_at IS NULL ORDER BY todo_date DESC, created_at DESC",
        TODO_COLUMNS
    );
    let mut stmt = db.prepare(&query).map_err(|e| e.to_string())?;

    let todos = stmt
        .query_map([], row_to_todo)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(todos)
}

#[tauri::command]
pub fn get_incomplete_todos(state: State<AppState>) -> Result<Vec<Todo>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let query = format!(
        "SELECT {} FROM todos WHERE status != 'done' AND deleted_at IS NULL ORDER BY todo_date DESC, created_at DESC",
        TODO_COLUMNS
    );
    let mut stmt = db.prepare(&query).map_err(|e| e.to_string())?;

    let todos = stmt
        .query_map([], row_to_todo)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(todos)
}

// ─── Trash Commands ────────────────────────────────────────────

#[tauri::command]
pub fn get_trash_todos(state: State<AppState>) -> Result<Vec<Todo>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let query = format!(
        "SELECT {} FROM todos WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC",
        TODO_COLUMNS
    );
    let mut stmt = db.prepare(&query).map_err(|e| e.to_string())?;

    let todos = stmt
        .query_map([], row_to_todo)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(todos)
}

#[tauri::command]
pub fn restore_todo(state: State<AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();
    db.execute(
        "UPDATE todos SET deleted_at=NULL, updated_at=?1 WHERE id=?2",
        params![&now, id],
    )
    .map_err(|e| e.to_string())?;

    // Log activity
    let _ = db.execute(
        "INSERT INTO todo_activity_log (todo_id, action, created_at) VALUES (?1, 'restored', ?2)",
        params![id, &now],
    );

    Ok(())
}

#[tauri::command]
pub fn permanent_delete_todo(state: State<AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM todo_tags WHERE todo_id=?1", params![id])
        .map_err(|e| e.to_string())?;
    db.execute("DELETE FROM todo_steps WHERE todo_id=?1", params![id])
        .map_err(|e| e.to_string())?;
    db.execute("DELETE FROM todos WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn clear_trash(state: State<AppState>) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    // Delete tag associations for trashed items
    db.execute(
        "DELETE FROM todo_tags WHERE todo_id IN (SELECT id FROM todos WHERE deleted_at IS NOT NULL)",
        [],
    )
    .map_err(|e| e.to_string())?;
    let count = db
        .execute("DELETE FROM todos WHERE deleted_at IS NOT NULL", [])
        .map_err(|e| e.to_string())?;
    Ok(count as i64)
}

#[tauri::command]
pub fn clean_expired_trash(state: State<AppState>) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let cutoff = chrono::Local::now()
        .checked_sub_days(chrono::Days::new(7))
        .map(|d| d.format("%Y-%m-%dT%H:%M:%S").to_string())
        .unwrap_or_default();

    // Delete tag associations for expired trash
    db.execute(
        "DELETE FROM todo_tags WHERE todo_id IN (SELECT id FROM todos WHERE deleted_at IS NOT NULL AND deleted_at < ?1)",
        params![&cutoff],
    )
    .map_err(|e| e.to_string())?;
    let count = db
        .execute(
            "DELETE FROM todos WHERE deleted_at IS NOT NULL AND deleted_at < ?1",
            params![&cutoff],
        )
        .map_err(|e| e.to_string())?;
    Ok(count as i64)
}

// ─── Attachment Commands ──────────────────────────────────────

#[tauri::command]
pub fn save_attachment(
    state: State<AppState>,
    file_path: String,
    file_name: String,
) -> Result<serde_json::Value, String> {
    let data_dir = std::path::PathBuf::from(&state.data_dir);
    let attachments_dir = data_dir.join("attachments");
    std::fs::create_dir_all(&attachments_dir).map_err(|e| e.to_string())?;

    // Generate unique filename to avoid collisions
    let timestamp = chrono::Local::now().format("%Y%m%d%H%M%S").to_string();
    let ext = std::path::Path::new(&file_name)
        .extension()
        .map(|e| format!(".{}", e.to_string_lossy()))
        .unwrap_or_default();
    let stem = std::path::Path::new(&file_name)
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "file".to_string());
    let stored_name = format!("{}_{}{}", stem, timestamp, ext);
    let dest_path = attachments_dir.join(&stored_name);

    // Copy file
    std::fs::copy(&file_path, &dest_path).map_err(|e| e.to_string())?;

    let metadata = std::fs::metadata(&dest_path).map_err(|e| e.to_string())?;
    let size = metadata.len();

    Ok(serde_json::json!({
        "path": dest_path.to_string_lossy().to_string(),
        "name": file_name,
        "size": size,
    }))
}

// ─── Daily Counts ─────────────────────────────────────────────

#[tauri::command]
pub fn get_daily_counts(
    state: State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<DailyCount>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare(
            "SELECT todo_date,
                    COUNT(*) as total,
                    SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as completed
             FROM todos WHERE todo_date BETWEEN ?1 AND ?2 AND deleted_at IS NULL
             GROUP BY todo_date ORDER BY todo_date",
        )
        .map_err(|e| e.to_string())?;

    let counts = stmt
        .query_map(params![start_date, end_date], |row| {
            Ok(DailyCount {
                date: row.get(0)?,
                total: row.get(1)?,
                completed: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(counts)
}

// ─── Tag Commands ─────────────────────────────────────────────

#[tauri::command]
pub fn get_all_tags(state: State<AppState>) -> Result<Vec<Tag>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT id, name, color, is_preset, created_at FROM tags ORDER BY is_preset DESC, name")
        .map_err(|e| e.to_string())?;

    let tags = stmt
        .query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                is_preset: row.get::<_, i32>(3).map(|v| v != 0).ok(),
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(tags)
}

#[tauri::command]
pub fn create_tag(state: State<AppState>, tag: Tag) -> Result<Tag, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();
    let color = tag.color.unwrap_or_else(|| "#6366f1".to_string());

    db.execute(
        "INSERT INTO tags (name, color, is_preset, created_at) VALUES (?1, ?2, 0, ?3)",
        params![tag.name, &color, &now],
    )
    .map_err(|e| e.to_string())?;

    let id = db.last_insert_rowid();
    Ok(Tag {
        id: Some(id),
        name: tag.name,
        color: Some(color),
        is_preset: Some(false),
        created_at: Some(now),
    })
}

#[tauri::command]
pub fn update_tag(state: State<AppState>, tag: Tag) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "UPDATE tags SET name=?1, color=?2 WHERE id=?3",
        params![tag.name, tag.color.unwrap_or_default(), tag.id.unwrap()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_tag(state: State<AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM todo_tags WHERE tag_id=?1", params![id])
        .map_err(|e| e.to_string())?;
    db.execute("DELETE FROM tags WHERE id=?1 AND is_preset=0", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_todo_tags(state: State<AppState>, todo_id: i64, tag_ids: Vec<i64>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM todo_tags WHERE todo_id=?1", params![todo_id])
        .map_err(|e| e.to_string())?;
    for tag_id in &tag_ids {
        db.execute(
            "INSERT INTO todo_tags (todo_id, tag_id) VALUES (?1, ?2)",
            params![todo_id, tag_id],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_todo_tags(state: State<AppState>, todo_id: i64) -> Result<Vec<Tag>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare(
            "SELECT t.id, t.name, t.color, t.is_preset, t.created_at
             FROM tags t INNER JOIN todo_tags tt ON t.id = tt.tag_id
             WHERE tt.todo_id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let tags = stmt
        .query_map(params![todo_id], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                is_preset: row.get::<_, i32>(3).map(|v| v != 0).ok(),
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(tags)
}

// ─── Statistics ───────────────────────────────────────────────

#[tauri::command]
pub fn get_tag_distribution(
    state: State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<TagDistribution>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare(
            "SELECT t.name, t.color, COUNT(tt.todo_id) as cnt
             FROM tags t
             INNER JOIN todo_tags tt ON t.id = tt.tag_id
             INNER JOIN todos td ON tt.todo_id = td.id
             WHERE td.todo_date BETWEEN ?1 AND ?2 AND td.status = 'done' AND td.deleted_at IS NULL
             GROUP BY t.id ORDER BY cnt DESC",
        )
        .map_err(|e| e.to_string())?;

    let dist = stmt
        .query_map(params![start_date, end_date], |row| {
            Ok(TagDistribution {
                tag_name: row.get(0)?,
                color: row.get(1)?,
                count: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(dist)
}

#[tauri::command]
pub fn get_completion_trend(
    state: State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<CompletionTrend>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare(
            "SELECT todo_date,
                    COUNT(*) as total,
                    SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as completed
             FROM todos WHERE todo_date BETWEEN ?1 AND ?2 AND deleted_at IS NULL
             GROUP BY todo_date ORDER BY todo_date",
        )
        .map_err(|e| e.to_string())?;

    let trend: Vec<CompletionTrend> = stmt
        .query_map(params![start_date, end_date], |row| {
            let total: i32 = row.get(1)?;
            let completed: i32 = row.get(2)?;
            let rate = if total > 0 {
                (completed as f64 / total as f64 * 100.0).round()
            } else {
                0.0
            };
            Ok(CompletionTrend {
                date: row.get(0)?,
                total,
                completed,
                rate,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(trend)
}

#[tauri::command]
pub fn get_priority_distribution(
    state: State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<PriorityDistribution>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare(
            "SELECT priority,
                    COUNT(*) as total,
                    SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as completed
             FROM todos WHERE todo_date BETWEEN ?1 AND ?2 AND deleted_at IS NULL
             GROUP BY priority ORDER BY total DESC",
        )
        .map_err(|e| e.to_string())?;

    let dist: Vec<PriorityDistribution> = stmt
        .query_map(params![start_date, end_date], |row| {
            let priority: String = row.get(0)?;
            let count: i32 = row.get(1)?;
            let completed: i32 = row.get(2)?;
            let label = match priority.as_str() {
                "high" => "高优先级".to_string(),
                "medium" => "中优先级".to_string(),
                "low" => "低优先级".to_string(),
                _ => priority.clone(),
            };
            Ok(PriorityDistribution {
                priority,
                label,
                count,
                completed,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(dist)
}

#[tauri::command]
pub fn get_overview_stats(state: State<AppState>) -> Result<OverviewStats, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let today = today_string();
    let week_start = chrono::Local::now()
        .checked_sub_days(chrono::Days::new(
            chrono::Local::now().weekday().num_days_from_monday() as u64,
        ))
        .map(|d| d.format("%Y-%m-%d").to_string())
        .unwrap_or_else(|| today.clone());

    let today_total: i32 = db
        .query_row(
            "SELECT COUNT(*) FROM todos WHERE todo_date=?1 AND deleted_at IS NULL",
            params![today],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let today_completed: i32 = db
        .query_row(
            "SELECT COUNT(*) FROM todos WHERE todo_date=?1 AND status='done' AND deleted_at IS NULL",
            params![today],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let week_total: i32 = db
        .query_row(
            "SELECT COUNT(*) FROM todos WHERE todo_date >= ?1 AND deleted_at IS NULL",
            params![week_start],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let week_completed: i32 = db
        .query_row(
            "SELECT COUNT(*) FROM todos WHERE todo_date >= ?1 AND status='done' AND deleted_at IS NULL",
            params![week_start],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let pending_count: i32 = db
        .query_row(
            "SELECT COUNT(*) FROM todos WHERE status != 'done' AND deleted_at IS NULL",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let trash_count: i32 = db
        .query_row(
            "SELECT COUNT(*) FROM todos WHERE deleted_at IS NOT NULL",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Calculate streak: consecutive days with all todos completed (going back from today)
    let mut streak = 0;
    let mut check_date = chrono::Local::now();
    loop {
        let date_str = check_date.format("%Y-%m-%d").to_string();
        let total: i32 = db
            .query_row(
                "SELECT COUNT(*) FROM todos WHERE todo_date=?1 AND deleted_at IS NULL",
                params![date_str],
                |row| row.get(0),
            )
            .unwrap_or(0);
        if total == 0 {
            break;
        }
        let done: i32 = db
            .query_row(
                "SELECT COUNT(*) FROM todos WHERE todo_date=?1 AND status='done' AND deleted_at IS NULL",
                params![date_str],
                |row| row.get(0),
            )
            .unwrap_or(0);
        if done < total {
            break;
        }
        streak += 1;
        check_date = match check_date.checked_sub_days(chrono::Days::new(1)) {
            Some(d) => d,
            None => break,
        };
    }

    Ok(OverviewStats {
        today_total,
        today_completed,
        week_total,
        week_completed,
        pending_count,
        streak_days: streak,
        trash_count,
    })
}

// ─── Settings ─────────────────────────────────────────────────

#[tauri::command]
pub fn get_setting(state: State<AppState>, key: String) -> Result<Option<String>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let result = db.query_row(
        "SELECT value FROM settings WHERE key=?1",
        params![key],
        |row| row.get::<_, String>(0),
    );
    match result {
        Ok(val) => Ok(Some(val)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn set_setting(state: State<AppState>, key: String, value: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_all_settings(state: State<AppState>) -> Result<Vec<(String, String)>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT key, value FROM settings")
        .map_err(|e| e.to_string())?;
    let settings = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(settings)
}

// ─── Calendar Day Commands ────────────────────────────────────

#[tauri::command]
pub fn get_calendar_days(
    state: State<AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<CalendarDay>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT date, day_type FROM calendar_days WHERE date BETWEEN ?1 AND ?2")
        .map_err(|e| e.to_string())?;

    let days = stmt
        .query_map(params![start_date, end_date], |row| {
            Ok(CalendarDay {
                date: row.get(0)?,
                day_type: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(days)
}

#[tauri::command]
pub fn set_day_type(
    state: State<AppState>,
    date: String,
    day_type: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();
    db.execute(
        "INSERT OR REPLACE INTO calendar_days (date, day_type, updated_at) VALUES (?1, ?2, ?3)",
        params![date, day_type, &now],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn remove_day_type(state: State<AppState>, date: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM calendar_days WHERE date=?1", params![date])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn is_workday(state: State<AppState>, date: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    // Check if there's a custom override
    let result = db.query_row(
        "SELECT day_type FROM calendar_days WHERE date=?1",
        params![date],
        |row| row.get::<_, String>(0),
    );
    match result {
        Ok(day_type) => Ok(day_type == "workday"),
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            // No override: use default (Mon-Fri = workday, Sat-Sun = rest)
            let d = chrono::NaiveDate::parse_from_str(&date, "%Y-%m-%d")
                .map_err(|e| e.to_string())?;
            let weekday = d.weekday().num_days_from_monday();
            Ok(weekday < 5) // 0=Mon .. 4=Fri = workday
        }
        Err(e) => Err(e.to_string()),
    }
}

// ─── Reminder Commands ────────────────────────────────────────

#[tauri::command]
pub fn get_pending_reminders(state: State<AppState>) -> Result<Vec<Todo>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().format("%Y-%m-%dT%H:%M").to_string();
    let query = format!(
        "SELECT {} FROM todos WHERE reminder_at IS NOT NULL AND reminder_at <= ?1 AND status != 'done' AND deleted_at IS NULL",
        TODO_COLUMNS
    );
    let mut stmt = db.prepare(&query).map_err(|e| e.to_string())?;

    let todos = stmt
        .query_map(params![now], row_to_todo)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(todos)
}

// ─── Recurrence Group Commands ────────────────────────────────

#[tauri::command]
pub fn toggle_recurrence_enabled(
    state: State<AppState>,
    group_id: String,
    enabled: bool,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();

    // Handle orphaned todos: if group_id starts with "single_", extract the todo ID
    if let Some(todo_id_str) = group_id.strip_prefix("single_") {
        if let Ok(todo_id) = todo_id_str.parse::<i64>() {
            db.execute(
                "UPDATE todos SET recurrence_enabled=?1, updated_at=?2 WHERE id=?3 AND deleted_at IS NULL",
                params![enabled as i32, &now, todo_id],
            )
            .map_err(|e| e.to_string())?;
            return Ok(());
        }
    }

    db.execute(
        "UPDATE todos SET recurrence_enabled=?1, updated_at=?2 WHERE recurrence_group_id=?3 AND deleted_at IS NULL",
        params![enabled as i32, &now, &group_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_recurrence_group(
    state: State<AppState>,
    group_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();

    // Handle orphaned todos: if group_id starts with "single_", extract the todo ID
    if let Some(todo_id_str) = group_id.strip_prefix("single_") {
        if let Ok(todo_id) = todo_id_str.parse::<i64>() {
            db.execute(
                "UPDATE todos SET deleted_at=?1, updated_at=?1 WHERE id=?2 AND deleted_at IS NULL",
                params![&now, todo_id],
            )
            .map_err(|e| e.to_string())?;
            return Ok(());
        }
    }

    // Soft delete all todos in the group
    db.execute(
        "UPDATE todos SET deleted_at=?1, updated_at=?1 WHERE recurrence_group_id=?2 AND deleted_at IS NULL",
        params![&now, &group_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Todo Step Commands ───────────────────────────────────────

#[tauri::command]
pub fn get_steps_by_todo_id(
    state: State<AppState>,
    todo_id: i64,
) -> Result<Vec<TodoStep>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT id, todo_id, title, completed, sort_order, created_at FROM todo_steps WHERE todo_id=?1 ORDER BY sort_order, id")
        .map_err(|e| e.to_string())?;

    let steps = stmt
        .query_map(params![todo_id], |row| {
            Ok(TodoStep {
                id: row.get(0)?,
                todo_id: row.get(1)?,
                title: row.get(2)?,
                completed: row.get::<_, i32>(3).map(|v| v != 0).ok(),
                sort_order: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(steps)
}

#[tauri::command]
pub fn save_todo_steps(
    state: State<AppState>,
    todo_id: i64,
    steps: Vec<TodoStep>,
) -> Result<Vec<TodoStep>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();

    // Delete existing steps for this todo
    db.execute("DELETE FROM todo_steps WHERE todo_id=?1", params![todo_id])
        .map_err(|e| e.to_string())?;

    // Insert new steps
    let mut result = Vec::new();
    for (idx, step) in steps.iter().enumerate() {
        if step.title.trim().is_empty() {
            continue;
        }
        let completed = step.completed.unwrap_or(false);
        db.execute(
            "INSERT INTO todo_steps (todo_id, title, completed, sort_order, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![todo_id, step.title.trim(), completed as i32, idx as i32, &now],
        )
        .map_err(|e| e.to_string())?;

        let id = db.last_insert_rowid();
        result.push(TodoStep {
            id: Some(id),
            todo_id: Some(todo_id),
            title: step.title.trim().to_string(),
            completed: Some(completed),
            sort_order: Some(idx as i32),
            created_at: Some(now.clone()),
        });
    }

    Ok(result)
}

#[tauri::command]
pub fn toggle_step_completed(
    state: State<AppState>,
    step_id: i64,
) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();

    // Get the step to find its todo_id and current state
    let step: TodoStep = db
        .query_row(
            "SELECT id, todo_id, title, completed, sort_order, created_at FROM todo_steps WHERE id=?1",
            params![step_id],
            |row| {
                Ok(TodoStep {
                    id: row.get(0)?,
                    todo_id: row.get(1)?,
                    title: row.get(2)?,
                    completed: row.get::<_, i32>(3).map(|v| v != 0).ok(),
                    sort_order: row.get(4)?,
                    created_at: row.get(5)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let new_completed = !step.completed.unwrap_or(false);
    let step_todo_id = step.todo_id.unwrap_or(0);

    // Toggle the step
    db.execute(
        "UPDATE todo_steps SET completed=?1 WHERE id=?2",
        params![new_completed as i32, step_id],
    )
    .map_err(|e| e.to_string())?;

    // Check if all steps for this todo are now completed
    let total_count: i32 = db
        .query_row(
            "SELECT COUNT(*) FROM todo_steps WHERE todo_id=?1",
            params![step_todo_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let completed_count: i32 = db
        .query_row(
            "SELECT COUNT(*) FROM todo_steps WHERE todo_id=?1 AND completed=1",
            params![step_todo_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let all_done = total_count > 0 && completed_count == total_count;

    // If all steps are done, auto-mark the todo as done; otherwise set to in_progress
    if total_count > 0 {
        let new_status = if all_done { "done" } else { "in_progress" };
        let completed_at = if all_done { Some(now.clone()) } else { None };

        // Get old status for activity logging
        let old_status: Option<String> = db
            .prepare("SELECT status FROM todos WHERE id=?1")
            .map_err(|e| e.to_string())?
            .query_row(params![step_todo_id], |row| row.get(0))
            .ok();

        db.execute(
            "UPDATE todos SET status=?1, completed_at=?2, updated_at=?3 WHERE id=?4 AND deleted_at IS NULL",
            params![new_status, completed_at, &now, step_todo_id],
        )
        .map_err(|e| e.to_string())?;

        // Log step toggle activity
        let step_action = if new_completed { "step_completed" } else { "step_reopened" };
        let _ = db.execute(
            "INSERT INTO todo_activity_log (todo_id, action, detail, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![step_todo_id, step_action, &step.title, &now],
        );

        // Log status change if it differs
        let old_st = old_status.unwrap_or_else(|| "pending".to_string());
        if old_st != new_status {
            let _ = db.execute(
                "INSERT INTO todo_activity_log (todo_id, action, old_status, new_status, created_at) VALUES (?1, 'status_changed', ?2, ?3, ?4)",
                params![step_todo_id, &old_st, new_status, &now],
            );
        }
    }

    Ok(new_completed)
}

// ─── Template Commands ────────────────────────────────────────

#[tauri::command]
pub fn get_all_templates(state: State<AppState>) -> Result<Vec<Template>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare(
            "SELECT id, name, title, notes, priority, recurrence_type, recurrence_config, tag_ids, locked_fields, created_at, updated_at
             FROM todo_templates ORDER BY updated_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let templates = stmt
        .query_map([], |row| {
            Ok(Template {
                id: row.get(0)?,
                name: row.get(1)?,
                title: row.get(2)?,
                notes: row.get(3)?,
                priority: row.get(4)?,
                recurrence_type: row.get(5)?,
                recurrence_config: row.get(6)?,
                tag_ids: row.get(7)?,
                locked_fields: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(templates)
}

#[tauri::command]
pub fn create_template(state: State<AppState>, template: Template) -> Result<Template, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();
    let priority = template.priority.clone().unwrap_or_else(|| "medium".to_string());
    let recurrence_type = template.recurrence_type.clone().unwrap_or_else(|| "none".to_string());
    let recurrence_config = template.recurrence_config.clone().unwrap_or_else(|| "{}".to_string());
    let tag_ids = template.tag_ids.clone().unwrap_or_else(|| "[]".to_string());
    let locked_fields = template.locked_fields.clone().unwrap_or_else(|| "[]".to_string());
    let notes = template.notes.clone().unwrap_or_default();

    db.execute(
        "INSERT INTO todo_templates (name, title, notes, priority, recurrence_type, recurrence_config, tag_ids, locked_fields, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            template.name,
            template.title,
            notes,
            priority,
            recurrence_type,
            recurrence_config,
            tag_ids,
            locked_fields,
            &now,
            &now,
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = db.last_insert_rowid();
    Ok(Template {
        id: Some(id),
        name: template.name,
        title: template.title,
        notes: template.notes,
        priority: Some(priority),
        recurrence_type: Some(recurrence_type),
        recurrence_config: Some(recurrence_config),
        tag_ids: Some(tag_ids),
        locked_fields: Some(locked_fields),
        created_at: Some(now.clone()),
        updated_at: Some(now),
    })
}

#[tauri::command]
pub fn update_template(state: State<AppState>, template: Template) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();
    let priority = template.priority.clone().unwrap_or_else(|| "medium".to_string());
    let recurrence_type = template.recurrence_type.clone().unwrap_or_else(|| "none".to_string());
    let recurrence_config = template.recurrence_config.clone().unwrap_or_else(|| "{}".to_string());
    let tag_ids = template.tag_ids.clone().unwrap_or_else(|| "[]".to_string());
    let locked_fields = template.locked_fields.clone().unwrap_or_else(|| "[]".to_string());
    let notes = template.notes.clone().unwrap_or_default();

    db.execute(
        "UPDATE todo_templates SET name=?1, title=?2, notes=?3, priority=?4, recurrence_type=?5,
         recurrence_config=?6, tag_ids=?7, locked_fields=?8, updated_at=?9 WHERE id=?10",
        params![
            template.name,
            template.title,
            notes,
            priority,
            recurrence_type,
            recurrence_config,
            tag_ids,
            locked_fields,
            &now,
            template.id.unwrap(),
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_template(state: State<AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM template_steps WHERE template_id=?1", params![id])
        .map_err(|e| e.to_string())?;
    db.execute("DELETE FROM todo_templates WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_template_steps(
    state: State<AppState>,
    template_id: i64,
) -> Result<Vec<TemplateStep>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare(
            "SELECT id, template_id, title, sort_order, created_at
             FROM template_steps WHERE template_id=?1 ORDER BY sort_order, id",
        )
        .map_err(|e| e.to_string())?;

    let steps = stmt
        .query_map(params![template_id], |row| {
            Ok(TemplateStep {
                id: row.get(0)?,
                template_id: row.get(1)?,
                title: row.get(2)?,
                sort_order: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(steps)
}

#[tauri::command]
pub fn save_template_steps(
    state: State<AppState>,
    template_id: i64,
    steps: Vec<TemplateStep>,
) -> Result<Vec<TemplateStep>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();

    // Delete existing steps for this template
    db.execute(
        "DELETE FROM template_steps WHERE template_id=?1",
        params![template_id],
    )
    .map_err(|e| e.to_string())?;

    // Insert new steps
    let mut result = Vec::new();
    for (idx, step) in steps.iter().enumerate() {
        if step.title.trim().is_empty() {
            continue;
        }
        db.execute(
            "INSERT INTO template_steps (template_id, title, sort_order, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![template_id, step.title.trim(), idx as i32, &now],
        )
        .map_err(|e| e.to_string())?;

        let id = db.last_insert_rowid();
        result.push(TemplateStep {
            id: Some(id),
            template_id: Some(template_id),
            title: step.title.trim().to_string(),
            sort_order: Some(idx as i32),
            created_at: Some(now.clone()),
        });
    }

    Ok(result)
}

// ─── Attachment Management Commands ───────────────────────────

/// Open a file with the system default application
#[tauri::command]
pub fn open_attachment(file_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }
    Ok(())
}

/// Show a file in the system file explorer (highlight the file)
#[tauri::command]
pub fn show_attachment_in_explorer(file_path: String) -> Result<(), String> {
    // Check if file exists
    if !std::path::Path::new(&file_path).exists() {
        return Err("文件不存在，可能已被删除".to_string());
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        let parent = std::path::Path::new(&file_path)
            .parent()
            .unwrap_or(std::path::Path::new("/"));
        std::process::Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {}", e))?;
    }
    Ok(())
}

/// Info about an attachment (for listing)
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AttachmentInfo {
    pub todo_id: i64,
    pub todo_title: String,
    pub todo_date: String,
    pub status: String,
    pub attachment_path: String,
    pub attachment_name: String,
    pub attachment_size: i64,
}

/// Get all attachments from todos (optionally filtered by status)
#[tauri::command]
pub fn get_all_attachments(state: State<AppState>, status_filter: Option<String>) -> Result<Vec<AttachmentInfo>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let sql = match status_filter.as_deref() {
        Some("done") => "SELECT id, title, todo_date, status, attachment_path, attachment_name, attachment_size FROM todos WHERE attachment_path IS NOT NULL AND attachment_path != '' AND status = 'done' AND deleted_at IS NULL ORDER BY todo_date DESC",
        Some("all") => "SELECT id, title, todo_date, status, attachment_path, attachment_name, attachment_size FROM todos WHERE attachment_path IS NOT NULL AND attachment_path != '' AND deleted_at IS NULL ORDER BY todo_date DESC",
        _ => "SELECT id, title, todo_date, status, attachment_path, attachment_name, attachment_size FROM todos WHERE attachment_path IS NOT NULL AND attachment_path != '' AND deleted_at IS NULL ORDER BY todo_date DESC",
    };

    let mut stmt = db.prepare(sql).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(AttachmentInfo {
            todo_id: row.get(0)?,
            todo_title: row.get(1)?,
            todo_date: row.get(2)?,
            status: row.get(3)?,
            attachment_path: row.get(4)?,
            attachment_name: row.get(5)?,
            attachment_size: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

/// Delete attachment for a specific todo (remove file from disk + clear DB fields)
#[tauri::command]
pub fn delete_attachment(state: State<AppState>, todo_id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Get the attachment path
    let path: Option<String> = db.query_row(
        "SELECT attachment_path FROM todos WHERE id=?1 AND deleted_at IS NULL",
        params![todo_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    // Delete file from disk if it exists
    if let Some(ref file_path) = path {
        let _ = std::fs::remove_file(file_path);
    }

    // Clear attachment fields in database
    db.execute(
        "UPDATE todos SET attachment_path=NULL, attachment_name=NULL, attachment_size=0 WHERE id=?1",
        params![todo_id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Bulk delete all attachments from completed todos
#[tauri::command]
pub fn clear_completed_attachments(state: State<AppState>) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Get all attachment paths from completed todos
    let mut stmt = db.prepare(
        "SELECT attachment_path FROM todos WHERE status='done' AND attachment_path IS NOT NULL AND attachment_path != '' AND deleted_at IS NULL"
    ).map_err(|e| e.to_string())?;

    let paths: Vec<String> = stmt.query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let count = paths.len() as i64;

    // Delete files from disk
    for path in &paths {
        let _ = std::fs::remove_file(path);
    }

    // Clear attachment fields for completed todos
    db.execute(
        "UPDATE todos SET attachment_path=NULL, attachment_name=NULL, attachment_size=0 WHERE status='done' AND attachment_path IS NOT NULL AND deleted_at IS NULL",
        [],
    ).map_err(|e| e.to_string())?;

    Ok(count)
}

// ─── Activity Log Commands ─────────────────────────────────────

#[tauri::command]
pub fn get_activity_logs_by_todo_id(state: State<AppState>, todo_id: i64) -> Result<Vec<ActivityLog>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare(
        "SELECT id, todo_id, action, old_status, new_status, detail, created_at FROM todo_activity_log WHERE todo_id=?1 ORDER BY created_at ASC"
    ).map_err(|e| e.to_string())?;

    let logs = stmt.query_map(params![todo_id], |row| {
        Ok(ActivityLog {
            id: row.get(0)?,
            todo_id: row.get(1)?,
            action: row.get(2)?,
            old_status: row.get(3)?,
            new_status: row.get(4)?,
            detail: row.get(5)?,
            created_at: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(logs)
}

#[tauri::command]
pub fn add_activity_log(state: State<AppState>, log: ActivityLog) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();
    db.execute(
        "INSERT INTO todo_activity_log (todo_id, action, old_status, new_status, detail, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![log.todo_id, log.action, log.old_status, log.new_status, log.detail, now],
    ).map_err(|e| e.to_string())?;
    Ok(db.last_insert_rowid())
}

// ─── Gantt Chart Commands ──────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GanttTodo {
    pub id: i64,
    pub title: String,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub created_at: Option<String>,
    pub completed_at: Option<String>,
    pub logs: Vec<ActivityLog>,
}

#[tauri::command]
pub fn get_gantt_data(state: State<AppState>, date: String) -> Result<Vec<GanttTodo>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Get all non-deleted todos for the given date
    let mut todo_stmt = db.prepare(
        "SELECT id, title, status, priority, created_at, completed_at FROM todos WHERE todo_date=?1 AND deleted_at IS NULL ORDER BY created_at ASC"
    ).map_err(|e| e.to_string())?;

    struct TodoRow {
        id: i64,
        title: String,
        status: Option<String>,
        priority: Option<String>,
        created_at: Option<String>,
        completed_at: Option<String>,
    }

    let todo_rows: Vec<TodoRow> = todo_stmt.query_map(params![date], |row| {
        Ok(TodoRow {
            id: row.get(0)?,
            title: row.get(1)?,
            status: row.get(2)?,
            priority: row.get(3)?,
            created_at: row.get(4)?,
            completed_at: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    // For each todo, fetch its activity logs
    let mut result = Vec::new();
    for todo in todo_rows {
        let mut log_stmt = db.prepare(
            "SELECT id, todo_id, action, old_status, new_status, detail, created_at FROM todo_activity_log WHERE todo_id=?1 ORDER BY created_at ASC"
        ).map_err(|e| e.to_string())?;

        let logs: Vec<ActivityLog> = log_stmt.query_map(params![todo.id], |row| {
            Ok(ActivityLog {
                id: row.get(0)?,
                todo_id: row.get(1)?,
                action: row.get(2)?,
                old_status: row.get(3)?,
                new_status: row.get(4)?,
                detail: row.get(5)?,
                created_at: row.get(6)?,
            })
        }).map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

        result.push(GanttTodo {
            id: todo.id,
            title: todo.title,
            status: todo.status,
            priority: todo.priority,
            created_at: todo.created_at,
            completed_at: todo.completed_at,
            logs,
        });
    }

    Ok(result)
}

// ─── Data Directory Commands ──────────────────────────────────

#[tauri::command]
pub fn get_data_dir(state: State<AppState>) -> Result<String, String> {
    Ok(state.data_dir.clone())
}

#[tauri::command]
pub fn get_default_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    let dir = app
        .path_resolver()
        .app_data_dir()
        .ok_or("cannot resolve app data dir")?;
    Ok(dir.to_string_lossy().to_string())
}

fn copy_dir_all(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            std::fs::copy(entry.path(), &dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn migrate_data_dir(
    app: tauri::AppHandle,
    state: State<AppState>,
    new_path: String,
) -> Result<(), String> {
    let default_dir = app
        .path_resolver()
        .app_data_dir()
        .ok_or("cannot resolve app data dir")?;
    let current_dir = std::path::PathBuf::from(&state.data_dir);
    let new_dir = std::path::Path::new(&new_path);

    if new_path.is_empty() {
        return Err("路径不能为空".to_string());
    }
    if new_dir == current_dir.as_path() {
        return Err("新路径与当前路径相同".to_string());
    }

    std::fs::create_dir_all(new_dir).map_err(|e| format!("创建目录失败: {}", e))?;

    let db_file = current_dir.join("dailydo.db");
    if db_file.exists() {
        std::fs::copy(&db_file, new_dir.join("dailydo.db"))
            .map_err(|e| format!("复制数据库失败: {}", e))?;
    }

    let attachments_src = current_dir.join("attachments");
    if attachments_src.exists() {
        copy_dir_all(&attachments_src, &new_dir.join("attachments"))
            .map_err(|e| format!("复制附件失败: {}", e))?;
    }

    let backgrounds_src = current_dir.join("backgrounds");
    if backgrounds_src.exists() {
        copy_dir_all(&backgrounds_src, &new_dir.join("backgrounds"))
            .map_err(|e| format!("复制背景失败: {}", e))?;
    }

    std::fs::create_dir_all(&default_dir).map_err(|e| format!("创建默认目录失败: {}", e))?;
    let override_file = default_dir.join("data_path_override");
    std::fs::write(&override_file, &new_path)
        .map_err(|e| format!("写入覆盖文件失败: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn delete_data_path_override(app: tauri::AppHandle) -> Result<(), String> {
    let default_dir = app
        .path_resolver()
        .app_data_dir()
        .ok_or("cannot resolve app data dir")?;
    let override_file = default_dir.join("data_path_override");
    if override_file.exists() {
        std::fs::remove_file(&override_file).map_err(|e| format!("删除覆盖文件失败: {}", e))?;
    }
    Ok(())
}

// ─── Custom Field Commands ────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CustomField {
    pub id: Option<i64>,
    pub name: String,
    pub field_type: Option<String>,
    pub enum_values: Option<String>,
    pub sort_order: Option<i32>,
    pub created_at: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CustomFieldValue {
    pub id: Option<i64>,
    pub todo_id: Option<i64>,
    pub field_id: i64,
    pub value: Option<String>,
}

#[tauri::command]
pub fn get_custom_fields(state: State<AppState>) -> Result<Vec<CustomField>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT id, name, field_type, enum_values, sort_order, created_at FROM custom_fields ORDER BY sort_order, id")
        .map_err(|e| e.to_string())?;

    let fields = stmt
        .query_map([], |row| {
            Ok(CustomField {
                id: row.get(0)?,
                name: row.get(1)?,
                field_type: row.get(2)?,
                enum_values: row.get(3)?,
                sort_order: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(fields)
}

#[tauri::command]
pub fn create_custom_field(state: State<AppState>, field: CustomField) -> Result<CustomField, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = now_string();
    let field_type = field.field_type.unwrap_or_else(|| "text".to_string());
    let enum_values = field.enum_values.unwrap_or_else(|| "[]".to_string());

    let max_order: i32 = db
        .query_row("SELECT COALESCE(MAX(sort_order), 0) FROM custom_fields", [], |row| row.get(0))
        .unwrap_or(0);

    db.execute(
        "INSERT INTO custom_fields (name, field_type, enum_values, sort_order, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![&field.name, &field_type, &enum_values, max_order + 1, &now],
    )
    .map_err(|e| e.to_string())?;

    let id = db.last_insert_rowid();
    Ok(CustomField {
        id: Some(id),
        name: field.name,
        field_type: Some(field_type),
        enum_values: Some(enum_values),
        sort_order: Some(max_order + 1),
        created_at: Some(now),
    })
}

#[tauri::command]
pub fn update_custom_field(state: State<AppState>, field: CustomField) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let id = field.id.ok_or("field id is required")?;
    let field_type = field.field_type.unwrap_or_else(|| "text".to_string());
    let enum_values = field.enum_values.unwrap_or_else(|| "[]".to_string());
    let sort_order = field.sort_order.unwrap_or(0);

    db.execute(
        "UPDATE custom_fields SET name=?1, field_type=?2, enum_values=?3, sort_order=?4 WHERE id=?5",
        params![&field.name, &field_type, &enum_values, sort_order, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_custom_field(state: State<AppState>, id: i64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM custom_field_values WHERE field_id=?1", params![id])
        .map_err(|e| e.to_string())?;
    db.execute("DELETE FROM custom_fields WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_custom_field_values(state: State<AppState>, todo_id: i64) -> Result<Vec<CustomFieldValue>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT id, todo_id, field_id, value FROM custom_field_values WHERE todo_id=?1")
        .map_err(|e| e.to_string())?;

    let values = stmt
        .query_map(params![todo_id], |row| {
            Ok(CustomFieldValue {
                id: row.get(0)?,
                todo_id: row.get(1)?,
                field_id: row.get(2)?,
                value: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(values)
}

#[tauri::command]
pub fn set_custom_field_values(
    state: State<AppState>,
    todo_id: i64,
    values: Vec<CustomFieldValue>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.execute(
        "DELETE FROM custom_field_values WHERE todo_id=?1",
        params![todo_id],
    )
    .map_err(|e| e.to_string())?;

    for cfv in &values {
        let val = cfv.value.clone().unwrap_or_default();
        db.execute(
            "INSERT INTO custom_field_values (todo_id, field_id, value) VALUES (?1, ?2, ?3)",
            params![todo_id, cfv.field_id, &val],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

// ─── Filtered Todos Command ───────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CustomFieldFilter {
    pub field_id: i64,
    pub value: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TodoFilter {
    pub search: Option<String>,
    pub status: Option<String>,
    pub tag_ids: Option<Vec<i64>>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub custom_field_filters: Option<Vec<CustomFieldFilter>>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

const TODO_COLUMNS_PREFIXED: &str = "t.id, t.title, t.notes, t.status, t.priority, t.due_date, t.todo_date, t.recurrence_type, t.recurrence_config, t.recurrence_group_id, t.recurrence_enabled, t.completed_at, t.created_at, t.updated_at, t.deleted_at, t.attachment_path, t.attachment_name, t.attachment_size, t.reminder_at";

#[tauri::command]
pub fn get_filtered_todos(
    state: State<AppState>,
    filter: TodoFilter,
) -> Result<Vec<Todo>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut conditions: Vec<String> = vec!["t.deleted_at IS NULL".to_string()];
    let mut param_values: Vec<String> = Vec::new();

    if let Some(ref search) = filter.search {
        if !search.is_empty() {
            param_values.push(format!("%{}%", search));
            let idx = param_values.len();
            conditions.push(format!("(t.title LIKE ?{0} OR t.notes LIKE ?{0})", idx));
        }
    }

    if let Some(ref status) = filter.status {
        if !status.is_empty() && status != "all" {
            param_values.push(status.clone());
            let idx = param_values.len();
            conditions.push(format!("t.status = ?{}", idx));
        }
    }

    if let Some(ref start) = filter.start_date {
        if !start.is_empty() {
            param_values.push(start.clone());
            let idx = param_values.len();
            conditions.push(format!("t.todo_date >= ?{}", idx));
        }
    }
    if let Some(ref end) = filter.end_date {
        if !end.is_empty() {
            param_values.push(end.clone());
            let idx = param_values.len();
            conditions.push(format!("t.todo_date <= ?{}", idx));
        }
    }

    if let Some(ref tag_ids) = filter.tag_ids {
        if !tag_ids.is_empty() {
            let ids_str: Vec<String> = tag_ids.iter().map(|id| id.to_string()).collect();
            param_values.push(ids_str.join(","));
            let idx = param_values.len();
            conditions.push(format!(
                "t.id IN (SELECT todo_id FROM todo_tags WHERE tag_id IN (SELECT value FROM json_each(?{0})) GROUP BY todo_id HAVING COUNT(DISTINCT tag_id) = {1})",
                idx,
                tag_ids.len()
            ));
        }
    }

    if let Some(ref cf_filters) = filter.custom_field_filters {
        for cf in cf_filters {
            if !cf.value.is_empty() {
                param_values.push(format!("%{}%", cf.value));
                let idx = param_values.len();
                conditions.push(format!(
                    "t.id IN (SELECT todo_id FROM custom_field_values WHERE field_id = {} AND value LIKE ?{})",
                    cf.field_id, idx
                ));
            }
        }
    }

    let where_clause = format!("WHERE {}", conditions.join(" AND "));

    let sort_column: &str = match filter.sort_by.as_deref() {
        Some("todo_date") => "t.todo_date",
        Some("priority") => "CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END",
        Some("status") => "CASE t.status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'blocked' THEN 2 ELSE 3 END",
        Some("created_at") => "t.created_at",
        Some("title") => "t.title",
        _ => "t.todo_date",
    };

    let sort_dir = match filter.sort_order.as_deref() {
        Some("ASC") => "ASC",
        _ => "DESC",
    };

    let query = format!(
        "SELECT {} FROM todos t {} ORDER BY {} {}",
        TODO_COLUMNS_PREFIXED, where_clause, sort_column, sort_dir
    );

    let mut stmt = db.prepare(&query).map_err(|e| e.to_string())?;

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = param_values
        .iter()
        .map(|s| s as &dyn rusqlite::types::ToSql)
        .collect();

    let todos = stmt
        .query_map(params_refs.as_slice(), row_to_todo)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(todos)
}
