use rusqlite::params;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use crate::core::{
    database::{connection::Database, errors::DatabaseError},
    identity::types::Identity,
    marketplace::types::{Job, JobStatus},
    vault::types::VaultFileRecord,
    social::types::{Post, PostType, Visibility},
    wager::types::{Wager, WagerStatus, Tournament, TournamentStatus, TournamentMatch},
    ai::types::AiAgent,
    distributed::types::StorageContract,
    payment::types::Transaction,
    infrastructure::rift::{ServerListing, ServerStatus, HardwareSpecs, RentalAgreement, RentalPeriod, RentalStatus, ServerMetrics},
};

// ─── IDENTITY ─────────────────────────────────────────────────────────────────

pub fn insert_identity(db: &Database, id: &Identity) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO identities
         (id, node_id, username, public_key, private_key_encrypted, fingerprint,
          recovery_key_hash, recovery_phrase_hash, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            id.id, id.node_id, id.username, id.public_key, id.private_key_encrypted,
            id.fingerprint, id.recovery_key_hash, id.recovery_phrase_hash, id.created_at
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn load_identity(db: &Database, id: &str) -> Result<Identity, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.query_row(
        "SELECT id, node_id, COALESCE(username,''), public_key, private_key_encrypted, fingerprint,
                recovery_key_hash, recovery_phrase_hash, created_at
         FROM identities WHERE id = ?1",
        params![id],
        |row| Ok(Identity {
            id: row.get(0)?,
            node_id: row.get(1)?,
            username: row.get(2)?,
            public_key: row.get(3)?,
            private_key_encrypted: row.get(4)?,
            fingerprint: row.get(5)?,
            recovery_key_hash: row.get(6)?,
            recovery_phrase_hash: row.get(7)?,
            created_at: row.get(8)?,
        }),
    ).map_err(|e| DatabaseError::NotFound(e.to_string()))
}

pub fn load_first_identity(db: &Database) -> Result<Option<Identity>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, node_id, COALESCE(username,''), public_key, private_key_encrypted, fingerprint,
                recovery_key_hash, recovery_phrase_hash, created_at
         FROM identities ORDER BY created_at ASC LIMIT 1"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query_map([], |row| Ok(Identity {
        id: row.get(0)?,
        node_id: row.get(1)?,
        username: row.get(2)?,
        public_key: row.get(3)?,
        private_key_encrypted: row.get(4)?,
        fingerprint: row.get(5)?,
        recovery_key_hash: row.get(6)?,
        recovery_phrase_hash: row.get(7)?,
        created_at: row.get(8)?,
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

pub fn get_vault_file(db: &Database, file_id: &str) -> Result<Option<VaultFileRecord>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, name, hash, encrypted, size_bytes, created_at
         FROM vault_files WHERE id = ?1"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query_map(params![file_id], |row| Ok(VaultFileRecord {
        id: row.get(0)?,
        name: row.get(1)?,
        hash: row.get(2)?,
        encrypted: row.get::<_, i64>(3)? != 0,
        size_bytes: row.get(4)?,
        created_at: row.get(5)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match rows.next() {
        Some(Ok(record)) => Ok(Some(record)),
        Some(Err(e)) => Err(DatabaseError::QueryFailed(e.to_string())),
        None => Ok(None),
    }
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
            rental_start: None,
            rental_duration_hours: None,
            renter_id: None,
            reputation_score: None,
            total_earnings: 0.0,
            metrics: ServerMetrics::default(),
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

// ─── RIFT (Server Rental) ──────────────────────────────────────────────────────

pub fn insert_rental(db: &Database, rental: &RentalAgreement) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let rental_id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO rift_rentals (id, server_id, renter_id, owner_id, period, start_time, end_time, total_cost, status, payment_transaction_id, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            rental_id, rental.server_id, rental.renter_id, rental.owner_id,
            format!("{:?}", rental.period), rental.start_time, rental.end_time,
            rental.total_cost, format!("{:?}", rental.status), rental.payment_transaction_id, rental.start_time
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_rentals(db: &Database) -> Result<Vec<RentalAgreement>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, server_id, renter_id, owner_id, period, start_time, end_time, total_cost, status, payment_transaction_id, created_at
         FROM rift_rentals ORDER BY created_at DESC"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map([], |row| {
        let period_str: String = row.get(4)?;
        let status_str: String = row.get(8)?;
        Ok(RentalAgreement {
            server_id: row.get(1)?,
            renter_id: row.get(2)?,
            owner_id: row.get(3)?,
            period: match period_str.as_str() {
                "Hourly" => RentalPeriod::Hourly,
                "Daily" => RentalPeriod::Daily,
                "Weekly" => RentalPeriod::Weekly,
                "Monthly" => RentalPeriod::Monthly,
                _ => RentalPeriod::Hourly,
            },
            start_time: row.get(5)?,
            end_time: row.get(6)?,
            total_cost: row.get(7)?,
            status: match status_str.as_str() {
                "Active" => RentalStatus::Active,
                "Completed" => RentalStatus::Completed,
                "Cancelled" => RentalStatus::Cancelled,
                "Disputes" => RentalStatus::Disputes,
                _ => RentalStatus::Active,
            },
            payment_transaction_id: row.get(9)?,
        })
    }).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

