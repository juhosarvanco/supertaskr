import {spawnSync} from "node:child_process";
import {test,expect} from "@playwright/test";
import {ordinaryRecordTextPath,normalizeRecordProfile,GENERIC_RECORD_PROFILE} from "../scripts/records-profile.mjs";
import {ordinaryRecordTextPath as previousPath,normalizeRecordProfile as previousProfile} from "../scripts/records-validation.mjs";
import {RecordReaderFinding} from "../scripts/records.mjs";
import {RecordReaderFinding as SharedFinding} from "../scripts/records-finding.mjs";

test("canonical pure profiles preserve existing eligibility normalization and error identity",()=>{
 expect(previousPath).toBe(ordinaryRecordTextPath);expect(previousProfile).toBe(normalizeRecordProfile);expect(RecordReaderFinding).toBe(SharedFinding);
 for(const file of ["docs/STATE.md","docs/tasks/T-001-first.md","docs/rooms/2026 note.md","docs/research/Ääni/notes.md"])expect(ordinaryRecordTextPath(file),file).toBe(true);
 for(const file of ["rules/file","docs/INDEX.md","docs/CAPABILITIES.md","docs/decisions/024-the-proportionate-loop.md",".supertaskr/session.json","docs/rooms/note.json"])expect(ordinaryRecordTextPath(file),file).toBe(false);
 expect(normalizeRecordProfile(undefined)).toEqual({version:1,kind:"dogfood"});
 const input={...GENERIC_RECORD_PROFILE,budgets:{"docs/STATE.md":{warn:4,fail:8}}},normalized=normalizeRecordProfile(input);input.budgets["docs/STATE.md"].warn=3;
 expect(normalized.budgets["docs/STATE.md"].warn).toBe(4);expect(Object.isFrozen(normalized.budgets["docs/STATE.md"])).toBe(true);
 let error;try{normalizeRecordProfile({version:1,kind:"generic",indexInputs:[],budgets:{}});}catch(e){error=e;}
 expect(error).toBeInstanceOf(RecordReaderFinding);expect(error).toMatchObject({code:"records-profile-invalid",name:"RecordReaderFinding"});
});
test("cold profile classification loads no committed or qualified reader and shared finding loads no generated parser",()=>{
 const profile=new URL("../scripts/records-profile.mjs",import.meta.url).href,finding=new URL("../scripts/records-finding.mjs",import.meta.url).href;
 const code=`import {registerHooks} from 'node:module';registerHooks({load(url,context,next){if(/\\/(qualified-reservation|records|records-context)\\.mjs$/.test(url))throw Error('unexpected capture dependency');return next(url,context);}});const p=await import(process.argv[1]);if(p.ordinaryRecordTextPath('rules/file')||!p.ordinaryRecordTextPath('docs/STATE.md'))throw Error('classification changed');console.log(JSON.stringify(p.normalizeRecordProfile(undefined)));`;
 const result=spawnSync(process.execPath,["--input-type=module","-e",code,profile],{encoding:"utf8"});expect(result.status,result.stdout+result.stderr).toBe(0);expect(JSON.parse(result.stdout)).toEqual({version:1,kind:"dogfood"});
 const noParser=`import {registerHooks} from 'node:module';registerHooks({load(url,context,next){if(url.includes('/lib/parser/dist/')||/\\/records\\.mjs$/.test(url))throw Error('unexpected dependency');return next(url,context);}});const {RecordReaderFinding}=await import(process.argv[1]);console.log(new RecordReaderFinding('named','detail').code);`;
 const cold=spawnSync(process.execPath,["--input-type=module","-e",noParser,finding],{encoding:"utf8"});expect(cold.status,cold.stdout+cold.stderr).toBe(0);expect(cold.stdout).toBe("named\n");
});
