import Module from 'node:module';

/**
 * Images are bundled with static `require('….jpg')` calls, which is what Metro
 * needs. Under vitest those requires go to Node's own loader, which would try
 * to parse a JPEG as JavaScript; an import alias can't catch them because
 * require() never goes through Vite. So Node is taught to load image files as
 * `{ uri: <path> }`, enough for tests to check which file a screen points at.
 */
type Loader = (module: { exports: unknown }, filename: string) => void;
const extensions = (Module as unknown as { _extensions: Record<string, Loader> })._extensions;

for (const ext of ['.jpg', '.jpeg', '.png']) {
  extensions[ext] = (module, filename) => {
    module.exports = { uri: filename };
  };
}
