use super::*;
use std::{fs, os::unix::fs::PermissionsExt};

#[test]
fn fixed_init_actor_environment_stays_native_and_excludes_git_routing() {
    const CHILD: &str = "SUPERTASKR_INIT_ACTOR_ENV_CHILD";
    const TEST:&str="record_editor::init_actor_env_tests::fixed_init_actor_environment_stays_native_and_excludes_git_routing";
    let actors = [
        ("GIT_AUTHOR_NAME", "Native Fixture Author"),
        ("GIT_AUTHOR_EMAIL", "author@example.invalid"),
        ("GIT_AUTHOR_DATE", "1793304000 +0000"),
        ("GIT_COMMITTER_NAME", "Native Fixture Committer"),
        ("GIT_COMMITTER_EMAIL", "committer@example.invalid"),
        ("GIT_COMMITTER_DATE", "1793304001 +0000"),
        ("EMAIL", "fallback@example.invalid"),
    ];
    let routing = [
        "GIT_DIR",
        "GIT_WORK_TREE",
        "GIT_CONFIG_COUNT",
        "GIT_CONFIG_KEY_0",
        "GIT_CONFIG_VALUE_0",
        "GIT_OBJECT_DIRECTORY",
        "GIT_INDEX_FILE",
    ];
    if std::env::var(CHILD).as_deref() != Ok("1") {
        let mut command = Command::new(std::env::current_exe().unwrap());
        command
            .args(["--exact", TEST, "--nocapture", "--test-threads=1"])
            .env(CHILD, "1");
        for (key, value) in actors {
            command.env(key, value);
        }
        for key in routing {
            command.env(key, "must-not-route");
        }
        let output = command.output().unwrap();
        assert!(
            output.status.success(),
            "{}\n{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
        assert!(String::from_utf8_lossy(&output.stdout).contains("1 passed"));
        return;
    }
    let root = std::env::temp_dir().join(format!(
        "supertaskr-init-actor-{}-{}",
        std::process::id(),
        docs_watch::now_ms()
    ));
    fs::create_dir(&root).unwrap();
    let root = root.canonicalize().unwrap();
    let product = root.join("product");
    fs::create_dir(&product).unwrap();
    let program = root.join("supertaskr");
    fs::write(&program,r#"#!/usr/bin/env node
const fs=require('node:fs'),q=JSON.parse(fs.readFileSync(0,'utf8'));
const keys=['GIT_AUTHOR_NAME','GIT_AUTHOR_EMAIL','GIT_AUTHOR_DATE','GIT_COMMITTER_NAME','GIT_COMMITTER_EMAIL','GIT_COMMITTER_DATE','EMAIL','GIT_DIR','GIT_WORK_TREE','GIT_CONFIG_COUNT','GIT_CONFIG_KEY_0','GIT_CONFIG_VALUE_0','GIT_OBJECT_DIRECTORY','GIT_INDEX_FILE'];
process.stdout.write(JSON.stringify({version:1,requestId:q.requestId,ok:true,result:{status:'actor-environment',argv:process.argv.slice(2),environment:Object.fromEntries(keys.map(k=>[k,process.env[k]??null]))}}));
"#).unwrap();
    fs::set_permissions(&program, fs::Permissions::from_mode(0o700)).unwrap();
    let state = RecordEditorState::with_controlled_program(program);
    let selected = SelectedInitializationDirectory::capture(&product).unwrap();
    let result = invoke_initialization_operation(
        &state,
        &InitializationOperation::Discover { product: selected },
        &|| Ok(()),
    )
    .unwrap();
    assert_eq!(result["argv"], json!(["init", "--stdio"]));
    for (key, value) in actors {
        assert_eq!(result["environment"][key], value);
    }
    for key in routing {
        assert!(
            result["environment"][key].is_null(),
            "routing variable {key} must stay excluded"
        );
    }
    let cancel = AtomicBool::new(false);
    let deadline = Instant::now() + Duration::from_secs(5);
    let tool = state.tool(deadline, &cancel).unwrap();
    for consumer in [InstalledCommand::Records, InstalledCommand::Index] {
        let verb = consumer.verb();
        let result=invoke_command(&tool,&product,&json!({"version":1,"requestId":"unchanged-other-consumer","operation":"discover","productRoot":product}),deadline,&cancel,consumer).unwrap();
        assert_eq!(result["argv"], json!([verb, "--stdio"]));
        for key in INIT_ACTOR_ENV.iter().chain(routing.iter()) {
            assert!(
                result["environment"][*key].is_null(),
                "{key} must not grow other consumer environments"
            );
        }
    }
    state.stop();
    fs::remove_dir_all(root).unwrap();
}
