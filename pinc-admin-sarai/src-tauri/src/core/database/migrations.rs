use crate::core::database::{connection::Database, errors::DatabaseError, schema::*};
use rusqlite::Connection;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn run_migrations(db: &Database) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute_batch(CREATE_SCHEMA_VERSION)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_IDENTITIES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_VAULT_FILES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_PEERS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_SETTINGS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_ACTIVITY_LOG)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_FILE_CHUNKS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_NODE_STATUS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_DISTRIBUTED_CHUNKS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_MESSAGES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    migrate_messages_schema(&conn).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_CONVERSATIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    migrate_conversations_schema(&conn)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_MESSAGES_INDEXES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_MESSAGING_KEYS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    migrate_messaging_keys_schema(&conn)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_MARKETPLACE)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_WALLET)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_REPUTATION)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_WAGERS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_SOCIAL_POSTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_AI_AGENTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_STORAGE_CONTRACTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_WALLET_BALANCES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RIFT_LISTINGS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RIFT_RENTALS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RIFT_METRICS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RIFT_PAYMENTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_NET_SHARE_CODES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_SHARED_CONNECTIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_NET_STORE_LISTINGS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_NET_STORE_PURCHASES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_HOTSPOT_SESSIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_PEER_BANDWIDTH_USAGE)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_BILLING_TRANSACTIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_ESCROW_HOLDS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_GAME_SESSIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_GAME_PROGRESS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_CONTACTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(MIGRATE_CONTACTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_CHANNELS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_CALL_HISTORY)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_P2P_AGENTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_P2P_PAYMENT_CHANNELS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_P2P_COMM_LINKS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_P2P_DEPOSIT_ORDERS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_AUDIT_LOGS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_PAYMENT_LINKS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_OP_TRAILS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_SESSIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_FAUCET_CLAIMS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_TOURNAMENTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_WEB_GAMES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_ADMIN_USERS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_ADMIN_LOGS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_SYSTEM_CONFIG)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_LOCAL_USERS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RECOVERY_CODES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_JOB_APPLICATIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_SOCIAL_COMMENTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_FOLLOWS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_CHALLENGES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_PROBLEMS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_DUELS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_PRODUCTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RESOURCES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RESOURCE_REQUESTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RESOURCE_ALLOCATIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RESOURCE_USAGE)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_MARKETPLACE_LISTINGS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_INTERNAL_WALLETS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_BUILD_TELEMETRY)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_P2P_AGENT_BALANCES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_TOKENS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_APP_SETTINGS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_AUTH_SECRETS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_WALLET_ADDRESSES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_CHAIN_TX_DEDUP)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_WALLET_BALANCES_TOKENS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    // Ensure wallet_transactions has chain_tx_hash UNIQUE dedup + confirmations (12 confs)
    let _ = conn.execute("ALTER TABLE wallet_transactions ADD COLUMN chain_tx_hash TEXT", []);
    let _ = conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_hash ON wallet_transactions(chain_tx_hash) WHERE chain_tx_hash IS NOT NULL", []);
    let _ = conn.execute("ALTER TABLE wallet_transactions ADD COLUMN confirmations INTEGER", []);

    for (table, column, sql) in [
        (
            "p2p_agents",
            "is_online",
            "ALTER TABLE p2p_agents ADD COLUMN is_online INTEGER NOT NULL DEFAULT 0;",
        ),
        (
            "p2p_agents",
            "last_seen",
            "ALTER TABLE p2p_agents ADD COLUMN last_seen INTEGER NOT NULL DEFAULT 0;",
        ),
        (
            "p2p_agents",
            "total_orders",
            "ALTER TABLE p2p_agents ADD COLUMN total_orders INTEGER NOT NULL DEFAULT 0;",
        ),
        (
            "p2p_agents",
            "completed_orders",
            "ALTER TABLE p2p_agents ADD COLUMN completed_orders INTEGER NOT NULL DEFAULT 0;",
        ),
        (
            "p2p_agents",
            "node_id",
            "ALTER TABLE p2p_agents ADD COLUMN node_id TEXT;",
        ),
        (
            "p2p_agents",
            "expires_at",
            "ALTER TABLE p2p_agents ADD COLUMN expires_at INTEGER;",
        ),
        (
            "p2p_agents",
            "dispute_reason",
            "ALTER TABLE p2p_agents ADD COLUMN dispute_reason TEXT;",
        ),
        (
            "p2p_agents",
            "evidence_hash",
            "ALTER TABLE p2p_agents ADD COLUMN evidence_hash TEXT;",
        ),
        (
            "p2p_agents",
            "complainant_node_id",
            "ALTER TABLE p2p_agents ADD COLUMN complainant_node_id TEXT;",
        ),
        (
            "p2p_agents",
            "disputed_at",
            "ALTER TABLE p2p_agents ADD COLUMN disputed_at INTEGER;",
        ),
        (
            "p2p_deposit_orders",
            "expires_at",
            "ALTER TABLE p2p_deposit_orders ADD COLUMN expires_at INTEGER;",
        ),
        (
            "p2p_deposit_orders",
            "dispute_reason",
            "ALTER TABLE p2p_deposit_orders ADD COLUMN dispute_reason TEXT;",
        ),
        (
            "p2p_deposit_orders",
            "evidence_hash",
            "ALTER TABLE p2p_deposit_orders ADD COLUMN evidence_hash TEXT;",
        ),
        (
            "p2p_deposit_orders",
            "complainant_node_id",
            "ALTER TABLE p2p_deposit_orders ADD COLUMN complainant_node_id TEXT;",
        ),
        (
            "p2p_deposit_orders",
            "disputed_at",
            "ALTER TABLE p2p_deposit_orders ADD COLUMN disputed_at INTEGER;",
        ),
        (
            "escrow_holds",
            "expires_at",
            "ALTER TABLE escrow_holds ADD COLUMN expires_at INTEGER;",
        ),
    ] {
        add_column_if_missing(&conn, table, column, sql)
            .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    }

    conn.execute_batch(
        "INSERT OR IGNORE INTO tokens (symbol, name, token_type, decimals, enabled) VALUES
        ('USDT','Tether','stable',6,1),
        ('USDC','USD Coin','stable',6,1),
        ('DAI','Dai','stable',18,1),
        ('FDUSD','First Digital','stable',18,1),
        ('PYUSD','PayPal USD','stable',6,1),
        ('USD','US Dollar','fiat',2,1),
        ('EUR','Euro','fiat',2,1),
        ('BTC','Bitcoin','crypto',8,1),
        ('ETH','Ethereum','crypto',18,1),
        ('PINC','PINC','crypto',8,1);",
    )
    .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    // Seed 150 countries currencies as tokens (fiat + local). Dedupe via INSERT OR IGNORE.
    {
        use std::collections::HashSet;
        let mut seen: HashSet<String> = HashSet::new();
        for c in crate::core::regions::countries::COUNTRIES.iter() {
            let cur = c.currency_code.to_uppercase();
            if seen.contains(&cur) { continue; }
            seen.insert(cur.clone());
            // Skip already inserted symbols above
            if ["USDT","USDC","DAI","FDUSD","PYUSD","USD","EUR","BTC","ETH","PINC"].contains(&cur.as_str()) { continue; }
            let name = format!("{} ({})", cur, c.name_en);
            let _ = conn.execute(
                "INSERT OR IGNORE INTO tokens (symbol, name, token_type, decimals, enabled) VALUES (?1, ?2, 'fiat', 2, 1)",
                rusqlite::params![cur, name],
            );
        }
        // Ensure common emerging market fiat explicitly (KES, NGN, etc.) have correct names if not yet
        let extra_tokens = [
            ("KES","Kenyan Shilling","fiat",2),
            ("UGX","Ugandan Shilling","fiat",2),
            ("TZS","Tanzanian Shilling","fiat",2),
            ("NGN","Nigerian Naira","fiat",2),
            ("ZAR","South African Rand","fiat",2),
            ("GHS","Ghanaian Cedi","fiat",2),
            ("EGP","Egyptian Pound","fiat",2),
            ("MAD","Moroccan Dirham","fiat",2),
            ("XOF","West African CFA Franc","fiat",2),
            ("XAF","Central African CFA Franc","fiat",2),
            ("ETB","Ethiopian Birr","fiat",2),
            ("RWF","Rwandan Franc","fiat",2),
            ("GBP","British Pound","fiat",2),
            ("INR","Indian Rupee","fiat",2),
            ("PKR","Pakistani Rupee","fiat",2),
            ("BDT","Bangladeshi Taka","fiat",2),
            ("IDR","Indonesian Rupiah","fiat",2),
            ("MYR","Malaysian Ringgit","fiat",2),
            ("THB","Thai Baht","fiat",2),
            ("VND","Vietnamese Dong","fiat",2),
            ("PHP","Philippine Peso","fiat",2),
            ("CNY","Chinese Yuan","fiat",2),
            ("JPY","Japanese Yen","fiat",2),
            ("KRW","Korean Won","fiat",2),
            ("SGD","Singapore Dollar","fiat",2),
            ("AED","UAE Dirham","fiat",2),
            ("SAR","Saudi Riyal","fiat",2),
            ("TRY","Turkish Lira","fiat",2),
            ("BRL","Brazilian Real","fiat",2),
            ("MXN","Mexican Peso","fiat",2),
            ("CAD","Canadian Dollar","fiat",2),
            ("AUD","Australian Dollar","fiat",2),
            ("NZD","New Zealand Dollar","fiat",2),
            ("RUB","Russian Ruble","fiat",2),
            ("UAH","Ukrainian Hryvnia","fiat",2),
            ("PLN","Polish Zloty","fiat",2),
            ("CHF","Swiss Franc","fiat",2),
            ("SEK","Swedish Krona","fiat",2),
            ("NOK","Norwegian Krone","fiat",2),
            ("DKK","Danish Krone","fiat",2),
        ];
        for (sym, name, ttype, dec) in extra_tokens {
            let _ = conn.execute(
                "INSERT OR IGNORE INTO tokens (symbol, name, token_type, decimals, enabled) VALUES (?1, ?2, ?3, ?4, 1)",
                rusqlite::params![sym, name, ttype, dec],
            );
        }
    }

    add_column_if_missing(
        &conn,
        "wagers",
        "data",
        "ALTER TABLE wagers ADD COLUMN data TEXT NOT NULL DEFAULT '';",
    )
    .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    for (table, column, sql) in [
        (
            "marketplace_jobs",
            "category",
            "ALTER TABLE marketplace_jobs ADD COLUMN category TEXT NOT NULL DEFAULT '';",
        ),
        (
            "marketplace_jobs",
            "subcategory",
            "ALTER TABLE marketplace_jobs ADD COLUMN subcategory TEXT NOT NULL DEFAULT '';",
        ),
        (
            "marketplace_jobs",
            "skills",
            "ALTER TABLE marketplace_jobs ADD COLUMN skills TEXT NOT NULL DEFAULT '[]';",
        ),
        (
            "marketplace_jobs",
            "deadline",
            "ALTER TABLE marketplace_jobs ADD COLUMN deadline TEXT NOT NULL DEFAULT '';",
        ),
        (
            "marketplace_jobs",
            "applicants",
            "ALTER TABLE marketplace_jobs ADD COLUMN applicants INTEGER NOT NULL DEFAULT 0;",
        ),
        (
            "marketplace_jobs",
            "budget_min",
            "ALTER TABLE marketplace_jobs ADD COLUMN budget_min REAL NOT NULL DEFAULT 0.0;",
        ),
        (
            "marketplace_jobs",
            "budget_max",
            "ALTER TABLE marketplace_jobs ADD COLUMN budget_max REAL NOT NULL DEFAULT 0.0;",
        ),
    ] {
        add_column_if_missing(&conn, table, column, sql)
            .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    }

    add_column_if_missing(
        &conn,
        "identities",
        "username",
        "ALTER TABLE identities ADD COLUMN username TEXT NOT NULL DEFAULT '';",
    )
    .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    add_column_if_missing(
        &conn,
        "identities",
        "password_hash",
        "ALTER TABLE identities ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';",
    )
    .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    // Identity uniqueness + permanence: two names + DOB, and PIN hash permanently
    // linked to the same node_id row as password_hash.
    add_column_if_missing(
        &conn,
        "identities",
        "first_name",
        "ALTER TABLE identities ADD COLUMN first_name TEXT NOT NULL DEFAULT '';",
    )
    .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    add_column_if_missing(
        &conn,
        "identities",
        "last_name",
        "ALTER TABLE identities ADD COLUMN last_name TEXT NOT NULL DEFAULT '';",
    )
    .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    add_column_if_missing(
        &conn,
        "identities",
        "date_of_birth",
        "ALTER TABLE identities ADD COLUMN date_of_birth TEXT NOT NULL DEFAULT '';",
    )
    .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    add_column_if_missing(
        &conn,
        "identities",
        "pin_hash",
        "ALTER TABLE identities ADD COLUMN pin_hash TEXT NOT NULL DEFAULT '';",
    )
    .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    migrate_contacts_schema(&conn).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    migrate_messages_schema(&conn).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    migrate_conversations_schema(&conn)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM schema_version", [], |r| r.get(0))
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if count == 0 {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        conn.execute(
            "INSERT INTO schema_version (version, applied_at) VALUES (?1, ?2)",
            rusqlite::params![SCHEMA_VERSION, now],
        )
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    }
    Ok(())
}

