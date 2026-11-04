/**
 * Bundles one Supabase Edge Function into a single self-contained file.
 *
 * The functions import workspace packages (@nutrio/nutrition-core) and npm
 * packages (zod) the way Node resolves them, which the Deno edge runtime does
 * not. Bundling inlines everything, so the deployed function has no imports.
 *
 *   node scripts/build-edge-function.mjs coach-chat
 *   -> supabase/.build/supabase/functions/coach-chat/index.js
 *   -> supabase/.build/supabase/config.toml (points the CLI at that bundle)
 *
 * supabase/.build is a deploy-only project the Supabase CLI can push as-is:
 *   npx supabase functions deploy coach-chat --workdir supabase/.build --use-api
 */

import { build } from 'esbuild';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const require = createRequire(import.meta.url);

// npm packages the edge runtime loads itself via `npm:` specifiers, pinned to
// the installed version. Inlining zod alone made the bundle ~780 KB, too large
// to deploy through the Supabase API.
const RUNTIME_NPM_PACKAGES = ['zod'];
const runtimeNpm = {
  name: 'runtime-npm',
  setup(b) {
    const filter = new RegExp(`^(${RUNTIME_NPM_PACKAGES.join('|')})(/.*)?$`);
    b.onResolve({ filter }, (args) => {
      const pkg = args.path.split('/')[0];
      const { version } = JSON.parse(readFileSync(require.resolve(`${pkg}/package.json`), 'utf8'));
      return { path: `npm:${pkg}@${version}${args.path.slice(pkg.length)}`, external: true };
    });
  },
};
const name = process.argv[2];

if (!name || !/^[a-z0-9-]+$/.test(name)) {
  console.error('Usage: node scripts/build-edge-function.mjs <function-name>');
  process.exit(1);
}

const entry = join(repoRoot, 'supabase', 'functions', name, 'index.ts');
if (!existsSync(entry)) {
  console.error(`No edge function at ${entry}`);
  process.exit(1);
}

const deployRoot = join(repoRoot, 'supabase', '.build', 'supabase');
const outfile = join(deployRoot, 'functions', name, 'index.js');

await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  mainFields: ['module', 'main'],
  conditions: ['import', 'default'],
  // Workspace packages from their ES-module source rather than the compiled
  // CommonJS in dist/, which esbuild cannot tree-shake: the coach needs one
  // module of nutrition-core, not the meal solver and swapper too.
  alias: {
    '@nutrio/nutrition-core': join(repoRoot, 'packages', 'nutrition-core', 'src', 'index.ts'),
    '@nutrio/food-db': join(repoRoot, 'packages', 'food-db', 'src', 'index.ts'),
  },
  plugins: [runtimeNpm],
  minify: process.env.EDGE_MINIFY !== '0',
  legalComments: 'none',
  logLevel: 'info',
});

// The CLI looks for index.ts by default; point it at the bundle. JWT checks stay
// on: only signed-in users may spend the shared AI quota.
const configPath = join(deployRoot, 'config.toml');
const existing = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
const section = `[functions.${name}]\nentrypoint = "./functions/${name}/index.js"\nverify_jwt = true\n`;
const withoutOld = existing.replace(new RegExp(`\\[functions\\.${name}\\][^[]*`, 'g'), '');
mkdirSync(deployRoot, { recursive: true });
writeFileSync(configPath, `${withoutOld.trimEnd()}\n\n${section}`.trimStart());

console.log(`Built ${name} -> ${outfile}`);
