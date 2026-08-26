

pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
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
        .setup(|_app| {
            log::info!("PINC Admin: setup complete, window ready");
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
            commands::cmd_admin_list_transactions,
            commands::cmd_admin_freeze_identity,
            commands::cmd_admin_suspend_user,
            commands::cmd_admin_send_notification,
            commands::cmd_admin_toggle_feature,
            commands::cmd_admin_get_fees,
            commands::cmd_admin_set_fees,
            commands::cmd_admin_get_wallet_types,
            commands::cmd_admin_add_wallet_type,
            commands::cmd_admin_remove_wallet_type,
            commands::cmd_admin_get_wallet_balances,
            commands::cmd_admin_get_all_transactions,
            commands::cmd_admin_get_payment_sources,
            commands::cmd_admin_add_payment_source,
            commands::cmd_admin_update_payment_source,
            commands::cmd_admin_super_admin_data,
            commands::cmd_admin_apply_global_changes,
            commands::cmd_admin_premium_plans,
            commands::cmd_admin_create_plan,
            commands::cmd_admin_update_plan,
            commands::cmd_admin_treific_data,
            commands::cmd_admin_toggle_community_feature,
            commands::cmd_admin_freeze_community,
            commands::cmd_admin_remove_community,
            commands::cmd_admin_security_threat_stats,
            commands::cmd_admin_analytics_data,
            commands::cmd_admin_sarai_fee_settings,
            commands::cmd_admin_save_sarai_fee_settings,
            commands::cmd_admin_notification_history,
            commands::cmd_admin_list_challenges,
            commands::cmd_admin_create_challenge,
            commands::cmd_admin_list_admin_challenges,
            commands::cmd_admin_publish_challenge,
            commands::cmd_admin_delete_challenge,
            commands::cmd_admin_edit_challenge,
            commands::cmd_admin_list_jobs,
            commands::cmd_admin_delete_job,
            commands::cmd_admin_edit_job,
            commands::cmd_admin_get_all_balances,
            commands::cmd_admin_list_clients,
            commands::cmd_admin_set_fee_config,
            commands::cmd_admin_force_rebalance,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PINC Admin");
}
