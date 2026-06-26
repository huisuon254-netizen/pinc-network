#[cfg(test)]
mod tests {
    use crate::core::marketplace::{engine::*, types::*};

    fn mock_milestone(id: &str, amount: f64) -> Milestone {
        Milestone {
            id: id.to_string(),
            job_id: "j1".to_string(),
            title: "M".to_string(),
            description: "D".to_string(),
            amount,
            due_date: None,
            completed: false,
            proof_hash: None,
            approved: false,
        }
    }

    #[test]
    fn test_create_job_ok() {
        let job = create_job("owner", "Test Job", "Desc", 100.0, vec![], vec![]).unwrap();
        assert_eq!(job.status, JobStatus::Open);
        assert_eq!(job.budget, 100.0);
    }

    #[test]
    fn test_create_job_zero_budget_fails() {
        assert!(create_job("owner", "job", "desc", 0.0, vec![], vec![]).is_err());
    }

    #[test]
    fn test_create_job_milestone_mismatch_fails() {
        let ms = vec![mock_milestone("m1", 50.0)];
        assert!(create_job("owner", "job", "desc", 100.0, vec![], ms).is_err());
    }

    #[test]
    fn test_submit_bid_ok() {
        let job = create_job("owner", "job", "desc", 100.0, vec![], vec![]).unwrap();
        let bid = submit_bid(&job, "worker", 80.0, "my proposal", 7).unwrap();
        assert_eq!(bid.status, BidStatus::Pending);
    }

    #[test]
    fn test_accept_bid_changes_status() {
        let mut job = create_job("owner", "job", "desc", 100.0, vec![], vec![]).unwrap();
        let mut bid = submit_bid(&job, "worker", 80.0, "proposal", 7).unwrap();
        accept_bid(&mut job, &mut bid).unwrap();
        assert_eq!(job.status, JobStatus::InProgress);
        assert_eq!(bid.status, BidStatus::Accepted);
        assert_eq!(job.selected_worker, Some("worker".to_string()));
    }

    #[test]
    fn test_bid_on_closed_job_fails() {
        let mut job = create_job("owner", "job", "desc", 100.0, vec![], vec![]).unwrap();
        job.status = JobStatus::Completed;
        assert!(submit_bid(&job, "worker", 50.0, "prop", 5).is_err());
    }

    #[test]
    fn test_submit_and_approve_proof() {
        let mut ms = mock_milestone("m1", 100.0);
        let proof = submit_proof("m1", "worker", "done", vec!["hash1".to_string()]);
        approve_milestone(&mut ms, &proof).unwrap();
        assert!(ms.completed);
        assert!(ms.approved);
        assert_eq!(ms.proof_hash, Some("hash1".to_string()));
    }
}
