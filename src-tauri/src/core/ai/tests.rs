#[cfg(test)]
mod tests {
    use crate::core::ai::{
        moderation::{moderate_content, detect_fake_work, detect_relay_abuse},
        routing::{recommend_route, predict_bandwidth, relay_fitness_score, PeerMetrics},
        types::{ModerationAction, ModerationCategory},
    };

    #[test]
    fn test_clean_content_allowed() {
        let r = moderate_content("c1", "Here is my completed project with full documentation.");
        assert!(!r.flagged);
        assert_eq!(r.action, ModerationAction::Allow);
    }

    #[test]
    fn test_spam_content_flagged() {
        let r = moderate_content("c2", "Click here for free money guaranteed 100% profit");
        assert!(r.flagged);
        assert!(r.categories.contains(&ModerationCategory::Spam));
    }

    #[test]
    fn test_fake_work_empty_submission() {
        let (flagged, score) = detect_fake_work("done", 0, 0);
        assert!(flagged);
        assert!(score > 0.5);
    }

    #[test]
    fn test_legitimate_work_not_flagged() {
        let (flagged, _) = detect_fake_work("Completed the full feature with unit tests and documentation", 5, 120);
        assert!(!flagged);
    }

    #[test]
    fn test_relay_abuse_detection_normal() {
        let (flagged, score) = detect_relay_abuse(1_000_000, 900_000, 10);
        assert!(!flagged);
        assert!(score < 0.7);
    }

    #[test]
    fn test_relay_abuse_detection_spike() {
        let (flagged, score) = detect_relay_abuse(100_000_000, 1_000_000, 500);
        assert!(flagged);
        assert!(score > 0.7);
    }

    #[test]
    fn test_route_recommendation() {
        let peers = vec![
            PeerMetrics { node_id: "fast".to_string(), latency_ms: 10, bandwidth_kbps: 50_000.0, reliability: 0.99, load: 0.1 },
            PeerMetrics { node_id: "slow".to_string(), latency_ms: 500, bandwidth_kbps: 1_000.0, reliability: 0.7, load: 0.8 },
        ];
        let rec = recommend_route("a", "b", &peers).unwrap();
        assert_eq!(rec.recommended_relay, "fast");
    }

    #[test]
    fn test_no_peers_returns_none() {
        assert!(recommend_route("a", "b", &[]).is_none());
    }

    #[test]
    fn test_bandwidth_prediction_smoothing() {
        let history = vec![100.0, 110.0, 105.0, 120.0, 115.0];
        let pred = predict_bandwidth(&history, 0.3);
        assert!(pred > 0.0 && pred < 200.0);
    }

    #[test]
    fn test_relay_fitness_high_quality_node() {
        let score = relay_fitness_score(10, 50_000.0, 99.9, 0.05);
        assert!(score > 0.8);
    }

    #[test]
    fn test_relay_fitness_poor_node() {
        let score = relay_fitness_score(1500, 100.0, 40.0, 0.95);
        assert!(score < 0.3);
    }
}
