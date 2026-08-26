pub mod countries;
pub mod payment_regions;

pub use countries::{Country, Region, COUNTRIES};
pub use payment_regions::{
    agent_prompt_for_payment, get_payment_method, get_payment_methods,
    list_payment_methods_for_country, payment_methods, ExchangeRate, ExchangeRateEngine,
    PaymentField, PaymentMethod,
};

use std::collections::HashMap;

pub fn lookup_by_iso2(iso2: &str) -> Option<&'static Country> {
    let needle = iso2.trim().to_uppercase();
    COUNTRIES.iter().find(|c| c.iso2 == needle.as_str())
}

pub fn lookup_by_calling_code(code: &str) -> Vec<&'static Country> {
    let mut cleaned = code.trim().to_string();
    if !cleaned.starts_with('+') {
        cleaned.insert(0, '+');
    }
    COUNTRIES
        .iter()
        .filter(|c| c.calling_code == cleaned.as_str())
        .collect()
}

pub fn list_by_region(region: Region) -> Vec<&'static Country> {
    COUNTRIES.iter().filter(|c| c.region == region).collect()
}

pub fn list_supported_channels(iso2: &str) -> Vec<String> {
    lookup_by_iso2(iso2)
        .map(|c| c.supported_payment.iter().map(|s| s.to_string()).collect())
        .unwrap_or_default()
}

pub fn list_all_countries() -> &'static [Country] {
    COUNTRIES
}

pub fn list_countries_paginated(skip: usize, limit: usize) -> Vec<&'static Country> {
    COUNTRIES.iter().skip(skip).take(limit).collect()
}

pub fn search_countries(query: &str) -> Vec<&'static Country> {
    let q = query.trim().to_lowercase();
    if q.is_empty() {
        return COUNTRIES.iter().collect();
    }
    COUNTRIES
        .iter()
        .filter(|c| {
            c.name_en.to_lowercase().contains(&q)
                || c.name_local.to_lowercase().contains(&q)
                || c.iso2.to_lowercase() == q
                || c.iso3.to_lowercase() == q
                || c.calling_code.contains(&q)
                || c.currency_code.to_lowercase().contains(&q)
        })
        .collect()
}

pub fn country_stats() -> HashMap<&'static str, usize> {
    let mut stats: HashMap<&'static str, usize> = HashMap::new();
    for r in [
        Region::Africa,
        Region::Americas,
        Region::Asia,
        Region::Europe,
        Region::Oceania,
    ] {
        stats.insert(r.as_str(), list_by_region(r).len());
    }
    stats.insert("total", COUNTRIES.len());
    let eu = COUNTRIES.iter().filter(|c| c.eu_member).count();
    stats.insert("eu_members", eu);
    let eea = COUNTRIES.iter().filter(|c| c.eea_member).count();
    stats.insert("eea_members", eea);
    let sanctioned_3 = COUNTRIES.iter().filter(|c| c.sanctions_level >= 3).count();
    stats.insert("high_risk", sanctioned_3);
    let sanctioned_2 = COUNTRIES.iter().filter(|c| c.sanctions_level >= 2).count();
    stats.insert("elevated_risk", sanctioned_2);
    stats
}