pub fn insert_rental_payment(db: &Database, payment: &RiftPayment) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO rift_payments (id, rental_id, transaction_id, amount, currency, status, payment_type, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            payment.id, payment.rental_id, payment.transaction_id, payment.amount,
            payment.currency, format!("{:?}", payment.status), payment.payment_type, payment.created_at
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn insert_server_metric(db: &Database, metric: &ServerMetrics, listing_id: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO rift_metrics (id, listing_id, uptime_percentage, cpu_usage, ram_usage, disk_usage, network_in_mbps, network_out_mbps, total_rentals, total_earnings, average_rating, last_updated)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            Uuid::new_v4().to_string(), listing_id,
            metric.uptime_percentage, metric.cpu_usage, metric.ram_usage,
            metric.disk_usage, metric.network_in_mbps, metric.network_out_mbps,
            metric.total_rentals, metric.total_earnings, metric.average_rating, metric.last_updated
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn get_server_metric(db: &Database, listing_id: &str) -> Result<Option<ServerMetrics>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT uptime_percentage, cpu_usage, ram_usage, disk_usage, network_in_mbps, network_out_mbps, total_rentals, total_earnings, average_rating, last_updated
         FROM rift_metrics WHERE listing_id = ?1 ORDER BY last_updated DESC LIMIT 1"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match stmt.query_row(params![listing_id], |row| {
        Ok(ServerMetrics {
            uptime_percentage: row.get(0)?,
            cpu_usage: row.get(1)?,
            ram_usage: row.get(2)?,
            disk_usage: row.get(3)?,
            network_in_mbps: row.get(4)?,
            network_out_mbps: row.get(5)?,
            total_rentals: row.get(6)?,
            total_earnings: row.get(7)?,
            average_rating: row.get(8)?,
            last_updated: row.get(9)?,
        })
    }) {
        Ok(metric) => Ok(Some(metric)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(DatabaseError::QueryFailed(e.to_string())),
    }
}

// ─── RIFT TYPES ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiftPayment {
    pub id: String,
    pub rental_id: String,
    pub transaction_id: String,
    pub amount: f64,
    pub currency: String,
    pub status: RiftPaymentStatus,
    pub payment_type: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RiftPaymentStatus { Pending, Completed, Failed, Refunded }

// ─── ESCROW HOLDS ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbEscrowHold {
    pub id: String,
    pub payer_node_id: String,
    pub payee_node_id: String,
    pub amount: f64,
    pub reason: String,
    pub status: String,
    pub created_at: i64,
    pub released_at: Option<i64>,
}

pub fn get_escrow(db: &Database, escrow_id: &str) -> Result<Option<DbEscrowHold>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, payer_node_id, payee_node_id, amount, reason, status, created_at, released_at
         FROM escrow_holds WHERE id = ?1"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query_map(params![escrow_id], |row| Ok(DbEscrowHold {
        id: row.get(0)?,
        payer_node_id: row.get(1)?,
        payee_node_id: row.get(2)?,
        amount: row.get(3)?,
        reason: row.get(4)?,
        status: row.get(5)?,
        created_at: row.get(6)?,
        released_at: row.get(7)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match rows.next() {
        Some(Ok(e)) => Ok(Some(e)),
        Some(Err(e)) => Err(DatabaseError::QueryFailed(e.to_string())),
        None => Ok(None),
    }
}

// ─── GAME SESSIONS ───────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSession {
    pub id: String,
    pub game_id: String,
    pub player_ids: String,
    pub wager_amount: f64,
    pub start_time: i64,
    pub end_time: Option<i64>,
    pub scores: String,
    pub status: String,
    pub created_at: i64,
}

