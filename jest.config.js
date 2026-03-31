const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '<rootDir>/__tests__/unit/utils/format.test.ts',
    '<rootDir>/__tests__/unit/lib/currency.test.ts',
    '<rootDir>/__tests__/unit/lib/data.test.ts',
  ],
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    '!lib/**/*.d.ts',
    '!lib/**/*.test.ts',
    '!lib/**/*.spec.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 13,
      functions: 13,
      lines: 13,
      statements: 13,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
