use crate::core::routing::types::{MultiHopPath, Route, RoutingTable};
use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone)]
struct NodeState {
    node_id: String,
    cost: u64,
}

impl PartialEq for NodeState {
    fn eq(&self, other: &Self) -> bool {
        self.cost == other.cost
    }
}
impl Eq for NodeState {}
impl Ord for NodeState {
    fn cmp(&self, other: &Self) -> Ordering {
        other.cost.cmp(&self.cost)
    }
}
impl PartialOrd for NodeState {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// Dijkstra shortest-latency path finding
pub fn find_shortest_path(
    source: &str,
    destination: &str,
    tables: &HashMap<String, RoutingTable>,
) -> Option<MultiHopPath> {
    let mut dist: HashMap<String, u64> = HashMap::new();
    let mut prev: HashMap<String, String> = HashMap::new();
    let mut heap = BinaryHeap::new();

    dist.insert(source.to_string(), 0);
    heap.push(NodeState {
        node_id: source.to_string(),
        cost: 0,
    });

    while let Some(NodeState { node_id, cost }) = heap.pop() {
        if node_id == destination {
            break;
        }
        if cost > *dist.get(&node_id).unwrap_or(&u64::MAX) {
            continue;
        }

        if let Some(table) = tables.get(&node_id) {
            for route in &table.routes {
                let next_cost = cost + route.latency_ms;
                if next_cost < *dist.get(&route.destination).unwrap_or(&u64::MAX) {
                    dist.insert(route.destination.clone(), next_cost);
                    prev.insert(route.destination.clone(), node_id.clone());
                    heap.push(NodeState {
                        node_id: route.destination.clone(),
                        cost: next_cost,
                    });
                }
            }
        }
    }

    // Reconstruct path
    if !dist.contains_key(destination) {
        return None;
    }
    let mut path = Vec::new();
    let mut current = destination.to_string();
    while current != source {
        path.push(current.clone());
        current = prev.get(&current)?.clone();
    }
    path.push(source.to_string());
    path.reverse();

    let total_lat = *dist.get(destination)?;
    Some(MultiHopPath {
        source: source.to_string(),
        destination: destination.to_string(),
        hops: path,
        total_latency_ms: total_lat,
        min_bandwidth_kbps: 10_000.0,
        reliability: 0.95,
    })
}

/// Balance load across regions
pub fn select_region(
    regions: &[crate::core::routing::types::RegionConfig],
) -> Option<&crate::core::routing::types::RegionConfig> {
    regions
        .iter()
        .filter(|r| r.load < 0.9)
        .min_by(|a, b| a.load.partial_cmp(&b.load).unwrap_or(Ordering::Equal))
}

/// Prune stale routes older than max_age_secs
pub fn prune_stale_routes(table: &mut RoutingTable, max_age_secs: i64) {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    table
        .routes
        .retain(|r| (now - r.last_verified) < max_age_secs);
}
