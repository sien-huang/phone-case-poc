import '@testing-library/jest-dom';

// Set test environment variables before any imports
process.env = {
  ...process.env,
  SMTP_HOST: 'smtp.test.com',
  SMTP_PORT: '587',
  SMTP_USER: 'test@test.com',
  SMTP_PASS: 'test-password',
  ADMIN_EMAIL: 'admin@test.com',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/phone-case-test',
  D1_DATABASE_URL: 'file:./d1-local.db',
  NEXTAUTH_SECRET: 'test-secret-for-testing-only',
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  CF_WORKER: 'false',
};

// Mock @opennextjs/cloudflare for Jest (tests don't need actual adapter)
jest.mock('@opennextjs/cloudflare', () => ({
  __esModule: true,
  defineCloudflareConfig: (config) => config,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
  })
);

// Polyfill Next.js Web APIs (Request, Response, Headers)
global.Request = class Request {}
global.Response = class Response {}
global.Headers = class Headers {}

// Silence console warnings/errors in tests (optional)
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('React does not recognize'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// ============================================
// Global Mocks for Database & Email
// ============================================

// Mock PrismaClient to avoid real DB connections
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    inquiry: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    PrismaLibSql: jest.fn(),
  };
});

// Provide module-level mockPrisma reference for individual tests to configure
if (!global.mockPrisma) {
  global.mockPrisma = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    inquiry: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

// Reset global mockPrisma implementations before each test to avoid cross-test contamination
beforeEach(() => {
  if (global.mockPrisma) {
    const resetMock = (fn) => fn && typeof fn.mockReset === 'function' && fn.mockReset()
    const resetObj = (obj) => {
      if (!obj || typeof obj !== 'object') return
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          resetMock(obj[key])
        }
      }
    }
    resetObj(global.mockPrisma.product)
    resetObj(global.mockPrisma.inquiry)
    resetMock(global.mockPrisma.$transaction)
  }
});

// Optionally mock @libsql/client as well
jest.mock('@libsql/client', () => ({
  createClient: jest.fn(() => ({
    execute: jest.fn(),
    batch: jest.fn(),
    close: jest.fn(),
  })),
}));
