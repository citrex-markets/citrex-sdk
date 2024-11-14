import { resolve } from 'path'

import { configDefaults, defineConfig } from 'vitest/config'

const config = defineConfig({
  resolve: {
    alias: [
      { find: 'src', replacement: resolve(__dirname, '../', './src') },
      { find: 'vitest/utils', replacement: resolve(__dirname, '../', './vitest/utils.ts') },
    ],
  },
  root: './src',
  test: {
    coverage: {
      all: true,
      exclude: [
        '__mocks__/',
        '__tests__/',
        'types/',
        '**/types.ts',
        '**/*.d.ts',
        'constants/**',
        'ABI/**',
        'sandbox.ts',
      ],
      ignoreEmptyLines: true,
      reporter: ['html', 'lcov'],
      reportsDirectory: '../reports/vitest',
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
      watermarks: {
        statements: [80, 100],
        functions: [80, 100],
        branches: [80, 100],
        lines: [80, 100],
      },
    },
    environment: 'node',
    globals: true,
    setupFiles: '../vitest/vitest.setup.ts',
    fakeTimers: {
      toFake: [...(configDefaults.fakeTimers.toFake ?? []), 'performance'],
    },
  },
})

export default config
