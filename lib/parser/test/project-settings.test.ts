import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { parseSettings, missingSettings, PROJECT_SETTINGS, ProjectSettingsFinding, normalizeDeliveryCiSelection, normalizeProjectPublication, isDeliveryBranchRef, VERIFICATION_TIERS, normalizeProjectTierBudgets } from '../src/pure.js';
import { parseProcessSchema } from '../src/process-settings.js';
const schema = readFileSync(new URL('../../../method/runtime/process-schema.yaml', import.meta.url), 'utf8');
const datum = () => ({ version: 1, roles: Object.fromEntries(['planner', 'builder', 'verifier', 'integrator', 'janitor'].map(role => [role, 'example@fresh'])),
  session_policy: { default: 'fresh', warn_after_turns: 20 }, process: { profile: 'standard', available: [...parseProcessSchema(schema).profiles.keys()], switches: {} },
  suites: [], smoke: null, guard_class: {}, bands: [], names: null, languages: [], records: { validation: { explicit: 'opaque policy requires Node normalization' } } });
describe('canonical PRODUCT settings datum', () => {
  it('accepts explicit initial empties without treating them as operation readiness', () => {
    expect(PROJECT_SETTINGS).toBe('supertaskr.yaml');
    const parsed = parseSettings(stringify(datum()), schema);
    for (const section of ['suites', 'smoke', 'guard_class', 'bands', 'names', 'languages'] as const) expect(missingSettings(parsed.settings, section)).toBe(`missing configuration: ${section}`);
    expect(Object.keys(parsed.processValues).length).toBeGreaterThan(20);
    expect(Object.isFrozen(parsed.settings.roles)).toBe(true);
    expect(() => { parsed.settings.languages.push('inferred'); }).toThrow();
  });
  it('accepts an explicit foreign suite argv without inferring a language or using shell text', () => {
    const source: any = datum(); source.languages = ['python'];
    source.suites = [{ id: 'python', cwd: '.', sentinel: 'pyproject.toml', argv: ['python3', '-m', 'unittest', 'discover'], solo: false, family: 'unittest', why: 'Authored Python project suite' }];
    const parsed = parseSettings(stringify(source), schema);
    expect(parsed.settings.suites[0]?.argv).toEqual(source.suites[0].argv);
    expect(missingSettings(parsed.settings, 'suites')).toBeNull(); expect(missingSettings(parsed.settings, 'names')).not.toBeNull();
  });
  it('retains an explicit tree selector without inventing one for legacy data', () => {
    const source: any=datum();
    source.bands=[{id:'private-suggestions',metric:'Selected suggestion count',unit:'cards',healthy:'below',drift:3,breach:5,
      authority:{kind:'tree',name:'Selected committed records',marker:'triage/live-suggestions'},measured:{at:'fixture',reason:'Authored control'}}];
    expect(parseSettings(stringify(source),schema).settings.bands[0]?.authority).toEqual(source.bands[0].authority);
    delete source.bands[0].authority.marker;
    expect(parseSettings(stringify(source),schema).settings.bands[0]?.authority).toEqual({kind:'tree',name:'Selected committed records'});
    source.bands[0].authority.selector='hidden alternate selector';
    expect(()=>parseSettings(stringify(source),schema)).toThrow();
  });
  it.each([
    ['missing explicit policy', (v: any) => { delete v.records.validation; }],
    ['missing languages', (v: any) => { delete v.languages; }],
    ['unknown root key', (v: any) => { v.dispatch = {}; }],
    ['duplicate languages', (v: any) => { v.languages = ['python', 'python']; }],
    ['shell command string', (v: any) => { v.smoke = { cwd: '.', sentinel: 'pyproject.toml', argv: 'python -m app' }; }],
    ['escaping cwd', (v: any) => { v.smoke = { cwd: '../other', sentinel: 'x', argv: ['x'] }; }],
    ['Windows absolute sentinel', (v: any) => { v.smoke = { cwd: '.', sentinel: 'C:/outside', argv: ['x'] }; }],
    ['wrong switch', (v: any) => { v.process.switches = { unknown: 'on' }; }],
    ['floor override', (v: any) => { v.process.switches = { 'fence.hook': 'off' }; }],
    ['hidden profile column', (v: any) => { v.process.available = ['standard']; }],
    ['unknown profile', (v: any) => { v.process.profile = 'invented'; }],
    ['incomplete band', (v: any) => { v.bands = [{id:'example'}]; }],
  ])('refuses %s', (_name, mutate) => { const input = datum(); mutate(input); expect(() => parseSettings(stringify(input), schema)).toThrow(); });
  it('refuses duplicate YAML keys and aliases rather than choosing a silent value', () => {
    const source = stringify(datum());
    expect(() => parseSettings(source + 'version: 1\n', schema)).toThrow();
    expect(() => parseSettings(source.replace('languages: []', 'languages: &stack [python]\nunused: *stack'), schema)).toThrow();
  });
  it('preserves literal directory and terminal-prefix guard tokens without weakening command paths', () => {
    const source: any = datum();
    source.guard_class = { gates: ['.claude/', 'tools/gate-*', 'src/*', 'exact/file.ts'] };
    expect(parseSettings(stringify(source), schema).settings.guard_class).toEqual(source.guard_class);
    for (const token of ['../', '/outside/', 'C:/outside/', 'src//', 'src//gate*', 'src/**', '*', '.supertaskr/', 'src/../gate*', 'src/a*b']) {
      source.guard_class.gates = [token]; expect(() => parseSettings(stringify(source), schema), token).toThrow();
    }
    source.guard_class.gates = ['src/']; source.smoke = { cwd: 'src/', sentinel: 'main.ts', argv: ['node', 'main.ts'] };
    expect(() => parseSettings(stringify(source), schema)).toThrow();
  });
});

