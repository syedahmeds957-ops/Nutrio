/**
 * CI Guard: Enforces Rule 4 in Part 0 of BUILD_INSTRUCTIONS.md
 * Mechanically prevents free-tier keys from reaching production builds.
 */

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
