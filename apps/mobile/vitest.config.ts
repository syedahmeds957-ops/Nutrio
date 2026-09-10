import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    // Array form with anchored regexes on purpose: object/string aliases are PREFIX
    // matches, so a plain 'react-native' key would also rewrite 'react-native-svg'
    // into 'react-native-websvg'.
    alias: [
      {
        // Native module — its entry requires untranspiled RN Flow source, which the
        // `node` environment cannot parse. See the stub for details.
        find: /^react-native-svg$/,
        replacement: path.resolve(__dirname, 'test/stubs/react-native-svg.ts'),
      },
      {
        find: /^@react-native-async-storage\/async-storage$/,
        replacement: path.resolve(__dirname, 'test/stubs/async-storage.ts'),
      },
      { find: /^react-native$/, replacement: 'react-native-web' },
    ],
  },
});
