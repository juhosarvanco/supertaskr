//! Pure cross-language format checks. These finite identity-shaped values do
//! not claim physical roots, initialization receipts or bank authority.
use super::{context::SessionOrigin, managed::answer_digest};
use serde_json::json;
use std::{
    io::Write,
    path::Path,
    process::{Command, Stdio},
};

#[test]
fn native_digest_values_match_actual_node_owners() {
    let directory = |path: &str, inode: &str| json!({"path":path,"device":"1","inode":inode});
    let repository = |path: &str, inode: &str| json!({"root":directory(path,inode),"gitDirectory":directory(&format!("{path}/.git"),"2"),"commonDirectory":directory(&format!("{path}/.git"),"2")});
    let origin:SessionOrigin=serde_json::from_value(json!({"version":1,"layout":"split","associationId":"format-only-project",
        "product":repository("/format-only/code","3"),"records":repository("/format-only/notes","4"),
        "docs":directory("/format-only/notes/docs","5"),"runtime":directory("/format-only/code/.supertaskr","6")})).unwrap();
    let answer = "Actual typed answer\nwith exact UTF-8 bytes: héllo.";
    let input = json!({"fingerprint":origin.fingerprint(),"origin":origin,"text":answer,"answerRef":answer_digest(answer)});
    let modules = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap();
    let script = r#"import{readFileSync}from'node:fs';import{pathToFileURL}from'node:url';import path from'node:path';
const moduleRoot=process.argv[1],data=JSON.parse(readFileSync(0,'utf8'));
const{operationDigest}=await import(pathToFileURL(path.join(moduleRoot,'tools/e2e/scripts/operation-record.mjs')));
const{captureGenesisAnswerReferences}=await import(pathToFileURL(path.join(moduleRoot,'tools/e2e/scripts/genesis-proposal.mjs')));
if(data.fingerprint!==operationDigest(data.origin))throw Error('native fingerprint differs from canonical Node owner');
const context={setupId:'format-only-setup',sessionId:'format-only-session',originDigest:data.fingerprint,productRevision:'a'.repeat(40),recordsRevision:'b'.repeat(40)};
captureGenesisAnswerReferences({context,answers:[{turn:2,text:data.text,setupId:context.setupId,sessionId:context.sessionId,originDigest:context.originDigest}],refs:[{turn:2,sha256:data.answerRef}],allowEmpty:false});"#;
    let mut child = Command::new("node")
        .args(["--input-type=module", "-e", script])
        .arg(modules)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(&serde_json::to_vec(&input).unwrap())
        .unwrap();
    let result = child.wait_with_output().unwrap();
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
}
