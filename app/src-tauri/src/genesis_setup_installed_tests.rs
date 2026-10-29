use super::*;
use crate::agent::{managed, runner, AgentState, StartOutcome};
use std::os::unix::fs::PermissionsExt;
use std::{
    fs,
    process::Command,
    sync::mpsc,
    time::{Duration, Instant},
};

#[test]
fn actual_installed_init_selects_new_histories_and_first_start_requires_the_owned_pristine_seed() {
    const CHILD: &str = "SUPERTASKR_NATIVE_NEW_INSTALLED_CHILD";
    if std::env::var_os(CHILD).is_none() {
        // Reuse the ordinary source-only installed-layout TOOL fixture. All
        // runtime modules/method/parser bytes and yaml are copied into it;
        // the native child's service has no checkout dependency or fallback.
        let source = Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .parent()
            .unwrap();
        let script = r#"
import {registerHooks,createRequire} from 'node:module';import path from 'node:path';import {pathToFileURL} from 'node:url';import {cpSync,mkdirSync,writeFileSync,chmodSync} from 'node:fs';
registerHooks({resolve(s,c,n){if(s.startsWith('.')&&!path.extname(s))return n(s+'.ts',c);return n(s,c);}});
const source=process.argv[1],{genesisFixture}=await import(pathToFileURL(path.join(source,'tools/e2e/tests/genesis-init-fixture.ts')));const f=genesisFixture();
const require=createRequire(path.join(source,'tools/e2e/package.json'));mkdirSync(path.join(f.tool,'node_modules'),{recursive:true});cpSync(path.dirname(require.resolve('yaml/package.json')),path.join(f.tool,'node_modules/yaml'),{recursive:true});
const program=path.join(f.dir,'supertaskr');writeFileSync(program,'#!/bin/sh\nexec '+JSON.stringify(process.execPath)+' '+JSON.stringify(path.join(f.tool,'supertaskr.mjs'))+' "$@"\n');chmodSync(program,0o700);
process.stdout.write(JSON.stringify({home:f.dir,product:f.product,records:f.records,program}));
"#;
        let fixture = Command::new("node")
            .args([
                "--experimental-strip-types",
                "--input-type=module",
                "-e",
                script,
            ])
            .arg(source)
            .output()
            .unwrap();
        assert!(
            fixture.status.success(),
            "{}",
            String::from_utf8_lossy(&fixture.stderr)
        );
        let fixture: Value = serde_json::from_slice(&fixture.stdout).unwrap();
        let result=Command::new(std::env::current_exe().unwrap()).args(["--exact","genesis_setup::installed_tests::actual_installed_init_selects_new_histories_and_first_start_requires_the_owned_pristine_seed","--nocapture"])
            .env(CHILD,fixture.to_string())
            .env("GIT_AUTHOR_NAME","Native setup fixture").env("GIT_AUTHOR_EMAIL","native@example.invalid")
            .env("GIT_COMMITTER_NAME","Native setup fixture").env("GIT_COMMITTER_EMAIL","native@example.invalid")
            .env_remove("GIT_AUTHOR_DATE").env_remove("GIT_COMMITTER_DATE").env_remove("GIT_DIR").env_remove("GIT_WORK_TREE").env_remove("GIT_INDEX_FILE")
            .output().unwrap();
        let cleanup = fs::remove_dir_all(fixture["home"].as_str().unwrap());
        assert!(
            result.status.success(),
            "{}\n{}",
            String::from_utf8_lossy(&result.stdout),
            String::from_utf8_lossy(&result.stderr)
        );
        cleanup.unwrap();
        return;
    }
    let f: Value = serde_json::from_str(&std::env::var(CHILD).unwrap()).unwrap();
    let home = PathBuf::from(f["home"].as_str().unwrap());
    let product = PathBuf::from(f["product"].as_str().unwrap());
    let records = PathBuf::from(f["records"].as_str().unwrap());
    let editor =
        RecordEditorState::with_controlled_program(PathBuf::from(f["program"].as_str().unwrap()));
    let watch = WatchState::start(None, |_| {});
    let state = SetupState::default();
    let selected = new_setup(
        &watch,
        &state,
        &editor,
        1,
        || Some(product.clone()),
        || Some(records.clone()),
    );
    assert!(
        matches!(
            selected.outcome,
            PickOutcome::Genesis {
                snapshot: Some(_),
                ..
            }
        ),
        "{}",
        serde_json::to_string(&selected.outcome).unwrap()
    );
    assert_eq!(selected.notice.unwrap().status, "initialized");
    assert!(state.pending.lock().unwrap().is_empty());
    assert_eq!(watch.project_dir().as_deref(), Some(product.as_path()));
    assert!(!product.join("docs").exists());
    assert!(product.join("supertaskr.yaml").is_file());
    assert!(records.join("workspace-association.json").is_file());
    let git = |root: &Path, args: &[&str]| {
        let out = Command::new("git")
            .arg("-C")
            .arg(root)
            .args(args)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{}",
            String::from_utf8_lossy(&out.stderr)
        );
        String::from_utf8(out.stdout).unwrap()
    };
    assert_eq!(
        git(&product, &["log", "-1", "--format=%an <%ae>"]).trim(),
        "Native setup fixture <native@example.invalid>"
    );
    let pcut = git(&product, &["rev-parse", "HEAD"]);
    let rcut = git(&records, &["rev-parse", "HEAD"]);
    // Cold setup recovery discovers the original accepted row and replays it
    // before current inspection; it never opens a new notes-folder picker.
    let reopened = new_setup(
        &watch,
        &SetupState::default(),
        &editor,
        2,
        || Some(product.clone()),
        || panic!("accepted setup must retain original notes"),
    );
    assert!(matches!(reopened.outcome, PickOutcome::Genesis { .. }));
    assert_eq!(git(&product, &["rev-parse", "HEAD"]), pcut);
    assert_eq!(git(&records, &["rev-parse", "HEAD"]), rcut);
    let planner = home.join("planner");
    let prompt = home.join("prompt");
    let cwd = home.join("cwd");
    fs::write(&planner,format!(r#"#!/bin/sh
if [ "$1" = '--version' ];then echo '2.1.226 (Claude Code)';exit 0;fi
/bin/cat > {}
/bin/pwd > {}
echo '{{"type":"system","subtype":"init","session_id":"new-project-first-planner","model":"controlled-model"}}'
echo '{{"type":"result","subtype":"success","is_error":false,"num_turns":1,"result":"First planner response."}}'
"#,serde_json::to_string(&prompt).unwrap(),serde_json::to_string(&cwd).unwrap())).unwrap();
    fs::set_permissions(&planner, fs::Permissions::from_mode(0o700)).unwrap();
    let (tx, events) = mpsc::channel();
    let agent = AgentState::new_managed(
        runner::RunnerConfig {
            binary_override: Some(planner),
            probe_login_shell: false,
            start_timeout: Duration::from_secs(3),
            stall_timeout: Duration::from_secs(5),
            kill_grace: Duration::from_millis(100),
            ..Default::default()
        },
        move |event| {
            let _ = tx.send(event);
        },
    );
    let start = |attempt| {
        let request = managed::Request {
            expected_context: pair(&watch.message_scope()),
            attempt,
        };
        let prepared = managed::prepare(&watch, &request).unwrap();
        managed::start_prepared(
            &watch,
            &agent,
            &editor,
            request,
            prepared,
            managed::StartAction::Start,
        )
    };
    let roadmap = records.join("docs/ROADMAP.md");
    let original = fs::read(&roadmap).unwrap();
    fs::write(
        &roadmap,
        [original.as_slice(), b"\nOwner's existing plan\n"].concat(),
    )
    .unwrap();
    assert!(matches!(
        start(2).result,
        StartOutcome::AlreadyPlanned { .. }
    ));
    assert!(!prompt.exists());
    fs::write(&roadmap, &original).unwrap();
    let extra = records.join("docs/tasks/existing.md");
    fs::write(&extra, "# Existing work\n").unwrap();
    assert!(matches!(
        start(3).result,
        StartOutcome::AlreadyPlanned { .. }
    ));
    assert!(!prompt.exists());
    fs::remove_file(extra).unwrap();
    let first = start(4);
    assert!(
        matches!(first.result, StartOutcome::Started { .. }),
        "{:?}",
        first.result
    );
    assert!(first.identity.is_some());
    let deadline = Instant::now() + Duration::from_secs(12);
    loop {
        let event = events
            .recv_timeout(deadline.saturating_duration_since(Instant::now()))
            .expect("first planner turn settled");
        match event.event {
            runner::RunEvent::Completed { .. } => break,
            runner::RunEvent::Failed { ref error, .. } => panic!("first planner failed: {error:?}"),
            _ => {}
        }
    }
    assert_eq!(
        fs::read_to_string(cwd).unwrap().trim_end(),
        records.to_str().unwrap()
    );
    assert!(fs::read_to_string(prompt)
        .unwrap()
        .contains("claude-opus-5"));
    assert_eq!(git(&product, &["rev-parse", "HEAD"]), pcut);
    assert_eq!(git(&records, &["rev-parse", "HEAD"]), rcut);
    assert!(!product.join("docs").exists());
    watch.stop_for_test();
}
