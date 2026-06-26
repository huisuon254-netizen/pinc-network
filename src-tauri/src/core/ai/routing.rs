use crate::core::ai::types::RouteRecommendation;

pub struct PeerMetrics {
    pub node_id: String,
    pub latency_ms: u64,
    pub bandwidth_kbps: f64,
    pub reliability: f64,
    pub load: f64, // 0.0 = idle, 1.0 = full
}

/// AI-assisted route selection — picks optimal relay for a given path
pub fn recommend_route(
    from_node: &str,
    to_node: &str,
    candidates: &[PeerMetrics],
) -> Option<RouteRecommendation> {
    if candidates.is_empty() {
        return None;
    }

    let scored: Vec<(&PeerMetrics, f64)> = candidates
        .iter()
        .map(|p| {
            let lat_score = 1.0 - (p.latency_ms as f64 / 2000.0).min(1.0);
            let bw_score = (p.bandwidth_kbps / 100_000.0).min(1.0);
            let load_score = 1.0 - p.load;
            let score = lat_score * 0.4 + bw_score * 0.35 + load_score * 0.15 + p.reliability * 0.1;
            (p, score)
        })
        .collect();

    let best = scored
        .iter()
        .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal))?;

    Some(RouteRecommendation {
        from_node: from_node.to_string(),
        to_node: to_node.to_string(),
        recommended_relay: best.0.node_id.clone(),
        expected_latency_ms: best.0.latency_ms,
        expected_bandwidth_kbps: best.0.bandwidth_kbps,
        confidence: best.1,
    })
}

/// Predict bandwidth for next interval using simple exponential smoothing
pub fn predict_bandwidth(history: &[f64], alpha: f64) -> f64 {
    if history.is_empty() {
        return 0.0;
    }
    let mut smoothed = history[0];
    for &val in &history[1..] {
        smoothed = alpha * val + (1.0 - alpha) * smoothed;
    }
    smoothed
}

/// Score a node's fitness for being a relay
pub fn relay_fitness_score(
    latency_ms: u64,
    bandwidth_kbps: f64,
    uptime_pct: f64,
    load: f64,
) -> f64 {
    let lat = 1.0 - (latency_ms as f64 / 1000.0).min(1.0);
    let bw = (bandwidth_kbps / 50_000.0).min(1.0);
    let up = uptime_pct / 100.0;
    let ld = 1.0 - load;
    (lat * 0.3 + bw * 0.3 + up * 0.2 + ld * 0.2).clamp(0.0, 1.0)
}