fn add_column_if_missing(
    conn: &Connection,
    table: &str,
    column: &str,
    sql: &str,
) -> rusqlite::Result<()> {
    if !table_has_column(conn, table, column)? {
        conn.execute_batch(sql)?;
    }
    Ok(())
}

fn table_has_column(conn: &Connection, table: &str, column: &str) -> rusqlite::Result<bool> {
    let pragma = format!("PRAGMA table_info({table})");
    let mut stmt = conn.prepare(&pragma)?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(1))?;
    for name in rows {
        if name? == column {
            return Ok(true);
        }
    }
    Ok(false)
}

fn contacts_select_expr(
    conn: &Connection,
    table: &str,
    primary: &str,
    fallback: &str,
) -> rusqlite::Result<String> {
    if table_has_column(conn, table, primary)? {
        return Ok(primary.to_string());
    }
    Ok(fallback.to_string())
}

fn contacts_table_is_legacy(conn: &Connection) -> rusqlite::Result<bool> {
    let pragma = "PRAGMA table_info(contacts)";
    let mut stmt = conn.prepare(pragma)?;
    let columns = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(1)?, row.get::<_, String>(2)?))
    })?;

    let mut has_owner_node_id = false;
    let mut has_contact_node_id = false;
    let mut has_legacy_owner = false;
    let mut has_legacy_contact = false;
    let mut id_is_text = false;

    for column in columns {
        let (name, ty) = column?;
        match name.as_str() {
            "owner_node_id" => has_owner_node_id = true,
            "contact_node_id" => has_contact_node_id = true,
            "owner_pinc_id" => has_legacy_owner = true,
            "contact_pinc_id" => has_legacy_contact = true,
            "id" => id_is_text = ty.eq_ignore_ascii_case("TEXT"),
            _ => {}
        }
    }

    Ok(has_legacy_owner
        || has_legacy_contact
        || !has_owner_node_id
        || !has_contact_node_id
        || !id_is_text)
}

