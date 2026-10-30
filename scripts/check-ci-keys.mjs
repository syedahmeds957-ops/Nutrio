/**
 * CI Guard: Enforces Rules 3 and 4 in Part 0 of docs/planning/BUILD_INSTRUCTIONS.md
 * - Rule 3 (every environment): no AI provider key or direct provider call in
 *   the client. All model traffic goes through Supabase Edge Functions.
 * - Rule 4 (production): free-tier keys never reach production builds.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const PROVIDER_HOSTS = [
  'api.openai.com',
  'generativelanguage.googleapis.com',
  'api.groq.com',
  'api.anthropic.com',
  'openrouter.ai',
];
// Expo inlines every EXPO_PUBLIC_* value into the shipped bundle.
const CLIENT_AI_KEY_NAME = /^EXPO_PUBLIC_\w*(OPENAI|GEMINI|GROQ|ANTHROPIC|OPENROUTER)\w*/i;
// Literal provider keys: OpenAI/Anthropic/OpenRouter (sk-), Google (AIza), Groq (gsk_).
const PROVIDER_KEY_LITERAL = /\b(sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}|gsk_[A-Za-z0-9]{20,})/;
const CLIENT_SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs)$/;

function listClientSources(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' || entry.name === 'node_modules'
        ? []
        : listClientSources(full);
    }
    return CLIENT_SOURCE_EXT.test(entry.name) ? [full] : [];
  });
}

function checkClientHasNoProviderAccess() {
  // Every app under apps/ ships to users (mobile today; web and admin later).
  const appsDir = join(repoRoot, 'apps');
  const appDirs = existsSync(appsDir)
    ? readdirSync(appsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(appsDir, entry.name))
    : [];
  const errors = [];
  // Workspace packages are bundled into the app, so they count as client code.
  const packagesDir = join(repoRoot, 'packages');
  const packageSources = existsSync(packagesDir)
    ? readdirSync(packagesDir).flatMap((pkg) => listClientSources(join(packagesDir, pkg, 'src')))
    : [];
  const sources = [
    ...appDirs.flatMap((dir) => [join(dir, 'App.tsx'), ...listClientSources(join(dir, 'src'))]),
    ...packageSources,
  ];
  for (const file of sources.filter(existsSync)) {
    const text = readFileSync(file, 'utf8');
    for (const host of PROVIDER_HOSTS) {
      if (text.includes(host)) {
        errors.push(`${relative(repoRoot, file)} calls ${host} directly; route it through an edge function.`);
      }
    }
    if (PROVIDER_KEY_LITERAL.test(text)) {
      errors.push(`${relative(repoRoot, file)} contains what looks like an AI provider key.`);
    }
  }

  const envNames = Object.keys(process.env);
  // Every .env variant (.env, .env.local, .env.production, ...) in the root and the app.
  const envFiles = [repoRoot, ...appDirs].flatMap((dir) =>
    readdirSync(dir)
      .filter((name) => name.startsWith('.env') && !name.endsWith('.example'))
      .map((name) => join(dir, name))
  );
  for (const path of envFiles) {
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const name = line.trim().replace(/^export\s+/, '').split('=')[0].trim();
      if (name && !name.startsWith('#')) envNames.push(name);
    }
  }
  for (const name of new Set(envNames)) {
    if (CLIENT_AI_KEY_NAME.test(name)) {
      errors.push(`${name} would ship an AI provider key in the client bundle; set it as an edge function secret instead.`);
    }
  }
  return errors;
}

const clientErrors = checkClientHasNoProviderAccess();
if (clientErrors.length > 0) {
  console.error('\n❌ CI Key Guard failed (Rule 3: no AI keys or provider calls in the client):');
  clientErrors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
}
console.log('✅ Client contains no AI provider keys or direct provider calls.');

const env = process.env.APP_ENV || 'development';
const visionTier = process.env.VISION_TIER;
const visionProvider = process.env.VISION_PROVIDER;

console.log(`[CI Key Guard] Checking environment policies for APP_ENV=${env}...`);

if (env === 'production') {
  const errors = [];

  if (visionTier !== 'paid') {
    errors.push(`PRODUCTION ERROR: VISION_TIER must be explicitly 'paid' in production (got: '${visionTier}').`);
  }

  if (visionProvider === 'groq' && visionTier !== 'paid') {
    errors.push('PRODUCTION ERROR: Groq cannot be used in production under free tier.');
  }

  if (errors.length > 0) {
    console.error('\n❌ CI Key Guard failed:');
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log('✅ Production security and key guards passed.');
} else {
  console.log('ℹ️ Non-production environment. Key guard passed for local/staging.');
}
