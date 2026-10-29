// Passive, process-inherited observation. It never suppresses or changes I/O.
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { syncBuiltinESMExports } = require('node:module');
const append = fs.appendFileSync;
const realpath = fs.realpathSync;
const roots = JSON.parse(process.env.SUPERTASKR_OBSERVE_PRIVATE_ROOTS || '[]');
const namespaces = JSON.parse(process.env.SUPERTASKR_OBSERVE_PRIVATE_NAMESPACES || '[]')
  .map(root => { try { return realpath(root); } catch { return path.resolve(root); } });
const log = process.env.SUPERTASKR_OBSERVE_PRIVATE_LOG;
if (log) append(log, JSON.stringify({kind:'observer-installed',pid:process.pid,roots,namespaces}) + '\n');
function observe(operation, value) {
  if (!log || typeof value === 'number') return;
  let absolute;
  try { absolute = path.resolve(value instanceof URL ? fileURLToPath(value) : String(value)); }
  catch { return; }
  const candidates = [absolute];
  try { const real = realpath(absolute); if (real !== absolute) candidates.push(real); } catch {}
  if (candidates.some(candidate => namespaces.some(root => {
    const relative = path.relative(root, candidate);
    return relative === '' || !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative);
  }))) {
    append(log, JSON.stringify({ operation, path: absolute }) + '\n');
    return;
  }
  for (const root of roots) {
    const relative = path.relative(root, absolute).split(path.sep).join('/');
    if (relative.startsWith('../') || path.isAbsolute(relative)) continue;
    if ((relative === 'docs' || relative.startsWith('docs/')) && relative !== 'docs/CAPABILITIES.md' && !relative.startsWith('docs/guide/') && (!relative.startsWith('docs/reference/') || relative === 'docs/reference/14-versions.md') ||
        relative === '.supertaskr/workspace.json' || relative === '.supertaskr/project.json') {
      append(log, JSON.stringify({ operation, path: absolute }) + '\n');
      break;
    }
  }
}
function wrapped(operation, original) {
  const instrumented = function (value, ...args) { observe(operation, value); return Reflect.apply(original, this, [value, ...args]); };
  Object.defineProperties(instrumented, Object.getOwnPropertyDescriptors(original));
  const native = Object.getOwnPropertyDescriptor(original, 'native');
  if (native && typeof native.value === 'function') Object.defineProperty(instrumented, 'native', { ...native, value: wrapped(operation + '.native', native.value) });
  return instrumented;
}
for (const name of ['readFile', 'readFileSync', 'open', 'openSync', 'stat', 'statSync', 'lstat', 'lstatSync',
  'access', 'accessSync', 'existsSync', 'readdir', 'readdirSync', 'opendir', 'opendirSync', 'realpath', 'realpathSync',
  'writeFile', 'writeFileSync', 'appendFile', 'appendFileSync', 'mkdir', 'mkdirSync', 'rm', 'rmSync', 'unlink', 'unlinkSync']) {
  const original = fs[name];
  if (typeof original !== 'function') continue;
  fs[name] = wrapped(name, original);
}
for (const name of ['readFile', 'open', 'stat', 'lstat', 'access', 'readdir', 'opendir', 'realpath',
  'writeFile', 'appendFile', 'mkdir', 'rm', 'unlink']) {
  const original = fs.promises[name];
  if (typeof original !== 'function') continue;
  fs.promises[name] = wrapped('promises.' + name, original);
}
syncBuiltinESMExports();
