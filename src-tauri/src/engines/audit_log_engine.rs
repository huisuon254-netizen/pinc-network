use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use crate::core::database::{connection::Database, errors::DatabaseError};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
    Fatal,
    Audit,
    Alert,
}

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LogLevel::Trace => write!(f, "trace"),
            LogLevel::Debug => write!(f, "debug"),
            LogLevel::Info => write!(f, "info"),
            LogLevel::Warn => write!(f, "warn"),
            LogLevel::Error => write!(f, "error"),
            LogLevel::Fatal => write!(f, "fatal"),
            LogLevel::Audit => write!(f, "audit"),
            LogLevel::Alert => write!(f, "alert"),
        }
    }
}

impl std::str::FromStr for LogLevel {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "trace" => Ok(LogLevel::Trace),
            "debug" => Ok(LogLevel::Debug),
            "info" => Ok(LogLevel::Info),
            "warn" => Ok(LogLevel::Warn),
            "error" => Ok(LogLevel::Error),
            "fatal" => Ok(LogLevel::Fatal),
            "audit" => Ok(LogLevel::Audit),
            "alert" => Ok(LogLevel::Alert),
            other => Err(format!("Unknown log level: {}", other)),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum LogDomain {
    Payment,
    Agent,
    Auth,
    System,
    Network,
    Db,
}

impl std::fmt::Display for LogDomain {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LogDomain::Payment => write!(f, "payment"),
            LogDomain::Agent => write!(f, "agent"),
            LogDomain::Auth => write!(f, "auth"),
            LogDomain::System => write!(f, "system"),
            LogDomain::Network => write!(f, "network"),
            LogDomain::Db => write!(f, "db"),
        }
    }
}

impl std::str::FromStr for LogDomain {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "payment" => Ok(LogDomain::Payment),
            "agent" => Ok(LogDomain::Agent),
            "auth" => Ok(LogDomain::Auth),
            "system" => Ok(LogDomain::System),
            "network" => Ok(LogDomain::Network),
            "db" => Ok(LogDomain::Db),
            other => Err(format!("Unknown log domain: {}", other)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: Option<i64>,
    pub ts: f64,
    pub level: LogLevel,
    pub domain: LogDomain,
    pub actor_id: Option<String>,
    pub action: String,
    pub target: Option<String>,
    pub status: Option<String>,
    pub duration_ms: Option<i64>,
    pub trace_id: Option<String>,
    pub fields: HashMap<String, serde_json::Value>,
}

impl Default for AuditLog {
    fn default() -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs_f64();
        AuditLog {
            id: None,
            ts: now,
            level: LogLevel::Info,
            domain: LogDomain::System,
            actor_id: None,
            action: String::new(),
            target: None,
            status: None,
            duration_ms: None,
            trace_id: None,
            fields: HashMap::new(),
        }
    }
}

impl AuditLog {
    pub fn builder() -> AuditLogBuilder {
        AuditLogBuilder::new()
    }
}

#[derive(Debug, Default)]
pub struct AuditLogBuilder {
    level: Option<LogLevel>,
    domain: Option<LogDomain>,
    actor_id: Option<String>,
    action: Option<String>,
    target: Option<String>,
    status: Option<String>,
    duration_ms: Option<i64>,
    trace_id: Option<String>,
    fields: HashMap<String, serde_json::Value>,
}

impl AuditLogBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn level(mut self, level: LogLevel) -> Self {
        self.level = Some(level);
        self
    }

    pub fn domain(mut self, domain: LogDomain) -> Self {
        self.domain = Some(domain);
        self
    }

    pub fn actor_id<T: Into<String>>(mut self, id: T) -> Self {
        self.actor_id = Some(id.into());
        self
    }

    pub fn action<T: Into<String>>(mut self, action: T) -> Self {
        self.action = Some(action.into());
        self
    }

    pub fn target<T: Into<String>>(mut self, target: T) -> Self {
        self.target = Some(target.into());
        self
    }

    pub fn status<T: Into<String>>(mut self, status: T) -> Self {
        self.status = Some(status.into());
        self
    }

    pub fn duration_ms(mut self, ms: i64) -> Self {
        self.duration_ms = Some(ms);
        self
    }

    pub fn trace_id<T: Into<String>>(mut self, id: T) -> Self {
        self.trace_id = Some(id.into());
        self
    }

    pub fn field<K: Into<String>, V: Into<serde_json::Value>>(mut self, k: K, v: V) -> Self {
        self.fields.insert(k.into(), v.into());
        self
    }

    pub fn build(self) -> AuditLog {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs_f64();
        AuditLog {
            id: None,
            ts: now,
            level: self.level.unwrap_or(LogLevel::Info),
            domain: self.domain.unwrap_or(LogDomain::System),
            actor_id: self.actor_id,
            action: self.action.unwrap_or_default(),
            target: self.target,
            status: self.status,
            duration_ms: self.duration_ms,
            trace_id: self.trace_id,
            fields: self.fields,
        }
    }
}

