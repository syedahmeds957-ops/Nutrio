
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..', '..');

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Workspace packages resolve to their TypeScript source, so edits show up live
const WORKSPACE_PACKAGES = {
  '@nutrio/nutrition-core': 'packages/nutrition-core',
  '@nutrio/food-db': 'packages/food-db',
  '@nutrio/workout-core': 'packages/workout-core',
};

config.resolver.extraNodeModules = Object.fromEntries(
  Object.entries(WORKSPACE_PACKAGES).map(([name, dir]) => [name, path.resolve(monorepoRoot, dir)])
);

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Custom resolveRequest
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Direct mapping for internal workspace packages
  if (WORKSPACE_PACKAGES[moduleName]) {
    return (originalResolveRequest || context.resolveRequest)(
      context,
      path.resolve(monorepoRoot, WORKSPACE_PACKAGES[moduleName], 'src/index.ts'),
      platform
    );
  }

  // Strip .js when importing local TypeScript files
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    const withoutJs = moduleName.slice(0, -3);
    const originDir = path.dirname(context.originModulePath);
    const targetPath = path.resolve(originDir, withoutJs);

    if (!fs.existsSync(targetPath + '.js')) {
      if (
        fs.existsSync(targetPath + '.tsx') ||
        fs.existsSync(targetPath + '.ts') ||
        fs.existsSync(path.join(targetPath, 'index.tsx')) ||
        fs.existsSync(path.join(targetPath, 'index.ts'))
      ) {
        return (originalResolveRequest || context.resolveRequest)(
          context,
          withoutJs,
          platform
        );
      }
    }
  }

  return (originalResolveRequest || context.resolveRequest)(
    context,
    moduleName,
    platform
  );
};

module.exports = config;
