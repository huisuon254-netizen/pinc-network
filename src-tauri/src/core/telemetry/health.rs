use crate::core::telemetry::types::HealthStatus;

pub fn run_health_check() -> HealthStatus {
    let crypto_ok = crate::core::crypto::validator::crypto_self_test();
    HealthStatus {
        overall: if crypto_ok {
            "OK".to_string()
        } else {
            "DEGRADED".to_string()
        },
        cpu_ok: true,
        memory_ok: true,
        storage_ok: true,
        network_ok: false, // false until Phase 3 transport is running
        crypto_ok,
        database_ok: true,
    }
}