pub trait AuditLogEngine {
    fn append(&self, db: &Database, log: AuditLog) -> Result<(), DatabaseError>;
    fn query(
        &self,
        db: &Database,
        filter: LogFilter,
        page: u32,
        page_size: u32,
    ) -> Result<LogPage, DatabaseError>;
    fn export_csv(&self, db: &Database, filter: LogFilter) -> Result<String, DatabaseError>;
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct LogFilter {
    pub levels: Option<Vec<LogLevel>>,
    pub domains: Option<Vec<LogDomain>>,
    pub actor_id: Option<String>,
    pub action: Option<String>,
    pub target: Option<String>,
    pub trace_id: Option<String>,
    pub status: Option<String>,
    pub ts_from: Option<f64>,
    pub ts_to: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogPage {
    pub items: Vec<AuditLog>,
    pub page: u32,
    pub page_size: u32,
    pub total: i64,
}

pub struct SqliteAuditLogEngine;

impl Default for SqliteAuditLogEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl SqliteAuditLogEngine {
    pub fn new() -> Self {
        SqliteAuditLogEngine
    }
}

impl AuditLogEngine for SqliteAuditLogEngine {
    fn append(&self, db: &Database, log: AuditLog) -> Result<(), DatabaseError> {
        append_to_sqlite(db, log)
    }

    fn query(
        &self,
        db: &Database,
        filter: LogFilter,
        page: u32,
        page_size: u32,
    ) -> Result<LogPage, DatabaseError> {
        query_logs(db, filter, page, page_size)
    }

    fn export_csv(&self, db: &Database, filter: LogFilter) -> Result<String, DatabaseError> {
        let page = query_logs(db, filter, 1, 100_000)?;
        let mut csv = String::from(
            "id,ts,level,domain,actor_id,action,target,status,duration_ms,trace_id,fields\n",
        );
        for log in page.items {
            let fields_json = serde_json::to_string(&log.fields).unwrap_or_default();
            let line = format!(
                "{},{},{},{},{},{},{},{},{},{},{}\n",
                log.id.unwrap_or(0),
                log.ts,
                log.level,
                log.domain,
                csv_escape(&log.actor_id.unwrap_or_default()),
                csv_escape(&log.action),
                csv_escape(&log.target.unwrap_or_default()),
                csv_escape(&log.status.unwrap_or_default()),
                log.duration_ms.unwrap_or(0),
                csv_escape(&log.trace_id.unwrap_or_default()),
                csv_escape(&fields_json),
            );
            csv.push_str(&line);
        }
        Ok(csv)
    }
}

fn csv_escape(s: &str) -> String {
    if s.contains(',') || s.contains('"') || s.contains('\n') {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s.to_string()
    }
}

pub fn append_to_sqlite(db: &Database, log: AuditLog) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let fields_json = serde_json::to_string(&log.fields)
        .map_err(|e| DatabaseError::QueryFailed(format!("serialize fields: {}", e)))?;
    conn.execute(
        "INSERT INTO audit_logs
         (ts, level, domain, actor_id, action, target, status, duration_ms, trace_id, fields)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        rusqlite::params![
            log.ts,
            log.level.to_string(),
            log.domain.to_string(),
            log.actor_id,
            log.action,
            log.target,
            log.status,
            log.duration_ms,
            log.trace_id,
            fields_json,
        ],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn new_trace_id() -> String {
    Uuid::new_v4().to_string()
}

pub fn query_logs(
    db: &Database,
    filter: LogFilter,
    page: u32,
    page_size: u32,
) -> Result<LogPage, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;

    let mut where_clauses: Vec<String> = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(ref levels) = filter.levels {
        let placeholders: Vec<String> = (0..levels.len())
            .map(|i| format!("?{}", params.len() + i + 1))
            .collect();
        where_clauses.push(format!("level IN ({})", placeholders.join(",")));
        for l in levels {
            params.push(Box::new(l.to_string()));
        }
    }

    if let Some(ref domains) = filter.domains {
        let placeholders: Vec<String> = (0..domains.len())
            .map(|i| format!("?{}", params.len() + i + 1))
            .collect();
        where_clauses.push(format!("domain IN ({})", placeholders.join(",")));
        for d in domains {
            params.push(Box::new(d.to_string()));
        }
    }

    if let Some(ref actor_id) = filter.actor_id {
        where_clauses.push(format!("actor_id = ?{}", params.len() + 1));
        params.push(Box::new(actor_id.clone()));
    }

    if let Some(ref action) = filter.action {
        where_clauses.push(format!("action LIKE ?{}", params.len() + 1));
        params.push(Box::new(format!("%{}%", action)));
    }

    if let Some(ref target) = filter.target {
        where_clauses.push(format!("target LIKE ?{}", params.len() + 1));
        params.push(Box::new(format!("%{}%", target)));
    }

    if let Some(ref trace_id) = filter.trace_id {
        where_clauses.push(format!("trace_id = ?{}", params.len() + 1));
        params.push(Box::new(trace_id.clone()));
    }

    if let Some(ref status) = filter.status {
        where_clauses.push(format!("status = ?{}", params.len() + 1));
        params.push(Box::new(status.clone()));
    }

    if let Some(ts_from) = filter.ts_from {
        where_clauses.push(format!("ts >= ?{}", params.len() + 1));
        params.push(Box::new(ts_from));
    }

    if let Some(ts_to) = filter.ts_to {
        where_clauses.push(format!("ts <= ?{}", params.len() + 1));
        params.push(Box::new(ts_to));
    }

    let where_sql = if where_clauses.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_clauses.join(" AND "))
    };

