//! Read-only Codex host observations. File installation, user trust and actual
//! callback receipt remain separate outcomes. No model or configuration RPC is
//! available through this finite client, and no executable comes from storage.
use super::*;
use crate::agent::{adapter, planner::PlannerSession, runner};
use std::io::Write;

const HOST_TIME: Duration = Duration::from_secs(10);
const HOST_BYTES: usize = 4 * 1_048_576;

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HostHook {
    pub source_path: PathBuf,
    pub current_hash: String,
    pub enabled: bool,
    pub trust_status: String,
    pub event_name: String,
    pub source: String,
    pub is_managed: bool,
    pub key: String,
}
#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
pub(crate) struct HostSkill {
    pub name: String,
    pub path: PathBuf,
    pub enabled: bool,
    pub scope: String,
}
/// Backend-only metadata: it never constitutes installation/trust/permission,
/// and these paths are not offered as webview routing authority.
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct CodexHostObservation {
    pub cwd: PathBuf,
    pub hooks: Vec<HostHook>,
    pub skills: Vec<HostSkill>,
    pub warnings: Vec<String>,
}

pub(crate) fn observe_codex_host(
    state: &RecordEditorState,
    product: &SelectedInitializationDirectory,
    planner: &PlannerSession,
    validate_native_selection: &dyn Fn() -> std::result::Result<(), String>,
) -> std::result::Result<CodexHostObservation, String> {
    observe_with_config(
        state,
        product,
        planner,
        validate_native_selection,
        &runner::RunnerConfig::default(),
        HOST_TIME,
    )
}

fn observe_with_config(
    state: &RecordEditorState,
    product: &SelectedInitializationDirectory,
    planner: &PlannerSession,
    validate: &dyn Fn() -> std::result::Result<(), String>,
    config: &runner::RunnerConfig,
    timeout: Duration,
) -> std::result::Result<CodexHostObservation, String> {
    if planner.selection.harness != "codex" {
        return Err("codex-host-provider-unavailable".into());
    }
    let verify = || {
        product.verify()?;
        validate()
    };
    verify()?;
    let attempt = state.next();
    let lease = state
        .begin("codex-host-observation", attempt)
        .map_err(|error| error.code)?;
    // Resolution selects only the fixed Codex adapter. Persisted executable
    // facts compare the result; they never become Command::new authority.
    let cli = runner::resolve_cli(config, &adapter::CODEX_SEPARATED_PLANNER_V1)
        .map_err(|_| "codex-host-executable-unavailable")?;
    planner.verify_executable(&cli)?;
    verify()?;
    let mut command = Command::new(&cli.path);
    command
        .args(["--no-daemon", "app-server", "--stdio"])
        .current_dir(product.path());
    let child_path = cli.login_path.as_deref().map(std::ffi::OsStr::new);
    child_environment(&mut command, child_path);
    let result = query(
        command,
        product.path(),
        Instant::now() + timeout,
        &lease.cancel,
    )?;
    // query owns cessation before these checks and before lease release.
    planner.verify_executable(&cli)?;
    verify()?;
    Ok(result)
}

