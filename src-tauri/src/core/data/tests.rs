use super::*;
use tempfile::TempDir;

#[test]
fn test_cache_set_and_get() {
    let tmp = TempDir::new().unwrap();
    let cache = CacheManager::with_dir(tmp.path().to_path_buf(), 10 * 1024 * 1024);
    cache.set("test_key", b"hello world", 3600).unwrap();
    let val = cache.get("test_key").unwrap();
    assert_eq!(val, b"hello world");
}

#[test]
fn test_cache_miss() {
    let tmp = TempDir::new().unwrap();
    let cache = CacheManager::with_dir(tmp.path().to_path_buf(), 10 * 1024 * 1024);
    assert!(cache.get("nonexistent").is_err());
}

#[test]
fn test_model_manager_list_empty() {
    let tmp = TempDir::new().unwrap();
    let mgr = ModelManager::with_dir(tmp.path().to_path_buf());
    assert!(mgr.list_models().is_empty());
}

#[test]
fn test_data_lifecycle_stats() {
    let tmp = TempDir::new().unwrap();
    let paths = DataPaths {
        base: tmp.path().to_path_buf(),
        db: tmp.path().join("test.db"),
        vault: tmp.path().join("vault"),
        models: tmp.path().join("models"),
        cache: tmp.path().join("cache"),
        logs: tmp.path().join("logs"),
        config: tmp.path().join("config"),
    };
    let lc = DataLifecycle::with_paths(paths, RetentionPolicy::default());
    lc.ensure_directories();
    let stats = lc.get_stats();
    assert_eq!(stats.model_count, 0);
}
