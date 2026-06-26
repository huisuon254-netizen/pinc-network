#![allow(dead_code)]

mod commands;
pub mod core;
pub mod errors;
mod startup;

#[cfg(target_os = "android")]
pub mod android;

use commands::AppState;
use std::sync::{Arc, Mutex};
use tauri::Manager;
use tokio::sync::Mutex as AsyncMutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Ignore SIGHUP so the app survives when the parent shell exits
    #[cfg(unix)]
    unsafe {
        libc::signal(libc::SIGHUP, libc::SIG_IGN);
    }

    let _ = rustls::crypto::ring::default_provider().install_default();

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
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let data_dir = app.path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));

            std::fs::create_dir_all(&data_dir).ok();
            let db_path = data_dir.join("pinc.db").to_string_lossy().to_string();

            log::info!("PINC: opening database at {}", db_path);

            let db = core::database::connection::Database::open(&db_path)
                .expect("Database must open on startup");

            core::database::migrations::run_migrations(&db)
                .expect("Migrations must succeed on startup");

            let report = startup::startup_check(&db);
            if report.all_passed {
                log::info!("PINC: all startup checks passed");
            } else {
                log::warn!(
                    "PINC: startup check failed at: {:?}",
                    report.failed_component
                );
            }

            let vault_dir = data_dir.join("vault");
            std::fs::create_dir_all(&vault_dir).ok();

            let kingsman_master_hash = match core::database::queries::get_system_config(&db, "kingsman_master_hash") {
                Ok(config) => config.config_value,
                Err(_) => {
                    log::warn!("PINC: kingsman_master_hash not found — admin auth disabled until configured");
                    String::new()
                }
            };

            let peer_registry = Arc::new(Mutex::new(core::network::peer::PeerRegistry::new()));
            let p2p_registry = peer_registry.clone();

            let ws_peer_registry = peer_registry.clone();
            let ws_app_handle = app.handle().clone();
            let web_socket_server = {
                let ws = core::networking::WebSocketServer::new(ws_peer_registry);
                ws.register_handler("webrtc_signaling".to_string(), Box::new(move |msg| {
                    use tauri::Emitter;
                    if let Ok(payload) = String::from_utf8(msg.payload.clone()) {
                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&payload) {
                            let event_name = match json.get("type").and_then(|v| v.as_str()) {
                                Some("offer") => "pinc://call-offer",
                                Some("answer") => "pinc://call-answer",
                                Some("ice-candidate") => "pinc://ice-candidate",
                                Some("hangup") => "pinc://call-hangup",
                                _ => "pinc://webrtc-unknown",
                            };
                            let _ = ws_app_handle.emit(event_name, json);
                        }
                    }
                }));
                Some(Arc::new(AsyncMutex::new(ws)))
            };

            let db_arc = Arc::new(Mutex::new(db));

            app.manage(AppState {
                db: db_arc.clone(),
                nexus: Arc::new(Mutex::new(core::infrastructure::nexus::NexusEngine::new())),
                rift: Arc::new(Mutex::new(core::infrastructure::rift::RiftEngine::new())),
                kingsman: Arc::new(Mutex::new(core::security::kingsman::KingsmanEngine::new(&kingsman_master_hash))),
                ghost_origin: Arc::new(Mutex::new(commands::GhostOriginEngine::new())),
                localization: Arc::new(AsyncMutex::new(core::settings::localization::LocalizationEngine::new())),
                peer_registry,
                bandwidth: Arc::new(Mutex::new(core::network::bandwidth::BandwidthMonitor::new())),
                discovery: Arc::new(Mutex::new(core::network::discovery::Discovery::new())),
                relay: Arc::new(Mutex::new(core::network::relay::RelayManager::new(10_000.0))),
                message_router: Arc::new(Mutex::new(core::messaging::router::MessageRouter::new())),
                metrics: Arc::new(Mutex::new(core::telemetry::metrics::MetricsCollector::new())),
                net_share: Arc::new(Mutex::new(core::net_share::NetShareEngine::new())),
                p2p_network: Arc::new(core::p2p::P2PNetwork::new(p2p_registry)),
                web_socket_server: web_socket_server.clone(),
                vault_dir,

            });

            if let Some(ws) = web_socket_server {
                let ws_clone = ws;
                tauri::async_runtime::spawn(async move {
                    let mut ws = ws_clone.lock().await;
                    if let Err(e) = ws.start() {
                        log::warn!("PINC: WebSocket server failed to start (non-fatal): {}", e);
                    } else {
                        log::info!("PINC: WebSocket server started");
                    }
                });
            }

            log::info!("PINC: setup complete, window ready");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::cmd_run_startup,
            commands::cmd_activate_kingsman,
            commands::cmd_get_admin_status,
            commands::is_admin_password,
            commands::validate_admin_access,
            commands::cmd_run_speed_test,
            commands::cmd_toggle_net_sharing,
            commands::cmd_get_wallet_balance,
            commands::cmd_get_transactions,
            commands::cmd_get_wallet_history,
            commands::cmd_get_games,
            commands::cmd_get_tournaments,
            commands::cmd_get_rift_listings,
            commands::cmd_create_server_listing,
            commands::cmd_rent_server,
            commands::cmd_return_server,
            commands::cmd_update_server_metrics,
            commands::cmd_get_server_metrics,
            commands::cmd_get_active_rentals,
            commands::cmd_download_language,
            commands::cmd_set_language,
            commands::cmd_get_ghost_origin_status,
            commands::cmd_toggle_ghost_origin,
            commands::cmd_set_ghost_origin_region,
            commands::cmd_set_ghost_origin_hops,
            commands::cmd_has_identity,
            commands::cmd_get_identity,
            commands::cmd_create_identity,
            commands::cmd_recover_identity,
            commands::cmd_get_node_status,
            commands::cmd_get_node_info,
            commands::cmd_list_vault,
            commands::cmd_list_files,
            commands::cmd_save_file,
            commands::cmd_upload_file,
            commands::cmd_download_file,
            commands::cmd_delete_file,
            commands::cmd_get_settings,
            commands::cmd_update_settings,
            commands::cmd_reset_settings_section,
            commands::cmd_reset_all_settings,
            commands::cmd_apply_settings,
            commands::cmd_get_network_status,
            commands::cmd_get_peers,
            commands::cmd_get_nodes,
            commands::cmd_connect_to_peer,
            commands::cmd_scan_network,
            commands::cmd_get_marketplace_listings,
            commands::cmd_get_marketplace_stats,
            commands::cmd_get_messages,
            commands::cmd_send_message,
            commands::cmd_get_wallet_balance,
            commands::cmd_get_transactions,
            commands::cmd_transfer_tokens,
            commands::cmd_send_payment,
            commands::cmd_get_wallet_history,
            commands::cmd_faucet_request,
            commands::cmd_create_escrow,
            commands::cmd_release_escrow,
            commands::cmd_refund_escrow,
            commands::cmd_get_reputation,
            commands::cmd_get_social_feed,
            commands::cmd_create_post,
            commands::cmd_get_wagers,
            commands::cmd_create_wager,
            commands::cmd_get_wager,
            commands::cmd_update_wager,
            commands::cmd_delete_wager,
            commands::cmd_settle_wager,
            commands::cmd_create_tournament,
            commands::cmd_join_tournament,
            commands::cmd_start_tournament,
            commands::cmd_end_tournament,
            commands::cmd_get_tournaments,
            commands::cmd_get_games,
            commands::cmd_save_game_progress,
            commands::cmd_get_game_progress,
            commands::cmd_get_user_game_stats,
            commands::cmd_get_ai_agents,
            commands::cmd_run_ai_inference,
            commands::cmd_whisper_transcribe,
            commands::cmd_llama_load_model,
            commands::cmd_llama_infer,
            commands::cmd_llama_generate,
            commands::cmd_llama_unload_model,
            commands::cmd_onnx_load_model,
            commands::cmd_onnx_segment_image,
            commands::cmd_onnx_unload_model,
            commands::cmd_tts_create_voice_profile,
            commands::cmd_tts_synthesize,
            commands::cmd_get_model_cache_stats,
            commands::cmd_clear_model_cache,
            commands::cmd_get_distributed_status,
            commands::cmd_get_storage_contracts,
            commands::cmd_repair_shards,
            commands::cmd_create_game_session,
            commands::cmd_join_game_session,
            commands::cmd_submit_score,
            commands::cmd_arena_create_duel,
            commands::cmd_create_net_store_listing,
            commands::cmd_list_net_store_listings,
            commands::cmd_purchase_bandwidth,
            commands::cmd_get_my_listings,
            commands::cmd_get_my_purchases,
            commands::cmd_get_metrics,
            commands::cmd_get_websocket_status,
            commands::cmd_websocket_broadcast,
            commands::cmd_websocket_shutdown,
            commands::cmd_generate_pairing_code,
            commands::cmd_validate_pairing_code,
            commands::cmd_generate_qr_png,
            commands::cmd_connect_with_code,
            commands::cmd_get_shared_connections,
            commands::cmd_disconnect_shared,
            commands::cmd_get_net_share_status,
            commands::cmd_toggle_net_share,
            commands::cmd_initiate_call,
            commands::cmd_answer_call,
            commands::cmd_hang_up,
            commands::cmd_get_call_status,
            commands::cmd_admin_get_overview,
            commands::cmd_admin_list_users,
            commands::cmd_admin_create_user,
            commands::cmd_admin_update_user,
            commands::cmd_admin_delete_user,
            commands::cmd_admin_toggle_user,
            commands::cmd_admin_list_logs,
            commands::cmd_admin_list_logs_filtered,
            commands::cmd_admin_list_config,
            commands::cmd_admin_update_config,
            commands::cmd_admin_delete_config,
            commands::cmd_admin_get_security,
            commands::cmd_admin_get_network_monitor,
            commands::cmd_admin_ban_peer,
            commands::cmd_admin_unban_peer,
            commands::cmd_admin_reset_password,
            commands::cmd_admin_list_banned_peers,
            commands::cmd_admin_get_kingsman_config,
            commands::cmd_admin_set_kingsman_master_hash,
            commands::cmd_admin_change_kingsman_master_hash,
            commands::cmd_admin_login,
            commands::cmd_admin_get_stats,
            commands::cmd_resolve_game_session,
            commands::cmd_get_game_sessions,
            commands::cmd_get_leaderboard,
            commands::cmd_save_game_result,
            commands::cmd_save_game_result_with_progress,
            commands::cmd_get_game_progress_all,
            commands::cmd_get_api_keys,
            commands::cmd_get_api_key_status,

            core::commands::cmd_get_starteran_status,
            core::commands::cmd_get_rentbit_status,
            core::commands::cmd_run_device_scan,
            core::commands::cmd_get_conversations,
            core::commands::cmd_get_call_history,
            core::commands::cmd_get_communities,
            core::commands::cmd_get_status_updates,
            core::commands::cmd_get_challenges,
            core::commands::cmd_get_rankings,
            core::commands::cmd_get_security_logs,
            core::commands::cmd_get_devices,
            core::commands::cmd_get_app_notifications,
            core::commands::cmd_get_jobs,
            core::commands::cmd_create_challenge,
            core::commands::cmd_add_contact,
            core::commands::cmd_list_contacts,
            core::commands::cmd_remove_contact,
            core::commands::cmd_search_users,
            core::commands::cmd_list_challenges,
            core::commands::cmd_list_problems,
            core::commands::cmd_join_challenge,
            core::commands::cmd_list_duels,
            core::commands::cmd_list_rankings,
            core::commands::cmd_list_products,
            core::commands::cmd_buy_product,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PINC");
}
