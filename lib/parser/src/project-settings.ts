/** Pure PRODUCT data. Private records.validation stays opaque here; Node load
 * and seed MUST use the canonical records normalizer before returning ready. */
import { parseDocument } from 'yaml';
import { constraintFindings, parseProcessSchema, resolveProcess, RUNTIME_TEMPLATE } from './process-settings.js';
export const PROJECT_SETTINGS = 'supertaskr.yaml';
/** Shared finite method tier registry; numeric project policy is separate. */
export const VERIFICATION_TIERS = Object.freeze(['bounded', 'standard', 'guarded'] as const);
export type VerificationTier = typeof VERIFICATION_TIERS[number];
export type ProjectTierBudgets = Record<VerificationTier, { minutes: number; tokens: number }>;
export class ProjectSettingsFinding extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = 'ProjectSettingsFinding'; }
}
export interface ConfiguredCommand { cwd: string; argv: string[]; sentinel: string }
export interface ConfiguredSuite extends ConfiguredCommand { id: string; solo: boolean; family: string; why: string }
export interface DeliveryCiSelection { provider: 'github-actions'; host: 'github.com'; repository: string; workflow: string; event: 'push'; checks: string[] }
export interface ProjectPublication { remote: string; destinationRef: string; ci: DeliveryCiSelection }
export interface ProjectSettings {
  version: 1; roles: Record<string, string>;
  session_policy: { default: string; warn_after_turns: number };
  process: { profile: string; available: string[]; switches: Record<string, string> };
  suites: ConfiguredSuite[]; smoke: ConfiguredCommand | null;
  guard_class: Record<string, string[]>; bands: Record<string, unknown>[];
  names: Record<string, unknown> | null; languages: string[];
  records: { validation: Record<string, unknown> };
  publication?: ProjectPublication | null;
  tier_budgets?: ProjectTierBudgets | null;
}
function fail(field: string, why: string): never { throw new ProjectSettingsFinding('project-settings-invalid', `${PROJECT_SETTINGS}: ${field} ${why}`); }
function mapping(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(field, 'must be a mapping');
  return value as Record<string, unknown>;
}
function fields(value: Record<string, unknown>, keys: string[], field: string) {
  if (Object.keys(value).sort().join(',') !== [...keys].sort().join(',')) fail(field, `requires exactly ${keys.join(', ')}`);
}
function text(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '' || /[\x00-\x1f\x7f]/.test(value)) fail(field, 'must be nonempty text without control characters');
}
function strings(value: unknown, field: string, empty = true): asserts value is string[] {
  if (!Array.isArray(value) || (!empty && value.length === 0)) fail(field, 'must be an explicit array');
  value.forEach((entry, at) => text(entry, `${field}[${at}]`));
  if (new Set(value).size !== value.length) fail(field, 'contains duplicate values');
}
/** Only explicit positive project denominators qualify a loop share. */
export function normalizeProjectTierBudgets(input: unknown): ProjectTierBudgets {
  const tiers=mapping(input,'tier_budgets');fields(tiers,[...VERIFICATION_TIERS],'tier_budgets');
  const result={} as ProjectTierBudgets;
  for(const tier of VERIFICATION_TIERS) {
    const budget=mapping(tiers[tier],`tier_budgets.${tier}`);fields(budget,['minutes','tokens'],`tier_budgets.${tier}`);
    for(const field of ['minutes','tokens']) if(typeof budget[field]!=='number'||!Number.isFinite(budget[field])||Number(budget[field])<=0)fail(`tier_budgets.${tier}.${field}`,'must be an explicit positive finite number');
    result[tier]={minutes:budget.minutes as number,tokens:budget.tokens as number};
  }
  return freezeSettings(result);
}
/** Exact branch ref data. Effects still ask Git and freeze the actual remote
 * destination; this grants no publication permission or run selection. */
