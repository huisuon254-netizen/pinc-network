#![allow(dead_code)]

pub mod errors;
pub mod core;
mod commands;
mod startup;

use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as AsyncMutex;
use tauri::Manager;
use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = rustls::crypto::ring::default_provider().install_default();

    env_logger::Builder::new()
        .filter_level(log::LevelFilter::Info)
        .format_timestamp_millis()
        .init();

    tauri::Builder::default()
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

            let mut discovery = core::network::discovery::Discovery::new();
            discovery.add_bootstrap("127.0.0.1:9000");

            app.manage(AppState {
                db: Arc::new(Mutex::new(db)),
                nexus: Arc::new(Mutex::new(core::infrastructure::nexus::NexusEngine::new())),
                rift: Arc::new(Mutex::new(core::infrastructure::rift::RiftEngine::new())),
                kingsman: Arc::new(Mutex::new(core::security::kingsman::KingsmanEngine::new("4813494d137e1631bba301d5acab6e7bb7aa74ce1185d456565ef51d737677b2"))),
                localization: Arc::new(AsyncMutex::new(core::settings::localization::LocalizationEngine::new())),
                peer_registry: Arc::new(Mutex::new(core::network::peer::PeerRegistry::new())),
                bandwidth: Arc::new(Mutex::new(core::network::bandwidth::BandwidthMonitor::new())),
                discovery: Arc::new(Mutex::new(discovery)),
                relay: Arc::new(Mutex::new(core::network::relay::RelayManager::new(10_000.0))),
                message_router: Arc::new(Mutex::new(core::messaging::router::MessageRouter::new())),
                metrics: Arc::new(Mutex::new(core::telemetry::metrics::MetricsCollector::new())),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Startup
            commands::cmd_run_startup,
            // Governance
            commands::cmd_activate_kingsman,
            commands::cmd_get_admin_status,
            // Nexus
            commands::cmd_run_speed_test,
            commands::cmd_toggle_net_sharing,
            // Rift
            commands::cmd_get_rift_listings,
            commands::cmd_create_server_listing,
            // Localization
            commands::cmd_download_language,
            commands::cmd_set_language,
            // Identity
            commands::cmd_has_identity,
            commands::cmd_get_identity,
            commands::cmd_create_identity,
            commands::cmd_recover_identity,
            // Node
            commands::cmd_get_node_status,
            // Vault
            commands::cmd_list_vault,
            commands::cmd_save_file,
            commands::cmd_delete_file,
            // Settings
            commands::cmd_get_settings,
            commands::cmd_update_settings,
            // Network (Phase 3)
            commands::cmd_get_network_status,
            commands::cmd_get_peers,
            commands::cmd_connect_to_peer,
            // Marketplace (Phase 6)
            commands::cmd_get_marketplace_listings,
            commands::cmd_create_job,
            // Messaging (Phase 5)
            commands::cmd_get_messages,
            commands::cmd_send_message,
            // Wallet (Phase 7)
            commands::cmd_get_wallet_balance,
            commands::cmd_get_transactions,
            // Reputation (Phase 8)
            commands::cmd_get_reputation,
            // Social (Phase 9)
            commands::cmd_get_social_feed,
            commands::cmd_create_post,
            // Wager (Phase 10)
            commands::cmd_get_wagers,
            commands::cmd_create_wager,
            // AI (Phase 11)
            commands::cmd_get_ai_agents,
            commands::cmd_run_ai_inference,
            // Distributed (Phase 4)
            commands::cmd_get_distributed_status,
            commands::cmd_get_storage_contracts,
            // Metrics
            commands::cmd_get_metrics,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PINC");
}
