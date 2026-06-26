#[cfg(test)]
mod tests {
    use crate::core::reputation::{
        engine::{
            apply_review, apply_uptime, burn_account, recalculate_total, record_dispute_result,
        },
        types::{ReputationScore, Review, ReviewCategory},
    };
    use uuid::Uuid;

    fn mock_review(subject: &str, rating: f64, cat: ReviewCategory) -> Review {
        Review {
            id: Uuid::new_v4().to_string(),
            reviewer_id: "reviewer".to_string(),
            subject_id: subject.to_string(),
            rating,
            category: cat,
            comment: None,
            reference_id: None,
            created_at: 0,
            verified: true,
        }
    }

    #[test]
    fn test_new_reputation_defaults() {
        let rep = ReputationScore::new("node-1");
        assert_eq!(rep.total_score, 0.5);
        assert!(!rep.burned);
    }

    #[test]
    fn test_apply_positive_review() {
        let mut rep = ReputationScore::new("node-1");
        let review = mock_review("node-1", 5.0, ReviewCategory::Job);
        apply_review(&mut rep, &review);
        assert!(rep.job_score > 0.5);
        assert_eq!(rep.total_reviews, 1);
    }

    #[test]
    fn test_apply_negative_review() {
        let mut rep = ReputationScore::new("node-1");
        for _ in 0..5 {
            apply_review(&mut rep, &mock_review("node-1", 1.0, ReviewCategory::Job));
        }
        assert!(rep.job_score < 0.5);
    }

    #[test]
    fn test_uptime_updates_score() {
        let mut rep = ReputationScore::new("node-1");
        apply_uptime(&mut rep, 99.5);
        assert!(rep.uptime_score > 0.9);
    }

    #[test]
    fn test_dispute_win_improves_score() {
        let mut rep = ReputationScore::new("node-1");
        record_dispute_result(&mut rep, true);
        assert_eq!(rep.dispute_score, 1.0);
        assert_eq!(rep.disputes_won, 1);
    }

    #[test]
    fn test_dispute_loss_reduces_score() {
        let mut rep = ReputationScore::new("node-1");
        record_dispute_result(&mut rep, false);
        assert_eq!(rep.dispute_score, 0.0);
    }

    #[test]
    fn test_burn_zeroes_score() {
        let mut rep = ReputationScore::new("node-1");
        burn_account(&mut rep, "fraud detected", true);
        assert!(rep.burned);
        assert_eq!(rep.total_score, 0.0);
    }

    #[test]
    fn test_burned_node_not_trusted() {
        let mut rep = ReputationScore::new("node-1");
        burn_account(&mut rep, "abuse", false);
        assert!(!rep.is_trusted(0.1));
    }

    #[test]
    fn test_trusted_check() {
        let rep = ReputationScore::new("node-1");
        assert!(rep.is_trusted(0.4));
        assert!(!rep.is_trusted(0.9));
    }
}