fn frame(value: Value) -> Vec<u8> {
    let mut bytes = serde_json::to_vec(&value).expect("fixed host request");
    bytes.push(b'\n');
    bytes
}
fn initialize() -> Vec<u8> {
    frame(
        json!({"id":1,"method":"initialize","params":{"clientInfo":{"name":"supertaskr","version":env!("CARGO_PKG_VERSION")},"capabilities":{"experimentalApi":false}}}),
    )
}
fn safe(value: &str, maximum: usize) -> bool {
    !value.is_empty() && value.len() <= maximum && !value.chars().any(char::is_control)
}
fn absolute(value: &Path) -> bool {
    value.is_absolute() && value.to_str().is_some_and(|s| safe(s, 16_384))
}
fn entry<'a>(value: &'a Value, cwd: &Path) -> std::result::Result<&'a Value, String> {
    let data = value["data"]
        .as_array()
        .filter(|rows| rows.len() == 1)
        .ok_or("codex-host-response-context")?;
    if data[0]["cwd"].as_str() != cwd.to_str()
        || !data[0]["errors"].as_array().is_some_and(Vec::is_empty)
    {
        return Err("codex-host-response-context".into());
    }
    Ok(&data[0])
}
fn skills(value: &Value, cwd: &Path) -> std::result::Result<Vec<HostSkill>, String> {
    let rows: Vec<HostSkill> = serde_json::from_value(entry(value, cwd)?["skills"].clone())
        .map_err(|_| "codex-host-skills-unavailable")?;
    if rows.len() > 512
        || rows.iter().any(|s| {
            !safe(&s.name, 256)
                || !absolute(&s.path)
                || !matches!(s.scope.as_str(), "repo" | "user" | "system" | "admin")
        })
    {
        return Err("codex-host-skills-unavailable".into());
    }
    Ok(rows)
}
fn hooks(value: &Value, cwd: &Path) -> std::result::Result<(Vec<HostHook>, Vec<String>), String> {
    let selected = entry(value, cwd)?;
    let rows: Vec<HostHook> = serde_json::from_value(selected["hooks"].clone())
        .map_err(|_| "codex-host-hooks-unavailable")?;
    let warnings: Vec<String> = serde_json::from_value(selected["warnings"].clone())
        .map_err(|_| "codex-host-hooks-unavailable")?;
    if rows.len() > 512
        || rows.iter().any(|h| {
            !absolute(&h.source_path)
                || !safe(&h.current_hash, 512)
                || !safe(&h.event_name, 128)
                || !safe(&h.source, 128)
                || !safe(&h.key, 1024)
                || !matches!(
                    h.trust_status.as_str(),
                    "managed" | "trusted" | "untrusted" | "modified"
                )
        })
        || warnings.len() > 64
        || warnings.iter().any(|s| s.len() > 4096)
    {
        return Err("codex-host-hooks-unavailable".into());
    }
    Ok((rows, warnings))
}

#[cfg(unix)]
fn nonblocking(pipe: &impl std::os::fd::AsRawFd) -> std::result::Result<(), String> {
    let fd = pipe.as_raw_fd();
    let flags = unsafe { libc::fcntl(fd, libc::F_GETFL) };
    if flags < 0 || unsafe { libc::fcntl(fd, libc::F_SETFL, flags | libc::O_NONBLOCK) } < 0 {
        return Err("codex-host-pipe-unavailable".into());
    }
    Ok(())
}

