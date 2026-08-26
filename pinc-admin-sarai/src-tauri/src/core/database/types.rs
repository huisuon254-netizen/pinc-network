pub struct DbStats {
    pub identity_count: i64,
}
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
