/** Portable backup front. It needs the artifact and a new restore destination,
 * never a selected project, current binding or inherited operation authority. */
import path from "node:path";
import {realpathSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {inspectPrivateBackup,restorePrivateBackup} from "./records-backup.mjs";
import {loadInstalledRecordTool,requireInstalledRuntimeAssets} from "./records-check.mjs";

const HELP="supertaskr backup inspect FILE\nsupertaskr backup restore FILE --to NEW_RECORDS\n"+
  "Restore only into a new directory. Existing or partial targets are preserved.\n"+
  "No project binding, credentials, runtime or worker authority is restored.\n";
/** @param {string} value */
function fileArgument(value){return typeof value==="string"&&value.length>0&&!value.startsWith("--")&&!/[\x00-\x1f\x7f]/.test(value);}
/** @param {string[]} args @param {{out:(text:string)=>unknown,err:(text:string)=>unknown}} [io] */
export function backupMain(args,io={out:text=>process.stdout.write(text),err:text=>process.stderr.write(text)}){
  if(args.length===1&&args[0]==="--help"){io.out(HELP);return 0;}
  const inspect=args.length===2&&args[0]==="inspect",restore=args.length===4&&args[0]==="restore"&&args[2]==="--to";
  if(!(inspect||restore)||!fileArgument(/** @type {string} */(args[1]))||restore&&!fileArgument(/** @type {string} */(args[3]))){io.err(HELP);return 2;}
  try{
    const tool=loadInstalledRecordTool();
    requireInstalledRuntimeAssets(tool,["tools/e2e/scripts/records-backup-command.mjs","tools/e2e/scripts/records-backup.mjs"]);
    const file=path.resolve(/** @type {string} */(args[1]));
    if(restore)io.out(JSON.stringify(restorePrivateBackup({file,directory:path.resolve(/** @type {string} */(args[3]))}),null,2)+"\n");
    else{
      const result=inspectPrivateBackup(file);
      io.out(JSON.stringify({...result,paths:result.paths.length,authority:"not-imported"},null,2)+"\n");
    }
    return 0;
  }catch(error){
    const code=typeof /** @type {any} */(error)?.code==="string"?/** @type {any} */(error).code:"private-backup-unavailable";
    io.err(`${code}: private backup operation unavailable. Preserve any partial new destination; existing records and bindings were not replaced.\n`);return 3;
  }
}
let direct=false;
try{direct=!!process.argv[1]&&realpathSync(process.argv[1])===realpathSync(fileURLToPath(import.meta.url));}catch{/* Imports never start a restore. */}
if(direct)process.exitCode=backupMain(process.argv.slice(2));
