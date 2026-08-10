use rusqlite::{Connection, Result};

pub fn init_db(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            notes TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'pending',
            priority TEXT NOT NULL DEFAULT 'medium',
            due_date TEXT,
            todo_date TEXT NOT NULL,
            recurrence_type TEXT NOT NULL DEFAULT 'none',
            recurrence_config TEXT DEFAULT '{}',
            recurrence_group_id TEXT,
            recurrence_enabled INTEGER NOT NULL DEFAULT 1,
            completed_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT,
            attachment_path TEXT,
            attachment_name TEXT,
            attachment_size INTEGER DEFAULT 0,
            reminder_at TEXT
        );

        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL DEFAULT '#6366f1',
            is_preset INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS todo_tags (
            todo_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY (todo_id, tag_id),
            FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS calendar_days (
            date TEXT PRIMARY KEY,
            day_type TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS todo_steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            todo_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS todo_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            title TEXT NOT NULL,
            notes TEXT DEFAULT '',
            priority TEXT NOT NULL DEFAULT 'medium',
            recurrence_type TEXT NOT NULL DEFAULT 'none',
            recurrence_config TEXT DEFAULT '{}',
            tag_ids TEXT DEFAULT '[]',
            locked_fields TEXT DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS template_steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            template_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (template_id) REFERENCES todo_templates(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS todo_activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            todo_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            old_status TEXT,
            new_status TEXT,
            detail TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_todos_todo_date ON todos(todo_date);
        CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
        CREATE INDEX IF NOT EXISTS idx_todos_deleted ON todos(deleted_at);
        CREATE INDEX IF NOT EXISTS idx_todo_tags_todo ON todo_tags(todo_id);
        CREATE INDEX IF NOT EXISTS idx_todo_tags_tag ON todo_tags(tag_id);
        CREATE INDEX IF NOT EXISTS idx_todo_steps_todo ON todo_steps(todo_id);
        CREATE INDEX IF NOT EXISTS idx_activity_log_todo ON todo_activity_log(todo_id);
        "
    )?;

    // Migration: add new columns if they don't exist (for existing databases)
    let columns: Vec<String> = conn
        .prepare("PRAGMA table_info(todos)")?
        .query_map([], |row| row.get::<_, String>(1))?
        .filter_map(|r| r.ok())
        .collect();

    if !columns.contains(&"deleted_at".to_string()) {
        conn.execute_batch("ALTER TABLE todos ADD COLUMN deleted_at TEXT;")?;
    }
    if !columns.contains(&"attachment_path".to_string()) {
        conn.execute_batch(
            "ALTER TABLE todos ADD COLUMN attachment_path TEXT;
             ALTER TABLE todos ADD COLUMN attachment_name TEXT;
             ALTER TABLE todos ADD COLUMN attachment_size INTEGER DEFAULT 0;",
        )?;
    }
    if !columns.contains(&"reminder_at".to_string()) {
        conn.execute_batch("ALTER TABLE todos ADD COLUMN reminder_at TEXT;")?;
    }
    if !columns.contains(&"recurrence_enabled".to_string()) {
        conn.execute_batch("ALTER TABLE todos ADD COLUMN recurrence_enabled INTEGER NOT NULL DEFAULT 1;")?;
    }

    // Check todo_templates columns for migration
    let tpl_columns: Vec<String> = conn
        .prepare("PRAGMA table_info(todo_templates)")?
        .query_map([], |row| row.get::<_, String>(1))?
        .filter_map(|r| r.ok())
        .collect();

    if !tpl_columns.contains(&"locked_fields".to_string()) {
        conn.execute_batch("ALTER TABLE todo_templates ADD COLUMN locked_fields TEXT DEFAULT '[]';")?;
    }

    // Insert preset tags if they don't exist
    let preset_tags = vec![
        ("会议", "#f59e0b"),
        ("代码评审", "#8b5cf6"),
        ("Bug修复", "#ef4444"),
        ("需求开发", "#3b82f6"),
        ("技术调研", "#06b6d4"),
        ("文档编写", "#10b981"),
        ("沟通协调", "#f97316"),
        ("方案设计", "#ec4899"),
        ("部署上线", "#6366f1"),
        ("学习成长", "#14b8a6"),
    ];

    let now = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    for (name, color) in preset_tags {
        conn.execute(
            "INSERT OR IGNORE INTO tags (name, color, is_preset, created_at) VALUES (?1, ?2, 1, ?3)",
            rusqlite::params![name, color, &now],
        )?;
    }

    // Insert default settings
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', '\"light\"')",
        [],
    )?;

    Ok(())
}