pub fn insert_game_session(db: &Database, session: &GameSession) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO game_sessions (id, game_id, player_ids, wager_amount, start_time, end_time, scores, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
         ON CONFLICT(id) DO UPDATE SET
         player_ids = ?2, end_time = ?6, scores = ?7, status = ?8",
        params![
            session.id, session.game_id, session.player_ids, session.wager_amount,
            session.start_time, session.end_time, session.scores, session.status, session.created_at
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_game_sessions(db: &Database) -> Result<Vec<GameSession>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, game_id, player_ids, wager_amount, start_time, end_time, scores, status, created_at
         FROM game_sessions ORDER BY created_at DESC"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map([], |row| Ok(GameSession {
        id: row.get(0)?,
        game_id: row.get(1)?,
        player_ids: row.get(2)?,
        wager_amount: row.get(3)?,
        start_time: row.get(4)?,
        end_time: row.get(5)?,
        scores: row.get(6)?,
        status: row.get(7)?,
        created_at: row.get(8)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

// ─── TOURNAMENTS ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbTournament {
    pub id: String,
    pub host_id: String,
    pub name: String,
    pub game_type: String,
    pub entry_fee: f64,
    pub prize_pool: f64,
    pub max_participants: u32,
    pub participants: String,
    pub bracket: String,
    pub status: String,
    pub created_at: i64,
    pub starts_at: i64,
    pub referee_ids: String,
    pub host_fee_pct: f64,
}

pub fn insert_tournament(db: &Database, tournament: &Tournament) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let participants_json = serde_json::to_string(&tournament.participants).unwrap_or_else(|_| "[]".to_string());
    let bracket_json = serde_json::to_string(&tournament.bracket).unwrap_or_else(|_| "[]".to_string());
    let referee_ids_json = serde_json::to_string(&tournament.referee_ids).unwrap_or_else(|_| "[]".to_string());
    conn.execute(
        "INSERT INTO tournaments (id, host_id, name, game_type, entry_fee, prize_pool, max_participants, participants, bracket, status, created_at, starts_at, referee_ids, host_fee_pct)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            tournament.id, tournament.host_id, tournament.name, tournament.game_type,
            tournament.entry_fee, tournament.prize_pool, tournament.max_participants,
            participants_json, bracket_json, format!("{:?}", tournament.status),
            tournament.created_at, tournament.starts_at, referee_ids_json, tournament.host_fee_pct
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

// ─── PEERS ───────────────────────────────────────────────────────────────────

pub fn upsert_peer(db: &Database, peer: &crate::core::network::types::PeerInfo) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT OR REPLACE INTO peers (id, address, public_key, last_seen, trust_score, relay_score, online)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            peer.id, peer.address, peer.public_key, peer.last_seen,
            peer.trust_score, peer.relay_score, peer.online as i64
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn load_peers(db: &Database) -> Result<Vec<crate::core::network::types::PeerInfo>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, address, public_key, last_seen, trust_score, relay_score, online
         FROM peers ORDER BY last_seen DESC"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let peers = stmt.query_map([], |row| {
        Ok(crate::core::network::types::PeerInfo {
            id: row.get(0)?,
            address: row.get(1)?,
            public_key: row.get(2)?,
            last_seen: row.get(3)?,
            trust_score: row.get(4)?,
            relay_score: row.get(5)?,
            online: row.get::<_, i64>(6)? != 0,
            latency_ms: 0,
        })
    }).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?
    .filter_map(|r| r.ok())
    .collect();
    Ok(peers)
}

pub fn update_peer_online(db: &Database, peer_id: &str, online: bool) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "UPDATE peers SET online = ?1 WHERE id = ?2",
        params![online as i64, peer_id],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn update_peer_last_seen(db: &Database, peer_id: &str, last_seen: i64) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "UPDATE peers SET last_seen = ?1, online = 1 WHERE id = ?2",
        params![last_seen, peer_id],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

// ─── ADMIN USERS ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdminUser {
    pub id: String,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub role: String,
    pub permissions: String,
    pub created_at: i64,
    pub last_login: Option<i64>,
    pub is_active: i64,
}

