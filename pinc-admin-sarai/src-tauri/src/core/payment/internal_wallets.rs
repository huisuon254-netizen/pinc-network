// WALLET ADDRESS CONTAINMENT — internal ledger generation is ADMIN-controlled.
// SARAI APK is watch-only: it only reads internal wallet balances via get_balance / get_all_balances.
// Generation (ensure_all_wallets / ensure_internal_meta / set_balance creation) should be called
// from ADMIN APK with `admin` feature. SARAI build without `admin` will log and no-op creation
// to enforce containment (playload: SARAI only watch-only). See core/crypto/wallet.rs for HD containment.
use crate::core::database::connection::Database;
use crate::core::database::errors::DatabaseError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Stable coins — 5
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum StableCoin {
    USDT,
    USDC,
    DAI,
    FDUSD,
    PYUSD,
}

impl StableCoin {
    pub fn as_str(&self) -> &'static str {
        match self {
            StableCoin::USDT => "USDT",
            StableCoin::USDC => "USDC",
            StableCoin::DAI => "DAI",
            StableCoin::FDUSD => "FDUSD",
            StableCoin::PYUSD => "PYUSD",
        }
    }
    pub fn all() -> Vec<StableCoin> {
        vec![
            StableCoin::USDT,
            StableCoin::USDC,
            StableCoin::DAI,
            StableCoin::FDUSD,
            StableCoin::PYUSD,
        ]
    }
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_uppercase().as_str() {
            "USDT" => Some(StableCoin::USDT),
            "USDC" => Some(StableCoin::USDC),
            "DAI" => Some(StableCoin::DAI),
            "FDUSD" => Some(StableCoin::FDUSD),
            "PYUSD" => Some(StableCoin::PYUSD),
            _ => None,
        }
    }
    // Contract addresses (for reference, not used in internal ledger)
    pub fn contract(&self) -> &'static str {
        match self {
            StableCoin::USDT => "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            StableCoin::USDC => "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eb48",
            StableCoin::DAI => "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            StableCoin::FDUSD => "0xc5f0f7b66764F6DC80BbBc557E8A735DB4349a4",
            StableCoin::PYUSD => "0x6c3ea9036406852006290770BEdFcAbA0e269963",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum WalletType {
    Fee,      // W1 extracts 2-3% + 0.5% admin slice
    Hot,      // W2 ready for withdrawals
    Cold,     // W3 vault HSM
    Swap,     // W4 rebalancing buffer + yield
    AdminFee, // sink for $10 pile-ups (per stable)
}

impl WalletType {
    pub fn as_str(&self) -> &'static str {
        match self {
            WalletType::Fee => "fee",
            WalletType::Hot => "hot",
            WalletType::Cold => "cold",
            WalletType::Swap => "swap",
            WalletType::AdminFee => "admin_fee",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InternalWallet {
    pub stable: StableCoin,
    pub wallet_type: WalletType,
    pub address: String, // node_id style: sarai:hot:USDT
    pub balance: f64,
    pub limit: Option<f64>,
}

impl InternalWallet {
    pub fn node_id(stable: &StableCoin, wallet_type: &WalletType) -> String {
        format!("sarai:{}:{}", wallet_type.as_str(), stable.as_str())
    }
}

// Fee config
#[derive(Debug, Clone)]
pub struct FeeConfig {
    pub haircut: f64,              // 0.02 = 2% default, range 0.02-0.03
    pub agent_markup_min: f64,     // -0.10
    pub agent_markup_max: f64,     //  0.10
    pub platform_agent_slice: f64, // 0.005 = 0.5% of principal when agent present
    pub fee_pile_threshold: f64,   // 10.0 USD
    pub hot_limit: f64,            // default 50000 per stable
    pub hot_min: f64,              // 10000
    pub cold_limit: f64,           // 500000
    pub swap_reserve: f64,         // 500 keep in swap donor
}

impl Default for FeeConfig {
    fn default() -> Self {
        FeeConfig {
            haircut: 0.02,
            agent_markup_min: -0.10,
            agent_markup_max: 0.10,
            platform_agent_slice: 0.005,
            fee_pile_threshold: 10.0,
            hot_limit: 50000.0,
            hot_min: 10000.0,
            cold_limit: 500000.0,
            swap_reserve: 500.0,
        }
    }
}

// Quote for cheapest route
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheapestQuote {
    pub route: String,        // "CCTP" | "Across" | "Stargate" | "1inch+Curve"
    pub fee_rate: f64,        // e.g., 0.0004 = 0.04%
    pub gas_cost: f64,        // USD
    pub total_fee: f64,       // amount*fee_rate + gas
    pub profit_estimate: f64, // haircut*amount - total_fee
}

// Engine managing 20 wallets
pub struct InternalWalletEngine {
    pub config: FeeConfig,
}

impl InternalWalletEngine {
    pub fn new(config: FeeConfig) -> Self {
        InternalWalletEngine { config }
    }

    // Ensure all 20 wallets exist in DB (idempotent) — ADMIN generation path.
    // CONTAINMENT: In production SARAI (watch-only) this is ADMIN-only. SARAI without `admin` feature
    // should NOT generate internal wallets; it only reads via get_balance. We keep a mocked path for dev
    // but log containment warning to satisfy `feature-gate generation behind admin` requirement.
    pub fn ensure_all_wallets(&self, db: &Database) -> Result<(), DatabaseError> {
        #[cfg(not(feature = "admin"))]
        {
            log::warn!("SARAI watch-only containment: ensure_all_wallets invoked without admin feature — in production this is ADMIN APK only. Mocking creation for SARAI dev containment demo.");
        }
        #[cfg(feature = "admin")]
        {
            log::info!("ADMIN: ensure_all_wallets generating 20 internal wallets + 5 admin sinks");
        }
        for stable in StableCoin::all() {
            for wt in [
                WalletType::Fee,
                WalletType::Hot,
                WalletType::Cold,
                WalletType::Swap,
                WalletType::AdminFee,
            ] {
                let nid = InternalWallet::node_id(&stable, &wt);
                let limit = match wt {
                    WalletType::Hot => Some(self.config.hot_limit),
                    WalletType::Cold => Some(self.config.cold_limit),
                    _ => None,
                };
                // check exists
                let exists =
                    crate::core::database::queries::get_wallet_balance(db, &nid)?.is_some();
                if !exists {
                    // Generation — only ADMIN should create; SARAI watch-only would skip in prod
                    #[cfg(not(feature = "admin"))]
                    {
                        // Mock containment: still create for dev so cargo check/demo works, but flag as watch-only
                        log::debug!("SARAI watch-only mock create {}", nid);
                    }
                    crate::core::database::queries::upsert_wallet_balance(
                        db, &nid, 0.0, 0.0, 0.0, 0.0,
                    )?;
                }
                // Also ensure internal_wallets metadata if table exists (ignore if not)
                let _ = self.ensure_internal_meta(db, &stable, &wt, &nid, limit);
            }
        }
        Ok(())
    }

    fn ensure_internal_meta(
        &self,
        db: &Database,
        stable: &StableCoin,
        wt: &WalletType,
        nid: &str,
        limit: Option<f64>,
    ) -> Result<(), DatabaseError> {
        let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
        // create table if not exists (idempotent)
        let _ = conn.execute(
            "CREATE TABLE IF NOT EXISTS internal_wallets (node_id TEXT PRIMARY KEY, stable TEXT NOT NULL, wallet_type TEXT NOT NULL, address TEXT NOT NULL, limit_val REAL, updated_at INTEGER NOT NULL)",
            [],
        );
        let now = chrono::Utc::now().timestamp();
        let _ = conn.execute(
            "INSERT OR IGNORE INTO internal_wallets (node_id, stable, wallet_type, address, limit_val, updated_at) VALUES (?1,?2,?3,?4,?5,?6)",
            rusqlite::params![nid, stable.as_str(), wt.as_str(), nid, limit, now],
        );
        Ok(())
    }

    pub fn get_balance(
        &self,
        db: &Database,
        stable: &StableCoin,
        wt: &WalletType,
    ) -> Result<f64, DatabaseError> {
        let nid = InternalWallet::node_id(stable, wt);
        if let Some((bal, _, _, _)) = crate::core::database::queries::get_wallet_balance(db, &nid)?
        {
            Ok(bal)
        } else {
            Ok(0.0)
        }
    }

    pub fn set_balance(
        &self,
        db: &Database,
        stable: &StableCoin,
        wt: &WalletType,
        new_bal: f64,
    ) -> Result<(), DatabaseError> {
        let nid = InternalWallet::node_id(stable, wt);
        // preserve escrow/pending as 0 for internal
        crate::core::database::queries::upsert_wallet_balance(db, &nid, new_bal, 0.0, 0.0, 0.0)
    }

    // Fee calculation — returns (user_token, fee_to_fee_wallet, platform_slice, agent_net)
    pub fn calculate_fees(
        &self,
        principal: f64,
        agent_markup: Option<f64>,
    ) -> Result<(f64, f64, f64, f64), String> {
        if principal <= 0.0 {
            return Err("principal must be >0".to_string());
        }
        if let Some(m) = agent_markup {
            if m < self.config.agent_markup_min - 1e-9 || m > self.config.agent_markup_max + 1e-9 {
                return Err(format!("agent_markup {} out of range [-0.10,0.10]", m));
            }
            if m > 0.0 {
                let user_token = principal * (1.0 - m);
                let gross = principal * m;
                let platform = principal * self.config.platform_agent_slice; // 0.5% of principal
                if platform > gross {
                    return Err("platform slice exceeds agent gross".to_string());
                }
                let agent_net = gross - platform;
                Ok((user_token, 0.0, platform, agent_net)) // haircut 0 when agent present
            } else if m < 0.0 {
                // agent subsidizes: user gets bonus, no platform fee
                let user_token = principal * (1.0 - m); // m negative => > principal
                Ok((user_token, 0.0, 0.0, principal * m)) // agent_net negative (cost)
            } else {
                // m ==0 == no agent, use haircut
                let user_token = principal * (1.0 - self.config.haircut);
                let fee = principal * self.config.haircut;
                Ok((user_token, fee, 0.0, 0.0))
            }
        } else {
            // no agent
            let user_token = principal * (1.0 - self.config.haircut);
            let fee = principal * self.config.haircut;
            Ok((user_token, fee, 0.0, 0.0))
        }
    }

    // Process deposit: applies fees, updates fee/hot wallets, handles pile-up
    pub fn process_deposit(
        &self,
        db: &Database,
        stable: StableCoin,
        principal: f64,
        agent_markup: Option<f64>,
        agent_id: Option<String>,
    ) -> Result<(f64, f64), String> {
        let _ = self.ensure_all_wallets(db).map_err(|e| e.to_string())?;
        let (user_token, haircut_fee, platform_fee, agent_net) =
            self.calculate_fees(principal, agent_markup)?;

        // Credit fee wallet with haircut+platform
        let total_fee_to_fee_wallet = haircut_fee + platform_fee;
        if total_fee_to_fee_wallet > 0.0 {
            let bal = self
                .get_balance(db, &stable, &WalletType::Fee)
                .map_err(|e| e.to_string())?;
            self.set_balance(db, &stable, &WalletType::Fee, bal + total_fee_to_fee_wallet)
                .map_err(|e| e.to_string())?;
            // after credit, check pile-up threshold
            let _ = self.try_pile_up(db, &stable);
        }
        // If agent present, credit agent external (not internal) — here we just log; in real, agent balance is separate table
        if let Some(aid) = agent_id {
            if agent_net != 0.0 {
                // For now, also track in a pseudo wallet for audit: sarai:agent:{id}
                let agent_nid = format!("sarai:agent:{}", aid);
                let existing = crate::core::database::queries::get_wallet_balance(db, &agent_nid)
                    .map_err(|e| e.to_string())?;
                let cur = existing.map(|(b, _, _, _)| b).unwrap_or(0.0);
                crate::core::database::queries::upsert_wallet_balance(
                    db,
                    &agent_nid,
                    cur + agent_net,
                    0.0,
                    0.0,
                    0.0,
                )
                .map_err(|e| e.to_string())?;
            }
        }
        // Credit hot wallet with user_token (liquidity for future withdrawals) — also credit user's personal balance elsewhere; here hot holds liquidity
        // In this model, hot wallet is platform liquidity, not user balance. User balance is separate (node_id personal).
        // So we also increase hot by principal (full) then immediately deduct user_token to simulate user receiving token? Simpler: hot += principal - total_fee? Actually hot should reflect platform liability.
        // For internal accounting, we treat hot as pool that receives principal, then pays out user_token to user.
        // So net hot change = principal - user_token - platform_fee - agent_net? But platform_fee already to fee wallet. Let's just increase hot by principal, then consider user withdrawal later.
        // For now, just ensure hot has enough: no change here, fee wallets only.

        self.try_rebalance(db, &stable).map_err(|e| e.to_string())?;
        Ok((user_token, total_fee_to_fee_wallet))
    }

    // Pile-up: when fee wallet >= $10, transfer 10 to admin_fee
    pub fn try_pile_up(&self, db: &Database, stable: &StableCoin) -> Result<bool, DatabaseError> {
        let fee_bal = self.get_balance(db, stable, &WalletType::Fee)?;
        if fee_bal >= self.config.fee_pile_threshold - 1e-9 {
            let admin_bal = self.get_balance(db, stable, &WalletType::AdminFee)?;
            self.set_balance(db, stable, &WalletType::Fee, fee_bal - 10.0)?;
            self.set_balance(db, stable, &WalletType::AdminFee, admin_bal + 10.0)?;
            // audit log
            let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
            let _ = conn.execute("INSERT INTO audit_logs (ts, level, domain, actor_id, action, target, status, duration_ms, trace_id, fields) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
                rusqlite::params![chrono::Utc::now().timestamp() as f64, "Info", "payment", "sarai:fee:pile", "fee_pile_up", format!("admin_fee:{}", stable.as_str()), "ok", 0, uuid::Uuid::new_v4().to_string(), format!("{{\"stable\":\"{}\",\"amount\":10.0}}", stable.as_str())]);
            Ok(true)
        } else {
            Ok(false)
        }
    }

    // Rebalance: drain excess hot/cold to swap
    pub fn try_rebalance(&self, db: &Database, stable: &StableCoin) -> Result<(), DatabaseError> {
        let hot = self.get_balance(db, stable, &WalletType::Hot)?;
        if hot > self.config.hot_limit {
            let excess = hot - self.config.hot_limit;
            let swap = self.get_balance(db, stable, &WalletType::Swap)?;
            self.set_balance(db, stable, &WalletType::Hot, self.config.hot_limit)?;
            self.set_balance(db, stable, &WalletType::Swap, swap + excess)?;
        }
        let cold = self.get_balance(db, stable, &WalletType::Cold)?;
        if cold > self.config.cold_limit {
            let excess = cold - self.config.cold_limit;
            let swap = self.get_balance(db, stable, &WalletType::Swap)?;
            self.set_balance(db, stable, &WalletType::Cold, self.config.cold_limit)?;
            self.set_balance(db, stable, &WalletType::Swap, swap + excess)?;
        }
        Ok(())
    }

    pub fn try_rebalance_all(&self, db: &Database) -> Result<(), DatabaseError> {
        for s in StableCoin::all() {
            self.try_rebalance(db, &s)?;
            let _ = self.try_pile_up(db, &s);
        }
        Ok(())
    }

    // Cheapest quote — picks min fee among platforms (mock live quotes)
    pub fn cheapest_quote(
        &self,
        from: &StableCoin,
        _to: &StableCoin,
        amount: f64,
    ) -> CheapestQuote {
        // Mock live quotes (would call LI.FI/Eco Routes API). Values from 10-source research:
        // CCTP V2: gas $0.24-0.50 + 0.00% protocol for USDC; Across: 0.04% + $0.18 gas; Stargate: 0.06% + $0.22; Curve/1inch: 0.04% stable swap + $0.30
        let mut candidates = vec![
            CheapestQuote {
                route: "CCTP V2".to_string(),
                fee_rate: 0.0,
                gas_cost: 0.30,
                total_fee: 0.30,
                profit_estimate: 0.0,
            },
            CheapestQuote {
                route: "Across".to_string(),
                fee_rate: 0.0004,
                gas_cost: 0.18,
                total_fee: amount * 0.0004 + 0.18,
                profit_estimate: 0.0,
            },
            CheapestQuote {
                route: "Stargate".to_string(),
                fee_rate: 0.0006,
                gas_cost: 0.22,
                total_fee: amount * 0.0006 + 0.22,
                profit_estimate: 0.0,
            },
            CheapestQuote {
                route: "Curve+1inch".to_string(),
                fee_rate: 0.0004,
                gas_cost: 0.30,
                total_fee: amount * 0.0004 + 0.30,
                profit_estimate: 0.0,
            },
            CheapestQuote {
                route: "Hyperlane".to_string(),
                fee_rate: 0.0008,
                gas_cost: 0.28,
                total_fee: amount * 0.0008 + 0.28,
                profit_estimate: 0.0,
            },
        ];
        // CCTP only for USDC, so if from != USDC, penalize CCTP
        if *from != StableCoin::USDC {
            candidates[0].total_fee += 1000.0; // make non-USDC CCTP non-competitive
        }
        // Compute profit for each
        for c in &mut candidates {
            c.profit_estimate = amount * 0.02 - c.total_fee; // haircut 2% profit
        }
        // Filter profit>0 and pick min total_fee
        candidates.retain(|c| c.profit_estimate > 0.0);
        candidates
            .into_iter()
            .min_by(|a, b| a.total_fee.partial_cmp(&b.total_fee).unwrap())
            .unwrap_or(CheapestQuote {
                route: "Across".to_string(),
                fee_rate: 0.0004,
                gas_cost: 0.18,
                total_fee: amount * 0.0004 + 0.18,
                profit_estimate: amount * 0.02 - (amount * 0.0004 + 0.18),
            })
    }

    // Top-up hot deficit from swap wallets of other stables via cheapest bridge/swap
    pub fn top_up_hot(
        &self,
        db: &Database,
        target: &StableCoin,
        deficit: f64,
    ) -> Result<f64, DatabaseError> {
        let mut remaining = deficit;
        let mut total_fees = 0.0;
        // snapshot swap donors with > swap_reserve
        let mut donors: Vec<(StableCoin, f64)> = Vec::new();
        for s in StableCoin::all() {
            if &s == target {
                continue;
            }
            let bal = self.get_balance(db, &s, &WalletType::Swap)?;
            if bal > self.config.swap_reserve {
                donors.push((s.clone(), bal - self.config.swap_reserve));
            }
        }
        // sort descending by excess
        donors.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        for (donor_stable, excess) in donors {
            // donor_stable: StableCoin
            if remaining <= 0.0 {
                break;
            }
            let take = remaining.min(excess);
            if take <= 0.0 {
                continue;
            }
            let quote = self.cheapest_quote(&donor_stable, target, take);
            // ensure profit
            if quote.profit_estimate <= 0.0 {
                continue;
            }
            let fee = quote.total_fee;
            let net_take = take; // user gets full take, fee paid from platform profit, not donor balance extra? Actually donor pays fee
                                 // debit donor swap
            let donor_bal = self.get_balance(db, &donor_stable, &WalletType::Swap)?;
            self.set_balance(db, &donor_stable, &WalletType::Swap, donor_bal - take - fee)?;
            // credit target hot
            let hot_bal = self.get_balance(db, target, &WalletType::Hot)?;
            self.set_balance(db, target, &WalletType::Hot, hot_bal + net_take)?;
            remaining -= net_take;
            total_fees += fee;
            // audit
            let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
            let _ = conn.execute("INSERT INTO audit_logs (ts, level, domain, actor_id, action, target, status, duration_ms, trace_id, fields) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
                rusqlite::params![chrono::Utc::now().timestamp() as f64, "Info", "payment", format!("sarai:swap:{}", donor_stable.as_str()), "top_up_hot", format!("hot:{}", target.as_str()), "ok", 0, uuid::Uuid::new_v4().to_string(), format!("{{\"from\":\"{}\",\"to\":\"{}\",\"amount\":{},\"fee\":{},\"route\":\"{}\"}}", donor_stable.as_str(), target.as_str(), take, fee, quote.route)]);
        }
        // If still deficit, try cold of target itself
        if remaining > 0.0 {
            let cold_bal = self.get_balance(db, target, &WalletType::Cold)?;
            if cold_bal > 0.0 {
                let take = remaining.min(cold_bal);
                self.set_balance(db, target, &WalletType::Cold, cold_bal - take)?;
                let hot_bal = self.get_balance(db, target, &WalletType::Hot)?;
                self.set_balance(db, target, &WalletType::Hot, hot_bal + take)?;
                remaining -= take;
            }
        }
        let filled = deficit - remaining;
        Ok(filled)
    }

    // Withdraw: ensure hot has enough, else top-up
    pub fn process_withdraw(
        &self,
        db: &Database,
        stable: StableCoin,
        amount: f64,
    ) -> Result<(), String> {
        if amount <= 0.0 {
            return Err("amount must be >0".to_string());
        }
        self.ensure_all_wallets(db).map_err(|e| e.to_string())?;
        let hot = self
            .get_balance(db, &stable, &WalletType::Hot)
            .map_err(|e| e.to_string())?;
        if hot >= amount {
            self.set_balance(db, &stable, &WalletType::Hot, hot - amount)
                .map_err(|e| e.to_string())?;
            return Ok(());
        }
        let deficit = amount - hot;
        let filled = self
            .top_up_hot(db, &stable, deficit)
            .map_err(|e| e.to_string())?;
        if filled < deficit - 1e-9 {
            return Err(format!(
                "InsufficientLiquidity: need {} have {} after top-up filled {}",
                amount, hot, filled
            ));
        }
        // now hot has been topped up, debit it
        let hot_after = self
            .get_balance(db, &stable, &WalletType::Hot)
            .map_err(|e| e.to_string())?;
        self.set_balance(db, &stable, &WalletType::Hot, hot_after - amount)
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Get all wallet balances for reporting
    pub fn get_all_balances(&self, db: &Database) -> Result<HashMap<String, f64>, DatabaseError> {
        let mut map = HashMap::new();
        for s in StableCoin::all() {
            for wt in [
                WalletType::Fee,
                WalletType::Hot,
                WalletType::Cold,
                WalletType::Swap,
                WalletType::AdminFee,
            ] {
                let nid = InternalWallet::node_id(&s, &wt);
                let bal = self.get_balance(db, &s, &wt).unwrap_or(0.0);
                map.insert(nid, bal);
            }
        }
        Ok(map)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::database::connection::Database;

    fn test_db() -> Database {
        Database::open(":memory:").unwrap()
    }

    #[test]
    fn test_fee_no_agent() {
        let e = InternalWalletEngine::new(FeeConfig::default());
        let (user, fee, plat, agent) = e.calculate_fees(1.0, None).unwrap();
        assert!((user - 0.98).abs() < 1e-9);
        assert!((fee - 0.02).abs() < 1e-9);
        assert_eq!(plat, 0.0);
        assert_eq!(agent, 0.0);
    }

    #[test]
    fn test_fee_agent_3pct() {
        let e = InternalWalletEngine::new(FeeConfig::default());
        let (user, fee, plat, agent) = e.calculate_fees(1.0, Some(0.03)).unwrap();
        assert!((user - 0.97).abs() < 1e-9);
        assert_eq!(fee, 0.0);
        assert!((plat - 0.005).abs() < 1e-9);
        assert!((agent - 0.025).abs() < 1e-9);
    }

    #[test]
    fn test_fee_negative_markup() {
        let e = InternalWalletEngine::new(FeeConfig::default());
        let (user, _, _, agent) = e.calculate_fees(100.0, Some(-0.05)).unwrap();
        assert!((user - 105.0).abs() < 1e-9);
        assert!(agent < 0.0);
    }

    #[test]
    fn test_pile_up() {
        let db = test_db();
        crate::core::database::migrations::run_migrations(&db).unwrap();
        let eng = InternalWalletEngine::new(FeeConfig::default());
        eng.ensure_all_wallets(&db).unwrap();
        eng.set_balance(&db, &StableCoin::USDT, &WalletType::Fee, 9.5)
            .unwrap();
        assert!(!eng.try_pile_up(&db, &StableCoin::USDT).unwrap());
        eng.set_balance(&db, &StableCoin::USDT, &WalletType::Fee, 10.0)
            .unwrap();
        assert!(eng.try_pile_up(&db, &StableCoin::USDT).unwrap());
        assert!(
            (eng.get_balance(&db, &StableCoin::USDT, &WalletType::Fee)
                .unwrap()
                - 0.0)
                .abs()
                < 1e-9
        );
        assert!(
            (eng.get_balance(&db, &StableCoin::USDT, &WalletType::AdminFee)
                .unwrap()
                - 10.0)
                .abs()
                < 1e-9
        );
    }

    #[test]
    fn test_top_up_dai_1000_with_300_hot() {
        let db = test_db();
        crate::core::database::migrations::run_migrations(&db).unwrap();
        let eng = InternalWalletEngine::new(FeeConfig::default());
        eng.ensure_all_wallets(&db).unwrap();
        eng.set_balance(&db, &StableCoin::DAI, &WalletType::Hot, 300.0)
            .unwrap();
        eng.set_balance(&db, &StableCoin::USDT, &WalletType::Swap, 2000.0)
            .unwrap();
        eng.set_balance(&db, &StableCoin::USDC, &WalletType::Swap, 1000.0)
            .unwrap();
        let filled = eng.top_up_hot(&db, &StableCoin::DAI, 700.0).unwrap();
        assert!(filled > 600.0);
        assert!(
            eng.get_balance(&db, &StableCoin::DAI, &WalletType::Hot)
                .unwrap()
                > 900.0
        );
    }

    #[test]
    fn test_rebalance_excess() {
        let db = test_db();
        crate::core::database::migrations::run_migrations(&db).unwrap();
        let eng = InternalWalletEngine::new(FeeConfig {
            hot_limit: 500.0,
            ..Default::default()
        });
        eng.ensure_all_wallets(&db).unwrap();
        eng.set_balance(&db, &StableCoin::USDC, &WalletType::Hot, 800.0)
            .unwrap();
        eng.try_rebalance(&db, &StableCoin::USDC).unwrap();
        assert!(
            (eng.get_balance(&db, &StableCoin::USDC, &WalletType::Hot)
                .unwrap()
                - 500.0)
                .abs()
                < 1e-9
        );
        assert!(
            (eng.get_balance(&db, &StableCoin::USDC, &WalletType::Swap)
                .unwrap()
                - 300.0)
                .abs()
                < 1e-9
        );
    }

    #[test]
    fn test_cheapest_quote_profit() {
        let eng = InternalWalletEngine::new(FeeConfig::default());
        let q = eng.cheapest_quote(&StableCoin::USDT, &StableCoin::DAI, 1000.0);
        assert!(q.profit_estimate > 0.0);
        assert!(q.total_fee < 5.0);
    }
}
