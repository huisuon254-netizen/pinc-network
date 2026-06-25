#[cfg(target_os = "android")]
use std::sync::OnceLock;

#[cfg(target_os = "android")]
static HOTSPOT_ACTIVE: OnceLock<std::sync::atomic::AtomicBool> = OnceLock::new();

#[cfg(target_os = "android")]
static HOTSPOT_SSID: OnceLock<std::sync::Mutex<Option<String>>> = OnceLock::new();

pub fn is_hotspot_active() -> bool {
    #[cfg(target_os = "android")]
    {
        HOTSPOT_ACTIVE
            .get_or_init(|| std::sync::atomic::AtomicBool::new(false))
            .load(std::sync::atomic::Ordering::Relaxed)
    }
    #[cfg(not(target_os = "android"))]
    {
        false
    }
}

pub fn set_hotspot_active(active: bool) {
    #[cfg(target_os = "android")]
    {
        HOTSPOT_ACTIVE
            .get_or_init(|| std::sync::atomic::AtomicBool::new(false))
            .store(active, std::sync::atomic::Ordering::Relaxed);
    }
}

pub fn get_hotspot_ssid() -> Option<String> {
    #[cfg(target_os = "android")]
    {
        HOTSPOT_SSID
            .get_or_init(|| std::sync::Mutex::new(None))
            .lock()
            .ok()
            .and_then(|guard| guard.clone())
    }
    #[cfg(not(target_os = "android"))]
    {
        None
    }
}

pub fn set_hotspot_ssid(ssid: Option<String>) {
    #[cfg(target_os = "android")]
    {
        if let Some(mutex) = HOTSPOT_SSID.get() {
            if let Ok(mut guard) = mutex.lock() {
                *guard = ssid;
            }
        }
    }
}

pub fn get_connected_devices() -> Vec<String> {
    Vec::new()
}
