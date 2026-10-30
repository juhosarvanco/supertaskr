//! Canonical configured planner data and original executable observations.
//! Settings are normalized by the installed Node owner, never reparsed here.
//! Persisted paths detect mismatch; the fixed CLI resolver alone chooses argv0.
use super::runner::ResolvedCli;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::io::Read;
use std::path::PathBuf;
use std::time::{Duration, Instant};

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SessionPolicy {
    pub default: String,
    pub warn_after_turns: u64,
}
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Selection {
    pub role: String,
    pub requested: String,
    pub harness: String,
    pub model: String,
    pub vehicle: Option<String>,
    pub session_policy: SessionPolicy,
}
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Provenance {
    pub configuration_digest: String,
    pub product_revision: String,
    pub tool_manifest_digest: String,
}
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(tag = "status", rename_all = "kebab-case", deny_unknown_fields)]
pub enum Decision {
    Ready {
        selection: Selection,
        provenance: Provenance,
    },
    CannotRun {
        code: u8,
        reason: String,
        diagnostics: Vec<String>,
    },
}
impl Decision {
    pub fn from_observation(value: &serde_json::Value) -> Result<Self, String> {
        let answer: Self = serde_json::from_value(value["planner"].clone())
            .map_err(|_| "genesis-planner-response-unavailable")?;
        match &answer {
            Self::Ready {
                selection,
                provenance,
            } => {
                selection.validate()?;
                let settings = &value["settingsProvenance"];
                if settings["configDigest"].as_str()
                    != Some(provenance.configuration_digest.as_str())
                    || settings["productRevision"].as_str()
                        != Some(provenance.product_revision.as_str())
                    || settings["tool"]["manifestDigest"].as_str()
                        != Some(provenance.tool_manifest_digest.as_str())
                    || !digest(&provenance.configuration_digest)
                    || provenance.tool_manifest_digest.len() != 64
                    || !provenance
                        .tool_manifest_digest
                        .bytes()
                        .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
                {
                    return Err("genesis-planner-provenance-unavailable".into());
                }
            }
            Self::CannotRun {
                code,
                reason,
                diagnostics,
            } => {
                if *code != 3
                    || reason.is_empty()
                    || reason.len() > 128
                    || !reason
                        .bytes()
                        .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
                    || diagnostics.len() > 32
                    || diagnostics.iter().any(|s| s.len() > 4096)
                {
                    return Err("genesis-planner-response-unavailable".into());
                }
            }
        }
        Ok(answer)
    }
    pub fn ready(&self) -> Result<(&Selection, &Provenance), String> {
        match self {
            Self::Ready {
                selection,
                provenance,
            } => Ok((selection, provenance)),
            Self::CannotRun { reason, .. } => Err(format!("genesis-planner-unavailable:{reason}")),
        }
    }
}
fn digest(value: &str) -> bool {
    value.strip_prefix("sha256:").is_some_and(|h| {
        h.len() == 64
            && h.bytes()
                .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
    })
}
impl Selection {
    pub fn validate(&self) -> Result<(), String> {
        // This is a bounded wire/argv datum check, not another roles parser.
        if self.role != "planner"
            || !matches!(self.harness.as_str(), "claude" | "codex")
            || self.requested.is_empty()
            || self.requested.len() > 1024
            || self.model.len() > 256
            || self
                .vehicle
                .as_ref()
                .is_some_and(|v| v.is_empty() || v.len() > 128 || v.chars().any(char::is_control))
            || !matches!(self.session_policy.default.as_str(), "fresh" | "resume")
            || self.session_policy.warn_after_turns == 0
        {
            return Err("genesis-planner-selection-unavailable".into());
        }
        super::adapter::validate_configured_model(&self.model)
            .map_err(|_| "genesis-planner-selection-unavailable".to_string())?;
        if self.harness == "codex" && !self.model.strip_prefix("gpt-").is_some_and(|rest| rest.as_bytes().first().is_some_and(u8::is_ascii_alphanumeric)) {
            return Err("genesis-planner-selection-unavailable".into());
        }
        Ok(())
    }
    pub fn adapter(&self) -> Result<&'static super::adapter::AgentAdapter, String> {
        self.validate()?;
        super::adapter::configured_planner_adapter(&self.harness).ok_or_else(|| "genesis-planner-provider-unavailable".into())
    }
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Executable {
    path: PathBuf,
    target: PathBuf,
    device: String,
    inode: String,
    mode: u32,
    bytes: u64,
    sha256: String,
    version: String,
    login_path_digest: Option<String>,
}
impl Executable {
    /// Hash one bounded original entry, including its symlink target. This
    /// neither authenticates a vendor nor measures the entry's dependencies.
    pub fn capture(cli: &ResolvedCli) -> Result<Self, String> {
        Self::capture_for(cli, super::adapter::planner_adapter())
    }
    fn capture_for(cli: &ResolvedCli, adapter: &super::adapter::AgentAdapter) -> Result<Self, String> {
        #[cfg(not(unix))]
        {
            let _ = cli;
            return Err("genesis-planner-platform-unsupported".into());
        }
        #[cfg(unix)]
        {
            use std::os::unix::fs::{MetadataExt, OpenOptionsExt};
            let fail = |stage: &str| format!("genesis-planner-executable-{stage}");
            let version = cli
                .version
                .clone()
                .filter(|v| adapter.version_supported(v) == Some(true))
                .ok_or_else(|| fail("version-unavailable"))?;
            let target = cli.path.canonicalize().map_err(|_| fail("path-unavailable"))?;
            let before = std::fs::metadata(&target).map_err(|_| fail("metadata-unavailable"))?;
            if !before.is_file() || before.mode() & 0o111 == 0 || before.len() > 1_073_741_824 {
                return Err(fail("kind-or-size"));
            }
            let mut file = std::fs::OpenOptions::new()
                .read(true)
                .custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK)
                .open(&target)
                .map_err(|_| fail("open-unavailable"))?;
            if !file.metadata().map_err(|_| fail("metadata-unavailable"))?.is_file() {
                return Err(fail("file-kind"));
            }
            let mut hash = Sha256::new();
            let mut buffer = [0u8; 65_536];
            let mut bytes = 0u64;
            let deadline = Instant::now() + Duration::from_secs(10);
            loop {
                if Instant::now() >= deadline {
                    return Err(fail("read-deadline"));
                }
                let count = file.read(&mut buffer).map_err(|_| fail("read-unavailable"))?;
                if count == 0 {
                    break;
                }
                bytes += count as u64;
                if bytes > 1_073_741_824 {
                    return Err(fail("size-limit"));
                }
                hash.update(&buffer[..count]);
            }
            let after = file.metadata().map_err(|_| fail("metadata-unavailable"))?;
            let facts = |s: &std::fs::Metadata| {
                (
                    s.dev(),
                    s.ino(),
                    s.mode(),
                    s.len(),
                    s.mtime(),
                    s.mtime_nsec(),
                    s.ctime(),
                    s.ctime_nsec(),
                )
            };
            if facts(&before) != facts(&after)
                || bytes != after.len()
                || cli.path.canonicalize().map_err(|_| fail("path-unavailable"))? != target
                || facts(&std::fs::metadata(&target).map_err(|_| fail("metadata-unavailable"))?) != facts(&after)
            {
                return Err(fail("changed"));
            }
            Ok(Self {
                path: cli.path.clone(),
                target,
                device: after.dev().to_string(),
                inode: after.ino().to_string(),
                mode: after.mode(),
                bytes,
                sha256: format!("sha256:{:x}", hash.finalize()),
                version,
                login_path_digest: cli
                    .login_path
                    .as_ref()
                    .map(|p| format!("sha256:{:x}", Sha256::digest(p.as_bytes()))),
            })
        }
    }
}
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PlannerSession {
    pub selection: Selection,
    pub provenance: Provenance,
    pub executable: Executable,
}
impl PlannerSession {
    pub fn capture(decision: &Decision, cli: &ResolvedCli) -> Result<Self, String> {
        let (selection, provenance) = decision.ready()?;
        selection.validate()?;
        Ok(Self {
            selection: selection.clone(),
            provenance: provenance.clone(),
            executable: Executable::capture_for(cli, selection.adapter()?)?,
        })
    }
    pub fn verify(&self, current: &Decision, cli: &ResolvedCli) -> Result<(), String> {
        let (selection, provenance) = current.ready()?;
        if selection != &self.selection || provenance != &self.provenance || Executable::capture_for(cli, self.selection.adapter()?)? != self.executable {
            return Err("genesis-original-planner-changed".into());
        }
        Ok(())
    }
    pub fn verify_executable(&self, cli: &ResolvedCli) -> Result<(), String> {
        if Executable::capture_for(cli, self.selection.adapter()?)? != self.executable {
            return Err("genesis-original-planner-changed".into());
        }
        Ok(())
    }
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use crate::agent::{adapter, runner};
    use std::{
        fs,
        os::unix::fs::PermissionsExt,
        sync::{
            atomic::{AtomicBool, AtomicU64, Ordering},
            Arc, Mutex,
        },
    };
    static NEXT: AtomicU64 = AtomicU64::new(0);
    fn decision() -> Decision {
        Decision::Ready {
            selection: Selection {
                role: "planner".into(),
                requested: "claude-opus-5@subagent".into(),
                harness: "claude".into(),
                model: "claude-opus-5".into(),
                vehicle: Some("subagent".into()),
                session_policy: SessionPolicy {
                    default: "fresh".into(),
                    warn_after_turns: 30,
                },
            },
            provenance: Provenance {
                configuration_digest: format!("sha256:{}", "a".repeat(64)),
                product_revision: "b".repeat(40),
                tool_manifest_digest: "c".repeat(64),
            },
        }
    }
    struct Fixture {
        root: PathBuf,
        cli: ResolvedCli,
    }
    impl Fixture {
        fn new() -> Self {
            let root = std::env::temp_dir().join(format!(
                "supertaskr-configured-planner-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::SeqCst)
            ));
            fs::create_dir(&root).unwrap();
            let root = root.canonicalize().unwrap();
            let program = root.join("claude");
            fs::write(&program, r#"#!/bin/sh
if [ "$1" = '--version' ]; then echo '2.1.226 (Claude Code)'; exit 0; fi
printf '%s\n' "$@" > "$SUPERTASKR_MODEL_ARGS"
/bin/cat > /dev/null
echo '{"type":"system","subtype":"init","session_id":"configured-native","model":"observed-provider-model"}'
echo '{"type":"result","subtype":"success","is_error":false,"num_turns":1,"result":"Configured ordinary child completed."}'
"#).unwrap();
            fs::set_permissions(&program, fs::Permissions::from_mode(0o700)).unwrap();
            Self {
                cli: ResolvedCli {
                    path: program,
                    version: Some("2.1.226 (Claude Code)".into()),
                    login_path: None,
                },
                root,
            }
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            fs::remove_dir_all(&self.root).unwrap();
        }
    }
    #[test]
    fn large_plain_executable_is_fully_hashed_and_a_same_size_edit_refuses_original_resume() {
        use std::io::{Seek,SeekFrom,Write};
        let f=Fixture::new();
        let mut file=fs::OpenOptions::new().write(true).truncate(true).open(&f.cli.path).unwrap();
        let block:Vec<u8>=(0..65_536).map(|n|(n%251) as u8).collect();
        for _ in 0..4096 {file.write_all(&block).unwrap();}
        file.sync_all().unwrap();drop(file);
        let expected=std::process::Command::new("node").args(["--input-type=module","-e",
            "import{createHash}from'node:crypto';import{createReadStream}from'node:fs';const hash=createHash('sha256');for await(const part of createReadStream(process.argv[1]))hash.update(part);process.stdout.write('sha256:'+hash.digest('hex'));"
        ]).arg(&f.cli.path).output().unwrap();
        assert!(expected.status.success(),"{}",String::from_utf8_lossy(&expected.stderr));
        let started=Instant::now();
        let session=PlannerSession::capture(&decision(),&f.cli).expect("full 256MiB executable capture within the unchanged ten-second bound");
        eprintln!("large original executable: bytes={} captured_ms={}",session.executable.bytes,started.elapsed().as_millis());
        assert_eq!(session.executable.bytes,268_435_456);
        assert_eq!(session.executable.sha256,String::from_utf8(expected.stdout).unwrap());
        let mut file=fs::OpenOptions::new().write(true).open(&f.cli.path).unwrap();
        file.seek(SeekFrom::End(-1)).unwrap();file.write_all(&[255]).unwrap();file.sync_all().unwrap();drop(file);
        let started=Instant::now();
        assert_eq!(session.verify_executable(&f.cli).unwrap_err(),"genesis-original-planner-changed");
        eprintln!("large same-size changed executable: refused_ms={}",started.elapsed().as_millis());
    }
    #[test]
    fn original_executable_model_and_source_remain_frozen_across_cold_session_data(
    ) {
        let f = Fixture::new();
        let original = decision();
        let session = PlannerSession::capture(&original, &f.cli).unwrap();
        let cold: PlannerSession =
            serde_json::from_slice(&serde_json::to_vec(&session).unwrap()).unwrap();
        let mut newer = original.clone();
        if let Decision::Ready { provenance, .. } = &mut newer {
            provenance.configuration_digest = format!("sha256:{}", "d".repeat(64));
            provenance.product_revision = "e".repeat(40);
        }
        assert_eq!(cold.verify(&newer, &f.cli).unwrap_err(), "genesis-original-planner-changed",
            "a later current configuration cannot be substituted for the original source requalification");
        cold.verify(&original, &f.cli).unwrap();
        let mut changed = newer.clone();
        if let Decision::Ready { selection, .. } = &mut changed {
            selection.model = "claude-sonnet-5".into();
        }
        assert_eq!(
            cold.verify(&changed, &f.cli).unwrap_err(),
            "genesis-original-planner-changed"
        );
        let held = f.root.join("original");
        fs::rename(&f.cli.path, &held).unwrap();
        fs::copy(&held, &f.cli.path).unwrap();
        assert_eq!(
            cold.verify(&original, &f.cli).unwrap_err(),
            "genesis-original-planner-changed",
            "identical bytes at another inode cannot silently replace the original executable"
        );
        fs::remove_file(&f.cli.path).unwrap();
        fs::rename(&held, &f.cli.path).unwrap();
        cold.verify(&original, &f.cli).unwrap();
        assert!(PlannerSession::capture(
            &Decision::CannotRun {
                code: 3,
                reason: "project-role-harness-unsupported".into(),
                diagnostics: vec![]
            },
            &f.cli
        )
        .is_err());
        assert_eq!(cold.selection.requested, "claude-opus-5@subagent");
    }
    #[test]
    fn actual_configured_child_receives_exact_model_for_start_and_resume_beside_distinct_observed_model(
    ) {
        let f = Fixture::new();
        let choice = decision();
        let session = PlannerSession::capture(&choice, &f.cli).unwrap();
        let mut cfg = runner::RunnerConfig {
            probe_login_shell: false,
            start_timeout: Duration::from_secs(2),
            stall_timeout: Duration::from_secs(2),
            kill_grace: Duration::from_millis(100),
            ..Default::default()
        };
        cfg.extra_env = vec![(
            "SUPERTASKR_MODEL_ARGS".into(),
            f.root.join("args").display().to_string(),
        )];
        for resume in [None, Some("configured-native")] {
            let request = runner::TurnRequest {
                project_dir: f.root.clone(),
                prompt: "Actual bounded configured input".into(),
                resume: resume.map(str::to_owned),
                turn: 1,
            };
            let emitter = runner::Emitter::new(Arc::new(|_| {}), Arc::new(AtomicU64::new(0)));
            let result = runner::run_configured_turn(
                &cfg,
                adapter::separated_planner_adapter(),
                &f.cli,
                &request,
                &emitter,
                &Mutex::new(None),
                &AtomicBool::new(false),
                &session.selection.model,
            );
            assert!(result.error.is_none(), "{:?}", result.error);
            assert_eq!(result.model.as_deref(), Some("observed-provider-model"));
            let args: Vec<_> = fs::read_to_string(f.root.join("args"))
                .unwrap()
                .lines()
                .map(str::to_owned)
                .collect();
            assert_eq!(args.iter().filter(|s| s.as_str() == "--model").count(), 1);
            assert_eq!(
                args.windows(2).find(|w| w[0] == "--model").unwrap()[1],
                "claude-opus-5"
            );
            assert!(!args
                .iter()
                .any(|s| s == "subagent" || s == "--add-dir" || s == "--allowedTools"));
            assert_eq!(
                args.windows(2)
                    .find(|w| w[0] == "--resume")
                    .map(|w| w[1].as_str()),
                resume
            );
        }
        let args_before = fs::read(f.root.join("args")).unwrap();
        let request = runner::TurnRequest {
            project_dir: f.root.clone(),
            prompt: "Must not spawn".into(),
            resume: None,
            turn: 2,
        };
        let emitter = runner::Emitter::new(Arc::new(|_| {}), Arc::new(AtomicU64::new(0)));
        let refused = runner::run_configured_turn(
            &cfg,
            adapter::separated_planner_adapter(),
            &f.cli,
            &request,
            &emitter,
            &Mutex::new(None),
            &AtomicBool::new(false),
            "--settings",
        );
        assert!(matches!(
            refused.error,
            Some(runner::TurnError::SpawnFailed { .. })
        ));
        assert!(adapter::separated_planner_adapter()
            .argv_for_model(None, "--settings")
            .is_err());
        assert!(adapter::separated_planner_adapter()
            .argv_for_model(None, "doctor")
            .is_err());
        assert!(adapter::separated_planner_adapter()
            .argv_for_model(None, &"m".repeat(256))
            .is_ok());
        assert!(adapter::separated_planner_adapter()
            .argv_for_model(None, &"m".repeat(257))
            .is_err());
        assert!(adapter::separated_planner_adapter()
            .argv_for_model(Some("--resume"), "claude-opus-5")
            .is_err());
        assert_eq!(fs::read(f.root.join("args")).unwrap(), args_before);
        assert!(
            !adapter::planner_adapter()
                .argv(None)
                .unwrap()
                .iter()
                .any(|s| s == "--model"),
            "legacy embedding retains its original default-model seam"
        );
    }
}
