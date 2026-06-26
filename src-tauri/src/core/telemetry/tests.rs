#[cfg(test)]
mod tests {
    use crate::core::telemetry::{health::run_health_check, metrics::MetricsCollector};
    #[test]
    fn test_health_check_crypto_ok() {
        let h = run_health_check();
        assert!(h.crypto_ok);
    }
    #[test]
    fn test_metrics_increment() {
        let m = MetricsCollector::new();
        m.inc_relayed(1024);
        m.inc_vault_op();
        let s = m.snapshot();
        assert_eq!(s.messages_relayed, 1);
        assert_eq!(s.bytes_relayed, 1024);
        assert_eq!(s.vault_operations, 1);
    }
}
