#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;

use db::init_db;
use std::sync::Mutex;
use rusqlite::Connection;
use tauri::Manager;

pub struct AppState {
    db: Mutex<Connection>,
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = app
                .path_resolver()
                .app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&db_path).expect("failed to create data dir");

            // Create attachments directory
            let attachments_dir = db_path.join("attachments");
            std::fs::create_dir_all(&attachments_dir).expect("failed to create attachments dir");

            // Create backgrounds directory
            let backgrounds_dir = db_path.join("backgrounds");
            std::fs::create_dir_all(&backgrounds_dir).expect("failed to create backgrounds dir");

            let db_file = db_path.join("dailydo.db");
            let conn = Connection::open(&db_file).expect("failed to open database");
            init_db(&conn).expect("failed to initialize database");

            // Auto-clean trash older than 7 days on startup
            let _ = conn.execute(
                "DELETE FROM todo_tags WHERE todo_id IN (SELECT id FROM todos WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', '-7 days'))",
                [],
            );
            let _ = conn.execute(
                "DELETE FROM todos WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', '-7 days')",
                [],
            );

            app.manage(AppState {
                db: Mutex::new(conn),
            });

            // Set initial window properties
            if let Some(window) = app.get_window("main") {
                let _ = window.set_title("DailyDo - 每日待办");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_todo,
            commands::update_todo,
            commands::delete_todo,
            commands::get_todos_by_date,
            commands::get_todos_by_date_range,
            commands::get_daily_counts,
            commands::get_tag_distribution,
            commands::get_completion_trend,
            commands::get_priority_distribution,
            commands::get_overview_stats,
            commands::get_all_tags,
            commands::create_tag,
            commands::update_tag,
            commands::delete_tag,
            commands::set_todo_tags,
            commands::get_todo_tags,
            commands::get_setting,
            commands::set_setting,
            commands::get_all_settings,
            commands::get_all_todos,
            commands::get_incomplete_todos,
            commands::get_trash_todos,
            commands::restore_todo,
            commands::permanent_delete_todo,
            commands::clear_trash,
            commands::clean_expired_trash,
            commands::save_attachment,
            commands::get_calendar_days,
            commands::set_day_type,
            commands::remove_day_type,
            commands::is_workday,
            commands::get_pending_reminders,
            commands::toggle_recurrence_enabled,
            commands::delete_recurrence_group,
            commands::get_steps_by_todo_id,
            commands::save_todo_steps,
            commands::toggle_step_completed,
            commands::get_all_templates,
            commands::create_template,
            commands::update_template,
            commands::delete_template,
            commands::get_template_steps,
            commands::save_template_steps,
            commands::open_attachment,
            commands::show_attachment_in_explorer,
            commands::get_all_attachments,
            commands::delete_attachment,
            commands::clear_completed_attachments,
            commands::get_activity_logs_by_todo_id,
            commands::add_activity_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