pub fn insert_admin_user(db: &Database, user: &AdminUser) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO admin_users (id, username, email, password_hash, role, permissions, created_at, last_login, is_active)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![user.id, user.username, user.email, user.password_hash, user.role, user.permissions, user.created_at, user.last_login, user.is_active],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn get_admin_user(db: &Database, id: &str) -> Result<AdminUser, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, username, email, password_hash, role, permissions, created_at, last_login, is_active
         FROM admin_users WHERE id = ?1"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query_map(params![id], |row| Ok(AdminUser {
        id: row.get(0)?,
        username: row.get(1)?,
        email: row.get(2)?,
        password_hash: row.get(3)?,
        role: row.get(4)?,
        permissions: row.get(5)?,
        created_at: row.get(6)?,
        last_login: row.get(7)?,
        is_active: row.get(8)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match rows.next() {
        Some(Ok(u)) => Ok(u),
        Some(Err(e)) => Err(DatabaseError::QueryFailed(e.to_string())),
        None => Err(DatabaseError::NotFound(format!("Admin user '{}' not found", id))),
    }
}

pub fn get_admin_user_by_username(db: &Database, username: &str) -> Result<AdminUser, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, username, email, password_hash, role, permissions, created_at, last_login, is_active
         FROM admin_users WHERE username = ?1"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query_map(params![username], |row| Ok(AdminUser {
        id: row.get(0)?,
        username: row.get(1)?,
        email: row.get(2)?,
        password_hash: row.get(3)?,
        role: row.get(4)?,
        permissions: row.get(5)?,
        created_at: row.get(6)?,
        last_login: row.get(7)?,
        is_active: row.get(8)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match rows.next() {
        Some(Ok(u)) => Ok(u),
        Some(Err(e)) => Err(DatabaseError::QueryFailed(e.to_string())),
        None => Err(DatabaseError::NotFound(format!("Admin user '{}' not found", username))),
    }
}

pub fn update_admin_user(db: &Database, user: &AdminUser) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "UPDATE admin_users SET username = ?2, email = ?3, password_hash = ?4, role = ?5, permissions = ?6, last_login = ?7, is_active = ?8 WHERE id = ?1",
        params![user.id, user.username, user.email, user.password_hash, user.role, user.permissions, user.last_login, user.is_active],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn delete_admin_user(db: &Database, id: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute("DELETE FROM admin_users WHERE id = ?1", params![id])
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_admin_users(db: &Database) -> Result<Vec<AdminUser>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, username, email, password_hash, role, permissions, created_at, last_login, is_active
         FROM admin_users ORDER BY username ASC"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map([], |row| Ok(AdminUser {
        id: row.get(0)?,
        username: row.get(1)?,
        email: row.get(2)?,
        password_hash: row.get(3)?,
        role: row.get(4)?,
        permissions: row.get(5)?,
        created_at: row.get(6)?,
        last_login: row.get(7)?,
        is_active: row.get(8)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut users = Vec::new();
    for row in rows {
        if let Ok(u) = row {
            users.push(u);
        }
    }
    Ok(users)
}

// ─── ADMIN LOGS ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdminLog {
    pub id: i64,
    pub admin_id: String,
    pub action: String,
    pub target_type: String,
    pub target_id: Option<String>,
    pub details: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: i64,
}

pub fn insert_admin_log(db: &Database, log: &AdminLog) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, ip_address, user_agent, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            log.id, log.admin_id, log.action, log.target_type,
            log.target_id, log.details, log.ip_address, log.user_agent, log.created_at
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_admin_logs(db: &Database, limit: i64, offset: i64) -> Result<Vec<AdminLog>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, admin_id, action, target_type, target_id, details, ip_address, user_agent, created_at
         FROM admin_logs ORDER BY created_at DESC LIMIT ?1 OFFSET ?2"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map(params![limit, offset], |row| Ok(AdminLog {
        id: row.get(0)?,
        admin_id: row.get(1)?,
        action: row.get(2)?,
        target_type: row.get(3)?,
        target_id: row.get(4)?,
        details: row.get(5)?,
        ip_address: row.get(6)?,
        user_agent: row.get(7)?,
        created_at: row.get(8)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut logs = Vec::new();
    for row in rows {
        if let Ok(l) = row {
            logs.push(l);
        }
    }
    Ok(logs)
}

pub fn get_admin_log_count(db: &Database) -> Result<i64, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.query_row("SELECT COUNT(*) FROM admin_logs", [], |r| r.get(0))
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))
}

// ─── SYSTEM CONFIG ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemConfig {
    pub id: String,
    pub config_key: String,
    pub config_value: String,
    pub description: Option<String>,
    pub category: String,
    pub updated_at: i64,
}

