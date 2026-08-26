use rand::rngs::OsRng;
use rand::RngCore;
use std::collections::HashSet;

pub const REQUIRED_KEYS: &[&str] = &[
    "PINC_MASTER_KEY_SEED",
    "PINC_JWT_SECRET",
    "PINC_DB_ENCRYPTION_KEY",
];

pub const REGIONAL_COUNTRY_VALIDATORS: &[&str] = &[
    "iso2_2chars",
    "currency_code_alpha3",
    "calling_code_plus_prefix",
    "timezone_tz_database",
    "sanctions_level_0_to_5",
    "payment_network_country_supported",
    "language_code_iso639",
];

pub fn validate_country_config(iso2: &str) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();
    let iso = iso2.trim().to_uppercase();
    if iso.len() != 2 {
        errors.push(format!(
            "Country code '{}' is not 2 characters (ISO 3166-1 alpha-2 required)",
            iso2
        ));
    }
    if !iso.chars().all(|c| c.is_ascii_uppercase()) {
        errors.push(format!(
            "Country code '{}' contains non-A-Z characters",
            iso2
        ));
    }
    let found = crate::core::regions::lookup_by_iso2(iso2).is_some();
    if !found {
        errors.push(format!(
            "Country '{}' not found in PINC regional database ({} entries loaded)",
            iso,
            crate::core::regions::COUNTRIES.len()
        ));
    }
    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

pub fn list_required_keys_for_country(iso2: &str) -> Vec<(String, String)> {
    let methods = crate::core::regions::list_payment_methods_for_country(iso2);
    methods
        .iter()
        .map(|m| (m.display_name.clone(), m.name.clone()))
        .collect()
}

pub fn generate_placeholder(key_name: &str) -> String {
    let mut seed = [0u8; 32];
    OsRng.fill_bytes(&mut seed);
    let hex = hex::encode(seed);
    log::warn!(
        "========================================================================\n\
         [SECRETS AUDIT] MISSING REQUIRED KEY: {}\n\
         ────────────────────────────────────────────────────────────────\n\
         A one-time placeholder has been generated for development only.\n\
         This placeholder MUST NOT be used in production environments.\n\
         Placeholder value (hex, 32 bytes seeded via OsRng):\n\
         {}\n\
         Export the real value in your shell or .env file immediately.\n\
         ========================================================================",
        key_name,
        hex
    );
    hex
}

fn read_env_or_file(key: &str) -> Option<String> {
    if let Ok(val) = std::env::var(key) {
        if !val.trim().is_empty() {
            return Some(val);
        }
    }
    if let Ok(env_path) = std::env::var("CARGO_MANIFEST_DIR") {
        let candidate = std::path::PathBuf::from(&env_path).join(".env");
        if candidate.exists() {
            if let Ok(content) = std::fs::read_to_string(&candidate) {
                for line in content.lines() {
                    let line = line.trim();
                    if line.is_empty() || line.starts_with('#') {
                        continue;
                    }
                    if let Some(eq_pos) = line.find('=') {
                        let k = line[..eq_pos].trim();
                        let mut v = line[eq_pos + 1..].trim();
                        if v.starts_with('"') && v.ends_with('"') && v.len() >= 2 {
                            v = &v[1..v.len() - 1];
                        }
                        if k == key && !v.is_empty() {
                            return Some(v.to_string());
                        }
                    }
                }
            }
        }
    }
    if let Ok(cwd) = std::env::current_dir() {
        let candidate = cwd.join(".env");
        if candidate.exists() {
            if let Ok(content) = std::fs::read_to_string(&candidate) {
                for line in content.lines() {
                    let line = line.trim();
                    if line.is_empty() || line.starts_with('#') {
                        continue;
                    }
                    if let Some(eq_pos) = line.find('=') {
                        let k = line[..eq_pos].trim();
                        let mut v = line[eq_pos + 1..].trim();
                        if v.starts_with('"') && v.ends_with('"') && v.len() >= 2 {
                            v = &v[1..v.len() - 1];
                        }
                        if k == key && !v.is_empty() {
                            return Some(v.to_string());
                        }
                    }
                }
            }
        }
    }
    None
}

pub fn validate_all() -> Result<(), String> {
    let mut missing_count = 0usize;
    let mut reported: HashSet<&'static str> = HashSet::new();

    for key in REQUIRED_KEYS {
        if reported.contains(key) {
            continue;
        }
        match read_env_or_file(key) {
            Some(val) => {
                let masked = if val.len() <= 8 {
                    "***".to_string()
                } else {
                    let prefix = &val[..4.min(val.len().saturating_sub(4))];
                    format!("{}***", prefix)
                };
                log::info!(
                    "[SECRETS AUDIT] OK  {} (configured, value: {})",
                    key,
                    masked
                );
            }
            None => {
                missing_count += 1;
                let placeholder = generate_placeholder(key);
                std::env::set_var(key, placeholder);
                reported.insert(key);
            }
        }
    }

    if missing_count > 0 {
        log::error!(
            "[SECRETS AUDIT] COMPLETE with {} missing required keys. \
             Placeholders were injected for this run but are INSECURE. \
             Please configure real values before deploying.",
            missing_count
        );
    } else {
        log::info!(
            "[SECRETS AUDIT] All {} required keys are configured successfully.",
            REQUIRED_KEYS.len()
        );
    }

    Ok(())
}

pub fn get_secret(key: &str) -> Option<String> {
    std::env::var(key)
        .ok()
        .and_then(|v| if v.trim().is_empty() { None } else { Some(v) })
}

pub fn is_configured(key: &str) -> bool {
    REQUIRED_KEYS.contains(&key) && get_secret(key).is_some()
}
