// Mock react-native-executorch
jest.mock('react-native-executorch', () => {
  const mockModelInstance = {
    isReady: true,
    isGenerating: false,
    response: '',
    token: '',
    messageHistory: [],
    error: null,
    downloadProgress: 1,
    generate: jest.fn(() => Promise.resolve()),
    interrupt: jest.fn(),
  };

  return {
    LLAMA3_2_1B_SPINQUANT: 'llama3-2-1b-spinquant',
    Message: {},
    useLLM: jest.fn(() => mockModelInstance),
  };
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};



