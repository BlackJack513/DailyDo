#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;

use db::init_db;
use std::sync::Mutex;
use rusqlite::Connection;
use tauri::Manager;

pub struct AppState {
    db: Mutex<Connection>,
    data_dir: String,
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let default_dir = app
                .path_resolver()
                .app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&default_dir).expect("failed to create data dir");

            // Check for data path override
            let override_file = default_dir.join("data_path_override");
            let data_dir = if override_file.exists() {
                if let Ok(custom_path) = std::fs::read_to_string(&override_file) {
                    let custom_path = custom_path.trim().to_string();
                    let custom_dir = std::path::PathBuf::from(&custom_path);
                    if custom_dir.exists() && !custom_path.is_empty() {
                        std::path::PathBuf::from(custom_path)
                    } else {
                        default_dir.clone()
                    }
                } else {
                    default_dir.clone()
                }
            } else {
                default_dir.clone()
            };

            std::fs::create_dir_all(&data_dir).expect("failed to create effective data dir");

            // Create attachments directory
            let attachments_dir = data_dir.join("attachments");
            std::fs::create_dir_all(&attachments_dir).expect("failed to create attachments dir");

            // Create backgrounds directory
            let backgrounds_dir = data_dir.join("backgrounds");
            std::fs::create_dir_all(&backgrounds_dir).expect("failed to create backgrounds dir");

            let db_file = data_dir.join("dailydo.db");
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

            let data_dir_str = data_dir.to_string_lossy().to_string();
            app.manage(AppState {
                db: Mutex::new(conn),
                data_dir: data_dir_str,
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
            commands::fetch_holidays,
            commands::get_holidays_for_year,
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
            commands::get_template_custom_field_values,
            commands::set_template_custom_field_values,
            commands::open_attachment,
            commands::show_attachment_in_explorer,
            commands::get_all_attachments,
            commands::delete_attachment,
            commands::clear_completed_attachments,
            commands::get_activity_logs_by_todo_id,
            commands::add_activity_log,
            commands::get_gantt_data,
            // Data directory commands
            commands::get_data_dir,
            commands::get_default_data_dir,
            commands::migrate_data_dir,
            commands::delete_data_path_override,
            // Custom field commands
            commands::get_custom_fields,
            commands::create_custom_field,
            commands::update_custom_field,
            commands::delete_custom_field,
            commands::get_custom_field_values,
            commands::set_custom_field_values,
            // Filtered todos command
            commands::get_filtered_todos,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