fn migrate_messages_schema(conn: &Connection) -> rusqlite::Result<()> {
    if table_has_column(conn, "messages", "peer_id")? {
        let rebuild_sql = "
        ALTER TABLE messages RENAME TO messages_legacy;
        CREATE TABLE messages (
            id              TEXT PRIMARY KEY NOT NULL,
            conversation_id TEXT NOT NULL,
            sender_id       TEXT NOT NULL,
            recipient_id    TEXT NOT NULL,
            content         BLOB NOT NULL,
            content_hash    TEXT NOT NULL DEFAULT '',
            msg_type        TEXT NOT NULL DEFAULT 'Text',
            status          TEXT NOT NULL DEFAULT 'Sent',
            sent_at         INTEGER NOT NULL,
            delivered_at    INTEGER,
            read_at         INTEGER,
            reply_to        TEXT,
            media_ref       TEXT,
            encrypted       INTEGER NOT NULL DEFAULT 1
        );
        INSERT INTO messages (id, conversation_id, sender_id, recipient_id, content, encrypted, sent_at)
        SELECT id, 'conv-' || peer_id, '', peer_id, content, encrypted, created_at FROM messages_legacy;
        DROP TABLE messages_legacy;
        DROP INDEX IF EXISTS idx_messages_peer_id;
        DROP INDEX IF EXISTS idx_messages_created_at;
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);
        ";
        conn.execute_batch(rebuild_sql)?;
    }
    Ok(())
}

