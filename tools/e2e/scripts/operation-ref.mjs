/** Exact local destination/correlation transactions. Policy, object identity
 * and operation ownership belong to the calling canonical operation. */
import {execFileSync} from "node:child_process";
export class OperationRefFinding extends Error {
 /** @param {string} code */
 constructor(code){super(`${code}: exact operation ref unavailable`);this.code=code;}
}
/** @param {string} code @returns {never} */
function refuse(code){throw new OperationRefFinding(code);}
/** @param {string} root @param {string[]} args @param {string|undefined} [input] */
function git(root,args,input){try{return execFileSync("git",["--no-replace-objects","-C",root,...args],{encoding:"utf8",maxBuffer:32*1024*1024,
 stdio:[input === undefined?"ignore":"pipe","pipe","pipe"],...(input === undefined?{}:{input}),env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}}).replace(/\n$/,"");}catch{refuse("OPERATION_GIT");}}
/** @param {string} root @param {string} ref @returns {string|null} */
export function readOperationRef(root,ref){
 const rows=git(root,["for-each-ref","--format=%(refname)%00%(objectname)%00%(symref)",ref]).split("\n").filter(Boolean).map(line=>line.split("\0")).filter(row=>row[0] === ref);
 if(!rows.length)return null;if(rows.length !== 1 || rows[0]?.[2] !== "")refuse("OPERATION_REF_ROUTING");return /** @type {string} */(rows[0]?.[1]);
}
/** @param {string} root @param {string} commit @param {string} tip */
export function operationDestinationContains(root,commit,tip){try{execFileSync("git",["--no-replace-objects","-C",root,"merge-base","--is-ancestor",commit,tip],{
 stdio:["ignore","pipe","pipe"],env:{...process.env,GIT_NO_LAZY_FETCH:"1",GIT_OPTIONAL_LOCKS:"0"}});return true;}
 catch(error){if(/** @type {any} */(error).status === 1)return false;refuse("OPERATION_GIT");}}
/** The only accepting transaction updates the expected destination and creates
 * its previously absent immutable operation witness together.
 * @param {string} root @param {{ref:string,commit:string,previousRevision:string,correlationRef:string}} intent */
export function acceptOperationRef(root,intent){
 if(!/^refs\/heads\/[^\s\x00-\x1f\x7f]+$/.test(intent.ref) || !/^refs\/supertaskr\/[^\s\x00-\x1f\x7f]+$/.test(intent.correlationRef) ||
  ![intent.commit,intent.previousRevision].every(id=>/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(id)))refuse("OPERATION_REF_ROUTING");
 git(root,["check-ref-format",intent.ref]);git(root,["check-ref-format",intent.correlationRef]);
 git(root,["update-ref","--stdin"],`start\nupdate ${intent.ref} ${intent.commit} ${intent.previousRevision}\ncreate ${intent.correlationRef} ${intent.commit}\nprepare\ncommit\n`);
}
