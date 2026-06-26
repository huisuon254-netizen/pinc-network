#[cfg(test)]
mod tests {
    use crate::core::security::{
        scanner::{detect_ddos, scan_for_malware_patterns, validate_message_size, RateLimiter},
        types::{DdosProtection, HardeningConfig, Severity},
    };

    #[test]
    fn test_rate_limiter_allows_within_limit() {
        let mut rl = RateLimiter::new(100);
        for _ in 0..50 {
            assert!(rl.check("peer-1"));
        }
    }

    #[test]
    fn test_rate_limiter_blocks_over_limit() {
        let mut rl = RateLimiter::new(5);
        for _ in 0..5 {
            rl.check("peer-x");
        }
        assert!(!rl.check("peer-x"));
    }

    #[test]
    fn test_ddos_detection_normal() {
        let cfg = DdosProtection::default();
        assert!(detect_ddos(100, &cfg, "peer").is_none());
    }

    #[test]
    fn test_ddos_detection_attack() {
        let cfg = DdosProtection::default();
        let event = detect_ddos(10_000, &cfg, "attacker");
        assert!(event.is_some());
        assert_eq!(event.unwrap().severity, Severity::Critical);
    }

    #[test]
    fn test_message_size_ok() {
        assert!(validate_message_size(1024, 64).is_ok());
    }

    #[test]
    fn test_message_size_too_large() {
        assert!(validate_message_size(100_000, 64).is_err());
    }

    #[test]
    fn test_malware_scan_clean() {
        let (flagged, _) = scan_for_malware_patterns(b"hello normal data");
        assert!(!flagged);
    }

    #[test]
    fn test_malware_scan_pe_header() {
        let mut data = vec![0u8; 20];
        data[0..4].copy_from_slice(b"\x4d\x5a\x90\x00");
        let (flagged, findings) = scan_for_malware_patterns(&data);
        assert!(flagged);
        assert!(!findings.is_empty());
    }

    #[test]
    fn test_hardening_config_defaults() {
        let cfg = HardeningConfig::default();
        assert!(cfg.rate_limits_enabled);
        assert!(cfg.audit_log_enabled);
        assert_eq!(cfg.min_tls_version, "TLS1.3");
    }

    #[test]
    fn test_severity_ordering() {
        assert!(Severity::Critical > Severity::High);
        assert!(Severity::High > Severity::Medium);
        assert!(Severity::Medium > Severity::Low);
    }
}