describe('explicit loop-share tier budgets',()=>{
  const budgets=()=>({bounded:{minutes:2,tokens:1000},standard:{minutes:10,tokens:5000},guarded:{minutes:15,tokens:9000}});
  it('shares the finite classifier registry and never supplies missing denominators',()=>{
    expect(VERIFICATION_TIERS).toEqual(['bounded','standard','guarded']);
    const source:any=datum();expect(missingSettings(parseSettings(stringify(source),schema).settings,'tier_budgets')).toBe('missing configuration: tier_budgets');
    source.tier_budgets=null;expect(missingSettings(parseSettings(stringify(source),schema).settings,'tier_budgets')).toBe('missing configuration: tier_budgets');
    source.tier_budgets=budgets();const parsed=parseSettings(stringify(source),schema);
    expect(parsed.settings.tier_budgets).toEqual(budgets());expect(Object.isFrozen(parsed.settings.tier_budgets?.bounded)).toBe(true);
  });
  it.each(['missing','unknown','zero','negative','infinite','string','extra'])('refuses %s policy data',(variant)=>{
    const data:any=budgets();
    if(variant==='missing')delete data.standard;
    if(variant==='unknown'){data.custom=data.guarded;delete data.guarded;}
    if(variant==='zero')data.bounded.minutes=0;
    if(variant==='negative')data.bounded.tokens=-1;
    if(variant==='infinite')data.standard.tokens=Infinity;
    if(variant==='string')data.guarded.minutes='15 minutes';
    if(variant==='extra')data.guarded.fallback=true;
    expect(()=>normalizeProjectTierBudgets(data)).toThrow(ProjectSettingsFinding);
  });
});

const publication = () => ({ remote: 'origin', destinationRef: 'refs/heads/main', ci: { provider: 'github-actions', host: 'github.com', repository: 'Owner/Project', workflow: '.github/workflows/checks.yml', event: 'push', checks: ['Python / linux', 'source checks'] } });
describe('explicit publication selection data', () => {
  it('keeps missing/null unconfigured and normalizes exact identities without run/head inference', () => {
    const absent = parseSettings(stringify(datum()), schema); expect(missingSettings(absent.settings, 'publication')).toBe('missing configuration: publication');
    const nullInput = { ...datum(), publication: null }; expect(missingSettings(parseSettings(stringify(nullInput), schema).settings, 'publication')).toBe('missing configuration: publication');
    const input = publication(), parsed = parseSettings(stringify({ ...datum(), publication: input }), schema);
    expect(parsed.settings.publication).toEqual({ ...input, ci: { ...input.ci, repository: 'owner/project' } });
    expect(input.ci.repository).toBe('Owner/Project'); expect(Object.isFrozen(input.ci.checks)).toBe(false);
    expect(missingSettings(parsed.settings, 'publication')).toBeNull(); expect(Object.isFrozen(parsed.settings.publication?.ci.checks)).toBe(true);
    expect(parsed.settings.publication?.ci).not.toHaveProperty('headCommit'); expect(parsed.settings.publication?.ci).not.toHaveProperty('run');
    expect(normalizeDeliveryCiSelection({ ...input.ci, checks: ['literal*name'] }).checks).toEqual(['literal*name']);
  });
  it.each([
    ['remote URL', (v: any) => { v.remote = 'https://github.com/owner/project'; }],
    ['remote option', (v: any) => { v.remote = '--mirror'; }],
    ['remote path', (v: any) => { v.remote = '../other'; }],
    ['shorthand ref', (v: any) => { v.destinationRef = 'main'; }],
    ['tag target', (v: any) => { v.destinationRef = 'refs/tags/v1'; }],
    ['missing explicit host', (v: any) => { delete v.ci.host; }],
    ['unsupported provider', (v: any) => { v.ci.provider = 'invented'; }],
    ['unsupported host', (v: any) => { v.ci.host = 'enterprise.invalid'; }],
    ['different event', (v: any) => { v.ci.event = 'pull_request'; }],
    ['workflow wildcard', (v: any) => { v.ci.workflow = '.github/workflows/*.yml'; }],
    ['empty checks', (v: any) => { v.ci.checks = []; }],
    ['duplicate identity', (v: any) => { v.ci.checks = ['unit', 'unit']; }],
    ['trimmed identity', (v: any) => { v.ci.checks = [' unit']; }],
    ['oversized identity', (v: any) => { v.ci.checks = ['x'.repeat(257)]; }],
    ['too many checks', (v: any) => { v.ci.checks = Array.from({length:65}, (_,at)=>`check-${at}`); }],
    ['caller run selection', (v: any) => { v.ci.run = {id:1,attempt:1}; }],
  ])('refuses %s rather than supplying defaults', (_name, mutate) => { const input = publication(); mutate(input); expect(() => normalizeProjectPublication(input)).toThrow(ProjectSettingsFinding); });
  it('agrees with Git on representative exact branch destinations and invalid spellings', () => {
    for (const ref of ['refs/heads/main', 'refs/heads/feature/topic', 'refs/heads/café', 'refs/heads/releases/v1.0', 'HEAD', 'refs/heads/', 'refs/heads/a..b', 'refs/heads/a.lock', 'refs/heads/.hidden', 'refs/heads/a/', 'refs/heads/a.', 'refs/heads/a@{1}', 'refs/heads/a b', 'refs/heads/a?b', 'refs/heads/a//b']) {
      const git = spawnSync('git', ['check-ref-format', ref]); expect(git.error).toBeUndefined(); expect(isDeliveryBranchRef(ref), ref).toBe(git.status === 0 && ref.startsWith('refs/heads/'));
    }
  });
});
