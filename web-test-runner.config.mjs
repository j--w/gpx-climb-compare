import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: 'test/**/*.test.js',
  nodeResolve: true,
  coverage: true,
  coverageConfig: {
    include: ['components/**/*.js', 'gpxProcessor.js', 'chartManager.js'],
  },
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
  ],
  testFramework: {
    config: {
      timeout: 3000,
    },
  },
};
