use rusqlite::params;
use crate::core::{
    database::{connection::Database, errors::DatabaseError},
    identity::types::Identity,
    marketplace::types::{Job, JobStatus},
    vault::types::VaultFileRecord,
    social::types::{Post, PostType, Visibility},
    wager::types::{Wager, WagerStatus},
    ai::types::AiAgent,
    distributed::types::StorageContract,
    payment::types::Transaction,
    infrastructure::rift::{ServerListing, ServerStatus, HardwareSpecs},
};

// ─── IDENTITY ─────────────────────────────────────────────────────────────────

pub fn insert_identity(db: &Database, id: &Identity) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO identities
         (id, node_id, public_key, private_key_encrypted, fingerprint,
          recovery_key_hash, recovery_phrase_hash, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            id.id, id.node_id, id.public_key, id.private_key_encrypted,
            id.fingerprint, id.recovery_key_hash, id.recovery_phrase_hash, id.created_at
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn load_identity(db: &Database, id: &str) -> Result<Identity, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.query_row(
        "SELECT id, node_id, public_key, private_key_encrypted, fingerprint,
                recovery_key_hash, recovery_phrase_hash, created_at
         FROM identities WHERE id = ?1",
        params![id],
        |row| Ok(Identity {
            id: row.get(0)?,
            node_id: row.get(1)?,
            public_key: row.get(2)?,
            private_key_encrypted: row.get(3)?,
            fingerprint: row.get(4)?,
            recovery_key_hash: row.get(5)?,
            recovery_phrase_hash: row.get(6)?,
            created_at: row.get(7)?,
        }),
    ).map_err(|e| DatabaseError::NotFound(e.to_string()))
}

pub fn load_first_identity(db: &Database) -> Result<Option<Identity>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, node_id, public_key, private_key_encrypted, fingerprint,
                recovery_key_hash, recovery_phrase_hash, created_at
         FROM identities ORDER BY created_at ASC LIMIT 1"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query_map([], |row| Ok(Identity {
        id: row.get(0)?,
        node_id: row.get(1)?,
        public_key: row.get(2)?,
        private_key_encrypted: row.get(3)?,
        fingerprint: row.get(4)?,
        recovery_key_hash: row.get(5)?,
        recovery_phrase_hash: row.get(6)?,
        created_at: row.get(7)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match rows.next() {
        Some(Ok(id)) => Ok(Some(id)),
        Some(Err(e)) => Err(DatabaseError::QueryFailed(e.to_string())),
        None => Ok(None),
    }
}

pub fn identity_count(db: &Database) -> Result<i64, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.query_row("SELECT COUNT(*) FROM identities", [], |r| r.get(0))
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))
}

// ─── VAULT FILES ──────────────────────────────────────────────────────────────

