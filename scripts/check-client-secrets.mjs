#!/usr/bin/env node
// Fails if server-only secrets or modules can leak into client code/bundles.
// 1) Source scan: client-side code must not reference secret env names or
//    import server-only modules.
// 2) Bundle scan (if built): Next.js client chunks must not contain secret
//    env names or service-role markers.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Actual secret material / names (the literal strings "service_role" and
// "sb_secret_" legitimately appear in the client-side key guard).
const SECRET_PATTERNS = [
  /SUPABASE_SERVICE_ROLE_KEY/,
  /sb_secret_[A-Za-z0-9][A-Za-z0-9_-]{19,}/,
  /InJvbGUiOiJzZXJ2aWNlX3JvbGUi|eyJyb2xlIjoic2VydmljZV9yb2xlI/, // base64 of "role":"service_role" in a JWT payload
];
const problems = [];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|mjs|hbc)$/.test(name)) out.push(p);
  }
  return out;
}

// Mobile: everything ships to devices.
for (const file of walk('apps/mobile/src')) {
  const src = readFileSync(file, 'utf8');
  for (const s of ['SUPABASE_SERVICE_ROLE_KEY', 'sb_secret_']) if (src.includes(s)) problems.push(`${file}: references ${s}`);
  if (/@ftn\/supabase\/server/.test(src)) problems.push(`${file}: imports server-only module`);
}

// Web client components.
for (const file of walk('apps/web/src')) {
  const src = readFileSync(file, 'utf8');
  if (!/^['"]use client['"]/.test(src.trimStart())) continue;
  if (src.includes('SUPABASE_SERVICE_ROLE_KEY')) problems.push(`${file}: client component references service key`);
  if (/@ftn\/supabase\/server|request-context|server-env/.test(src)) problems.push(`${file}: client component imports server module`);
}

// Shared client package must not read secrets.
for (const file of walk('packages/supabase/src').filter((f) => !f.includes('/server/'))) {
  if (readFileSync(file, 'utf8').includes('SUPABASE_SERVICE_ROLE_KEY')) problems.push(`${file}: references service key`);
}

// Built client bundles: Next.js static chunks and an Expo export, if present.
const chunks = [...walk('apps/web/.next/static'), ...walk(process.env.EXPO_EXPORT_DIR ?? 'apps/mobile/dist')];
for (const file of chunks) {
  const src = readFileSync(file, 'latin1');
  for (const re of SECRET_PATTERNS) if (re.test(src)) problems.push(`${file}: client bundle matches ${re}`);
}

if (problems.length) {
  console.error('Client secret check FAILED:\n' + problems.map((p) => ` - ${p}`).join('\n'));
  process.exit(1);
}
console.log(`Client secret check passed (${chunks.length} client chunks scanned).`);
