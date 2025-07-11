// Jest setup file for global test configuration

// Mock fetch globally for API tests
global.fetch = jest.fn();

// Setup timezone for consistent test results
process.env.TZ = 'UTC';