pub fn insert_vault_file(db: &Database, f: &VaultFileRecord) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO vault_files (id, name, hash, encrypted, size_bytes, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![f.id, f.name, f.hash, f.encrypted as i64, f.size_bytes, f.created_at],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_vault_files(db: &Database) -> Result<Vec<VaultFileRecord>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, name, hash, encrypted, size_bytes, created_at
         FROM vault_files ORDER BY created_at DESC"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map([], |row| Ok(VaultFileRecord {
        id: row.get(0)?,
        name: row.get(1)?,
        hash: row.get(2)?,
        encrypted: row.get::<_, i64>(3)? != 0,
        size_bytes: row.get(4)?,
        created_at: row.get(5)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

// ─── MARKETPLACE ──────────────────────────────────────────────────────────────

pub fn insert_job(db: &Database, job: &Job) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO marketplace_jobs (id, title, description, budget, status, owner_id, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![job.id, job.title, job.description, job.budget, "open", job.owner_id, job.created_at],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_jobs(db: &Database) -> Result<Vec<Job>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, title, description, budget, status, owner_id, created_at
         FROM marketplace_jobs ORDER BY created_at DESC"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    
    let rows = stmt.query_map([], |row| Ok(Job {
        id: row.get(0)?,
        title: row.get(1)?,
        description: row.get(2)?,
        budget: row.get(3)?,
        status: JobStatus::Open,
        owner_id: row.get(5)?,
        created_at: row.get(6)?,
        // Fields not in marketplace_jobs table yet, providing defaults
        currency: "PINC".to_string(),
        skills_required: vec![],
        milestones: vec![],
        deadline: None,
        updated_at: row.get(6)?,
        applicant_count: 0,
        selected_worker: None,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

pub fn delete_vault_file(db: &Database, id: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute("DELETE FROM vault_files WHERE id = ?1", params![id])
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn vault_file_count(db: &Database) -> Result<i64, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.query_row("SELECT COUNT(*) FROM vault_files", [], |r| r.get(0))
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

pub fn get_settings_row(db: &Database) -> Result<Option<String>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    match conn.query_row("SELECT value FROM settings WHERE key = ?1", params!["global"], |r| r.get(0)) {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(DatabaseError::QueryFailed(e.to_string())),
    }
}

pub fn upsert_settings(db: &Database, json: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params!["global", json],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────

pub fn log_activity(db: &Database, event_type: &str, message: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    conn.execute(
        "INSERT INTO activity_log (event_type, message, created_at) VALUES (?1, ?2, ?3)",
        params![event_type, message, now],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

// ─── SOCIAL POSTS ────────────────────────────────────────────────────────────

pub fn insert_post(db: &Database, post: &Post) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let tags_json = serde_json::to_string(&post.tags).unwrap_or_else(|_| "[]".to_string());
    conn.execute(
        "INSERT INTO social_posts (id, author_id, content, post_type, visibility,
         like_count, reply_count, reply_to, tags, created_at, edited_at, encrypted)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            post.id, post.author_id, post.content,
            format!("{:?}", post.post_type),
            format!("{:?}", post.visibility),
            post.like_count as i64, post.reply_count as i64,
            post.reply_to, tags_json, post.created_at,
            post.edited_at, post.encrypted as i64,
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_posts(db: &Database, limit: i64) -> Result<Vec<Post>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, author_id, content, post_type, visibility,
                like_count, reply_count, reply_to, tags, created_at, edited_at, encrypted
         FROM social_posts ORDER BY created_at DESC LIMIT ?1"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map(params![limit], |row| {
        let post_type_str: String = row.get(3)?;
        let visibility_str: String = row.get(4)?;
        let tags_raw: String = row.get(8)?;
        let tags: Vec<String> = serde_json::from_str(&tags_raw).unwrap_or_default();
        Ok(Post {
            id: row.get(0)?,
            author_id: row.get(1)?,
            content: row.get(2)?,
            post_type: match post_type_str.as_str() {
                "Image" => PostType::Image,
                "Video" => PostType::Video,
                "Challenge" => PostType::Challenge,
                "Announcement" => PostType::Announcement,
                "JobPost" => PostType::JobPost,
                _ => PostType::Text,
            },
            visibility: match visibility_str.as_str() {
                "Followers" => Visibility::Followers,
                "Private" => Visibility::Private,
                _ => Visibility::Public,
            },
            like_count: row.get::<_, i64>(5)? as u64,
            reply_count: row.get::<_, i64>(6)? as u64,
            reply_to: row.get(7)?,
            tags,
            media_hashes: vec![],
            created_at: row.get(9)?,
            edited_at: row.get(10)?,
            encrypted: row.get::<_, i64>(11)? != 0,
        })
    }).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

// ─── WAGERS ──────────────────────────────────────────────────────────────────

pub fn insert_wager(db: &Database, wager: &Wager) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO wagers (id, challenger, opponent, amount, game_type, status, winner_id, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            wager.id, wager.challenger_id, wager.opponent_id, wager.amount,
            wager.game_type, format!("{:?}", wager.status), wager.winner_id, wager.created_at,
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_wagers(db: &Database) -> Result<Vec<Wager>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, challenger, opponent, amount, game_type, status, winner_id, created_at
         FROM wagers ORDER BY created_at DESC"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map([], |row| {
        let status_str: String = row.get(5)?;
        Ok(Wager {
            id: row.get(0)?,
            challenger_id: row.get(1)?,
            opponent_id: row.get(2)?,
            amount: row.get(3)?,
            currency: "PINC".to_string(),
            game_type: row.get(4)?,
            description: String::new(),
            status: match status_str.as_str() {
                "Accepted" => WagerStatus::Accepted,
                "InProgress" => WagerStatus::InProgress,
                "Completed" => WagerStatus::Completed,
                "Cancelled" => WagerStatus::Cancelled,
                "Expired" => WagerStatus::Expired,
                _ => WagerStatus::Pending,
            },
            outcome: None,
            winner_id: row.get(6)?,
            referee_ids: vec![],
            created_at: row.get(7)?,
            accepted_at: None,
            expires_at: None,
            evidence_hashes: vec![],
            platform_fee_pct: 0.025,
        })
    }).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

// ─── AI AGENTS ───────────────────────────────────────────────────────────────

pub fn insert_ai_agent(db: &Database, agent: &AiAgent) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO ai_agents (id, agent_type, name, active, model_hash, version, accuracy, inferences, created_at, last_run)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            agent.id, format!("{:?}", agent.agent_type), agent.name,
            agent.active as i64, agent.model_hash, agent.version,
            agent.accuracy, agent.inferences_run as i64, agent.created_at, agent.last_run,
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_ai_agents(db: &Database) -> Result<Vec<AiAgent>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, agent_type, name, active, model_hash, version, accuracy, inferences, created_at, last_run
         FROM ai_agents ORDER BY created_at DESC"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map([], |row| {
        let type_str: String = row.get(1)?;
        Ok(AiAgent {
            id: row.get(0)?,
            agent_type: match type_str.as_str() {
                "Routing" => crate::core::ai::types::AgentType::Routing,
                "FraudDetection" => crate::core::ai::types::AgentType::FraudDetection,
                "ContentRecommendation" => crate::core::ai::types::AgentType::ContentRecommendation,
                "DisputeArbitration" => crate::core::ai::types::AgentType::DisputeArbitration,
                "AnomalyDetection" => crate::core::ai::types::AgentType::AnomalyDetection,
                "CachePredictor" => crate::core::ai::types::AgentType::CachePredictor,
                "BandwidthOptimizer" => crate::core::ai::types::AgentType::BandwidthOptimizer,
                _ => crate::core::ai::types::AgentType::Moderation,
            },
            name: row.get(2)?,
            active: row.get::<_, i64>(3)? != 0,
            model_hash: row.get(4)?,
            version: row.get(5)?,
            accuracy: row.get(6)?,
            inferences_run: row.get::<_, i64>(7)? as u64,
            created_at: row.get(8)?,
            last_run: row.get(9)?,
        })
    }).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

// ─── STORAGE CONTRACTS ───────────────────────────────────────────────────────

pub fn insert_storage_contract(db: &Database, contract: &StorageContract) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO storage_contracts (id, provider_node_id, consumer_node_id, bytes_allocated, price_per_gb, expires_at, active)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            contract.id, contract.provider_node_id, contract.consumer_node_id,
            contract.bytes_allocated as i64, contract.price_per_gb_per_day,
            contract.expires_at, contract.active as i64,
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_storage_contracts(db: &Database) -> Result<Vec<StorageContract>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, provider_node_id, consumer_node_id, bytes_allocated, price_per_gb, expires_at, active
         FROM storage_contracts ORDER BY expires_at DESC"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map([], |row| {
        Ok(StorageContract {
            id: row.get(0)?,
            provider_node_id: row.get(1)?,
            consumer_node_id: row.get(2)?,
            bytes_allocated: row.get::<_, i64>(3)? as u64,
            price_per_gb_per_day: row.get(4)?,
            expires_at: row.get(5)?,
            active: row.get::<_, i64>(6)? != 0,
        })
    }).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

// ─── RIFT SERVER LISTINGS ──────────────────────────────────────────────────────

pub fn insert_server_listing(db: &Database, listing: &ServerListing) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let specs_json = serde_json::to_string(&listing.hardware_specs).unwrap_or_else(|_| "{}".to_string());
    conn.execute(
        "INSERT INTO rift_listings (id, owner_id, tier, price_per_hour, hardware_specs, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            listing.id, listing.owner_id, listing.tier, listing.price_per_hour,
            specs_json, format!("{:?}", listing.status), listing.created_at
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_server_listings(db: &Database) -> Result<Vec<ServerListing>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, owner_id, tier, price_per_hour, hardware_specs, status, created_at
         FROM rift_listings ORDER BY created_at DESC"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map([], |row| {
        let status_str: String = row.get(5)?;
        let specs_raw: String = row.get(4)?;
        let specs: HardwareSpecs = serde_json::from_str(&specs_raw).unwrap_or(HardwareSpecs { cpu_cores: 0, ram_gb: 0, storage_gb: 0, network_speed_mbps: 0 });
        Ok(ServerListing {
            id: row.get(0)?,
            owner_id: row.get(1)?,
            tier: row.get(2)?,
            price_per_hour: row.get(3)?,
            hardware_specs: specs,
            status: match status_str.as_str() {
                "Rented" => ServerStatus::Rented,
                "Maintenance" => ServerStatus::Maintenance,
                "Offline" => ServerStatus::Offline,
                _ => ServerStatus::Available,
            },
            created_at: row.get(6)?,
        })
    }).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

