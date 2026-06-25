use tauri::Manager;

pub mod commands;

pub fn run() {
    env_logger::Builder::new()
        .filter_level(log::LevelFilter::Info)
        .format_timestamp_millis()
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            log::info!("PINC Admin: setup complete");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::cmd_admin_login,
            commands::cmd_admin_platform_stats,
            commands::cmd_admin_list_nodes,
            commands::cmd_admin_list_servers,
            commands::cmd_admin_wallet_stats,
            commands::cmd_admin_traffic_stats,
            commands::cmd_admin_game_stats,
            commands::cmd_admin_security_events,
            commands::cmd_admin_freeze_identity,
            commands::cmd_admin_suspend_user,
            commands::cmd_admin_send_notification,
            commands::cmd_admin_toggle_feature,
            commands::cmd_admin_set_fees,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PINC Admin");
}
