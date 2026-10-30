/** Authored project configuration using the canonical verified TOOL seed. */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { testToolRuntime } from "./tool-runtime";
import { SOURCE_CI_SUITES } from "../scripts/source-ci-contract.mjs";
import { NO_BACKGROUND_MAINTENANCE } from "../tests/git-fixture";
const seedCode = `import path from 'node:path';import {pathToFileURL} from 'node:url';
const root=process.argv[1],at=name=>pathToFileURL(path.join(root,'tools/e2e/scripts',name+'.mjs')).href;
const checker=await import(at('records-check')),settings=await import(at('project-settings')),profile=await import(at('records-validation'));
const seed=settings.seedProjectSettings({tool:checker.loadInstalledRecordTool(),recordsValidation:profile.GENERIC_RECORD_PROFILE});
if(seed.status!=='ready')throw Error(JSON.stringify(seed));const data=structuredClone(seed.settings);data.suites=JSON.parse(process.argv[2]);process.stdout.write(JSON.stringify(data)+'\\n');`;
export function configureGateFixture(root: string, suites: readonly unknown[]=Object.values(SOURCE_CI_SUITES)) {
  const installation=testToolRuntime();
  const source=execFileSync(process.execPath,["--input-type=module","-e",seedCode,installation.runtimeRoot,JSON.stringify(suites)],{encoding:"utf8",stdio:["ignore","pipe","pipe"]});
  writeFileSync(path.join(root,"supertaskr.yaml"),source);
  const git=(...args:string[])=>execFileSync("git",["-C",root,...NO_BACKGROUND_MAINTENANCE,...args],{stdio:"pipe"});
  git("add","--","supertaskr.yaml");git("-c","user.name=Configured fixture","-c","user.email=fixture@example.invalid","commit","-qm","Configure authored project suites");
  return installation;
}