// ─── REPUTATION ────────────────────────────────────────────────────────────────

pub fn get_reputation(db: &Database, node_id: &str) -> Result<Option<(f64, f64, f64, f64)>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    match conn.query_row(
        "SELECT relay_score, job_score, pay_score, total_score FROM reputation WHERE node_id = ?1",
        params![node_id],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
    ) {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(DatabaseError::QueryFailed(e.to_string())),
    }
}

pub fn upsert_reputation(
    db: &Database, node_id: &str, relay_score: f64, job_score: f64, pay_score: f64, total_score: f64,
) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    conn.execute(
        "INSERT INTO reputation (node_id, relay_score, job_score, pay_score, total_score, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(node_id) DO UPDATE SET relay_score = excluded.relay_score,
         job_score = excluded.job_score, pay_score = excluded.pay_score,
         total_score = excluded.total_score, updated_at = excluded.updated_at",
        params![node_id, relay_score, job_score, pay_score, total_score, now],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

// ─── WALLET BALANCES ─────────────────────────────────────────────────────────

pub fn get_wallet_balance(db: &Database, node_id: &str) -> Result<Option<(f64, f64, f64, f64)>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    match conn.query_row(
        "SELECT balance, escrow_locked, pending_in, pending_out FROM wallet_balances WHERE node_id = ?1",
        params![node_id],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
    ) {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(DatabaseError::QueryFailed(e.to_string())),
    }
}

