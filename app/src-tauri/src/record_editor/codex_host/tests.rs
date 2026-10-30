use super::*;
use crate::agent::planner::{Decision, Provenance, Selection, SessionPolicy};
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::sync::atomic::AtomicU64;

static NEXT: AtomicU64 = AtomicU64::new(0);
struct Fixture {
    root: PathBuf,
    product: SelectedInitializationDirectory,
    config: runner::RunnerConfig,
    planner: PlannerSession,
}
impl Fixture {
    fn new(mode: &str) -> Self {
        let root = std::env::temp_dir().join(format!(
            "supertaskr-host-observation-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::SeqCst)
        ));
        fs::create_dir(&root).unwrap();
        let root = root.canonicalize().unwrap();
        let product_path = root.join("original product  ");
        fs::create_dir(&product_path).unwrap();
        let program = root.join("codex");
        let log = root.join("calls.jsonl");
        let pid = root.join("pid");
        let script = format!(
            r##"#!/usr/bin/python3
import sys,json,time,os
if sys.argv[1:]==['--version']:
 print('codex-cli 0.165.0-alpha.1.2');sys.exit(0)
assert sys.argv[1:]==['--no-daemon','app-server','--stdio'],sys.argv
log={log};mode={mode};root={product};pid={pid}
open(pid,'w').write(str(os.getpid()))
def receive():
 line=sys.stdin.readline()
 assert line,'stdin closed before interactive query completed'
 value=json.loads(line)
 with open(log,'a') as f:f.write(json.dumps(value)+'\n')
 return value
def answer(i,result):print(json.dumps({{'id':i,'result':result}}),flush=True)
one=receive();assert one['method']=='initialize' and one['id']==1
assert one['params']['capabilities']=={{'experimentalApi':False}}
if mode=='idle':
 while True:time.sleep(1)
if mode=='overflow':
 sys.stdout.write('x'*(4*1048576+1));sys.stdout.flush()
 while True:time.sleep(1)
if mode=='eof':sys.exit(0)
answer(1,{{'userAgent':'controlled-codex-host'}})
two=receive();assert two=={{'method':'initialized'}}
three=receive();assert three=={{'id':2,'method':'skills/list','params':{{'cwds':[root],'forceReload':True}}}}
answer(2,{{'data':[{{'cwd':root if mode!='foreign' else root+'-other','errors':[],'skills':[{{'name':'supertaskr-seat','path':root+'/.agents/skills/supertaskr-seat/SKILL.md','enabled':True,'scope':'repo'}}]}}]}})
four=receive();assert four=={{'id':3,'method':'hooks/list','params':{{'cwds':[root]}}}}
if mode=='replaced':
 os.rename(root,root+'-retired');os.mkdir(root)
answer(3,{{'data':[{{'cwd':root,'errors':[],'warnings':['Definition requires ordinary user review.'],'hooks':[{{'sourcePath':root+'/.codex/hooks.json','currentHash':'observed-definition-hash','enabled':True,'trustStatus':'untrusted','eventName':'preToolUse','source':'project','isManaged':False,'key':'observed-hook'}}]}}]}})
while True:time.sleep(1)
"##,
            log = serde_json::to_string(log.to_str().unwrap()).unwrap(),
            mode = serde_json::to_string(mode).unwrap(),
            product = serde_json::to_string(product_path.to_str().unwrap()).unwrap(),
            pid = serde_json::to_string(pid.to_str().unwrap()).unwrap()
        );
        fs::write(&program, script).unwrap();
        fs::set_permissions(&program, fs::Permissions::from_mode(0o700)).unwrap();
        let config = runner::RunnerConfig {
            binary_override: Some(program),
            probe_login_shell: false,
            ..Default::default()
        };
        let cli = runner::resolve_cli(&config, &adapter::CODEX_SEPARATED_PLANNER_V1).unwrap();
        let decision = Decision::Ready {
            selection: Selection {
                role: "planner".into(),
                requested: "codex/gpt-6.1-sol@subagent".into(),
                harness: "codex".into(),
                model: "gpt-6.1-sol".into(),
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
        };
        Self {
            root,
            product: SelectedInitializationDirectory::capture(&product_path).unwrap(),
            config,
            planner: PlannerSession::capture(&decision, &cli).unwrap(),
        }
    }
    fn observed(
        &self,
        state: &RecordEditorState,
        timeout: Duration,
    ) -> std::result::Result<CodexHostObservation, String> {
        observe_with_config(
            state,
            &self.product,
            &self.planner,
            &|| Ok(()),
            &self.config,
            timeout,
        )
    }
    fn ceased(&self) {
        let pid: i32 = fs::read_to_string(self.root.join("pid"))
            .unwrap()
            .parse()
            .unwrap();
        assert_eq!(
            unsafe { libc::killpg(pid, 0) },
            -1,
            "owned read-only child group must have ceased"
        );
        assert_eq!(
            std::io::Error::last_os_error().raw_os_error(),
            Some(libc::ESRCH)
        );
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        fs::remove_dir_all(&self.root).unwrap();
    }
}

#[test]
fn interactive_host_queries_keep_stdin_open_and_report_observed_untrusted_metadata_without_changing_it(
) {
    let f = Fixture::new("healthy");
    let state = RecordEditorState::default();
    let answer = f.observed(&state, Duration::from_secs(3)).unwrap();
    assert_eq!(answer.cwd, f.product.path());
    assert_eq!(answer.skills.len(), 1);
    assert!(answer.skills[0].enabled);
    assert_eq!(
        answer.skills[0].path,
        f.product
            .path()
            .join(".agents/skills/supertaskr-seat/SKILL.md")
    );
    assert_eq!(answer.hooks[0].trust_status, "untrusted");
    assert_eq!(answer.hooks[0].current_hash, "observed-definition-hash");
    assert_eq!(
        answer.hooks[0].source_path,
        f.product.path().join(".codex/hooks.json")
    );
    assert_eq!(
        answer.warnings,
        ["Definition requires ordinary user review."]
    );
    let requests: Vec<Value> = fs::read_to_string(f.root.join("calls.jsonl"))
        .unwrap()
        .lines()
        .map(|line| serde_json::from_str(line).unwrap())
        .collect();
    assert_eq!(
        requests
            .iter()
            .map(|v| v["method"].as_str().unwrap())
            .collect::<Vec<_>>(),
        ["initialize", "initialized", "skills/list", "hooks/list"]
    );
    assert_eq!(
        fs::read_dir(f.product.path()).unwrap().count(),
        0,
        "observation installs and trusts nothing"
    );
    assert!(state.active.lock().unwrap().is_none());
    f.ceased();
}

#[test]
fn foreign_cwd_and_incomplete_output_refuse_without_adopting_another_host_context() {
    for (mode, code) in [
        ("foreign", "codex-host-response-context"),
        ("eof", "codex-host-incomplete"),
    ] {
        let f = Fixture::new(mode);
        let state = RecordEditorState::default();
        assert_eq!(
            f.observed(&state, Duration::from_secs(2)).unwrap_err(),
            code
        );
        assert!(state.active.lock().unwrap().is_none());
        f.ceased();
        assert_eq!(fs::read_dir(f.product.path()).unwrap().count(), 0);
    }
}

#[test]
fn unread_host_query_times_out_and_oversized_output_is_collected_before_lease_release() {
    for (mode, code) in [
        ("idle", "codex-host-timeout"),
        ("overflow", "codex-host-output-limit"),
    ] {
        let f = Fixture::new(mode);
        let state = RecordEditorState::default();
        let query_time = Duration::from_millis(200);
        let began = Instant::now();
        assert_eq!(
            f.observed(&state, query_time).unwrap_err(),
            code
        );
        // The complete observation first re-resolves/fingerprints the CLI.
        // Its separately bounded version probe precedes the query clock;
        // allow that stage while retaining the same query and cleanup budget.
        assert!(began.elapsed() < f.config.probe_timeout + query_time + Duration::from_secs(3));
        assert!(state.active.lock().unwrap().is_none());
        f.ceased();
    }
}

#[test]
fn exact_owned_cancellation_stops_an_unread_interactive_query_without_an_input_join() {
    let f = Fixture::new("idle");
    let state = Arc::new(RecordEditorState::default());
    let stop = state.clone();
    let log = f.root.join("calls.jsonl");
    let cancelling = std::thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_secs(2);
        while !log.exists() {
            assert!(Instant::now() < deadline);
            std::thread::sleep(Duration::from_millis(5));
        }
        assert!(!stop.cancel("foreign-host", 1));
        assert!(stop.cancel("codex-host-observation", 1));
    });
    let began = Instant::now();
    assert_eq!(
        f.observed(&state, Duration::from_secs(3)).unwrap_err(),
        "codex-host-cancelled"
    );
    cancelling.join().unwrap();
    assert!(began.elapsed() < Duration::from_secs(3));
    assert!(state.active.lock().unwrap().is_none());
    f.ceased();
}

