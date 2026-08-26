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
    username              TEXT NOT NULL DEFAULT '',
    public_key            TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    fingerprint           TEXT NOT NULL,
    recovery_key_hash     TEXT NOT NULL,
    recovery_phrase_hash  TEXT NOT NULL,
    created_at            INTEGER NOT NULL
);";

pub const CREATE_CONTACTS: &str = "
CREATE TABLE IF NOT EXISTS contacts (
    id              TEXT PRIMARY KEY NOT NULL,
    owner_node_id   TEXT NOT NULL,
    contact_node_id TEXT NOT NULL,
    contact_username TEXT NOT NULL DEFAULT '',
    nickname        TEXT NOT NULL DEFAULT '',
    service_name    TEXT NOT NULL DEFAULT 'General',
    share_code      TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'pending',
    created_at      INTEGER NOT NULL,
    UNIQUE(owner_node_id, contact_node_id)
);";

// Migration: add contacts columns if missing
pub const MIGRATE_CONTACTS: &str = "
CREATE TABLE IF NOT EXISTS forum_posts (
    id          TEXT PRIMARY KEY NOT NULL,
    author_pinc_id TEXT NOT NULL,
    display_name  TEXT NOT NULL DEFAULT 'Anonymous',
    content     TEXT NOT NULL,
    post_type   TEXT NOT NULL DEFAULT 'text',
    visibility  TEXT NOT NULL DEFAULT 'public',
    like_count  INTEGER NOT NULL DEFAULT 0,
    reply_count INTEGER NOT NULL DEFAULT 0,
    reply_to    TEXT,
    tags        TEXT NOT NULL DEFAULT '[]',
    encrypted   INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL,
    edited_at   INTEGER
);
CREATE TABLE IF NOT EXISTS forum_comments (
    id          TEXT PRIMARY KEY NOT NULL,
    post_id     TEXT NOT NULL,
    author_pinc_id TEXT NOT NULL,
    display_name  TEXT NOT NULL DEFAULT 'Anonymous',
    content     TEXT NOT NULL,
    like_count  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS forum_profiles (
    pinc_id     TEXT PRIMARY KEY NOT NULL,
    handle      TEXT NOT NULL DEFAULT '',
    display_name TEXT NOT NULL DEFAULT 'Anonymous',
    bio         TEXT NOT NULL DEFAULT '',
    avatar_hash TEXT,
    is_verified INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS communities (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    c_type      TEXT NOT NULL DEFAULT 'public',
    description TEXT NOT NULL DEFAULT '',
    member_ids  TEXT NOT NULL DEFAULT '[]',
    created_at  INTEGER NOT NULL
);
";

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
);";

pub const CREATE_MARKETPLACE: &str = "
CREATE TABLE IF NOT EXISTS marketplace_jobs (
    id            TEXT PRIMARY KEY NOT NULL,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    budget        REAL NOT NULL DEFAULT 0.0,
    budget_min    REAL NOT NULL DEFAULT 0.0,
    budget_max    REAL NOT NULL DEFAULT 0.0,
    category      TEXT NOT NULL DEFAULT '',
    subcategory   TEXT NOT NULL DEFAULT '',
    skills        TEXT NOT NULL DEFAULT '[]',
    deadline      TEXT NOT NULL DEFAULT '',
    applicants    INTEGER NOT NULL DEFAULT 0,
    status        TEXT NOT NULL DEFAULT 'open',
    owner_id      TEXT NOT NULL,
    created_at    INTEGER NOT NULL
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
    data        TEXT NOT NULL DEFAULT '',
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

pub const CREATE_RIFT_RENTALS: &str = "
CREATE TABLE IF NOT EXISTS rift_rentals (
    id                      TEXT PRIMARY KEY NOT NULL,
    server_id              TEXT NOT NULL,
    renter_id              TEXT NOT NULL,
    owner_id               TEXT NOT NULL,
    period                 TEXT NOT NULL,
    start_time             INTEGER NOT NULL,
    end_time               INTEGER NOT NULL,
    total_cost             REAL NOT NULL,
    status                 TEXT NOT NULL DEFAULT 'Active',
    payment_transaction_id TEXT,
    created_at             INTEGER NOT NULL,
    FOREIGN KEY (server_id) REFERENCES rift_listings(id)
);";

pub const CREATE_RIFT_METRICS: &str = "
CREATE TABLE IF NOT EXISTS rift_metrics (
    id               TEXT PRIMARY KEY NOT NULL,
    listing_id       TEXT NOT NULL,
    uptime_percentage REAL NOT NULL DEFAULT 0.0,
    cpu_usage        REAL NOT NULL DEFAULT 0.0,
    ram_usage        REAL NOT NULL DEFAULT 0.0,
    disk_usage       REAL NOT NULL DEFAULT 0.0,
    network_in_mbps  REAL NOT NULL DEFAULT 0.0,
    network_out_mbps REAL NOT NULL DEFAULT 0.0,
    total_rentals    INTEGER NOT NULL DEFAULT 0,
    total_earnings   REAL NOT NULL DEFAULT 0.0,
    average_rating   REAL NOT NULL DEFAULT 0.0,
    last_updated     INTEGER NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES rift_listings(id)
);";

pub const CREATE_RIFT_PAYMENTS: &str = "
CREATE TABLE IF NOT EXISTS rift_payments (
    id                 TEXT PRIMARY KEY NOT NULL,
    rental_id          TEXT NOT NULL,
    transaction_id     TEXT NOT NULL,
    amount             REAL NOT NULL,
    currency           TEXT NOT NULL DEFAULT 'PINC',
    status             TEXT NOT NULL DEFAULT 'pending',
    payment_type       TEXT NOT NULL,
    created_at         INTEGER NOT NULL,
    FOREIGN KEY (rental_id) REFERENCES rift_rentals(id)
);";

pub const CREATE_SHARED_CONNECTIONS: &str = "
CREATE TABLE IF NOT EXISTS shared_connections (
    id              TEXT PRIMARY KEY NOT NULL,
    owner_node_id   TEXT NOT NULL,
    peer_node_id    TEXT NOT NULL,
    connection_type TEXT NOT NULL DEFAULT 'wifi',
    max_bandwidth   REAL NOT NULL DEFAULT 0.0,
    used_bandwidth  REAL NOT NULL DEFAULT 0.0,
    price_per_gb    REAL NOT NULL DEFAULT 0.0,
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      INTEGER NOT NULL
);";

pub const CREATE_PEER_BANDWIDTH_USAGE: &str = "
CREATE TABLE IF NOT EXISTS peer_bandwidth_usage (
    id          TEXT PRIMARY KEY NOT NULL,
    peer_id     TEXT NOT NULL,
    bytes_in    INTEGER NOT NULL DEFAULT 0,
    bytes_out   INTEGER NOT NULL DEFAULT 0,
    recorded_at INTEGER NOT NULL
);";

pub const CREATE_NET_STORE_PURCHASES: &str = "
CREATE TABLE IF NOT EXISTS net_store_purchases (
    id          TEXT PRIMARY KEY NOT NULL,
    buyer_id    TEXT NOT NULL,
    listing_id  TEXT NOT NULL,
    amount      REAL NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    created_at  INTEGER NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES net_store_listings(id)
);";

pub const CREATE_NET_STORE_LISTINGS: &str = "
CREATE TABLE IF NOT EXISTS net_store_listings (
    id              TEXT PRIMARY KEY NOT NULL,
    seller_node_id  TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    bandwidth_gb    REAL NOT NULL DEFAULT 0.0,
    price_per_gb    REAL NOT NULL DEFAULT 0.0,
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      INTEGER NOT NULL
);";

pub const CREATE_NET_SHARE_CODES: &str = "
CREATE TABLE IF NOT EXISTS net_share_codes (
    id              TEXT PRIMARY KEY NOT NULL,
    code            TEXT NOT NULL UNIQUE,
    owner_node_id   TEXT NOT NULL,
    bandwidth_limit REAL NOT NULL DEFAULT 0.0,
    expires_at      INTEGER NOT NULL,
    used            INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER NOT NULL
);";

pub const CREATE_MESSAGING_KEYS: &str = "
CREATE TABLE IF NOT EXISTS messaging_keys (
    node_id         TEXT PRIMARY KEY NOT NULL,
    x25519_public   TEXT NOT NULL,
    x25519_private  TEXT NOT NULL,
    created_at      INTEGER NOT NULL
);";

pub const CREATE_MESSAGES_INDEXES: &str = "
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);";

pub const CREATE_HOTSPOT_SESSIONS: &str = "
CREATE TABLE IF NOT EXISTS hotspot_sessions (
    id              TEXT PRIMARY KEY NOT NULL,
    device_id       TEXT NOT NULL,
    mac_address     TEXT NOT NULL,
    ip_address      TEXT NOT NULL,
    bytes_in        INTEGER NOT NULL DEFAULT 0,
    bytes_out       INTEGER NOT NULL DEFAULT 0,
    connected_at    INTEGER NOT NULL,
    disconnected_at INTEGER
);";

pub const CREATE_ESCROW_HOLDS: &str = "
CREATE TABLE IF NOT EXISTS escrow_holds (
    id              TEXT PRIMARY KEY NOT NULL,
    payer_node_id   TEXT NOT NULL,
    payee_node_id   TEXT NOT NULL,
    amount          REAL NOT NULL,
    reason          TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'held',
    created_at      INTEGER NOT NULL,
    released_at     INTEGER
);";

pub const CREATE_CONVERSATIONS: &str = "
CREATE TABLE IF NOT EXISTS conversations (
    id              TEXT PRIMARY KEY NOT NULL,
    participants    TEXT NOT NULL DEFAULT '',
    name            TEXT,
    is_group        INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER NOT NULL,
    last_message_at INTEGER NOT NULL DEFAULT 0,
    unread_count    INTEGER NOT NULL DEFAULT 0,
    encrypted       INTEGER NOT NULL DEFAULT 1
);";

pub const CREATE_BILLING_TRANSACTIONS: &str = "
CREATE TABLE IF NOT EXISTS billing_transactions (
    id              TEXT PRIMARY KEY NOT NULL,
    payer_node_id   TEXT NOT NULL,
    payee_node_id   TEXT NOT NULL,
    amount          REAL NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'PINC',
    tx_type         TEXT NOT NULL DEFAULT 'transfer',
    status          TEXT NOT NULL DEFAULT 'pending',
    description     TEXT NOT NULL DEFAULT '',
    created_at      INTEGER NOT NULL
);";

pub const CREATE_GAME_SESSIONS: &str = "
CREATE TABLE IF NOT EXISTS game_sessions (
    id              TEXT PRIMARY KEY NOT NULL,
    game_id         TEXT NOT NULL,
    player_ids      TEXT NOT NULL DEFAULT '[]',
    wager_amount    REAL NOT NULL DEFAULT 0.0,
    start_time      INTEGER NOT NULL,
    end_time        INTEGER,
    scores          TEXT NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'waiting',
    winner_id       TEXT,
    created_at      INTEGER NOT NULL
);";

pub const CREATE_GAME_PROGRESS: &str = "
CREATE TABLE IF NOT EXISTS game_progress (
    user_id              TEXT NOT NULL,
    game_id              TEXT NOT NULL,
    high_score           INTEGER DEFAULT 0,
    total_play_time_secs INTEGER DEFAULT 0,
    games_played         INTEGER DEFAULT 0,
    last_played_at       INTEGER DEFAULT 0,
    level                INTEGER,
    metadata             TEXT,
    PRIMARY KEY (user_id, game_id)
);";

pub const CREATE_P2P_AGENTS: &str = "
CREATE TABLE IF NOT EXISTS p2p_agents (
    id                TEXT PRIMARY KEY NOT NULL,
    name              TEXT NOT NULL,
    country_iso2      TEXT NOT NULL DEFAULT '',
    languages         TEXT NOT NULL DEFAULT '[]',
    identity_verified INTEGER NOT NULL DEFAULT 0,
    kyc_level         INTEGER NOT NULL DEFAULT 0,
    rating            REAL NOT NULL DEFAULT 0.0,
    commission_rate   REAL NOT NULL DEFAULT 0.0,
    volume_24h        REAL NOT NULL DEFAULT 0.0,
    created_at        INTEGER NOT NULL
);";

pub const CREATE_P2P_PAYMENT_CHANNELS: &str = "
CREATE TABLE IF NOT EXISTS p2p_payment_channels (
    id                    TEXT PRIMARY KEY NOT NULL,
    agent_id              TEXT NOT NULL,
    network               TEXT NOT NULL,
    account_identifier    TEXT NOT NULL,
    credentials_encrypted TEXT NOT NULL DEFAULT '',
    currency              TEXT NOT NULL DEFAULT 'USD',
    min_amount            REAL NOT NULL DEFAULT 0.0,
    max_amount            REAL NOT NULL DEFAULT 0.0,
    daily_limit           REAL NOT NULL DEFAULT 0.0,
    fee_percent           REAL NOT NULL DEFAULT 0.0,
    enabled               INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (agent_id) REFERENCES p2p_agents(id) ON DELETE CASCADE
);";

pub const CREATE_P2P_COMM_LINKS: &str = "
CREATE TABLE IF NOT EXISTS p2p_comm_links (
    id                   TEXT PRIMARY KEY NOT NULL,
    agent_id             TEXT NOT NULL,
    platform             TEXT NOT NULL,
    handle               TEXT NOT NULL,
    verified             INTEGER NOT NULL DEFAULT 0,
    preferred_for_escrow INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (agent_id) REFERENCES p2p_agents(id) ON DELETE CASCADE
);";

pub const CREATE_P2P_DEPOSIT_ORDERS: &str = "
CREATE TABLE IF NOT EXISTS p2p_deposit_orders (
    id               TEXT PRIMARY KEY NOT NULL,
    agent_id         TEXT NOT NULL,
    channel_id       TEXT NOT NULL,
    buyer_node_id    TEXT NOT NULL,
    amount           REAL NOT NULL,
    fee_amount       REAL NOT NULL,
    total_amount     REAL NOT NULL,
    currency         TEXT NOT NULL DEFAULT 'USD',
    escrow_id        TEXT,
    status           TEXT NOT NULL DEFAULT 'PendingPayment',
    payment_proof    TEXT,
    created_at       INTEGER NOT NULL,
    confirmed_at     INTEGER,
    released_at      INTEGER,
    FOREIGN KEY (agent_id) REFERENCES p2p_agents(id),
    FOREIGN KEY (channel_id) REFERENCES p2p_payment_channels(id)
);";

pub const CREATE_AUDIT_LOGS: &str = "
CREATE TABLE IF NOT EXISTS audit_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ts          REAL NOT NULL,
    level       TEXT,
    domain      TEXT,
    actor_id    TEXT,
    action      TEXT,
    target      TEXT,
    status      TEXT,
    duration_ms INTEGER,
    trace_id    TEXT,
    fields      TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ts ON audit_logs(ts);
CREATE INDEX IF NOT EXISTS idx_audit_logs_trace_id ON audit_logs(trace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_domain ON audit_logs(domain);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);";

pub const CREATE_PAYMENT_LINKS: &str = "
CREATE TABLE IF NOT EXISTS payment_links (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id      TEXT,
    stage         INTEGER NOT NULL DEFAULT 0,
    trace_id      TEXT UNIQUE,
    agent_id      TEXT,
    channel_id    TEXT,
    amount        REAL,
    currency      TEXT,
    fee           REAL,
    escrow_state  TEXT,
    ts_init       REAL,
    ts_confirm    REAL,
    ts_release    REAL,
    fields        TEXT
);
CREATE INDEX IF NOT EXISTS idx_payment_links_stage ON payment_links(stage);
CREATE INDEX IF NOT EXISTS idx_payment_links_order_id ON payment_links(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_agent_id ON payment_links(agent_id);";

pub const CREATE_OP_TRAILS: &str = "
CREATE TABLE IF NOT EXISTS op_trails (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    ts           REAL NOT NULL,
    actor_id     TEXT,
    module       TEXT,
    action       TEXT,
    ip           TEXT,
    ua           TEXT,
    params       TEXT,
    fingerprint  TEXT,
    ok           INTEGER,
    errmsg       TEXT
);
CREATE INDEX IF NOT EXISTS idx_op_trails_ts ON op_trails(ts);
CREATE INDEX IF NOT EXISTS idx_op_trails_actor_id ON op_trails(actor_id);
CREATE INDEX IF NOT EXISTS idx_op_trails_ok ON op_trails(ok);
CREATE INDEX IF NOT EXISTS idx_op_trails_module_action ON op_trails(module, action);";

pub const CREATE_CHANNELS: &str = "
CREATE TABLE IF NOT EXISTS channels (
    id           TEXT PRIMARY KEY NOT NULL,
    community_id TEXT NOT NULL,
    name         TEXT NOT NULL,
    created_at   INTEGER NOT NULL
);";

pub const CREATE_CALL_HISTORY: &str = "
CREATE TABLE IF NOT EXISTS call_history (
    id           TEXT PRIMARY KEY NOT NULL,
    peer_id      TEXT NOT NULL,
    call_type    TEXT NOT NULL DEFAULT 'voice',
    started_at   INTEGER NOT NULL,
    ended_at     INTEGER NOT NULL DEFAULT 0,
    duration_secs INTEGER NOT NULL DEFAULT 0,
    status       TEXT NOT NULL DEFAULT 'completed'
);";

pub const CREATE_SESSIONS: &str = "
CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY NOT NULL,
    node_id    TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    active     INTEGER NOT NULL DEFAULT 1
);";

pub const CREATE_FAUCET_CLAIMS: &str = "
CREATE TABLE IF NOT EXISTS faucet_claims (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id    TEXT NOT NULL,
    amount     REAL NOT NULL,
    claimed_at INTEGER NOT NULL
);";

pub const CREATE_TOURNAMENTS: &str = "
CREATE TABLE IF NOT EXISTS tournaments (
    id               TEXT PRIMARY KEY NOT NULL,
    host_id          TEXT NOT NULL,
    name             TEXT NOT NULL DEFAULT '',
    game_type        TEXT NOT NULL DEFAULT '',
    entry_fee        REAL NOT NULL DEFAULT 0.0,
    prize_pool       REAL NOT NULL DEFAULT 0.0,
    max_participants INTEGER NOT NULL DEFAULT 0,
    participants     TEXT NOT NULL DEFAULT '[]',
    bracket          TEXT NOT NULL DEFAULT '[]',
    status           TEXT NOT NULL DEFAULT 'registration',
    created_at       INTEGER NOT NULL,
    starts_at        INTEGER NOT NULL DEFAULT 0,
    referee_ids      TEXT NOT NULL DEFAULT '[]',
    host_fee_pct     REAL NOT NULL DEFAULT 0.0,
    data             TEXT NOT NULL DEFAULT ''
);";

pub const CREATE_WEB_GAMES: &str = "
CREATE TABLE IF NOT EXISTS web_games (
    id         TEXT PRIMARY KEY NOT NULL,
    data       TEXT NOT NULL,
    created_at INTEGER NOT NULL
);";

pub const CREATE_ADMIN_USERS: &str = "
CREATE TABLE IF NOT EXISTS admin_users (
    id            TEXT PRIMARY KEY NOT NULL,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'admin',
    permissions   TEXT NOT NULL DEFAULT '[]',
    created_at    INTEGER NOT NULL,
    last_login    INTEGER,
    is_active     INTEGER NOT NULL DEFAULT 1
);";

pub const CREATE_ADMIN_LOGS: &str = "
CREATE TABLE IF NOT EXISTS admin_logs (
    id          TEXT PRIMARY KEY NOT NULL,
    admin_id    TEXT NOT NULL,
    action      TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT '',
    target_id   TEXT NOT NULL DEFAULT '',
    details     TEXT NOT NULL DEFAULT '',
    ip_address  TEXT NOT NULL DEFAULT '',
    user_agent  TEXT NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL
);";

pub const CREATE_SYSTEM_CONFIG: &str = "
CREATE TABLE IF NOT EXISTS system_config (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key   TEXT NOT NULL UNIQUE,
    config_value TEXT NOT NULL DEFAULT '',
    description  TEXT NOT NULL DEFAULT '',
    category     TEXT NOT NULL DEFAULT 'general',
    updated_at   INTEGER NOT NULL
);";

pub const CREATE_LOCAL_USERS: &str = "
CREATE TABLE IF NOT EXISTS local_users (
    id                    TEXT PRIMARY KEY NOT NULL,
    username              TEXT NOT NULL UNIQUE,
    email                 TEXT NOT NULL DEFAULT '',
    password_hash         TEXT NOT NULL,
    node_id               TEXT NOT NULL,
    created_at            INTEGER NOT NULL,
    last_login            INTEGER,
    is_active             INTEGER NOT NULL DEFAULT 1,
    force_password_change INTEGER NOT NULL DEFAULT 0
);";

pub const CREATE_RECOVERY_CODES: &str = "
CREATE TABLE IF NOT EXISTS recovery_codes (
    id         TEXT PRIMARY KEY NOT NULL,
    node_id    TEXT NOT NULL,
    code_hash  TEXT NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);";

pub const CREATE_JOB_APPLICATIONS: &str = "
CREATE TABLE IF NOT EXISTS job_applications (
    id           TEXT PRIMARY KEY NOT NULL,
    job_id       TEXT NOT NULL,
    applicant_id TEXT NOT NULL,
    proposal     TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'pending',
    created_at   INTEGER NOT NULL,
    FOREIGN KEY (job_id) REFERENCES marketplace_jobs(id)
);";

pub const CREATE_SOCIAL_COMMENTS: &str = "
CREATE TABLE IF NOT EXISTS social_comments (
    id         TEXT PRIMARY KEY NOT NULL,
    post_id    TEXT NOT NULL,
    author_id  TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at INTEGER NOT NULL
);";

pub const CREATE_FOLLOWS: &str = "
CREATE TABLE IF NOT EXISTS follows (
    follower_id  TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at   INTEGER NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);";

pub const CREATE_CHALLENGES: &str = "
CREATE TABLE IF NOT EXISTS challenges (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    category     TEXT NOT NULL DEFAULT '',
    difficulty   TEXT NOT NULL DEFAULT 'medium',
    reward       REAL NOT NULL DEFAULT 0.0,
    participants INTEGER NOT NULL DEFAULT 0,
    status       TEXT NOT NULL DEFAULT 'open',
    description  TEXT NOT NULL DEFAULT '',
    created_at   INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);";

pub const CREATE_PROBLEMS: &str = "
CREATE TABLE IF NOT EXISTS problems (
    id          TEXT PRIMARY KEY NOT NULL,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    reward      REAL NOT NULL DEFAULT 0.0,
    status      TEXT NOT NULL DEFAULT 'open',
    posted_by   TEXT NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL
);";

pub const CREATE_DUELS: &str = "
CREATE TABLE IF NOT EXISTS duels (
    id            TEXT PRIMARY KEY NOT NULL,
    duel_type     TEXT NOT NULL DEFAULT '',
    entry_fee     REAL NOT NULL DEFAULT 0.0,
    prize_pool    REAL NOT NULL DEFAULT 0.0,
    players_online INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL
);";

pub const CREATE_PRODUCTS: &str = "
CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT '',
    price       REAL NOT NULL DEFAULT 0.0,
    rating      REAL NOT NULL DEFAULT 0.0,
    seller      TEXT NOT NULL DEFAULT '',
    product_type TEXT NOT NULL DEFAULT 'Template',
    created_at  INTEGER NOT NULL
);";

