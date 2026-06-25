use crate::core::database::connection::Database;
use crate::core::database::queries::{get_settings_row, upsert_settings};
use super::types::PincSettings;

pub const SETTINGS_KEY: &str = "pinc_settings";

pub fn save_settings(db: &Database, settings: &PincSettings) -> Result<(), String> {
    let json = serde_json::to_string(settings).map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        rusqlite::params![SETTINGS_KEY, json],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_settings(db: &Database) -> PincSettings {
    let conn = match db.conn.lock() {
        Ok(c) => c,
        Err(_) => return PincSettings::default(),
    };
    match conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        rusqlite::params![SETTINGS_KEY],
        |row| row.get::<_, String>(0),
    ) {
        Ok(json) => serde_json::from_str(&json).unwrap_or_default(),
        Err(_) => PincSettings::default(),
    }
}

pub fn reset_settings(db: &Database, section: &str) -> Result<PincSettings, String> {
    let mut settings = load_settings(db);
    let defaults = PincSettings::default();

    match section {
        "general" => {
            settings.theme = defaults.theme;
            settings.language = defaults.language;
            settings.auto_start = defaults.auto_start;
            settings.notifications_enabled = defaults.notifications_enabled;
        }
        "network" => {
            settings.relay_enabled = defaults.relay_enabled;
            settings.bandwidth_cap_kbps = defaults.bandwidth_cap_kbps;
            settings.network_port = defaults.network_port;
            settings.max_peers = defaults.max_peers;
            settings.bootstrap_nodes = defaults.bootstrap_nodes;
        }
        "security" => {
            settings.vault_auto_compress = defaults.vault_auto_compress;
            settings.vault_auto_encrypt = defaults.vault_auto_encrypt;
            settings.telemetry_enabled = defaults.telemetry_enabled;
            settings.auto_lock_timeout_minutes = defaults.auto_lock_timeout_minutes;
            settings.biometric_enabled = defaults.biometric_enabled;
            settings.vault_key_rotation_days = defaults.vault_key_rotation_days;
        }
        "ai" => {
            settings.groq_api_key = defaults.groq_api_key;
            settings.ai_model = defaults.ai_model;
            settings.ai_local_mode = defaults.ai_local_mode;
        }
        "about" | "storage" => {
            settings.storage_limit_gb = defaults.storage_limit_gb;
            settings.auto_backup = defaults.auto_backup;
        }
        _ => return Err(format!("Unknown settings section: {}", section)),
    }

    save_settings(db, &settings)?;
    Ok(settings)
}

pub fn reset_all_settings(db: &Database) -> Result<PincSettings, String> {
    let defaults = PincSettings::default();
    save_settings(db, &defaults)?;
    Ok(defaults)
}