#[test]
fn original_executable_and_native_selection_are_checked_before_host_spawn() {
    let f = Fixture::new("healthy");
    let state = RecordEditorState::default();
    assert_eq!(
        observe_with_config(
            &state,
            &f.product,
            &f.planner,
            &|| Err("original-selection-retired".into()),
            &f.config,
            HOST_TIME
        )
        .unwrap_err(),
        "original-selection-retired"
    );
    assert!(!f.root.join("calls.jsonl").exists());
    fs::write(
        f.config.binary_override.as_ref().unwrap(),
        "#!/bin/sh\necho 'codex-cli 0.165.0-alpha.1.2'\n",
    )
    .unwrap();
    assert_eq!(
        f.observed(&state, Duration::from_secs(2)).unwrap_err(),
        "genesis-original-planner-changed"
    );
    assert!(!f.root.join("calls.jsonl").exists());
    assert!(state.active.lock().unwrap().is_none());
}

#[test]
fn a_completed_host_response_cannot_be_admitted_to_a_replacement_product() {
    let f = Fixture::new("replaced");
    let state = RecordEditorState::default();
    assert_eq!(
        f.observed(&state, Duration::from_secs(3)).unwrap_err(),
        "genesis-selected-folder-changed"
    );
    assert!(state.active.lock().unwrap().is_none());
    f.ceased();
    assert_eq!(fs::read_dir(f.product.path()).unwrap().count(), 0);
}