fn query(
    mut command: Command,
    cwd: &Path,
    deadline: Instant,
    cancel: &AtomicBool,
) -> std::result::Result<CodexHostObservation, String> {
    #[cfg(not(unix))]
    {
        let _ = (command, cwd, deadline, cancel);
        return Err("codex-host-platform-unavailable".into());
    }
    #[cfg(unix)]
    {
        use std::os::{fd::AsRawFd, unix::process::CommandExt};
        if cancel.load(Ordering::SeqCst) {
            return Err("codex-host-cancelled".into());
        }
        command
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .process_group(0);
        let child = command
            .spawn()
            .map_err(|_| "codex-host-start-unavailable")?;
        let handle = ChildHandle::new(child.id() as i32, 0);
        let mut owned = OwnedChild {
            child,
            handle,
            ceased: false,
        };
        let mut input = owned.child.stdin.take().expect("piped host input");
        let mut output = owned.child.stdout.take().expect("piped host output");
        let mut errors = owned.child.stderr.take().expect("piped host errors");
        nonblocking(&input)?;
        nonblocking(&output)?;
        nonblocking(&errors)?;
        let mut pending = initialize();
        let mut written = 0;
        let mut buffer = Vec::new();
        let mut total = 0usize;
        let mut error_bytes = 0usize;
        let mut error_open = true;
        let mut messages = 0usize;
        let mut stage = 1u64;
        let mut observed_skills = None;
        let result = (|| {
            loop {
                if cancel.load(Ordering::SeqCst) {
                    return Err("codex-host-cancelled".into());
                }
                if Instant::now() >= deadline {
                    return Err("codex-host-timeout".into());
                }
                if written < pending.len() {
                    match input.write(&pending[written..]) {
                        Ok(0) => return Err("codex-host-input-unavailable".into()),
                        Ok(n) => written += n,
                        Err(e)
                            if matches!(
                                e.kind(),
                                std::io::ErrorKind::WouldBlock | std::io::ErrorKind::Interrupted
                            ) => {}
                        Err(_) => return Err("codex-host-input-unavailable".into()),
                    }
                }
                let mut block = [0u8; 8192];
                loop {
                    match output.read(&mut block) {
                        Ok(0) => return Err("codex-host-incomplete".into()),
                        Ok(n) => {
                            total = total.saturating_add(n);
                            if total > HOST_BYTES {
                                return Err("codex-host-output-limit".into());
                            }
                            buffer.extend_from_slice(&block[..n]);
                        }
                        Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
                        Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => break,
                        Err(_) => return Err("codex-host-output-unavailable".into()),
                    }
                    // Process each batch before another read. EOF after a full
                    // response must not discard the response already received.
                    while let Some(end) = buffer.iter().position(|byte| *byte == b'\n') {
                        let bytes: Vec<_> = buffer.drain(..=end).collect();
                        messages += 1;
                        if messages > 1024 {
                            return Err("codex-host-output-limit".into());
                        }
                        let value: Value =
                            serde_json::from_slice(&bytes).map_err(|_| "codex-host-protocol")?;
                        if value.get("id").is_none() {
                            if !value["method"].is_string() {
                                return Err("codex-host-protocol".into());
                            }
                            continue; // Bounded host notifications confer no result.
                        }
                        if written != pending.len()
                            || value["id"].as_u64() != Some(stage)
                            || value.get("method").is_some()
                            || value.get("error").is_some()
                            || !value["result"].is_object()
                        {
                            return Err("codex-host-protocol".into());
                        }
                        match stage {
                            1 => {
                                if !value["result"]["userAgent"]
                                    .as_str()
                                    .is_some_and(|s| safe(s, 2048))
                                {
                                    return Err("codex-host-protocol".into());
                                }
                                pending = frame(json!({"method":"initialized"}));
                                pending.extend(frame(json!({"id":2,"method":"skills/list","params":{"cwds":[cwd],"forceReload":true}})));
                                written = 0;
                                stage = 2;
                            }
                            2 => {
                                observed_skills = Some(skills(&value["result"], cwd)?);
                                pending = frame(
                                    json!({"id":3,"method":"hooks/list","params":{"cwds":[cwd]}}),
                                );
                                written = 0;
                                stage = 3;
                            }
                            3 => {
                                let (hooks, warnings) = hooks(&value["result"], cwd)?;
                                return Ok(CodexHostObservation {
                                    cwd: cwd.into(),
                                    hooks,
                                    skills: observed_skills.take().expect("ordered skills result"),
                                    warnings,
                                });
                            }
                            _ => unreachable!(),
                        }
                    }
                }
                loop {
                    match errors.read(&mut block) {
                        Ok(0) => {
                            error_open = false;
                            break;
                        }
                        Ok(n) => {
                            error_bytes = error_bytes.saturating_add(n);
                            if error_bytes > MAX_STDERR {
                                return Err("codex-host-output-limit".into());
                            }
                        }
                        Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
                        Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => break,
                        Err(_) => return Err("codex-host-output-unavailable".into()),
                    }
                }
                if owned
                    .child
                    .try_wait()
                    .map_err(|_| "codex-host-process-unavailable")?
                    .is_some()
                {
                    owned.handle.mark_reaped();
                    return Err("codex-host-incomplete".into());
                }
                let mut fds = [
                    libc::pollfd {
                        fd: output.as_raw_fd(),
                        events: libc::POLLIN,
                        revents: 0,
                    },
                    libc::pollfd {
                        fd: if error_open { errors.as_raw_fd() } else { -1 },
                        events: libc::POLLIN,
                        revents: 0,
                    },
                    libc::pollfd {
                        fd: input.as_raw_fd(),
                        events: if written < pending.len() {
                            libc::POLLOUT
                        } else {
                            0
                        },
                        revents: 0,
                    },
                ];
                if unsafe { libc::poll(fds.as_mut_ptr(), fds.len() as _, 20) } < 0
                    && std::io::Error::last_os_error().kind() != std::io::ErrorKind::Interrupted
                {
                    return Err("codex-host-pipe-unavailable".into());
                }
            }
        })();
        // Stop the fixed read-only app server after its last response, too.
        // No pipe joins can wait on an unread/unclosed inherited descriptor.
        drop(input);
        owned.stop();
        result
    }
}

#[cfg(all(test, unix))]
mod tests;
