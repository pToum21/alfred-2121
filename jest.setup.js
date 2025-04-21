// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';

// Silence console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock the Logger to prevent console output during tests
jest.mock('@/lib/utils/logging', () => ({
  __esModule: true,
  default: {
    auth: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
})); 