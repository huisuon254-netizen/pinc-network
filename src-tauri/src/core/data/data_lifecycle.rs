use crate::core::data::types::{DataPaths, DataStats, RetentionPolicy};
use std::path::PathBuf;

pub struct DataLifecycle {
    paths: DataPaths,
    policy: RetentionPolicy,
}

impl DataLifecycle {
    pub fn new() -> Self {
        let paths = Self::default_paths();
        Self {
            paths,
            policy: RetentionPolicy::default(),
        }
    }

    pub fn with_policy(policy: RetentionPolicy) -> Self {
        let paths = Self::default_paths();
        Self { paths, policy }
    }

    pub fn with_paths(paths: DataPaths, policy: RetentionPolicy) -> Self {
        Self { paths, policy }
    }

    pub fn default_paths() -> DataPaths {
        let home = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
        let base = home.join("com.pinc.app");
        DataPaths {
            db: base.join("pinc.db"),
            vault: base.join("vault"),
            models: base.join("models"),
            cache: base.join("cache"),
            logs: base.join("logs"),
            config: base.join("config"),
            base,
        }
    }

    pub fn ensure_directories(&self) {
        for dir in [
            &self.paths.vault,
            &self.paths.models,
            &self.paths.cache,
            &self.paths.logs,
            &self.paths.config,
        ] {
            let _ = std::fs::create_dir_all(dir);
        }
    }

    pub fn get_stats(&self) -> DataStats {
        DataStats {
            total_size_bytes: Self::dir_size(&self.paths.base),
            db_size_bytes: Self::file_size(&self.paths.db),
            vault_size_bytes: Self::dir_size(&self.paths.vault),
            models_size_bytes: Self::dir_size(&self.paths.models),
            cache_size_bytes: Self::dir_size(&self.paths.cache),
            logs_size_bytes: Self::dir_size(&self.paths.logs),
            model_count: Self::count_files(&self.paths.models),
            cache_entry_count: Self::count_files(&self.paths.cache),
        }
    }

    pub fn run_cleanup(&self) -> CleanupResult {
        let mut result = CleanupResult::default();
        result.cache_bytes_removed = self.cleanup_cache();
        result.logs_bytes_removed = self.cleanup_logs();
        result.total_bytes_removed = result.cache_bytes_removed + result.logs_bytes_removed;
        result
    }

    fn cleanup_cache(&self) -> u64 {
        let mut removed: u64 = 0;
        let max_age = std::time::Duration::from_secs(self.policy.max_cache_age_secs);
        if let Ok(entries) = std::fs::read_dir(&self.paths.cache) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("ttl") {
                    continue;
                }
                let ttl_path = path.with_extension("ttl");
                let mut expired = false;
                if ttl_path.exists() {
                    if let Ok(ttl_str) = std::fs::read_to_string(&ttl_path) {
                        if let Ok(ttl_secs) = ttl_str.trim().parse::<u64>() {
                            if let Ok(meta) = std::fs::metadata(&path) {
                                if let Ok(modified) = meta.modified() {
                                    if let Ok(elapsed) = modified.elapsed() {
                                        if elapsed.as_secs() > ttl_secs {
                                            expired = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if !expired {
                    if let Ok(meta) = std::fs::metadata(&path) {
                        if let Ok(modified) = meta.modified() {
                            if let Ok(elapsed) = modified.elapsed() {
                                if elapsed > max_age {
                                    expired = true;
                                }
                            }
                        }
                    }
                }
                if expired {
                    if let Ok(meta) = std::fs::metadata(&path) {
                        removed += meta.len();
                    }
                    let _ = std::fs::remove_file(&path);
                    let _ = std::fs::remove_file(&ttl_path);
                }
            }
        }
        removed
    }

    fn cleanup_logs(&self) -> u64 {
        let mut removed: u64 = 0;
        let max_age = std::time::Duration::from_secs(self.policy.max_log_age_days * 24 * 60 * 60);
        if let Ok(entries) = std::fs::read_dir(&self.paths.logs) {
            for entry in entries.flatten() {
                let path = entry.path();
                if let Ok(meta) = std::fs::metadata(&path) {
                    if let Ok(modified) = meta.modified() {
                        if let Ok(elapsed) = modified.elapsed() {
                            if elapsed > max_age {
                                removed += meta.len();
                                let _ = std::fs::remove_file(&path);
                            }
                        }
                    }
                }
            }
        }
        removed
    }

    fn dir_size(path: &std::path::Path) -> u64 {
        let mut total: u64 = 0;
        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_dir() {
                    total += Self::dir_size(&p);
                } else if let Ok(meta) = std::fs::metadata(&p) {
                    total += meta.len();
                }
            }
        }
        total
    }

    fn file_size(path: &std::path::Path) -> u64 {
        std::fs::metadata(path).map(|m| m.len()).unwrap_or(0)
    }

    fn count_files(path: &std::path::Path) -> usize {
        let mut count = 0;
        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                if entry.path().is_file() {
                    count += 1;
                }
            }
        }
        count
    }

    pub fn get_paths(&self) -> &DataPaths {
        &self.paths
    }

    pub fn get_policy(&self) -> &RetentionPolicy {
        &self.policy
    }
}

#[derive(Debug, Clone, Default)]
pub struct CleanupResult {
    pub cache_bytes_removed: u64,
    pub logs_bytes_removed: u64,
    pub total_bytes_removed: u64,
}

impl Default for DataLifecycle {
    fn default() -> Self {
        Self::new()
    }
}
