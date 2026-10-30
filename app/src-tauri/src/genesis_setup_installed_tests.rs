use super::*;
use crate::agent::{self, banking, managed, runner, AgentState, StartOutcome};
use std::os::unix::fs::PermissionsExt;
use std::{
    fs,
    process::Command,
    sync::{mpsc,Arc,OnceLock,Weak},
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
import {registerHooks,createRequire} from 'node:module';import path from 'node:path';import {pathToFileURL} from 'node:url';import {cpSync,mkdirSync,writeFileSync,chmodSync,existsSync} from 'node:fs';
registerHooks({resolve(s,c,n){if(s.startsWith('.')&&!path.extname(s)&&c.parentURL?.includes('/tools/e2e/tests/')&&existsSync(new URL(s+'.ts',c.parentURL)))return n(s+'.ts',c);return n(s,c);}});
const source=process.argv[1],{genesisFixture}=await import(pathToFileURL(path.join(source,'tools/e2e/tests/genesis-init-fixture.ts')));const f=genesisFixture();
const require=createRequire(path.join(source,'tools/e2e/package.json'));mkdirSync(path.join(f.tool,'node_modules'),{recursive:true});cpSync(path.dirname(require.resolve('yaml/package.json')),path.join(f.tool,'node_modules/yaml'),{recursive:true});
const entry=path.join(f.dir,'controlled-init.mjs'),stop=path.join(f.dir,'stop-first-bank');
const script=name=>JSON.stringify(pathToFileURL(path.join(f.tool,'dist/tools/e2e/scripts',name+'.mjs')).href);
writeFileSync(entry,`import{readFileSync,writeFileSync,existsSync}from'node:fs';import{executeInitializationProtocol}from ${script('genesis-init-command')};import{prepareGenesisBank}from ${script('genesis-bank-plan')};import{executeProjectBank}from ${script('project-bank-operation')};import{loadInstalledRecordTool}from ${script('records-check')};process.on('uncaughtException',error=>{writeFileSync(${JSON.stringify(stop+'.error')},error.stack??String(error));process.exit(73);});if(JSON.stringify(process.argv.slice(2))!==JSON.stringify(['init','--stdio']))throw Error('fixed init only');const input=JSON.parse(readFileSync(0,'utf8'));if(input.operation==='bank'&&existsSync(${JSON.stringify(stop)})){const{version,requestId,operation,...data}=input,tool=loadInstalledRecordTool(),{request}=prepareGenesisBank({...data,tool});executeProjectBank(input.productRoot,request,{tool,authorize(){return true;},onBoundary(at){if(at==='captured'){writeFileSync(${JSON.stringify(stop+'.captured')},request.operationId);process.exit(72);}}});}else{const result=executeInitializationProtocol(input);process.stdout.write(JSON.stringify(result)+'\\n');process.exitCode=result.ok?0:1;}`);
const program=path.join(f.dir,'supertaskr');writeFileSync(program,'#!/bin/sh\nexec '+JSON.stringify(process.execPath)+' '+JSON.stringify(entry)+' "$@"\n');chmodSync(program,0o700);
process.stdout.write(JSON.stringify({home:f.dir,product:f.product,records:f.records,program,stop}));
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
    let editor = Arc::new(
        RecordEditorState::with_controlled_program(PathBuf::from(f["program"].as_str().unwrap())));
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
    let calls=home.join("planner-calls");
    fs::write(&planner,format!(r#"#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path');
if(process.argv[2]==='--version'){{console.log('codex-cli 0.165.0-alpha.1.2');process.exit(0);}}
const prompt=fs.readFileSync(0,'utf8');fs.writeFileSync({},prompt);fs.writeFileSync({},process.cwd());fs.appendFileSync({},'called\n');
const match=/<supertaskr-bank-context-v1>\n([^]*?)\n<\/supertaskr-bank-context-v1>/.exec(prompt);if(!match)throw Error('exact structured bank context required');const c=JSON.parse(match[1]);
fs.writeFileSync('docs/STATE.md','# State\n\nUpdated: 2026-10-30\n\n## In progress\nQ1 problem and person.\n');
fs.mkdirSync('docs/plans',{{recursive:true}});fs.writeFileSync('docs/plans/genesis-bank-proposal.json',JSON.stringify({{version:1,setupId:c.setupId,sessionId:c.sessionId,originDigest:c.originDigest,expectedProductRevision:c.expectedProductRevision,expectedRecordsRevision:c.expectedRecordsRevision,proposalId:'native-stage-zero',stage:0,answerRefs:[],records:[{{path:'docs/STATE.md'}}]}}));
console.log(JSON.stringify({{type:'thread.started',thread_id:'11111111-2222-4333-8444-555555555555'}}));console.log(JSON.stringify({{type:'item.completed',item:{{id:'controlled-answer',type:'agent_message',text:'First planner response.'}}}}));console.log(JSON.stringify({{type:'turn.completed',usage:{{input_tokens:1,cached_input_tokens:0,output_tokens:1}}}}));
"#,serde_json::to_string(&prompt).unwrap(),serde_json::to_string(&cwd).unwrap(),serde_json::to_string(&calls).unwrap())).unwrap();
    fs::set_permissions(&planner, fs::Permissions::from_mode(0o700)).unwrap();
    let cfg=runner::RunnerConfig {
            binary_override: Some(planner),
            probe_login_shell: false,
            start_timeout: Duration::from_secs(3),
            stall_timeout: Duration::from_secs(5),
            kill_grace: Duration::from_millis(100),
            ..Default::default()
        };
    let make_agent=|| {
        let (tx,events)=mpsc::channel();let (bank_tx,banks)=mpsc::channel();
        let owner:Arc<OnceLock<Weak<AgentState>>>=Arc::new(OnceLock::new());let original=owner.clone();let service=editor.clone();
        let agent=Arc::new(AgentState::new_managed(cfg.clone(),move|event|{let _=tx.send(event);})
            .with_banking(move|turn|{let agent=original.get().unwrap().upgrade().unwrap();banking::finish(&agent,&service,turn);},move|event|{let _=bank_tx.send(event);}));
        owner.set(Arc::downgrade(&agent)).unwrap();(agent,events,banks)
    };
    let (agent,events,banks)=make_agent();
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
    fs::write(f["stop"].as_str().unwrap(),"stop after durable bank capture").unwrap();
    let product_index=fs::read(product.join(".git/index")).unwrap();
    let product_refs=git(&product,&["for-each-ref","--format=%(refname) %(objectname)"]);
    let product_objects=git(&product,&["cat-file","--batch-all-objects","--batch-check=%(objectname)"]);
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
    let bank=banks.recv_timeout(Duration::from_secs(180)).expect("original bank callback started after model cessation/registry settlement");
    assert_eq!(bank.identity,first.identity.clone().unwrap());
    let banking::Notice::Banking {view,..}=bank.event;assert_eq!(view.phase,banking::Phase::Banking);
    let transcript=fs::read(product.join(agent::sessions::TRANSCRIPT_REL)).unwrap();
    let request=managed::SessionRequest {expected_context:pair(&watch.message_scope()),attempt:5,identity:first.identity.clone().unwrap()};
    let prepared=managed::prepare(&watch,&request.request()).unwrap();
    assert!(matches!(managed::send_prepared(&watch,&agent,&editor,request,prepared,"Must not overtake banking".into()).result,agent::SendOutcome::Busy));
    assert_eq!(fs::read(product.join(agent::sessions::TRANSCRIPT_REL)).unwrap(),transcript);
    let bank=banks.recv_timeout(Duration::from_secs(180)).expect("captured bank interruption is collected");
    let banking::Notice::Banking {view,..}=bank.event;assert_eq!(view.phase,banking::Phase::Recovery);assert!(view.recovery_token.is_some());
    assert!(Path::new(&format!("{}.captured",f["stop"].as_str().unwrap())).is_file(),"actual canonical capture required; native={view:?}; diagnostic={:?}",fs::read_to_string(format!("{}.error",f["stop"].as_str().unwrap())));
    assert_eq!(
        fs::read_to_string(cwd).unwrap().trim_end(),
        records.to_str().unwrap()
    );
    assert!(fs::read_to_string(prompt)
        .unwrap()
        .contains("gpt-6.1-sol"));
    assert_eq!(git(&product, &["rev-parse", "HEAD"]), pcut);
    assert_eq!(git(&records, &["rev-parse", "HEAD"]), rcut);
    assert_eq!(fs::read(&calls).unwrap(),b"called\n");
    assert_eq!(fs::read(product.join(".git/index")).unwrap(),product_index);
    assert_eq!(git(&product,&["for-each-ref","--format=%(refname) %(objectname)"]),product_refs);
    assert_eq!(git(&product,&["cat-file","--batch-all-objects","--batch-check=%(objectname)"]),product_objects);
    drop(agent);
    fs::remove_file(f["stop"].as_str().unwrap()).unwrap();
    let (cold,_events,_banks)=make_agent();
    let request=managed::Request {expected_context:pair(&watch.message_scope()),attempt:6};
    let prepared=managed::prepare(&watch,&request).unwrap();
    let recovery=managed::start_prepared(&watch,&cold,&editor,request,prepared,managed::StartAction::Start);
    assert!(matches!(recovery.result,StartOutcome::Error {ref message} if message=="genesis-bank-recovery-required"),"{:?}",recovery.result);
    let identity=recovery.identity.expect("cold recovery offers exact original session with a new native activation");
    assert_eq!(identity.session_id,first.identity.unwrap().session_id);
    assert_eq!(fs::read(&calls).unwrap(),b"called\n");
    assert_eq!(fs::read(product.join(agent::sessions::TRANSCRIPT_REL)).unwrap(),transcript);
    let request=managed::Request {expected_context:pair(&watch.message_scope()),attempt:7};
    let status=managed::status_prepared(&watch,&cold,request.clone(),managed::prepare(&watch,&request).unwrap());
    let managed::ReadOutcome::Ready {value}=status.result else {panic!("scoped cold bank status");};
    let pending=value.banking.unwrap();assert_eq!(pending.phase,banking::Phase::Recovery);let token=pending.recovery_token.unwrap();
    let request=managed::SessionRequest {expected_context:pair(&watch.message_scope()),attempt:8,identity};
    let wrong=managed::replay_bank_prepared(&watch,&cold,&editor,request.clone(),managed::prepare(&watch,&request.request()).unwrap(),"foreign-offer".into());
    assert!(matches!(wrong.result,managed::ReadOutcome::Error {ref message} if message=="genesis-bank-offer-changed"));
    assert_eq!(git(&records,&["rev-parse","HEAD"]),rcut);
    let replay=managed::replay_bank_prepared(&watch,&cold,&editor,request.clone(),managed::prepare(&watch,&request.request()).unwrap(),token);
    let managed::ReadOutcome::Ready {value}=replay.result else {panic!("exact original bank replay: {:?}",replay.result);};
    assert_eq!(value.phase,banking::Phase::Ready);assert!(value.current);assert_eq!(value.completed_stage,Some(0));assert_eq!(value.receipts.len(),1);
    assert!(value.receipts[0].paths.contains(&"docs/STATE.md".into()));assert!(value.receipts[0].paths.contains(&"docs/INDEX.md".into()));
    assert_eq!(git(&records,&["rev-parse","HEAD"]).trim_end(),value.receipts[0].records_commit);
    assert_eq!(fs::read(&calls).unwrap(),b"called\n");assert_eq!(fs::read(product.join(agent::sessions::TRANSCRIPT_REL)).unwrap(),transcript);
    assert_eq!(git(&product,&["rev-parse","HEAD"]),pcut);assert_eq!(fs::read(product.join(".git/index")).unwrap(),product_index);
    assert_eq!(git(&product,&["for-each-ref","--format=%(refname) %(objectname)"]),product_refs);
    assert_eq!(git(&product,&["cat-file","--batch-all-objects","--batch-check=%(objectname)"]),product_objects);
    assert!(!product.join("docs").exists());
    // An ordinary later private commit cannot turn the cached observation into
    // fresh current qualification. Keep the original accepted receipt visible.
    fs::write(records.join("docs/rooms/later.md"),"# Later ordinary private note\n").unwrap();
    git(&records,&["add","docs/rooms/later.md"]);git(&records,&["-c","commit.gpgsign=false","commit","-qm","Later private note fixture"]);
    let request=managed::Request {expected_context:pair(&watch.message_scope()),attempt:9};
    let status=managed::status_prepared(&watch,&cold,request.clone(),managed::prepare(&watch,&request).unwrap());
    let managed::ReadOutcome::Ready {value:status}=status.result else {panic!("scoped status after later private commit");};
    let history=status.banking.unwrap();assert!(!history.current);assert_eq!(history.completed_stage,None);assert_eq!(history.receipts[0].receipt_digest,value.receipts[0].receipt_digest);
    watch.stop_for_test();
}
