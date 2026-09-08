// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Extra node modules mapping for workspace packages
config.resolver.extraNodeModules = {
  '@nutrio/nutrition-core': path.resolve(monorepoRoot, 'packages/nutrition-core'),
  '@nutrio/food-db': path.resolve(monorepoRoot, 'packages/food-db'),
};

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Custom resolveRequest
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Direct mapping for internal workspace packages
  if (moduleName === '@nutrio/nutrition-core') {
    return (originalResolveRequest || context.resolveRequest)(
      context,
      path.resolve(monorepoRoot, 'packages/nutrition-core/dist/index.js'),
      platform
    );
  }

  if (moduleName === '@nutrio/food-db') {
    return (originalResolveRequest || context.resolveRequest)(
      context,
      path.resolve(monorepoRoot, 'packages/food-db/dist/index.js'),
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
