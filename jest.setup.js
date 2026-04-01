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
  NEXTAUTH_SECRET: 'test-secret-for-testing-only',
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
};

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
