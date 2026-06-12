#[cfg(test)]
mod tests {
    use crate::core::payment::{
        escrow::{lock_escrow, release_escrow, return_escrow, mark_condition_met},
        ledger::{new_wallet, transfer, deposit},
        types::{EscrowCondition},
    };

    fn funded_wallet(id: &str, bal: f64) -> crate::core::payment::types::Wallet {
        let mut w = new_wallet(id);
        w.balance = bal;
        w
    }

    #[test]
    fn test_transfer_ok() {
        let mut a = funded_wallet("a", 100.0);
        let mut b = funded_wallet("b", 0.0);
        transfer(&mut a, &mut b, 50.0, None).unwrap();
        assert_eq!(a.balance, 50.0);
        assert_eq!(b.balance, 50.0);
    }

    #[test]
    fn test_transfer_insufficient_fails() {
        let mut a = funded_wallet("a", 10.0);
        let mut b = funded_wallet("b", 0.0);
        assert!(transfer(&mut a, &mut b, 50.0, None).is_err());
    }

    #[test]
    fn test_deposit_increases_balance() {
        let mut w = new_wallet("node");
        deposit(&mut w, 200.0, "chain-tx-001").unwrap();
        assert_eq!(w.balance, 200.0);
    }

    #[test]
    fn test_escrow_lock_and_release() {
        let mut payer = funded_wallet("payer", 100.0);
        let mut payee = funded_wallet("payee", 0.0);
        let cond = EscrowCondition { description: "done".to_string(), met: false, verified_at: None };
        let mut escrow = lock_escrow(&mut payer, 50.0, "payee", "job-1", vec![cond]).unwrap();
        assert_eq!(payer.escrow_locked, 50.0);
        assert_eq!(payer.available_balance(), 50.0);
        mark_condition_met(&mut escrow, 0).unwrap();
        release_escrow(&mut escrow, &mut payer, &mut payee).unwrap();
        assert!(escrow.released);
        assert_eq!(payee.balance, 50.0);
    }

    #[test]
    fn test_escrow_conditions_not_met_blocks_release() {
        let mut payer = funded_wallet("payer", 100.0);
        let mut payee = funded_wallet("payee", 0.0);
        let cond = EscrowCondition { description: "not done".to_string(), met: false, verified_at: None };
        let mut escrow = lock_escrow(&mut payer, 50.0, "payee", "job-2", vec![cond]).unwrap();
        assert!(release_escrow(&mut escrow, &mut payer, &mut payee).is_err());
    }

    #[test]
    fn test_escrow_return() {
        let mut payer = funded_wallet("payer", 100.0);
        let mut escrow = lock_escrow(&mut payer, 30.0, "payee", "job-3", vec![]).unwrap();
        return_escrow(&mut escrow, &mut payer).unwrap();
        assert!(escrow.returned);
        assert_eq!(payer.escrow_locked, 0.0);
    }

    #[test]
    fn test_available_balance_accounts_for_escrow() {
        let mut w = funded_wallet("node", 100.0);
        w.escrow_locked = 40.0;
        assert_eq!(w.available_balance(), 60.0);
    }
}