fn migrate_conversations_schema(conn: &Connection) -> rusqlite::Result<()> {
    if table_has_column(conn, "conversations", "peer_id")? {
        let rebuild_sql = "
        ALTER TABLE conversations RENAME TO conversations_legacy;
        CREATE TABLE conversations (
            id              TEXT PRIMARY KEY NOT NULL,
            participants    TEXT NOT NULL DEFAULT '',
            name            TEXT,
            is_group        INTEGER NOT NULL DEFAULT 0,
            created_at      INTEGER NOT NULL,
            last_message_at INTEGER NOT NULL DEFAULT 0,
            unread_count    INTEGER NOT NULL DEFAULT 0,
            encrypted       INTEGER NOT NULL DEFAULT 1
        );
        INSERT INTO conversations (id, participants, name, is_group, created_at, last_message_at, unread_count, encrypted)
        SELECT id, peer_id, title, is_group, created_at, last_msg_at, 0, 1 FROM conversations_legacy;
        DROP TABLE conversations_legacy;
        ";
        conn.execute_batch(rebuild_sql)?;
    }
    Ok(())
}

fn migrate_contacts_schema(conn: &Connection) -> rusqlite::Result<()> {
    if contacts_table_is_legacy(conn)? {
        let owner_expr = if table_has_column(conn, "contacts", "owner_pinc_id")? {
            "owner_pinc_id"
        } else {
            "owner_node_id"
        };
        let contact_expr = if table_has_column(conn, "contacts", "contact_pinc_id")? {
            "contact_pinc_id"
        } else {
            "contact_node_id"
        };
        let username_expr = contacts_select_expr(conn, "contacts", "contact_username", "''")?;
        let nickname_expr = contacts_select_expr(conn, "contacts", "nickname", "''")?;
        let service_expr = contacts_select_expr(conn, "contacts", "service_name", "'General'")?;
        let share_code_expr = contacts_select_expr(conn, "contacts", "share_code", "''")?;
        let status_expr = contacts_select_expr(conn, "contacts", "status", "'accepted'")?;
        let created_at_expr = if table_has_column(conn, "contacts", "created_at")? {
            "CASE
                WHEN typeof(created_at) IN ('integer', 'real') THEN CAST(created_at AS INTEGER)
                ELSE CAST(strftime('%s', COALESCE(created_at, CURRENT_TIMESTAMP)) AS INTEGER)
             END"
        } else if table_has_column(conn, "contacts", "added_at")? {
            "CASE
                WHEN typeof(added_at) IN ('integer', 'real') THEN CAST(added_at AS INTEGER)
                ELSE CAST(strftime('%s', COALESCE(added_at, CURRENT_TIMESTAMP)) AS INTEGER)
             END"
        } else {
            "CAST(strftime('%s','now') AS INTEGER)"
        };

        // Preserve existing contact pairs while moving the old table shape to the current schema.
        let rebuild_sql = format!(
            "
            ALTER TABLE contacts RENAME TO contacts_legacy;
            CREATE TABLE contacts (
                id               TEXT PRIMARY KEY NOT NULL,
                owner_node_id    TEXT NOT NULL,
                contact_node_id  TEXT NOT NULL,
                contact_username TEXT NOT NULL DEFAULT '',
                nickname         TEXT NOT NULL DEFAULT '',
                service_name     TEXT NOT NULL DEFAULT 'General',
                share_code       TEXT NOT NULL DEFAULT '',
                status           TEXT NOT NULL DEFAULT 'pending',
                created_at       INTEGER NOT NULL,
                UNIQUE(owner_node_id, contact_node_id)
            );
            INSERT INTO contacts (
                id,
                owner_node_id,
                contact_node_id,
                contact_username,
                nickname,
                service_name,
                share_code,
                status,
                created_at
            )
            SELECT
                printf('legacy-%s', id),
                {owner_expr},
                {contact_expr},
                COALESCE({username_expr}, ''),
                COALESCE({nickname_expr}, ''),
                COALESCE({service_expr}, 'General'),
                COALESCE({share_code_expr}, ''),
                COALESCE({status_expr}, 'accepted'),
                {created_at_expr}
            FROM contacts_legacy;
            DROP TABLE contacts_legacy;
            ",
            owner_expr = owner_expr,
            contact_expr = contact_expr,
            username_expr = username_expr,
            nickname_expr = nickname_expr,
            service_expr = service_expr,
            share_code_expr = share_code_expr,
            status_expr = status_expr,
            created_at_expr = created_at_expr,
        );
        conn.execute_batch(&rebuild_sql)?;
        return Ok(());
    }

    add_column_if_missing(
        conn,
        "contacts",
        "contact_username",
        "ALTER TABLE contacts ADD COLUMN contact_username TEXT NOT NULL DEFAULT '';",
    )?;
    add_column_if_missing(
        conn,
        "contacts",
        "service_name",
        "ALTER TABLE contacts ADD COLUMN service_name TEXT NOT NULL DEFAULT 'General';",
    )?;
    add_column_if_missing(
        conn,
        "contacts",
        "share_code",
        "ALTER TABLE contacts ADD COLUMN share_code TEXT NOT NULL DEFAULT '';",
    )?;
    add_column_if_missing(
        conn,
        "contacts",
        "status",
        "ALTER TABLE contacts ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted';",
    )?;
    add_column_if_missing(
        conn,
        "contacts",
        "created_at",
        "ALTER TABLE contacts ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0;",
    )?;

    Ok(())
}

fn migrate_messaging_keys_schema(conn: &Connection) -> rusqlite::Result<()> {
    if table_has_column(conn, "messaging_keys", "peer_id")? {
        let rebuild_sql = "
        ALTER TABLE messaging_keys RENAME TO messaging_keys_legacy;
        CREATE TABLE messaging_keys (
            node_id         TEXT PRIMARY KEY NOT NULL,
            x25519_public   TEXT NOT NULL,
            x25519_private  TEXT NOT NULL,
            created_at      INTEGER NOT NULL
        );
        INSERT INTO messaging_keys (node_id, x25519_public, x25519_private, created_at)
        SELECT peer_id, public_key, private_key_enc, created_at FROM messaging_keys_legacy;
        DROP TABLE messaging_keys_legacy;
        ";
        conn.execute_batch(rebuild_sql)?;
    }
    Ok(())
}
