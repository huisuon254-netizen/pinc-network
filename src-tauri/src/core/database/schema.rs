pub const SCHEMA_VERSION: i64 = 1;

pub const CREATE_SCHEMA_VERSION: &str = "
CREATE TABLE IF NOT EXISTS schema_version (
    version    INTEGER NOT NULL,
    applied_at INTEGER NOT NULL
);";

pub const CREATE_IDENTITIES: &str = "
CREATE TABLE IF NOT EXISTS identities (
    id                    TEXT PRIMARY KEY NOT NULL,
    node_id               TEXT NOT NULL,
    public_key            TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    fingerprint           TEXT NOT NULL,
    recovery_key_hash     TEXT NOT NULL,
    recovery_phrase_hash  TEXT NOT NULL,
    created_at            INTEGER NOT NULL
);";

pub const CREATE_VAULT_FILES: &str = "
CREATE TABLE IF NOT EXISTS vault_files (
    id         TEXT PRIMARY KEY NOT NULL,
    name       TEXT NOT NULL,
    hash       TEXT NOT NULL,
    encrypted  INTEGER NOT NULL DEFAULT 1,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);";

pub const CREATE_PEERS: &str = "
CREATE TABLE IF NOT EXISTS peers (
    id          TEXT PRIMARY KEY NOT NULL,
    address     TEXT NOT NULL,
    public_key  TEXT NOT NULL,
    last_seen   INTEGER NOT NULL,
    trust_score REAL NOT NULL DEFAULT 0.0,
    relay_score REAL NOT NULL DEFAULT 0.0,
    online      INTEGER NOT NULL DEFAULT 0
);";

pub const CREATE_SETTINGS: &str = "
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);";

pub const CREATE_ACTIVITY_LOG: &str = "
CREATE TABLE IF NOT EXISTS activity_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    message    TEXT NOT NULL,
    created_at INTEGER NOT NULL
);";

pub const CREATE_FILE_CHUNKS: &str = "
CREATE TABLE IF NOT EXISTS file_chunks (
    id       TEXT PRIMARY KEY NOT NULL,
    file_id  TEXT NOT NULL,
    chunk_idx INTEGER NOT NULL,
    hash     TEXT NOT NULL,
    size     INTEGER NOT NULL,
    stored   INTEGER NOT NULL DEFAULT 0
);";

pub const CREATE_NODE_STATUS: &str = "
CREATE TABLE IF NOT EXISTS node_status (
    id         INTEGER PRIMARY KEY,
    online     INTEGER NOT NULL DEFAULT 0,
    last_seen  INTEGER NOT NULL DEFAULT 0,
    peer_count INTEGER NOT NULL DEFAULT 0
);";

// Phase 4+ tables (created as stubs now)
pub const CREATE_DISTRIBUTED_CHUNKS: &str = "
CREATE TABLE IF NOT EXISTS distributed_chunks (
    id         TEXT PRIMARY KEY NOT NULL,
    file_id    TEXT NOT NULL,
    node_id    TEXT NOT NULL,
    chunk_hash TEXT NOT NULL,
    verified   INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);";

pub const CREATE_MESSAGES: &str = "
CREATE TABLE IF NOT EXISTS messages (
    id         TEXT PRIMARY KEY NOT NULL,
    peer_id    TEXT NOT NULL,
    content    TEXT NOT NULL,
    encrypted  INTEGER NOT NULL DEFAULT 1,
    sent       INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
);";

pub const CREATE_MARKETPLACE: &str = "
CREATE TABLE IF NOT EXISTS marketplace_jobs (
    id          TEXT PRIMARY KEY NOT NULL,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    budget      REAL NOT NULL DEFAULT 0.0,
    status      TEXT NOT NULL DEFAULT 'open',
    owner_id    TEXT NOT NULL,
    created_at  INTEGER NOT NULL
);";