pub fn get_system_config(db: &Database, key: &str) -> Result<SystemConfig, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, config_key, config_value, description, category, updated_at
         FROM system_config WHERE config_key = ?1"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query_map(params![key], |row| Ok(SystemConfig {
        id: row.get(0)?,
        config_key: row.get(1)?,
        config_value: row.get(2)?,
        description: row.get(3)?,
        category: row.get(4)?,
        updated_at: row.get(5)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match rows.next() {
        Some(Ok(c)) => Ok(c),
        Some(Err(e)) => Err(DatabaseError::QueryFailed(e.to_string())),
        None => Err(DatabaseError::NotFound(format!("Config '{}' not found", key))),
    }
}

pub fn update_system_config(db: &Database, key: &str, value: &str, description: Option<String>, category: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let existing = get_system_config(db, key);
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    match existing {
        Ok(_) => {
            conn.execute(
                "UPDATE system_config SET config_value = ?1, description = ?2, category = ?3, updated_at = ?4 WHERE config_key = ?5",
                params![value, description, category, now, key],
            ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
        }
        Err(_) => {
            conn.execute(
                "INSERT INTO system_config (id, config_key, config_value, description, category, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![Uuid::new_v4().to_string(), key, value, description, category, now],
            ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
        }
    }
    Ok(())
}

pub fn list_system_config(db: &Database, category: Option<&str>) -> Result<Vec<SystemConfig>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let owned_val;
    let (sql, query_params): (String, Vec<&dyn rusqlite::types::ToSql>) = match category {
        Some(cat) => {
            owned_val = cat.to_string();
            (
                "SELECT id, config_key, config_value, description, category, updated_at FROM system_config WHERE category = ?1 ORDER BY config_key".to_string(),
                vec![&owned_val],
            )
        }
        None => (
            "SELECT id, config_key, config_value, description, category, updated_at FROM system_config ORDER BY category, config_key".to_string(),
            vec![],
        ),
    };
    let mut stmt = conn.prepare(&sql).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map(query_params.as_slice(), |row| Ok(SystemConfig {
        id: row.get(0)?,
        config_key: row.get(1)?,
        config_value: row.get(2)?,
        description: row.get(3)?,
        category: row.get(4)?,
        updated_at: row.get(5)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut configs = Vec::new();
    for row in rows {
        if let Ok(c) = row {
            configs.push(c);
        }
    }
    Ok(configs)
}

// ─── LOCAL USERS (Authentication) ──────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalUser {
    pub id: String,
    pub username: String,
    pub email: Option<String>,
    pub password_hash: String,
    pub node_id: String,
    pub created_at: i64,
    pub last_login: Option<i64>,
    pub is_active: bool,
    pub force_password_change: bool,
}

pub fn insert_local_user(db: &Database, user: &LocalUser) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO local_users (id, username, email, password_hash, node_id, created_at, last_login, is_active, force_password_change)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            user.id, user.username, user.email, user.password_hash, user.node_id,
            user.created_at, user.last_login, user.is_active as i64, user.force_password_change as i64
        ],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn get_local_user_by_username(db: &Database, username: &str) -> Result<LocalUser, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, username, email, password_hash, node_id, created_at, last_login, is_active, force_password_change
         FROM local_users WHERE username = ?1"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query_map(params![username], |row| Ok(LocalUser {
        id: row.get(0)?,
        username: row.get(1)?,
        email: row.get(2)?,
        password_hash: row.get(3)?,
        node_id: row.get(4)?,
        created_at: row.get(5)?,
        last_login: row.get(6)?,
        is_active: row.get::<_, i64>(7)? != 0,
        force_password_change: row.get::<_, i64>(8)? != 0,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match rows.next() {
        Some(Ok(u)) => Ok(u),
        Some(Err(e)) => Err(DatabaseError::QueryFailed(e.to_string())),
        None => Err(DatabaseError::NotFound(format!("User '{}' not found", username))),
    }
}

pub fn update_local_user_last_login(db: &Database, user_id: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    conn.execute(
        "UPDATE local_users SET last_login = ?1 WHERE id = ?2",
        params![now, user_id],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn update_local_user_password(db: &Database, user_id: &str, new_password_hash: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "UPDATE local_users SET password_hash = ?1, force_password_change = 0 WHERE id = ?2",
        params![new_password_hash, user_id],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

// ─── RECOVERY CODES ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryCode {
    pub id: String,
    pub node_id: String,
    pub code_hash: String,
    pub used: bool,
    pub created_at: i64,
    pub expires_at: i64,
}

pub fn insert_recovery_code(db: &Database, code: &RecoveryCode) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO recovery_codes (id, node_id, code_hash, used, created_at, expires_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![code.id, code.node_id, code.code_hash, code.used as i64, code.created_at, code.expires_at],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn get_valid_recovery_code(db: &Database, code_hash: &str) -> Result<RecoveryCode, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    let mut stmt = conn.prepare(
        "SELECT id, node_id, code_hash, used, created_at, expires_at
         FROM recovery_codes WHERE code_hash = ?1 AND used = 0 AND expires_at > ?2"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query_map(params![code_hash, now], |row| Ok(RecoveryCode {
        id: row.get(0)?,
        node_id: row.get(1)?,
        code_hash: row.get(2)?,
        used: row.get::<_, i64>(3)? != 0,
        created_at: row.get(4)?,
        expires_at: row.get(5)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match rows.next() {
        Some(Ok(c)) => Ok(c),
        Some(Err(e)) => Err(DatabaseError::QueryFailed(e.to_string())),
        None => Err(DatabaseError::NotFound("Invalid or expired recovery code".to_string())),
    }
}

pub fn mark_recovery_code_used(db: &Database, code_id: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "UPDATE recovery_codes SET used = 1 WHERE id = ?1",
        params![code_id],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

// ─── CONTACTS ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    pub id: String,
    pub owner_node_id: String,
    pub contact_node_id: String,
    pub contact_username: String,
    pub nickname: String,
    pub status: String,
    pub created_at: i64,
}

pub fn insert_contact(db: &Database, owner_node_id: &str, contact_node_id: &str, contact_username: &str, nickname: &str) -> Result<Contact, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let id = Uuid::new_v4().to_string();
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    conn.execute(
        "INSERT INTO contacts (id, owner_node_id, contact_node_id, contact_username, nickname, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 'accepted', ?6)
         ON CONFLICT(owner_node_id, contact_node_id) DO UPDATE SET
         contact_username = excluded.contact_username, nickname = excluded.nickname",
        params![id, owner_node_id, contact_node_id, contact_username, nickname, now],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(Contact { id, owner_node_id: owner_node_id.to_string(), contact_node_id: contact_node_id.to_string(), contact_username: contact_username.to_string(), nickname: nickname.to_string(), status: "accepted".to_string(), created_at: now })
}

pub fn list_contacts(db: &Database, owner_node_id: &str) -> Result<Vec<Contact>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare(
        "SELECT id, owner_node_id, contact_node_id, contact_username, nickname, status, created_at
         FROM contacts WHERE owner_node_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map(params![owner_node_id], |row| Ok(Contact {
        id: row.get(0)?,
        owner_node_id: row.get(1)?,
        contact_node_id: row.get(2)?,
        contact_username: row.get(3)?,
        nickname: row.get(4)?,
        status: row.get(5)?,
        created_at: row.get(6)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string()))).collect()
}

pub fn remove_contact(db: &Database, owner_node_id: &str, contact_node_id: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "DELETE FROM contacts WHERE owner_node_id = ?1 AND contact_node_id = ?2",
        params![owner_node_id, contact_node_id],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn search_identities_by_query(db: &Database, query: &str) -> Result<Vec<Identity>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let pattern = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT id, node_id, COALESCE(username,''), public_key, private_key_encrypted, fingerprint,
                recovery_key_hash, recovery_phrase_hash, created_at
         FROM identities WHERE node_id LIKE ?1 OR username LIKE ?1 LIMIT 20"
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt.query_map(params![pattern], |row| Ok(Identity {
        id: row.get(0)?,
        node_id: row.get(1)?,
        username: row.get(2)?,
        public_key: row.get(3)?,
        private_key_encrypted: row.get(4)?,
        fingerprint: row.get(5)?,
        recovery_key_hash: row.get(6)?,
        recovery_phrase_hash: row.get(7)?,
        created_at: row.get(8)?,
    })).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string()))).collect()
}

pub fn store_recovery_attempt(db: &Database, node_id: &str, code_hash: &str, success: bool) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS recovery_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            code_hash TEXT NOT NULL,
            success INTEGER NOT NULL,
            attempted_at INTEGER NOT NULL
        )",
        [],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    conn.execute(
        "INSERT INTO recovery_attempts (node_id, code_hash, success, attempted_at) VALUES (?1, ?2, ?3, ?4)",
        params![node_id, code_hash, success as i64, now],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}
