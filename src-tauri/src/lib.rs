use std::net::{SocketAddr, TcpStream, ToSocketAddrs};
use std::path::PathBuf;
use std::time::Duration;

/// Kao gateway (JSON-RPC over POST /rpc). The page never chooses the URL or
/// sees the token: both are resolved here, so a compromised page cannot send
/// the gateway token anywhere else.
const DEFAULT_KAO_URL: &str = "http://10.66.2.2:19001";
const MAX_RPC_BODY: usize = 2 * 1024 * 1024;

fn home_dir() -> PathBuf {
    std::env::var_os("USERPROFILE")
        .or_else(|| std::env::var_os("HOME"))
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."))
}

fn kao_url() -> String {
    std::env::var("IMAGORO_MCP_URL")
        .ok()
        .filter(|u| u.starts_with("http://") || u.starts_with("https://"))
        .unwrap_or_else(|| DEFAULT_KAO_URL.to_string())
        .trim_end_matches('/')
        .to_string()
}

fn token_path() -> PathBuf {
    std::env::var_os("KAO_TOKEN_FILE")
        .map(PathBuf::from)
        .unwrap_or_else(|| home_dir().join(".scout-mesh").join("kao-gateway.token"))
}

#[tauri::command]
fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Where the desktop shell sends harness traffic (no secrets).
#[tauri::command]
fn kao_config() -> serde_json::Value {
    let token_file = token_path();
    serde_json::json!({
        "url": kao_url(),
        "token_file": token_file.display().to_string(),
        "token_present": token_file.is_file(),
    })
}

/// One JSON-RPC request to the Kao gateway, Bearer token attached here.
#[tauri::command]
async fn kao_rpc(body: String) -> Result<String, String> {
    if body.len() > MAX_RPC_BODY {
        return Err("rpc body too large".into());
    }
    serde_json::from_str::<serde_json::Value>(&body).map_err(|_| "rpc body is not JSON".to_string())?;
    tauri::async_runtime::spawn_blocking(move || {
        let token = std::fs::read_to_string(token_path())
            .map_err(|e| format!("gateway token not readable ({}): {e}", token_path().display()))?;
        let resp = ureq::post(&format!("{}/rpc", kao_url()))
            .timeout(Duration::from_secs(600))
            .set("Content-Type", "application/json")
            .set("Authorization", &format!("Bearer {}", token.trim()))
            .send_string(&body);
        match resp {
            Ok(r) => r.into_string().map_err(|e| format!("gateway read failed: {e}")),
            // 4xx/5xx still carry a JSON-RPC error body the console can show
            Err(ureq::Error::Status(code, r)) => {
                let text = r.into_string().unwrap_or_default();
                if code == 401 {
                    Err("gateway rejected the token (401)".into())
                } else if text.trim_start().starts_with('{') {
                    Ok(text)
                } else {
                    Err(format!("gateway http {code}"))
                }
            }
            Err(e) => Err(format!("gateway unreachable at {}: {e}", kao_url())),
        }
    })
    .await
    .map_err(|e| format!("rpc task failed: {e}"))?
}

fn probe(addr: &str, timeout: Duration) -> bool {
    let addrs: Vec<SocketAddr> = match addr.to_socket_addrs() {
        Ok(a) => a.collect(),
        Err(_) => return false,
    };
    addrs.iter().any(|a| TcpStream::connect_timeout(a, timeout).is_ok())
}

/// Reachability of every piece the local harnesses depend on (TCP connect only).
#[tauri::command]
async fn stack_status() -> serde_json::Value {
    let kao = kao_url();
    let kao_hostport = kao
        .trim_start_matches("http://")
        .trim_start_matches("https://")
        .split('/')
        .next()
        .unwrap_or("")
        .to_string();
    let checks: Vec<(&'static str, String)> = vec![
        ("ollama (PC :11435)", "127.0.0.1:11435".into()),
        ("long proxy :11434", "127.0.0.1:11434".into()),
        ("NUC proxy :11436", "127.0.0.1:11436".into()),
        ("NUC engine", "10.66.2.2:11434".into()),
        ("Kao gateway", kao_hostport),
        ("blackboard (Dell)", "10.66.0.1:8765".into()),
    ];
    let handles: Vec<_> = checks
        .into_iter()
        .map(|(name, addr)| {
            std::thread::spawn(move || {
                let up = probe(&addr, Duration::from_millis(1500));
                serde_json::json!({ "name": name, "addr": addr, "up": up })
            })
        })
        .collect();
    let results: Vec<serde_json::Value> = handles
        .into_iter()
        .map(|h| h.join().unwrap_or(serde_json::json!({ "name": "?", "up": false })))
        .collect();
    serde_json::json!({ "checks": results })
}

/// Start (or restart) the local engine stack: Ollama + both tool-role proxies.
/// Runs the same script the Startup folder uses, so behaviour is identical to login.
#[tauri::command]
fn stack_start() -> Result<String, String> {
    let script = home_dir().join("bin").join("start-ollama-local.cmd");
    if !script.is_file() {
        return Err(format!("{} not found", script.display()));
    }
    let mut cmd = std::process::Command::new("cmd");
    cmd.arg("/C").arg(&script);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd.spawn().map_err(|e| format!("could not start {}: {e}", script.display()))?;
    Ok(format!("started {}", script.display()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            app_version,
            kao_config,
            kao_rpc,
            stack_status,
            stack_start
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