    let count_sql = format!("SELECT COUNT(*) FROM audit_logs {}", where_sql);
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let total: i64 = conn
        .query_row(&count_sql, param_refs.as_slice(), |r| r.get(0))
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;

    let offset = (page.saturating_sub(1) as i64) * (page_size as i64);
    let limit = page_size as i64;

    let select_sql = format!(
        "SELECT id, ts, level, domain, actor_id, action, target, status, duration_ms, trace_id, fields
         FROM audit_logs {}
         ORDER BY ts DESC, id DESC
         LIMIT ?{} OFFSET ?{}",
        where_sql,
        params.len() + 1,
        params.len() + 2
    );

    let mut final_params = params;
    final_params.push(Box::new(limit));
    final_params.push(Box::new(offset));
    let final_refs: Vec<&dyn rusqlite::ToSql> = final_params.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conn
        .prepare(&select_sql)
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;

    let rows = stmt
        .query_map(final_refs.as_slice(), |row| {
            let fields_str: String = row.get(10).unwrap_or_default();
            let fields: HashMap<String, serde_json::Value> =
                serde_json::from_str(&fields_str).unwrap_or_default();
            let level_str: String = row.get(2).unwrap_or_default();
            let domain_str: String = row.get(3).unwrap_or_default();
            Ok(AuditLog {
                id: row.get(0).ok(),
                ts: row.get(1).unwrap_or(0.0),
                level: level_str.parse().unwrap_or(LogLevel::Info),
                domain: domain_str.parse().unwrap_or(LogDomain::System),
                actor_id: row.get(4).ok(),
                action: row.get(5).unwrap_or_default(),
                target: row.get(6).ok(),
                status: row.get(7).ok(),
                duration_ms: row.get(8).ok(),
                trace_id: row.get(9).ok(),
                fields,
            })
        })
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;

    let mut items: Vec<AuditLog> = Vec::new();
    for row_result in rows {
        match row_result {
            Ok(log) => items.push(log),
            Err(e) => return Err(DatabaseError::QueryFailed(e.to_string())),
        }
    }

    Ok(LogPage {
        items,
        page,
        page_size,
        total,
    })
}

pub fn query_payment_trace(db: &Database, trace_id: &str) -> Result<Vec<AuditLog>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, ts, level, domain, actor_id, action, target, status, duration_ms, trace_id, fields
             FROM audit_logs
             WHERE trace_id = ?1 AND domain = 'payment'
             ORDER BY ts ASC, id ASC",
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;

    let rows = stmt
        .query_map(rusqlite::params![trace_id], |row| {
            let fields_str: String = row.get(10).unwrap_or_default();
            let fields: HashMap<String, serde_json::Value> =
                serde_json::from_str(&fields_str).unwrap_or_default();
            let level_str: String = row.get(2).unwrap_or_default();
            let domain_str: String = row.get(3).unwrap_or_default();
            Ok(AuditLog {
                id: row.get(0).ok(),
                ts: row.get(1).unwrap_or(0.0),
                level: level_str.parse().unwrap_or(LogLevel::Info),
                domain: domain_str.parse().unwrap_or(LogDomain::System),
                actor_id: row.get(4).ok(),
                action: row.get(5).unwrap_or_default(),
                target: row.get(6).ok(),
                status: row.get(7).ok(),
                duration_ms: row.get(8).ok(),
                trace_id: row.get(9).ok(),
                fields,
            })
        })
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;

    let mut items: Vec<AuditLog> = Vec::new();
    for row_result in rows {
        match row_result {
            Ok(log) => items.push(log),
            Err(e) => return Err(DatabaseError::QueryFailed(e.to_string())),
        }
    }
    Ok(items)
}