pub fn upsert_wallet_balance(
    db: &Database, node_id: &str, balance: f64, escrow_locked: f64, pending_in: f64, pending_out: f64,
) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    conn.execute(
        "INSERT INTO wallet_balances (node_id, balance, escrow_locked, pending_in, pending_out, currency, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 'PINC', ?6)
         ON CONFLICT(node_id) DO UPDATE SET balance = excluded.balance,
         escrow_locked = excluded.escrow_locked, pending_in = excluded.pending_in,
         pending_out = excluded.pending_out, updated_at = excluded.updated_at",
        params![node_id, balance, escrow_locked, pending_in, pending_out, now],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

// ─── WALLET TRANSACTIONS ─────────────────────────────────────────────────────

pub fn insert_transaction(db: &Database, tx: &Transaction) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO wallet_transactions (id, amount, tx_type, peer_id, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            tx.id, tx.amount, format!("{:?}", tx.tx_type),
            tx.to_node, format!("{:?}", tx.status), tx.created_at,
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_transactions(db: &Database) -> Result<Vec<Transaction>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, amount, tx_type, peer_id, status, created_at
         FROM wallet_transactions ORDER BY created_at DESC"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map([], |row| {
        let tx_type_str: String = row.get(2)?;
        let status_str: String = row.get(4)?;
        Ok(Transaction {
            id: row.get(0)?,
            from_node: String::new(),
            to_node: row.get(3)?,
            amount: row.get(1)?,
            currency: "PINC".to_string(),
            tx_type: match tx_type_str.as_str() {
                "Deposit" => crate::core::payment::types::TxType::Deposit,
                "Withdrawal" => crate::core::payment::types::TxType::Withdrawal,
                "EscrowLock" => crate::core::payment::types::TxType::EscrowLock,
                "EscrowRelease" => crate::core::payment::types::TxType::EscrowRelease,
                "EscrowReturn" => crate::core::payment::types::TxType::EscrowReturn,
                "Transfer" => crate::core::payment::types::TxType::Transfer,
                "Fee" => crate::core::payment::types::TxType::Fee,
                "Reward" => crate::core::payment::types::TxType::Reward,
                _ => crate::core::payment::types::TxType::Transfer,
            },
            status: match status_str.as_str() {
                "Confirmed" => crate::core::payment::types::TxStatus::Confirmed,
                "Failed" => crate::core::payment::types::TxStatus::Failed,
                "Cancelled" => crate::core::payment::types::TxStatus::Cancelled,
                "Disputed" => crate::core::payment::types::TxStatus::Disputed,
                _ => crate::core::payment::types::TxStatus::Pending,
            },
            reference: None,
            memo: None,
            created_at: row.get(5)?,
            confirmed_at: None,
            chain_tx_hash: None,
        })
    }).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}