pub const CREATE_RESOURCES: &str = "
CREATE TABLE IF NOT EXISTS resources (
    id             TEXT PRIMARY KEY NOT NULL,
    name           TEXT NOT NULL,
    resource_type  TEXT NOT NULL DEFAULT 'compute',
    capacity       REAL NOT NULL DEFAULT 0.0,
    used           REAL NOT NULL DEFAULT 0.0,
    unit           TEXT NOT NULL DEFAULT 'GB',
    price_per_unit REAL NOT NULL DEFAULT 0.0,
    owner          TEXT NOT NULL DEFAULT '',
    available      INTEGER NOT NULL DEFAULT 1,
    shared         INTEGER NOT NULL DEFAULT 0,
    shared_with    TEXT NOT NULL DEFAULT '[]',
    description    TEXT NOT NULL DEFAULT '',
    created_at     INTEGER NOT NULL
);";

pub const CREATE_RESOURCE_REQUESTS: &str = "
CREATE TABLE IF NOT EXISTS resource_requests (
    id               TEXT PRIMARY KEY NOT NULL,
    request_type     TEXT NOT NULL DEFAULT 'compute',
    needed_capacity  REAL NOT NULL DEFAULT 0.0,
    requester        TEXT NOT NULL DEFAULT '',
    message          TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'pending',
    created_at       TEXT NOT NULL DEFAULT ''
);";

