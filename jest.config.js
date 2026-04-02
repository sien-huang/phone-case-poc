const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
}, {
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
});

const customJestConfig = {
  setupFiles: ['<rootDir>/jest.setup.global.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock @opennextjs/cloudflare to avoid require issues in Jest
    '^@opennextjs/cloudflare$': '<rootDir>/__mocks__/cloudflare-opennext.js',
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.test.tsx',
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    '!lib/**/*.d.ts',
    '!lib/**/*.test.ts',
    '!lib/**/*.spec.ts',
    '!lib/data.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 70,
    },
  },
  resetModules: true,
  resetMocks: false,
  clearMocks: true,
};

module.exports = createJestConfig(customJestConfig);
