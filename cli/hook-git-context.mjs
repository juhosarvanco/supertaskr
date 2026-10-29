/** Builtin-only raw Git-hook routing audit. Scoped child environments are
 * derived only after actual incoming routing agrees with the bound PRODUCT;
 * no global environment is cleared and no user hook/config is disabled. */
import {execFileSync} from "node:child_process";
import {existsSync,lstatSync,readFileSync,realpathSync,statSync} from "node:fs";
import path from "node:path";
/** @param {string} code @returns {never} */
function refuse(code){throw Object.assign(new Error(`${code}: Git hook context unavailable`),{code});}
/** @param {string} file */
function text(file){try{if(lstatSync(file).size>65536)refuse("hook-git-routing-unavailable");return new TextDecoder("utf-8",{fatal:true}).decode(readFileSync(file));}catch{refuse("hook-git-routing-unavailable");}}
/** @param {string} value */
function canonical(value){try{if(!value||/[\x00-\x1f\x7f]/.test(value))refuse("hook-git-routing-invalid");return realpathSync(value);}catch{refuse("hook-git-routing-unavailable");}}
/** @param {string} root */
function gitDirectories(root){
 const marker=path.join(root,".git");let directory;
 try{
  const s=lstatSync(marker);if(s.isSymbolicLink())refuse("hook-git-routing-unavailable");
  if(s.isDirectory())directory=canonical(marker);
  else if(s.isFile()){
   const m=/^gitdir: ([^\x00-\x1f\x7f]+)\n?$/.exec(text(marker));if(!m)refuse("hook-git-routing-unavailable");
   directory=canonical(path.resolve(root,/** @type {string} */(m[1])));
  }else refuse("hook-git-routing-unavailable");
  if(!statSync(directory).isDirectory())refuse("hook-git-routing-unavailable");
  const commonFile=path.join(directory,"commondir");
  const common=existsSync(commonFile)?canonical(path.resolve(directory,text(commonFile).replace(/\n$/,""))):directory;
  return {directory,common};
 }catch{refuse("hook-git-routing-unavailable");}
}
/** @param {string} cwd */
function checkout(cwd){let current=canonical(cwd);for(;;){if(existsSync(path.join(current,".git")))return current;const parent=path.dirname(current);if(parent===current)return null;current=parent;}}
/** Fixed executable discovery, without invoking a shell or repository config.
 * @param {string} [name] */
export function hookProgram(name="git"){
 for(const directory of (process.env.PATH??"").split(path.delimiter)){
  if(!directory||!path.isAbsolute(directory))continue;
  for(const file of process.platform==="win32"?[`${name}.exe`]:[name]){
   const candidate=path.join(directory,file);
   try{const s=statSync(candidate);if(s.isFile()&&(process.platform==="win32"||s.mode&0o111))return realpathSync(candidate);}catch{/* try next explicit PATH directory */}
  }
 }refuse("hook-git-program-unavailable");
}
/** @param {string} productRoot @param {string} cwd @param {"pre-tool"|"pre-push"} mode */
export function auditHookGitContext(productRoot,cwd,mode){
 const root=canonical(productRoot),expected=gitDirectories(root),actual=checkout(cwd);
 // A foreign cwd is not evidence of a foreign effect when inherited routing
 // explicitly points back into this PRODUCT family. Inspect it before the
 // outside/no-question arm, without invoking Git under that routing.
 const expectedPaths=[root,expected.directory,expected.common,path.join(expected.common,"objects")];
 for(const key of ["GIT_DIR","GIT_COMMON_DIR","GIT_WORK_TREE","GIT_OBJECT_DIRECTORY"]){
  const value=process.env[key];if(value===undefined||actual===root)continue;
  const routed=canonical(path.resolve(cwd,value));
  const target=statSync(routed,{bigint:true});
  if(expectedPaths.some(file=>{const s=statSync(file,{bigint:true});return s.dev===target.dev&&s.ino===target.ino;}))refuse("hook-git-routing-mismatch");
  if(key==="GIT_DIR"&&existsSync(path.join(routed,"commondir"))){
   const common=statSync(canonical(path.resolve(routed,text(path.join(routed,"commondir")).replace(/\n$/,""))),{bigint:true}),selected=statSync(expected.common,{bigint:true});
   if(common.dev===selected.dev&&common.ino===selected.ino)refuse("hook-git-routing-mismatch");
  }
 }
 if(actual===null)return {status:/** @type {const} */("outside"),env:{...process.env}};
 const selected=gitDirectories(actual);
 if(actual!==root){
  const a=statSync(selected.common,{bigint:true}),b=statSync(expected.common,{bigint:true});
  if(a.dev===b.dev&&a.ino===b.ino)refuse("hook-related-worktree-unadapted");
  return {status:/** @type {const} */("outside"),env:{...process.env}};
 }
 const ordinary=new Set(["GIT_AUTHOR_NAME","GIT_AUTHOR_EMAIL","GIT_AUTHOR_DATE","GIT_COMMITTER_NAME","GIT_COMMITTER_EMAIL","GIT_COMMITTER_DATE","GIT_NO_LAZY_FETCH","GIT_OPTIONAL_LOCKS","GIT_PAGER"]);
 const owned=new Set(["GIT_DIR","GIT_WORK_TREE","GIT_PREFIX","GIT_EXEC_PATH","GIT_NO_REPLACE_OBJECTS","GIT_TERMINAL_PROMPT"]);
 for(const key of Object.keys(process.env))if(key.startsWith("GIT_")&&!ordinary.has(key)&&!(mode==="pre-push"&&owned.has(key)))refuse("hook-git-environment-unsupported");
 if(process.env.GIT_DIR!==undefined&&canonical(path.resolve(cwd,process.env.GIT_DIR))!==expected.directory||
  process.env.GIT_WORK_TREE!==undefined&&canonical(path.resolve(cwd,process.env.GIT_WORK_TREE))!==root||
  process.env.GIT_PREFIX!==undefined&&process.env.GIT_PREFIX!==""||
  process.env.GIT_NO_REPLACE_OBJECTS!==undefined&&process.env.GIT_NO_REPLACE_OBJECTS!=="1"||
  process.env.GIT_TERMINAL_PROMPT!==undefined&&process.env.GIT_TERMINAL_PROMPT!=="0")refuse("hook-git-routing-mismatch");
 const env={...process.env};
 // Every removed value above has already been checked. GIT_EXEC_PATH is
 // checked against this actual trusted executable's own installation below.
 for(const key of owned)delete env[key];
 const program=hookProgram();
 if(process.env.GIT_EXEC_PATH!==undefined){
  let installed;try{installed=execFileSync(program,["--exec-path"],{env,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).replace(/\n$/,"");}catch{refuse("hook-git-program-unavailable");}
  if(canonical(process.env.GIT_EXEC_PATH)!==canonical(installed))refuse("hook-git-exec-path-mismatch");
 }
 return {status:/** @type {const} */("selected"),root,gitDirectory:expected.directory,commonDirectory:expected.common,env,program};
}
