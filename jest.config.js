const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
}, {
  // Transform options for Next.js
  // This helps with Web API polyfills
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
    '!lib/data.ts', // Exclude large data.ts to focus on core logic coverage
  ],
  coverageThreshold: {
    global: {
      branches: 13,
      functions: 13,
      lines: 13,
      statements: 13,
    },
  },
  // Ensure test isolation to avoid mock leakage
  resetModules: true,
  resetMocks: false,  // Disable: we manually reset where needed
  clearMocks: true,
};

module.exports = createJestConfig(customJestConfig);