pub const CREATE_WALLET: &str = "
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id         TEXT PRIMARY KEY NOT NULL,
    amount     REAL NOT NULL,
    tx_type    TEXT NOT NULL,
    peer_id    TEXT,
    status     TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL
);";

pub const CREATE_REPUTATION: &str = "
CREATE TABLE IF NOT EXISTS reputation (
    node_id      TEXT PRIMARY KEY NOT NULL,
    relay_score  REAL NOT NULL DEFAULT 0.0,
    job_score    REAL NOT NULL DEFAULT 0.0,
    pay_score    REAL NOT NULL DEFAULT 0.0,
    total_score  REAL NOT NULL DEFAULT 0.0,
    updated_at   INTEGER NOT NULL
);";

pub const CREATE_WAGERS: &str = "
CREATE TABLE IF NOT EXISTS wagers (
    id          TEXT PRIMARY KEY NOT NULL,
    challenger  TEXT NOT NULL,
    opponent    TEXT NOT NULL,
    amount      REAL NOT NULL,
    game_type   TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    winner_id   TEXT,
    created_at  INTEGER NOT NULL
);";

pub const CREATE_SOCIAL_POSTS: &str = "
CREATE TABLE IF NOT EXISTS social_posts (
    id          TEXT PRIMARY KEY NOT NULL,
    author_id   TEXT NOT NULL,
    content     TEXT NOT NULL,
    post_type   TEXT NOT NULL DEFAULT 'text',
    visibility  TEXT NOT NULL DEFAULT 'public',
    like_count  INTEGER NOT NULL DEFAULT 0,
    reply_count INTEGER NOT NULL DEFAULT 0,
    reply_to    TEXT,
    tags        TEXT NOT NULL DEFAULT '[]',
    created_at  INTEGER NOT NULL,
    edited_at   INTEGER,
    encrypted   INTEGER NOT NULL DEFAULT 0
);";

pub const CREATE_AI_AGENTS: &str = "
CREATE TABLE IF NOT EXISTS ai_agents (
    id           TEXT PRIMARY KEY NOT NULL,
    agent_type   TEXT NOT NULL,
    name         TEXT NOT NULL,
    active       INTEGER NOT NULL DEFAULT 1,
    model_hash   TEXT,
    version      TEXT NOT NULL,
    accuracy     REAL NOT NULL DEFAULT 0.0,
    inferences   INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL,
    last_run     INTEGER
);";

pub const CREATE_STORAGE_CONTRACTS: &str = "
CREATE TABLE IF NOT EXISTS storage_contracts (
    id               TEXT PRIMARY KEY NOT NULL,
    provider_node_id TEXT NOT NULL,
    consumer_node_id TEXT NOT NULL,
    bytes_allocated  INTEGER NOT NULL,
    price_per_gb     REAL NOT NULL,
    expires_at       INTEGER NOT NULL,
    active           INTEGER NOT NULL DEFAULT 1
);";

pub const CREATE_WALLET_BALANCES: &str = "
CREATE TABLE IF NOT EXISTS wallet_balances (
    node_id      TEXT PRIMARY KEY NOT NULL,
    balance      REAL NOT NULL DEFAULT 0.0,
    escrow_locked REAL NOT NULL DEFAULT 0.0,
    pending_in   REAL NOT NULL DEFAULT 0.0,
    pending_out  REAL NOT NULL DEFAULT 0.0,
    currency     TEXT NOT NULL DEFAULT 'PINC',
    updated_at   INTEGER NOT NULL
);";

pub const CREATE_RIFT_LISTINGS: &str = "
CREATE TABLE IF NOT EXISTS rift_listings (
    id               TEXT PRIMARY KEY NOT NULL,
    owner_id         TEXT NOT NULL,
    tier             TEXT NOT NULL,
    price_per_hour   REAL NOT NULL,
    hardware_specs   TEXT NOT NULL DEFAULT '{}',
    status           TEXT NOT NULL DEFAULT 'Available',
    created_at       INTEGER NOT NULL
);";
