use crate::core::data::errors::DataError;
use std::path::{Path, PathBuf};

pub struct CacheManager {
    cache_dir: PathBuf,
    max_size_bytes: u64,
}

impl CacheManager {
    pub fn new() -> Self {
        let home = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
        let cache_dir = home.join("com.pinc.app").join("cache");
        std::fs::create_dir_all(&cache_dir).ok();
        Self {
            cache_dir,
            max_size_bytes: 500 * 1024 * 1024, // 500 MB default
        }
    }

    pub fn with_dir(cache_dir: PathBuf, max_size_bytes: u64) -> Self {
        std::fs::create_dir_all(&cache_dir).ok();
        Self {
            cache_dir,
            max_size_bytes,
        }
    }

    pub fn get(&self, key: &str) -> Result<Vec<u8>, DataError> {
        let path = self.key_to_path(key);
        if !path.exists() {
            return Err(DataError::CacheMiss(key.to_string()));
        }

        let meta = std::fs::metadata(&path)
            .map_err(|e| DataError::Io(format!("Failed to read metadata: {}", e)))?;

        if let Ok(modified) = meta.modified() {
            if let Ok(elapsed) = modified.elapsed() {
                let ttl_path = path.with_extension("ttl");
                if ttl_path.exists() {
                    if let Ok(ttl_str) = std::fs::read_to_string(&ttl_path) {
                        if let Ok(ttl_secs) = ttl_str.trim().parse::<u64>() {
                            if elapsed.as_secs() > ttl_secs {
                                let _ = std::fs::remove_file(&path);
                                let _ = std::fs::remove_file(&ttl_path);
                                return Err(DataError::CacheMiss(key.to_string()));
                            }
                        }
                    }
                }
            }
        }

        std::fs::read(&path).map_err(|e| DataError::Io(format!("Failed to read cache: {}", e)))
    }

    pub fn set(&self, key: &str, data: &[u8], ttl_secs: u64) -> Result<(), DataError> {
        let _ = self.ensure_capacity(data.len() as u64);

        let path = self.key_to_path(key);
        std::fs::write(&path, data)
            .map_err(|e| DataError::Io(format!("Failed to write cache: {}", e)))?;

        let ttl_path = path.with_extension("ttl");
        std::fs::write(&ttl_path, ttl_secs.to_string())
            .map_err(|e| DataError::Io(format!("Failed to write TTL: {}", e)))?;

        Ok(())
    }

    pub fn remove(&self, key: &str) -> Result<(), DataError> {
        let path = self.key_to_path(key);
        let ttl_path = path.with_extension("ttl");
        let _ = std::fs::remove_file(&path);
        let _ = std::fs::remove_file(&ttl_path);
        Ok(())
    }

    pub fn cleanup(&self) -> u64 {
        let mut removed_bytes: u64 = 0;
        if let Ok(entries) = std::fs::read_dir(&self.cache_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("ttl") {
                    continue;
                }
                let ttl_path = path.with_extension("ttl");
                if ttl_path.exists() {
                    if let Ok(ttl_str) = std::fs::read_to_string(&ttl_path) {
                        if let Ok(ttl_secs) = ttl_str.trim().parse::<u64>() {
                            if let Ok(meta) = std::fs::metadata(&path) {
                                if let Ok(modified) = meta.modified() {
                                    if let Ok(elapsed) = modified.elapsed() {
                                        if elapsed.as_secs() > ttl_secs {
                                            let _ = std::fs::remove_file(&path);
                                            let _ = std::fs::remove_file(&ttl_path);
                                            removed_bytes += meta.len();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        removed_bytes
    }

    pub fn get_size(&self) -> u64 {
        let mut total: u64 = 0;
        if let Ok(entries) = std::fs::read_dir(&self.cache_dir) {
            for entry in entries.flatten() {
                if let Ok(meta) = std::fs::metadata(entry.path()) {
                    total += meta.len();
                }
            }
        }
        total
    }

    pub fn clear(&self) -> Result<(), DataError> {
        if self.cache_dir.exists() {
            std::fs::remove_dir_all(&self.cache_dir)
                .map_err(|e| DataError::Io(format!("Failed to clear cache: {}", e)))?;
            std::fs::create_dir_all(&self.cache_dir)
                .map_err(|e| DataError::Io(format!("Failed to recreate cache dir: {}", e)))?;
        }
        Ok(())
    }

    pub fn get_cache_dir(&self) -> &PathBuf {
        &self.cache_dir
    }

    fn key_to_path(&self, key: &str) -> PathBuf {
        let sanitized: String = key
            .chars()
            .map(|c| {
                if c.is_alphanumeric() || c == '-' || c == '_' {
                    c
                } else {
                    '_'
                }
            })
            .collect();
        self.cache_dir.join(format!("{}.cache", sanitized))
    }

    fn ensure_capacity(&self, additional_bytes: u64) -> Result<(), DataError> {
        let current = self.get_size();
        if current + additional_bytes > self.max_size_bytes {
            self.cleanup();
            let current = self.get_size();
            if current + additional_bytes > self.max_size_bytes {
                return Err(DataError::CacheFull {
                    current,
                    max: self.max_size_bytes,
                });
            }
        }
        Ok(())
    }
}

impl Default for CacheManager {
    fn default() -> Self {
        Self::new()
    }
}
