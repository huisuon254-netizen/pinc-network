use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApkInfo {
    pub path: PathBuf,
    pub package_name: Option<String>,
    pub app_label: Option<String>,
    pub version_name: Option<String>,
    pub version_code: Option<String>,
    pub min_sdk: Option<String>,
    pub target_sdk: Option<String>,
    pub decompiled_path: Option<PathBuf>,
    pub extracted_size_bytes: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentFlowEndpoint {
    pub name: String,
    pub url: Option<String>,
    pub method: Option<String>,
    pub source_file: PathBuf,
    pub line_start: usize,
    pub line_end: usize,
    pub auth_scheme: Option<String>,
    pub content_type: Option<String>,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentSdkRef {
    pub sdk_name: String,
    pub maven_coord: Option<String>,
    pub permissions: Vec<String>,
    pub services: Vec<String>,
    pub receivers: Vec<String>,
    pub activities: Vec<String>,
    pub providers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentFlowAnalysis {
    pub apk: ApkInfo,
    pub endpoints: Vec<PaymentFlowEndpoint>,
    pub sdks: Vec<PaymentSdkRef>,
    pub permission_categories: std::collections::HashMap<String, Vec<String>>,
    pub interesting_strings: Vec<(String, PathBuf)>,
    pub analysis_notes: Vec<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum DecompileEngine {
    Jadx,
    Apktool,
    Both,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecompileOptions {
    pub engine: DecompileEngine,
    pub output_dir: PathBuf,
    pub resources_only: bool,
    pub no_sources: bool,
    pub threads: u32,
    pub keep_intermediate: bool,
}

impl Default for DecompileOptions {
    fn default() -> Self {
        DecompileOptions {
            engine: DecompileEngine::Both,
            output_dir: PathBuf::from("./apk-analysis"),
            resources_only: false,
            no_sources: false,
            threads: 4,
            keep_intermediate: true,
        }
    }
}

pub fn is_tool_available(name: &str) -> bool {
    which(name).is_ok()
}

fn which(name: &str) -> Result<PathBuf, String> {
    if let Ok(paths) = std::env::var("PATH") {
        for p in std::env::split_paths(&paths) {
            let candidate = p.join(name);
            if candidate.exists() {
                return Ok(candidate);
            }
            #[cfg(windows)]
            {
                let with_ext = p.join(format!("{}.exe", name));
                if with_ext.exists() {
                    return Ok(with_ext);
                }
            }
        }
    }
    Err(format!("Tool '{}' not found in PATH", name))
}

pub fn list_required_tools() -> Vec<(&'static str, bool, &'static str)> {
    vec![
        (
            "jadx",
            is_tool_available("jadx"),
            "Decompiles DEX to Java/Kotlin sources (https://github.com/skylot/jadx)",
        ),
        (
            "apktool",
            is_tool_available("apktool"),
            "Extracts resources, manifest, smali (https://ibotpeaches.github.io/Apktool/)",
        ),
        (
            "aapt",
            is_tool_available("aapt") || is_tool_available("aapt2"),
            "Android Asset Packaging Tool for manifest/badging info",
        ),
        (
            "keytool",
            is_tool_available("keytool"),
            "Java keytool for APK signature inspection (JDK)",
        ),
        (
            "jarsigner",
            is_tool_available("jarsigner"),
            "Jar signer for signature verification",
        ),
        (
            "unzip",
            is_tool_available("unzip"),
            "Fallback zip extractor for APK contents",
        ),
    ]
}

pub fn analyze_apk_shell_only<P: AsRef<Path>>(apk_path: P) -> Result<ApkInfo, String> {
    let path = apk_path.as_ref().to_path_buf();
    if !path.exists() {
        return Err(format!("APK not found at {}", path.display()));
    }
    let mut info = ApkInfo {
        path: path.clone(),
        package_name: None,
        app_label: None,
        version_name: None,
        version_code: None,
        min_sdk: None,
        target_sdk: None,
        decompiled_path: None,
        extracted_size_bytes: None,
    };
    if is_tool_available("aapt") || is_tool_available("aapt2") {
        let tool = if is_tool_available("aapt2") {
            "aapt2"
        } else {
            "aapt"
        };
        let output = Command::new(tool)
            .arg("dump")
            .arg("badging")
            .arg(&path)
            .output()
            .map_err(|e| format!("Failed to run {}: {}", tool, e))?;
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if let Some(rest) = line.strip_prefix("package:") {
                    if let Some(pn) = capture_quoted(rest, "name=") {
                        info.package_name = Some(pn);
                    }
                    if let Some(vn) = capture_quoted(rest, "versionName=") {
                        info.version_name = Some(vn);
                    }
                    if let Some(vc) = capture_quoted(rest, "versionCode=") {
                        info.version_code = Some(vc);
                    }
                }
                if let Some(rest) = line.strip_prefix("application:") {
                    if let Some(lbl) = capture_quoted(rest, "label=") {
                        info.app_label = Some(lbl);
                    }
                }
                if let Some(sdk) = line.strip_prefix("sdkVersion:") {
                    info.min_sdk = Some(sdk.trim().trim_matches('\'').to_string());
                }
                if let Some(sdk) = line.strip_prefix("targetSdkVersion:") {
                    info.target_sdk = Some(sdk.trim().trim_matches('\'').to_string());
                }
            }
        }
    }
    Ok(info)
}

fn capture_quoted(haystack: &str, key: &str) -> Option<String> {
    if let Some(pos) = haystack.find(key) {
        let after = &haystack[pos + key.len()..];
        let q1 = after.find('\'')?;
        let rest = &after[q1 + 1..];
        let q2 = rest.find('\'')?;
        Some(rest[..q2].to_string())
    } else {
        None
    }
}

pub fn decompile_apk<P: AsRef<Path>>(
    apk_path: P,
    options: &DecompileOptions,
) -> Result<PathBuf, String> {
    let apk_path = apk_path.as_ref();
    if !apk_path.exists() {
        return Err(format!("APK not found: {}", apk_path.display()));
    }
    std::fs::create_dir_all(&options.output_dir)
        .map_err(|e| format!("Failed to create output dir: {}", e))?;
    let apk_stem = apk_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("apk");
    let output_dir = options.output_dir.join(apk_stem);
    if output_dir.exists() {
        std::fs::remove_dir_all(&output_dir).ok();
    }
    match options.engine {
        DecompileEngine::Jadx => {
            if !is_tool_available("jadx") {
                return Err("jadx requested but not installed in PATH".to_string());
            }
            let mut args = vec!["-d", output_dir.to_str().unwrap()];
            if options.resources_only {
                args.push("--no-src");
            }
            if options.no_sources {
                args.push("--no-res");
            }
            let thread_str = options.threads.to_string();
            args.push("-j");
            args.push(&thread_str);
            let apk = apk_path.to_string_lossy().to_string();
            let _ = Command::new("jadx")
                .args(&args)
                .arg(&apk)
                .output()
                .map_err(|e| format!("jadx failed: {}", e))?;
        }
        DecompileEngine::Apktool => {
            if !is_tool_available("apktool") {
                return Err("apktool requested but not installed in PATH".to_string());
            }
            let apktool_out = options.output_dir.join(format!("{}-apktool", apk_stem));
            let mut args = vec!["d", "-f", "-o", apktool_out.to_str().unwrap()];
            if options.no_sources {
                args.push("-r");
            }
            let apk = apk_path.to_string_lossy().to_string();
            let _ = Command::new("apktool")
                .args(&args)
                .arg(&apk)
                .output()
                .map_err(|e| format!("apktool failed: {}", e))?;
        }
        DecompileEngine::Both => {
            if is_tool_available("jadx") {
                let mut args = vec!["-d", output_dir.to_str().unwrap()];
                if options.resources_only {
                    args.push("--no-src");
                }
                if options.no_sources {
                    args.push("--no-res");
                }
                let thread_str = options.threads.to_string();
                args.push("-j");
                args.push(&thread_str);
                let apk = apk_path.to_string_lossy().to_string();
                let _ = Command::new("jadx")
                    .args(&args)
                    .arg(&apk)
                    .output()
                    .map_err(|e| format!("jadx failed: {}", e))?;
            }
            if is_tool_available("apktool") {
                let apktool_out = options.output_dir.join(format!("{}-apktool", apk_stem));
                let mut args = vec!["d", "-f", "-o", apktool_out.to_str().unwrap()];
                if options.no_sources {
                    args.push("-r");
                }
                let apk = apk_path.to_string_lossy().to_string();
                let _ = Command::new("apktool")
                    .args(&args)
                    .arg(&apk)
                    .output()
                    .map_err(|e| format!("apktool failed: {}", e))?;
            }
            if !is_tool_available("jadx") && !is_tool_available("apktool") {
                return Err(
                    "Both engine requested but neither jadx nor apktool installed in PATH"
                        .to_string(),
                );
            }
        }
    }
    Ok(output_dir)
}

pub fn grep_payment_keywords<P: AsRef<Path>>(decompiled_dir: P) -> Vec<(String, PathBuf)> {
    let keywords = [
        "stripe",
        "paypal",
        "binance",
        "sendwave",
        "wave",
        "mpesa",
        "m-pesa",
        "skrill",
        "payment",
        "pay",
        "checkout",
        "purchase",
        "escrow",
        "deposit",
        "withdraw",
        "wallet",
        "transfer",
        "credit_card",
        "debit_card",
        "card_token",
        "cvv",
        "ach",
        "wire",
        "swift",
        "iban",
        "account_number",
        "routing_number",
        "access_token",
        "api_key",
        "client_id",
        "client_secret",
        "refresh_token",
        "webhook",
        "callback",
        "redirect_uri",
        "oauth",
        "auth",
        "bearer",
        "api/v1",
        "api/v2",
        "https://",
        "http://",
    ];
    let mut out: Vec<(String, PathBuf)> = Vec::new();
    let dir = decompiled_dir.as_ref();
    let Ok(entries) = walkdir_simple(dir) else {
        return out;
    };
    for entry in entries {
        if !entry.is_file() {
            continue;
        }
        let ext = entry.extension().and_then(|e| e.to_str()).unwrap_or("");
        if !["java", "kt", "smali", "xml", "json", "txt", "gradle", "pro"].contains(&ext) {
            continue;
        }
        if let Ok(content) = std::fs::read_to_string(&entry) {
            let lower = content.to_lowercase();
            for kw in &keywords {
                if lower.contains(kw) {
                    out.push((kw.to_string(), entry.clone()));
                    break;
                }
            }
        }
    }
    out
}

fn walkdir_simple(dir: &Path) -> Result<Vec<PathBuf>, String> {
    let mut results = Vec::new();
    fn recurse(d: &Path, results: &mut Vec<PathBuf>) -> Result<(), String> {
        let rd = std::fs::read_dir(d).map_err(|e| e.to_string())?;
        for entry in rd.flatten() {
            let p = entry.path();
            if p.is_dir() {
                recurse(&p, results)?;
            } else {
                results.push(p);
            }
        }
        Ok(())
    }
    recurse(dir, &mut results)?;
    Ok(results)
}

pub fn parse_manifest_permissions<P: AsRef<Path>>(
    decompiled_dir: P,
) -> std::collections::HashMap<String, Vec<String>> {
    let mut map: std::collections::HashMap<String, Vec<String>> = std::collections::HashMap::new();
    let manifest = decompiled_dir.as_ref().join("AndroidManifest.xml");
    if !manifest.exists() {
        let alt = decompiled_dir
            .as_ref()
            .join("apktool")
            .join("AndroidManifest.xml");
        if alt.exists() {
            return parse_manifest_permissions(alt.parent().unwrap());
        }
        return map;
    }
    if let Ok(content) = std::fs::read_to_string(&manifest) {
        for line in content.lines() {
            let lower = line.to_lowercase();
            if let Some(start) = lower.find("android.permission.") {
                let rest = &lower[start..];
                let end = rest
                    .find(|c: char| !c.is_alphanumeric() && c != '.')
                    .unwrap_or(rest.len());
                let perm = rest[..end].to_string();
                let cat = categorize_permission(&perm);
                map.entry(cat).or_default().push(perm);
            }
        }
    }
    map
}

fn categorize_permission(perm: &str) -> String {
    if perm.contains("INTERNET") || perm.contains("NETWORK") {
        "networking".to_string()
    } else if perm.contains("READ_SMS") || perm.contains("RECEIVE_SMS") || perm.contains("SEND_SMS")
    {
        "sms_payment".to_string()
    } else if perm.contains("READ_CONTACTS") || perm.contains("WRITE_CONTACTS") {
        "contacts".to_string()
    } else if perm.contains("READ_PHONE") || perm.contains("CALL_PHONE") {
        "telephony".to_string()
    } else if perm.contains("CAMERA") {
        "camera".to_string()
    } else if perm.contains("LOCATION") {
        "location".to_string()
    } else if perm.contains("STORAGE")
        || perm.contains("WRITE_EXTERNAL")
        || perm.contains("READ_EXTERNAL")
    {
        "storage".to_string()
    } else if perm.contains("BILLING") || perm.contains("PAY") {
        "billing".to_string()
    } else {
        "other".to_string()
    }
}

pub fn scaffold_payment_flow_analysis(
    package_name: &str,
    endpoints: Vec<(&str, &str, &str)>,
    sdks: Vec<(&str, &str, Vec<&str>)>,
) -> PaymentFlowAnalysis {
    let mut analysis = PaymentFlowAnalysis {
        apk: ApkInfo {
            path: PathBuf::from(format!("./{}.apk", package_name)),
            package_name: Some(package_name.to_string()),
            app_label: Some(package_name.to_string()),
            version_name: None,
            version_code: None,
            min_sdk: None,
            target_sdk: None,
            decompiled_path: None,
            extracted_size_bytes: None,
        },
        endpoints: Vec::new(),
        sdks: Vec::new(),
        permission_categories: std::collections::HashMap::new(),
        interesting_strings: Vec::new(),
        analysis_notes: Vec::new(),
    };
    for (name, url, method) in endpoints {
        analysis.endpoints.push(PaymentFlowEndpoint {
            name: name.to_string(),
            url: if url.is_empty() {
                None
            } else {
                Some(url.to_string())
            },
            method: if method.is_empty() {
                None
            } else {
                Some(method.to_string())
            },
            source_file: PathBuf::from("scaffolded"),
            line_start: 0,
            line_end: 0,
            auth_scheme: None,
            content_type: None,
            summary: format!("Scaffolded endpoint {} for comparative analysis", name),
        });
    }
    for (name, maven, perms) in sdks {
        analysis.sdks.push(PaymentSdkRef {
            sdk_name: name.to_string(),
            maven_coord: if maven.is_empty() {
                None
            } else {
                Some(maven.to_string())
            },
            permissions: perms.iter().map(|s| s.to_string()).collect(),
            services: Vec::new(),
            receivers: Vec::new(),
            activities: Vec::new(),
            providers: Vec::new(),
        });
    }
    analysis.analysis_notes.push(
        "This is a scaffold analysis for legal comparative workflow design. Replace endpoints/SDKs with findings from legally-owned APK decompilation once tools are installed.".to_string(),
    );
    analysis
}