pub const CREATE_RESOURCE_ALLOCATIONS: &str = "
CREATE TABLE IF NOT EXISTS resource_allocations (
    id               TEXT PRIMARY KEY NOT NULL,
    resource_id      TEXT NOT NULL,
    task_name        TEXT NOT NULL DEFAULT '',
    allocated_amount REAL NOT NULL DEFAULT 0.0,
    assignee         TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'active',
    created_at       TEXT NOT NULL DEFAULT ''
);";

pub const CREATE_RESOURCE_USAGE: &str = "
CREATE TABLE IF NOT EXISTS resource_usage (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id   TEXT NOT NULL,
    date          TEXT NOT NULL,
    usage_percent REAL NOT NULL DEFAULT 0.0
);";

pub const CREATE_MARKETPLACE_LISTINGS: &str = "
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id              TEXT PRIMARY KEY NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    price           REAL NOT NULL DEFAULT 0.0,
    category        TEXT NOT NULL DEFAULT 'other',
    image_url       TEXT NOT NULL DEFAULT '',
    seller_address  TEXT NOT NULL DEFAULT '',
    seller_name     TEXT NOT NULL DEFAULT '',
    created_at      TEXT NOT NULL DEFAULT '',
    stock           INTEGER NOT NULL DEFAULT 1,
    sold            INTEGER NOT NULL DEFAULT 0,
    rating          REAL NOT NULL DEFAULT 0.0
);";

