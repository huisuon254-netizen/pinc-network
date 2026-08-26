#[macro_export]
macro_rules! payment_trace {
    ($trace_id:expr, $amount:expr, $channel:expr) => {{
        use $crate::engines::audit_log_engine::{
            AuditLogBuilder, LogDomain, LogLevel,
        };
        AuditLogBuilder::new()
            .level(LogLevel::Trace)
            .domain(LogDomain::Payment)
            .trace_id($trace_id.to_string())
            .action("payment_trace")
            .status("pending")
            .field("amount", $amount)
            .field("channel", $channel)
            .build()
    }};
    ($trace_id:expr, $amount:expr, $channel:expr, $($key:expr => $val:expr),+ $(,)?) => {{
        use $crate::engines::audit_log_engine::{
            AuditLogBuilder, LogDomain, LogLevel,
        };
        let mut builder = AuditLogBuilder::new()
            .level(LogLevel::Trace)
            .domain(LogDomain::Payment)
            .trace_id($trace_id.to_string())
            .action("payment_trace")
            .status("pending")
            .field("amount", $amount)
            .field("channel", $channel);
        $(
            builder = builder.field($key, $val);
        )+
        builder.build()
    }};
}

#[macro_export]
macro_rules! agent_audit {
    ($actor:expr, $action:expr) => {{
        use $crate::engines::audit_log_engine::{AuditLogBuilder, LogDomain, LogLevel};
        AuditLogBuilder::new()
            .level(LogLevel::Audit)
            .domain(LogDomain::Agent)
            .actor_id($actor.to_string())
            .action($action.to_string())
            .status("ok")
            .build()
    }};
    ($actor:expr, $action:expr, $target:expr) => {{
        use $crate::engines::audit_log_engine::{AuditLogBuilder, LogDomain, LogLevel};
        AuditLogBuilder::new()
            .level(LogLevel::Audit)
            .domain(LogDomain::Agent)
            .actor_id($actor.to_string())
            .action($action.to_string())
            .target($target.to_string())
            .status("ok")
            .build()
    }};
    ($actor:expr, $action:expr, $target:expr, $status:expr) => {{
        use $crate::engines::audit_log_engine::{AuditLogBuilder, LogDomain, LogLevel};
        AuditLogBuilder::new()
            .level(LogLevel::Audit)
            .domain(LogDomain::Agent)
            .actor_id($actor.to_string())
            .action($action.to_string())
            .target($target.to_string())
            .status($status.to_string())
            .build()
    }};
}

#[macro_export]
macro_rules! alert {
    ($condition:expr, $message:expr) => {{
        use $crate::engines::audit_log_engine::{
            AuditLogBuilder, LogDomain, LogLevel,
        };
        if $condition {
            let log = AuditLogBuilder::new()
                .level(LogLevel::Alert)
                .domain(LogDomain::System)
                .action("alert_triggered")
                .status("alert")
                .field("message", $message)
                .field("condition", stringify!($condition))
                .build();
            log::warn!("[ALERT] {} (condition: {})", $message, stringify!($condition));
            Some(log)
        } else {
            None
        }
    }};
    ($condition:expr, $message:expr, $($key:expr => $val:expr),+ $(,)?) => {{
        use $crate::engines::audit_log_engine::{
            AuditLogBuilder, LogDomain, LogLevel,
        };
        if $condition {
            let mut builder = AuditLogBuilder::new()
                .level(LogLevel::Alert)
                .domain(LogDomain::System)
                .action("alert_triggered")
                .status("alert")
                .field("message", $message)
                .field("condition", stringify!($condition));
            $(
                builder = builder.field($key, $val);
            )+
            log::warn!("[ALERT] {} (condition: {})", $message, stringify!($condition));
            Some(builder.build())
        } else {
            None
        }
    }};
}

#[macro_export]
macro_rules! op_trail {
    ($actor:expr, $path:expr, $method:expr) => {{
        use $crate::engines::audit_log_engine::{AuditLogBuilder, LogDomain, LogLevel};
        AuditLogBuilder::new()
            .level(LogLevel::Audit)
            .domain(LogDomain::Auth)
            .actor_id($actor.to_string())
            .action(format!("{} {}", $method, $path))
            .target($path.to_string())
            .field("http_method", $method)
            .field("path", $path)
            .build()
    }};
    ($actor:expr, $path:expr, $method:expr, $ok:expr) => {{
        use $crate::engines::audit_log_engine::{AuditLogBuilder, LogDomain, LogLevel};
        let status = if $ok { "ok" } else { "error" };
        AuditLogBuilder::new()
            .level(LogLevel::Audit)
            .domain(LogDomain::Auth)
            .actor_id($actor.to_string())
            .action(format!("{} {}", $method, $path))
            .target($path.to_string())
            .status(status.to_string())
            .field("http_method", $method)
            .field("path", $path)
            .field("ok", $ok)
            .build()
    }};
    ($actor:expr, $path:expr, $method:expr, $ok:expr, $ip:expr, $ua:expr) => {{
        use $crate::engines::audit_log_engine::{AuditLogBuilder, LogDomain, LogLevel};
        let status = if $ok { "ok" } else { "error" };
        AuditLogBuilder::new()
            .level(LogLevel::Audit)
            .domain(LogDomain::Auth)
            .actor_id($actor.to_string())
            .action(format!("{} {}", $method, $path))
            .target($path.to_string())
            .status(status.to_string())
            .field("http_method", $method)
            .field("path", $path)
            .field("ok", $ok)
            .field("ip", $ip)
            .field("user_agent", $ua)
            .build()
    }};
}