export function isDeliveryBranchRef(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('refs/heads/') && !value.endsWith('/') && !value.endsWith('.') &&
    !/[\x00-\x20\x7f~^:?*\[\\]/.test(value) && !value.includes('..') && !value.includes('@{') &&
    value.split('/').every(part => part !== '' && !part.startsWith('.') && !part.endsWith('.lock'));
}
/** Selection-only canonical policy. Actual head/run/attempt/check IDs belong
 * to provider observation and cannot be fabricated for settings validation. */
export function normalizeDeliveryCiSelection(input: unknown): DeliveryCiSelection {
  const ci = mapping(input, 'publication.ci'); fields(ci, ['provider', 'host', 'repository', 'workflow', 'event', 'checks'], 'publication.ci');
  for (const key of ['provider', 'host', 'repository', 'workflow', 'event']) text(ci[key], `publication.ci.${key}`);
  if (ci.provider !== 'github-actions' || ci.host !== 'github.com' || ci.event !== 'push') throw new ProjectSettingsFinding('project-settings-publication-unsupported', 'Only explicit github-actions/github.com push selection is currently supported');
  if (typeof ci.repository !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(ci.repository)) fail('publication.ci.repository', 'must be one exact owner/repository identity');
  if (typeof ci.workflow !== 'string' || !/^\.github\/workflows\/[A-Za-z0-9_.-]+\.ya?ml$/.test(ci.workflow)) fail('publication.ci.workflow', 'must be an exact workflow file path');
  strings(ci.checks, 'publication.ci.checks', false);
  if (ci.checks.length > 64 || ci.checks.some(name => name.length > 256 || name.trim() !== name)) fail('publication.ci.checks', 'requires 1–64 unique exact names of at most 256 characters, without surrounding whitespace');
  return freezeSettings({ provider: ci.provider, host: ci.host, repository: ci.repository.toLowerCase(), workflow: ci.workflow, event: ci.event, checks: [...ci.checks] });
}
export function normalizeProjectPublication(input: unknown): ProjectPublication {
  const selection = mapping(input, 'publication'); fields(selection, ['remote', 'destinationRef', 'ci'], 'publication');
  if (typeof selection.remote !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(selection.remote)) fail('publication.remote', 'must be a finite local Git remote name, never a URL, option or path');
  if (!isDeliveryBranchRef(selection.destinationRef)) fail('publication.destinationRef', 'must be one exact refs/heads/ destination');
  return freezeSettings({ remote: selection.remote, destinationRef: selection.destinationRef, ci: normalizeDeliveryCiSelection(selection.ci) });
}
/** Portable paths; effects must also check physical containment. */
export function settingsRelativePath(value: unknown, allowRoot = false): value is string {
  return typeof value === 'string' && (allowRoot && value === '.' || value !== '' && !/^(?:[A-Za-z]:|\/)/.test(value) &&
    !/[\\\x00-\x1f\x7f]/.test(value) && value.split('/').every(part => part && !['.', '..', '.git', '.supertaskr'].includes(part)));
}
/** Guard maps use the existing literal file/directory/terminal-prefix grammar.
 * Command cwd and sentinel paths deliberately keep their stricter file form. */
function guardPath(token: string): boolean {
  let base = token;
  if (base.endsWith('*')) { base = base.slice(0, -1); if (base.endsWith('/')) base = base.slice(0, -1); }
  else if (base.endsWith('/')) base = base.slice(0, -1);
  return !token.includes('//') && !base.includes('*') && settingsRelativePath(base);
}
function command(value: unknown, field: string, suite: boolean) {
  const row = mapping(value, field);
  fields(row, suite ? ['id', 'cwd', 'argv', 'sentinel', 'solo', 'family', 'why'] : ['cwd', 'argv', 'sentinel'], field);
  if (!settingsRelativePath(row.cwd, true)) fail(`${field}.cwd`, 'must stay within PRODUCT');
  if (!settingsRelativePath(row.sentinel)) fail(`${field}.sentinel`, 'must be a relative file within cwd');
  if (!Array.isArray(row.argv) || !row.argv.length) fail(`${field}.argv`, 'must be a nonempty argv array');
  row.argv.forEach((entry, at) => { if (typeof entry !== 'string' || /[\x00-\x1f\x7f]/.test(entry) || at === 0 && entry.trim() === '') fail(`${field}.argv[${at}]`, 'must be a literal argument'); });
  if (suite) {
    text(row.id, `${field}.id`); text(row.family, `${field}.family`); text(row.why, `${field}.why`);
    if (!/^[a-z][a-z0-9_-]*$/.test(row.id)) fail(`${field}.id`, 'must be a stable lowercase identifier');
    if (typeof row.solo !== 'boolean') fail(`${field}.solo`, 'must be a boolean');
  }
}
function band(value: unknown, field: string) {
  const row = mapping(value, field);
  fields(row, ['id', 'metric', 'unit', 'healthy', 'drift', 'breach', 'authority', 'measured'], field);
  for (const key of ['id', 'metric', 'unit']) text(row[key], `${field}.${key}`);
  if (!['above', 'below'].includes(String(row.healthy))) fail(`${field}.healthy`, 'must be above or below');
  for (const key of ['drift', 'breach']) if (row[key] !== null && (typeof row[key] !== 'number' || !Number.isFinite(row[key]))) fail(`${field}.${key}`, 'must be finite or explicitly null');
  const authority = mapping(row.authority, `${field}.authority`);
  if (!['tree', 'readings', 'none'].includes(String(authority.kind))) fail(`${field}.authority.kind`, 'is unsupported');
  fields(authority, authority.kind === 'readings' || authority.kind === 'tree' && Object.hasOwn(authority, 'marker') ? ['kind', 'name', 'marker'] : authority.kind === 'none' ? ['kind', 'name', 'keeper'] : ['kind', 'name'], `${field}.authority`);
  for (const [key, value] of Object.entries(authority)) text(value, `${field}.authority.${key}`);
  const measured = mapping(row.measured, `${field}.measured`); fields(measured, ['at', 'reason'], `${field}.measured`);
  text(measured.at, `${field}.measured.at`); text(measured.reason, `${field}.measured.reason`);
}
export function freezeSettings<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freezeSettings); Object.freeze(value); }
  return value;
}
/** Validates PRODUCT shape/process, not private-policy semantics or run readiness. */
export function parseSettings(source: string, schemaText: string): { settings: ProjectSettings; processValues: Readonly<Record<string, string>> } {
  let input: unknown;
  try { const document = parseDocument(source, { uniqueKeys: true }); if (document.errors.length) throw document.errors[0]; input = document.toJS({ maxAliasCount: 0 }); }
  catch (error) { fail('YAML', error instanceof Error ? error.message : String(error)); }
  const data = mapping(input, 'root');
  fields(data, ['version', 'roles', 'session_policy', 'process', 'suites', 'smoke', 'guard_class', 'bands', 'names', 'languages', 'records', ...(Object.hasOwn(data, 'publication') ? ['publication'] : []), ...(Object.hasOwn(data, 'tier_budgets') ? ['tier_budgets'] : [])], 'root');
  if (data.version !== 1) fail('version', 'must be 1');
  const roles = mapping(data.roles, 'roles');
  for (const role of ['planner', 'builder', 'verifier', 'integrator', 'janitor']) text(roles[role], `roles.${role}`);
  for (const [role, value] of Object.entries(roles)) { if (!/^[a-z][a-z0-9_-]*$/.test(role)) fail('roles', 'has an invalid role key'); text(value, `roles.${role}`); }
  const session = mapping(data.session_policy, 'session_policy'); fields(session, ['default', 'warn_after_turns'], 'session_policy');
  if (!['fresh', 'resume'].includes(String(session.default)) || !Number.isSafeInteger(session.warn_after_turns) || Number(session.warn_after_turns) < 1) fail('session_policy', 'requires a named default and positive turn bound');
  const process = mapping(data.process, 'process'); fields(process, ['profile', 'available', 'switches'], 'process');
  text(process.profile, 'process.profile'); strings(process.available, 'process.available', false);
  const overrides = mapping(process.switches, 'process.switches'); Object.entries(overrides).forEach(([key, value]) => text(value, `process.switches.${key}`));
  let processValues: Record<string, string>;
  try {
    const schema = parseProcessSchema(schemaText);
    const resolved = resolveProcess(schema, { profile: process.profile, available: process.available, overrides: new Map(Object.entries(overrides) as [string, string][]) });
    const problems = constraintFindings(schema, resolved); if (problems.length) fail('process', `has forbidden combinations: ${problems.join('; ')}`);
    processValues = Object.fromEntries(resolved.values);
  } catch (error) { fail('process', (error instanceof Error ? error.message : String(error)).replaceAll(RUNTIME_TEMPLATE, PROJECT_SETTINGS)); }
  if (!Array.isArray(data.suites)) fail('suites', 'must be an explicit array');
  data.suites.forEach((entry, at) => command(entry, `suites[${at}]`, true));
  if (new Set(data.suites.map(entry => entry.id)).size !== data.suites.length) fail('suites', 'contains duplicate ids');
  if (data.smoke !== null) command(data.smoke, 'smoke', false);
  const guards = mapping(data.guard_class, 'guard_class');
  for (const [name, paths] of Object.entries(guards)) { text(name, 'guard_class key'); strings(paths, `guard_class.${name}`, false); if (paths.some(token => !guardPath(token))) fail(`guard_class.${name}`, 'contains an unsafe fence path'); }
  if (!Array.isArray(data.bands)) fail('bands', 'must be an explicit array'); data.bands.forEach((entry, at) => band(entry, `bands[${at}]`));
  if (data.names !== null) mapping(data.names, 'names'); strings(data.languages, 'languages');
  const records = mapping(data.records, 'records'); fields(records, ['validation'], 'records'); mapping(records.validation, 'records.validation');
  if (data.publication !== undefined && data.publication !== null) data.publication = normalizeProjectPublication(data.publication);
  if (data.tier_budgets !== undefined && data.tier_budgets !== null) data.tier_budgets = normalizeProjectTierBudgets(data.tier_budgets);
  return freezeSettings({ settings: data as unknown as ProjectSettings, processValues });
}
/** A valid initial datum is not executable configuration. */
export function missingSettings(settings: ProjectSettings, section: 'suites' | 'smoke' | 'guard_class' | 'bands' | 'names' | 'languages' | 'publication' | 'tier_budgets'): string | null {
  if (!['suites', 'smoke', 'guard_class', 'bands', 'names', 'languages', 'publication', 'tier_budgets'].includes(section)) fail('section', 'is unsupported');
  const value = settings[section];
  return value === undefined || value === null || Array.isArray(value) && value.length === 0 || typeof value === 'object' && Object.keys(value).length === 0 ? `missing configuration: ${section}` : null;
}