pub const CREATE_BUILD_TELEMETRY: &str = "
CREATE TABLE IF NOT EXISTS build_telemetry (
    id            TEXT PRIMARY KEY NOT NULL,
    build_version TEXT NOT NULL,
    build_target  TEXT NOT NULL,
    cpu_usage_pct REAL NOT NULL DEFAULT 0.0,
    ram_usage_mb  REAL NOT NULL DEFAULT 0.0,
    relayed_bytes INTEGER NOT NULL DEFAULT 0,
    active_mesh_peers INTEGER NOT NULL DEFAULT 0,
    error_count   INTEGER NOT NULL DEFAULT 0,
    last_error    TEXT NOT NULL DEFAULT '',
    created_at    INTEGER NOT NULL
);";

pub const CREATE_INTERNAL_WALLETS: &str = "
CREATE TABLE IF NOT EXISTS internal_wallets (
    node_id TEXT PRIMARY KEY NOT NULL,
    stable TEXT NOT NULL,
    wallet_type TEXT NOT NULL,
    address TEXT NOT NULL,
    limit_val REAL,
    updated_at INTEGER NOT NULL
);";

pub const CREATE_P2P_AGENT_BALANCES: &str = "
CREATE TABLE IF NOT EXISTS p2p_agent_balances (
    agent_id      TEXT NOT NULL,
    token_symbol  TEXT NOT NULL,
    balance       REAL NOT NULL DEFAULT 0.0,
    escrow_locked REAL NOT NULL DEFAULT 0.0,
    updated_at    INTEGER NOT NULL,
    PRIMARY KEY (agent_id, token_symbol),
    FOREIGN KEY (agent_id) REFERENCES p2p_agents(id) ON DELETE CASCADE
);";

