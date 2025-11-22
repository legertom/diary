// Global test setup to prevent hanging tests

// Mock node-cron to prevent cron jobs from running during tests
// This is CRITICAL - cron.schedule() creates timers that keep the Node process alive
jest.mock('node-cron', () => {
  const mockTask = {
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  };
  
  return {
    schedule: jest.fn(() => mockTask),
    validate: jest.fn(),
    getTasks: jest.fn(() => []),
  };
});

