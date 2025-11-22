module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  // Detect open handles to prevent hanging tests
  detectOpenHandles: true,
  // Force exit after tests complete (prevents hanging)
  forceExit: true,
  // Set test timeout
  testTimeout: 10000,
  // Setup files before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js']
};