pub const CREATE_TOKENS: &str = "
CREATE TABLE IF NOT EXISTS tokens (
    symbol    TEXT PRIMARY KEY NOT NULL,
    name      TEXT NOT NULL,
    token_type TEXT NOT NULL DEFAULT 'stable',
    decimals  INTEGER NOT NULL DEFAULT 2,
    enabled   INTEGER NOT NULL DEFAULT 1
);";

pub const CREATE_APP_SETTINGS: &str = "
CREATE TABLE IF NOT EXISTS app_settings (
    key        TEXT PRIMARY KEY NOT NULL,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);";

pub const CREATE_AUTH_SECRETS: &str = "
CREATE TABLE IF NOT EXISTS auth_secrets (
    key        TEXT PRIMARY KEY NOT NULL,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);";

pub const CREATE_WALLET_ADDRESSES: &str = "
CREATE TABLE IF NOT EXISTS wallet_addresses (
    address TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    coin TEXT NOT NULL,
    derivation_path TEXT NOT NULL,
    addr_index INTEGER NOT NULL,
    encrypted_xpub TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, coin, addr_index)
);
CREATE INDEX IF NOT EXISTS idx_wallet_addresses_user_coin ON wallet_addresses(user_id, coin);
CREATE INDEX IF NOT EXISTS idx_wallet_addresses_used ON wallet_addresses(used);
";

pub const CREATE_CHAIN_TX_DEDUP: &str = "
CREATE TABLE IF NOT EXISTS chain_tx_dedup (
    chain_tx_hash TEXT PRIMARY KEY NOT NULL,
    seen_at INTEGER NOT NULL,
    user_id TEXT,
    coin TEXT
);
CREATE INDEX IF NOT EXISTS idx_chain_tx_dedup_seen ON chain_tx_dedup(seen_at);
";

pub const CREATE_WALLET_BALANCES_TOKENS: &str = "
CREATE TABLE IF NOT EXISTS wallet_balances_tokens (
    id TEXT PRIMARY KEY NOT NULL,
    node_id TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    token_type TEXT NOT NULL DEFAULT 'fiat',
    decimals INTEGER NOT NULL DEFAULT 2,
    balance REAL NOT NULL DEFAULT 0.0,
    locked REAL NOT NULL DEFAULT 0.0,
    updated_at INTEGER NOT NULL,
    UNIQUE(node_id, token_symbol)
);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_tokens_node ON wallet_balances_tokens(node_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_tokens_symbol ON wallet_balances_tokens(token_symbol);
";
