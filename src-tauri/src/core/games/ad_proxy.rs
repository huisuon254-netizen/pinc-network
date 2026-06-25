use std::collections::HashSet;

const AD_DOMAINS: &[&str] = &[
    "googleads.g.doubleclick.net",
    "pagead2.googlesyndication.com",
    "ads.gamedistribution.com",
    "googletagmanager.com",
    "google-analytics.com",
    "doubleclick.net",
    "adnxs.com",
    "amazon-adsystem.com",
    "criteo.com",
    "taboola.com",
    "outbrain.com",
    "moatads.com",
    "pubmatic.com",
    "openx.net",
    "rubiconproject.com",
];

const AD_SCRIPT_PATTERNS: &[&str] = &[
    "googletag", "gpt.js", "adsbygoogle", "doubleclick.net",
    "pagead2", "googlesyndication", "prebid", "pbjs",
    "moat.", "criteo", "taboola", "outbrain",
];

pub struct AdBlockConfig {
    pub blocked_domains: HashSet<String>,
    pub blocked_script_patterns: Vec<String>,
    pub inject_csp: bool,
    pub strip_ad_scripts: bool,
    pub ghost_origin_active: bool,
}

impl AdBlockConfig {
    pub fn new() -> Self {
        let blocked_domains: HashSet<String> = AD_DOMAINS.iter().map(|s| s.to_string()).collect();
        Self {
            blocked_domains,
            blocked_script_patterns: AD_SCRIPT_PATTERNS.iter().map(|s| s.to_string()).collect(),
            inject_csp: true,
            strip_ad_scripts: true,
            ghost_origin_active: false,
        }
    }

    pub fn should_block_url(&self, url: &str) -> bool {
        self.blocked_domains.iter().any(|domain| url.contains(domain))
    }

    pub fn strip_ad_scripts_from_html(&self, html: &str) -> String {
        if !self.strip_ad_scripts { return html.to_string(); }
        let mut result = html.to_string();
        for pattern in &self.blocked_script_patterns {
            let pattern_lower = pattern.to_lowercase();
            loop {
                if let Some(start) = result.to_lowercase().find("<script") {
                    if let Some(end) = result[start..].find("</script>") {
                        let script_content = &result[start..start + end + 9];
                        if script_content.to_lowercase().contains(&pattern_lower) {
                            result.replace_range(start..start + end + 9, "");
                            continue;
                        }
                    }
                }
                break;
            }
        }
        result
    }

    pub fn csp_header_value(&self) -> String {
        let gd = "https://*.gamedistribution.com https://*.gamedistribution-cdn.com";
        format!("default-src 'self' {gd}; script-src 'self' 'unsafe-inline' 'unsafe-eval' {gd}; style-src 'self' 'unsafe-inline'; img-src 'self' {gd} https://img.gamedistribution.com data:; media-src 'self' {gd}; connect-src 'self' {gd} wss://*; frame-src {gd}; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'")
    }
}
