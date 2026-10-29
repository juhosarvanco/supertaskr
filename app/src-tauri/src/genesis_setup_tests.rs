use super::*;
use std::fs;
use std::os::unix::fs::PermissionsExt;
use std::time::{SystemTime, UNIX_EPOCH};
struct Fixture {
    home: PathBuf,
    p: PathBuf,
    r: PathBuf,
    watch: WatchState,
    state: SetupState,
    editor: RecordEditorState,
}
impl Fixture {
    fn new() -> Self {
        let home = std::env::temp_dir().join(format!(
            "supertaskr-setup-caller-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir(&home).unwrap();
        let home = home.canonicalize().unwrap();
        let p = home.join("code");
        let r = home.join("notes");
        fs::create_dir(&p).unwrap();
        fs::create_dir(&r).unwrap();
        let program = home.join("supertaskr");
        fs::write(home.join("control.json"), "{}").unwrap();
        fs::write(&program,format!(r#"#!/usr/bin/env node
const fs=require('node:fs'),p={};if(JSON.stringify(process.argv.slice(2))!=='["init","--stdio"]')process.exit(91);
const q=JSON.parse(fs.readFileSync(0,'utf8'));fs.appendFileSync(p+'/calls',JSON.stringify(q)+'\n');const c=JSON.parse(fs.readFileSync(p+'/control.json'));
let result,error;
if(q.operation==='discover')result={{status:'initializations',initializations:c.rows||[]}};
else if(q.operation==='inspect')error={{code:'fixture-current-unavailable',message:'Current observation unavailable',state:'refused'}};
else{{if(q.operation==='initialize')fs.writeFileSync(p+'/captured.json',JSON.stringify(q));const original=JSON.parse(fs.readFileSync(p+'/captured.json'));
if(c.accepted)result={{status:'initialized',operationId:original.operationId,projectId:original.projectId,requestDigest:'sha256:'+'a'.repeat(64),bindingDigest:'sha256:'+'b'.repeat(64),receiptDigest:'sha256:'+'c'.repeat(64),
product:{{root:original.productRoot,commit:'a'.repeat(40),tree:'b'.repeat(40),ref:'refs/heads/main',attribution:'exact'}},records:{{root:original.recordsRoot,commit:'c'.repeat(40),tree:'d'.repeat(40),ref:'refs/heads/main',attribution:'exact'}}}};
else error={{code:'fixture-interrupted',message:'Original setup pending',state:'unknown',operationId:original.operationId}};}}
process.stdout.write(JSON.stringify({{version:1,requestId:q.requestId,ok:!error,...(error?{{error}}:{{result}})}}));
"#,serde_json::to_string(&home).unwrap())).unwrap();
        fs::set_permissions(&program, fs::Permissions::from_mode(0o700)).unwrap();
        Self {
            home,
            p,
            r,
            watch: WatchState::start(None, |_| {}),
            state: SetupState::default(),
            editor: RecordEditorState::with_controlled_program(program),
        }
    }
    fn calls(&self) -> Vec<Value> {
        fs::read_to_string(self.home.join("calls"))
            .unwrap_or_default()
            .lines()
            .map(|line| serde_json::from_str(line).unwrap())
            .collect()
    }
    fn control(&self, value: Value) {
        fs::write(self.home.join("control.json"), value.to_string()).unwrap();
    }
    fn run(&self, attempt: u64) -> SetupResult {
        new_setup(
            &self.watch,
            &self.state,
            &self.editor,
            attempt,
            || Some(self.p.clone()),
            || Some(self.r.clone()),
        )
    }
    fn captured(&self) -> Value {
        serde_json::from_slice(&fs::read(self.home.join("captured.json")).unwrap()).unwrap()
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        self.watch.stop_for_test();
        fs::remove_dir_all(&self.home).unwrap();
    }
}
#[test]
fn native_cancel_and_busy_never_start_setup_and_notes_cancel_only_discovers() {
    let f = Fixture::new();
    assert!(matches!(
        new_setup(
            &f.watch,
            &f.state,
            &f.editor,
            1,
            || None,
            || panic!("no second dialog after cancellation")
        )
        .outcome,
        PickOutcome::Cancelled
    ));
    assert!(f.calls().is_empty());
    let held = f.watch.begin_pick().unwrap();
    assert!(matches!(
        new_setup(
            &f.watch,
            &f.state,
            &f.editor,
            2,
            || panic!("busy"),
            || panic!("busy")
        )
        .outcome,
        PickOutcome::Busy
    ));
    drop(held);
    assert!(matches!(
        new_setup(
            &f.watch,
            &f.state,
            &f.editor,
            3,
            || Some(f.p.clone()),
            || None
        )
        .outcome,
        PickOutcome::Cancelled
    ));
    assert_eq!(
        f.calls()
            .iter()
            .map(|q| q["operation"].as_str().unwrap())
            .collect::<Vec<_>>(),
        ["discover"]
    );
    assert!(f.state.pending.lock().unwrap().is_empty());
    assert_eq!(fs::read_dir(&f.p).unwrap().count(), 0);
    assert_eq!(fs::read_dir(&f.r).unwrap().count(), 0);
    assert!(f.watch.project_dir().is_none());
}
#[test]
fn retained_unknown_replays_original_id_without_discovery_or_new_notes_picker_and_keeps_accepted_receipt(
) {
    let f = Fixture::new();
    let first = f.run(1);
    let notice = first.notice.unwrap();
    assert_eq!(notice.status, "unknown");
    assert_eq!(notice.code.as_deref(), Some("fixture-interrupted"));
    let captured = f.captured();
    let second = new_setup(
        &f.watch,
        &f.state,
        &f.editor,
        2,
        || Some(f.p.clone()),
        || panic!("pending must not recapture notes"),
    );
    assert_eq!(second.notice.unwrap().status, "unknown");
    assert_eq!(
        f.calls()
            .iter()
            .map(|q| q["operation"].as_str().unwrap())
            .collect::<Vec<_>>(),
        ["discover", "initialize", "replay"]
    );
    assert_eq!(f.calls()[2]["operationId"], captured["operationId"]);
    assert!(f.calls()[2].get("recordsRoot").is_none());
    let original = f.home.join("original-notes");
    fs::rename(&f.r, &original).unwrap();
    fs::create_dir(&f.r).unwrap();
    let count = f.calls().len();
    assert!(matches!(f.run(3).outcome, PickOutcome::Error { .. }));
    assert_eq!(f.calls().len(), count);
    assert_eq!(fs::read_dir(&f.r).unwrap().count(), 0);
    fs::remove_dir(&f.r).unwrap();
    fs::rename(original, &f.r).unwrap();
    f.control(serde_json::json!({"accepted":true}));
    let completed = f.run(4);
    assert_eq!(completed.notice.unwrap().status, "initialized");
    assert!(matches!(completed.outcome, PickOutcome::Error { .. }));
    let accepted = f
        .state
        .pending
        .lock()
        .unwrap()
        .get(&f.p)
        .unwrap()
        .accepted
        .clone()
        .unwrap();
    assert_eq!(accepted["operationId"], captured["operationId"]);
    assert!(
        f.watch.project_dir().is_none(),
        "accepted fact cannot bypass current inspection"
    );
    f.control(serde_json::json!({}));
    assert_eq!(
        f.run(5).notice.unwrap().status,
        "initialized",
        "later replay failure cannot erase prior exact acceptance"
    );
    assert_eq!(f.captured(), captured);
    assert!(f
        .state
        .pending
        .lock()
        .unwrap()
        .get(&f.p)
        .unwrap()
        .accepted
        .is_some());
}
#[test]
fn cold_discovery_selects_only_the_original_matching_setup_and_refuses_ambiguity() {
    let f = Fixture::new();
    f.run(1);
    let captured = f.captured();
    let row = serde_json::json!({"operationId":captured["operationId"],"projectId":captured["projectId"],"state":"pending","originStatus":"matched",
        "roots":{"product":SelectedInitializationDirectory::capture(&f.p).unwrap().descriptor(),"records":SelectedInitializationDirectory::capture(&f.r).unwrap().descriptor()}});
    let cold = SetupState::default();
    f.control(serde_json::json!({"rows":[row]}));
    let result = new_setup(
        &f.watch,
        &cold,
        &f.editor,
        2,
        || Some(f.p.clone()),
        || panic!("cold recovery must retain original notes"),
    );
    assert_eq!(result.notice.unwrap().status, "unknown");
    assert_eq!(
        f.calls().last().unwrap()["operationId"],
        captured["operationId"]
    );
    assert_eq!(f.calls().last().unwrap()["operation"], "replay");
    let count = f.calls().len();
    f.control(serde_json::json!({"rows":[row,row]}));
    let refused = SetupState::default();
    assert!(matches!(
        new_setup(
            &f.watch,
            &refused,
            &f.editor,
            3,
            || Some(f.p.clone()),
            || panic!("ambiguous setup")
        )
        .outcome,
        PickOutcome::Error { .. }
    ));
    assert_eq!(f.calls().len(), count + 1);
    let mut unavailable = row;
    unavailable["originStatus"] = "unavailable".into();
    f.control(serde_json::json!({"rows":[unavailable]}));
    assert!(matches!(
        new_setup(
            &f.watch,
            &SetupState::default(),
            &f.editor,
            4,
            || Some(f.p.clone()),
            || panic!("foreign setup")
        )
        .outcome,
        PickOutcome::Error { .. }
    ));
    assert_eq!(f.calls().len(), count + 2);
    assert_eq!(f.captured(), captured);
    assert!(f.watch.project_dir().is_none());
}
#[test]
fn here_requires_the_exact_native_offer_and_context_and_invalid_binding_never_falls_back() {
    let f = Fixture::new();
    let initial = f.watch.message_scope();
    let offered = f.state.reply(
        &f.watch,
        SetupResult {
            outcome: PickOutcome::NoDocs {
                path: f.p.display().to_string(),
                probe: docs_watch::PlanProbe {
                    roadmap: false,
                    tasks: false,
                    architecture: false,
                    git: false,
                },
            },
            notice: None,
        },
        initial.clone(),
        None,
    );
    let token = offered.genesis_offer.unwrap();
    let request = |token: String, context: ExpectedContext| HereRequest {
        expected_context: context,
        attempt: 1,
        target: HereTarget::Offered { token },
    };
    assert!(matches!(
        here_setup(
            &f.watch,
            &f.state,
            &f.editor,
            request("foreign".into(), pair(&initial)),
            || panic!("foreign token")
        )
        .outcome,
        PickOutcome::Error { .. }
    ));
    let mut stale = pair(&initial);
    stale.context_sequence += 1;
    assert!(matches!(
        here_setup(
            &f.watch,
            &f.state,
            &f.editor,
            request(token.clone(), stale),
            || panic!("stale pair")
        )
        .outcome,
        PickOutcome::Error { .. }
    ));
    assert!(f.calls().is_empty());
    assert!(matches!(
        here_setup(
            &f.watch,
            &f.state,
            &f.editor,
            request(token.clone(), pair(&initial)),
            || None
        )
        .outcome,
        PickOutcome::Cancelled
    ));
    assert_eq!(f.calls().len(), 1);
    fs::create_dir(f.p.join(".supertaskr")).unwrap();
    fs::write(
        f.p.join(".supertaskr/workspace.json"),
        "invalid explicit binding",
    )
    .unwrap();
    assert!(matches!(
        here_setup(
            &f.watch,
            &f.state,
            &f.editor,
            request(token, pair(&initial)),
            || panic!("invalid binding cannot fresh initialize")
        )
        .outcome,
        PickOutcome::Error { .. }
    ));
    assert_eq!(f.calls().len(), 2);
    assert!(f.state.pending.lock().unwrap().is_empty());
    assert!(!f.p.join("docs").exists());
    assert_eq!(fs::read_dir(&f.r).unwrap().count(), 0);
}

#[test]
fn selected_here_accepts_plain_legacy_origin_but_never_substitutes_a_new_selection_for_the_rendered_pair(
) {
    let f = Fixture::new();
    assert!(matches!(
        docs_watch::apply_genesis_folder(&f.watch, &f.p, f.watch.begin_pick().unwrap()),
        PickOutcome::Genesis { .. }
    ));
    let original = pair(&f.watch.message_scope());
    let request = |expected_context| HereRequest {
        expected_context,
        attempt: 1,
        target: HereTarget::Selected,
    };
    assert!(matches!(
        here_setup(&f.watch, &f.state, &f.editor, request(original), || None).outcome,
        PickOutcome::Cancelled
    ));
    assert_eq!(f.calls().len(), 1);
    assert_eq!(f.calls()[0]["productRoot"], serde_json::json!(f.p));
    assert!(matches!(
        docs_watch::apply_genesis_folder(&f.watch, &f.r, f.watch.begin_pick().unwrap()),
        PickOutcome::Genesis { .. }
    ));
    assert!(matches!(
        here_setup(&f.watch, &f.state, &f.editor, request(original), || panic!(
            "retired displayed selection"
        ))
        .outcome,
        PickOutcome::Error { .. }
    ));
    assert_eq!(f.calls().len(), 1);
    let current = pair(&f.watch.message_scope());
    assert_ne!(original, current);
    assert!(matches!(
        here_setup(&f.watch, &f.state, &f.editor, request(current), || None).outcome,
        PickOutcome::Cancelled
    ));
    assert_eq!(f.calls().len(), 2);
    assert_eq!(f.calls()[1]["productRoot"], serde_json::json!(f.r));
    assert!(!f.p.join("docs").exists());
    assert!(!f.r.join("docs").exists());
    assert!(f.state.pending.lock().unwrap().is_empty());
}
