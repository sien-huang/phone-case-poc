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
    '<rootDir>/__tests__/unit/components/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/__tests__/unit/contexts/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/__tests__/unit/utils/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/__tests__/unit/lib/currency.test.ts',
    '<rootDir>/tests/**/*.spec.ts',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
