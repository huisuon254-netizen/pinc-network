#[cfg(test)]
mod tests {
    use crate::core::wager::{
        engine::*,
        types::{WagerOutcome, WagerStatus, MIN_REFEREES},
    };

    fn make_ready_wager() -> crate::core::wager::types::Wager {
        let mut w = create_wager("alice", "bob", 50.0, "chess", "1v1 chess", None).unwrap();
        for i in 0..MIN_REFEREES {
            add_referee(&mut w, &format!("ref-{}", i)).unwrap();
        }
        w
    }

    #[test]
    fn test_create_wager_ok() {
        let w = create_wager("alice", "bob", 100.0, "chess", "game", None).unwrap();
        assert_eq!(w.status, WagerStatus::Pending);
        assert_eq!(w.amount, 100.0);
    }

    #[test]
    fn test_self_wager_fails() {
        assert!(create_wager("alice", "alice", 100.0, "chess", "game", None).is_err());
    }

    #[test]
    fn test_zero_amount_fails() {
        assert!(create_wager("alice", "bob", 0.0, "chess", "game", None).is_err());
    }

    #[test]
    fn test_accept_without_referees_fails() {
        let mut w = create_wager("alice", "bob", 50.0, "chess", "game", None).unwrap();
        assert!(accept_wager(&mut w).is_err());
    }

    #[test]
    fn test_accept_with_referees_ok() {
        let mut w = make_ready_wager();
        accept_wager(&mut w).unwrap();
        assert_eq!(w.status, WagerStatus::Accepted);
    }

    #[test]
    fn test_finalize_challenger_wins() {
        let mut w = make_ready_wager();
        accept_wager(&mut w).unwrap();
        w.status = WagerStatus::InProgress;
        let payout = finalize_wager(&mut w, WagerOutcome::ChallengerWins).unwrap();
        assert!(payout > 0.0);
        assert_eq!(w.winner_id, Some("alice".to_string()));
        assert_eq!(w.status, WagerStatus::Completed);
    }

    #[test]
    fn test_finalize_platform_fee_deducted() {
        let mut w = make_ready_wager();
        accept_wager(&mut w).unwrap();
        w.status = WagerStatus::InProgress;
        let total = w.amount * 2.0;
        let payout = finalize_wager(&mut w, WagerOutcome::OpponentWins).unwrap();
        assert!(payout < total); // fee was deducted
    }

    #[test]
    fn test_draw_has_no_winner() {
        let mut w = make_ready_wager();
        accept_wager(&mut w).unwrap();
        w.status = WagerStatus::InProgress;
        finalize_wager(&mut w, WagerOutcome::Draw).unwrap();
        assert!(w.winner_id.is_none());
    }

    #[test]
    fn test_add_duplicate_referee_fails() {
        let mut w = create_wager("a", "b", 10.0, "game", "d", None).unwrap();
        add_referee(&mut w, "ref-1").unwrap();
        assert!(add_referee(&mut w, "ref-1").is_err());
    }
}
