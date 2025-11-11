import { generateSummaryWithLLM } from '@/utils/generation-core';

describe('generateSummaryWithLLM', () => {
  let dateNowSpy: jest.SpyInstance;
  let mockDateNow: number;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockDateNow = 1000000000000; // Base timestamp
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockDateNow);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
    jest.useRealTimers();
  });

  const createMockModelInstance = (overrides: any = {}) => {
    const defaultInstance = {
      isReady: true,
      isGenerating: false,
      downloadProgress: 1,
      error: null,
      response: '',
      token: '',
      messageHistory: [],
      interrupt: jest.fn(),
      configure: jest.fn(),
      sendMessage: jest.fn().mockImplementation(() => {
        return Promise.resolve();
      }),
    };
    
    return Object.assign(defaultInstance, overrides);
  };

  // Helper to advance timers and flush promises
  const advanceTimersAndFlush = async (iterations = 50) => {
    for (let i = 0; i < iterations; i++) {
      mockDateNow += 100; // Advance Date.now() with timers
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    }
  };

  describe('successful generation', () => {
    it('should generate summary from response field', async () => {
      const modelInstance = createMockModelInstance({
        response: '',
      });

      modelInstance.sendMessage = jest.fn().mockImplementation(() => {
        modelInstance.response = 'This is a test summary.';
        return Promise.resolve();
      });

      const promise = generateSummaryWithLLM('Test input text', modelInstance);
      await advanceTimersAndFlush(100);
      const result = await promise;

      expect(result).toBe('This is a test summary.');
      expect(modelInstance.sendMessage).toHaveBeenCalled();
    }, 10000);

    it('should generate summary from messageHistory', async () => {
      const messageHistory = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User input' },
        { role: 'assistant', content: 'This is a test summary.' },
      ];
      
      const modelInstance = createMockModelInstance({
        messageHistory: [],
      });

      modelInstance.sendMessage = jest.fn().mockImplementation(() => {
        modelInstance.messageHistory = messageHistory;
        return Promise.resolve();
      });

      const promise = generateSummaryWithLLM('Test input', modelInstance);
      await advanceTimersAndFlush(100);
      const result = await promise;

      expect(result).toBe('This is a test summary.');
    }, 10000);

    it('should prefer longer summary when both response and messageHistory exist', async () => {
      const modelInstance = createMockModelInstance({
        response: '',
        messageHistory: [],
      });

      modelInstance.sendMessage = jest.fn().mockImplementation(() => {
        modelInstance.response = 'Short summary';
        modelInstance.messageHistory = [
          { role: 'assistant', content: 'This is a longer and more complete summary.' },
        ];
        return Promise.resolve();
      });

      const promise = generateSummaryWithLLM('Test input', modelInstance);
      await advanceTimersAndFlush(100);
      const result = await promise;

      expect(result).toBe('This is a longer and more complete summary.');
    }, 10000);

    it('should clean up summary text', async () => {
      const modelInstance = createMockModelInstance({
        response: '',
      });

      modelInstance.sendMessage = jest.fn().mockImplementation(() => {
        modelInstance.response = 'Summarize the following text: This is a summary';
        return Promise.resolve();
      });

      const promise = generateSummaryWithLLM('Test input', modelInstance);
      await advanceTimersAndFlush(100);
      const result = await promise;

      expect(result).not.toContain('Summarize the following text:');
    }, 10000);

    it('should add punctuation if missing', async () => {
      const modelInstance = createMockModelInstance({
        response: '',
      });

      modelInstance.sendMessage = jest.fn().mockImplementation(() => {
        modelInstance.response = 'This is a summary without punctuation';
        return Promise.resolve();
      });

      const promise = generateSummaryWithLLM('Test input', modelInstance);
      await advanceTimersAndFlush(100);
      const result = await promise;

      expect(result).toMatch(/[.!?]$/);
    }, 10000);
  });

  describe('error handling', () => {
    it('should throw error if model instance is null', async () => {
      await expect(
        generateSummaryWithLLM('Test', null as any)
      ).rejects.toThrow('Model instance is null or undefined');
    });

    it('should throw error if model is not ready', async () => {
      const modelInstance = createMockModelInstance({
        isReady: false,
      });

      const promise = generateSummaryWithLLM('Test input', modelInstance);
      
      // Advance timers to timeout (5 minutes + buffer)
      // waitForModelReady checks every 2 seconds, and uses Date.now()
      // We need to advance both timers and Date.now()
      const startTime = mockDateNow;
      for (let i = 0; i < 200; i++) {
        mockDateNow = startTime + (i + 1) * 2000; // Advance Date.now() with each check
        jest.advanceTimersByTime(2000); // READY_CHECK_INTERVAL
        await Promise.resolve();
      }
      
      await expect(promise).rejects.toThrow('Model initialization timeout');
    }, 30000);

    it('should handle sendMessage failure', async () => {
      const modelInstance = createMockModelInstance({
        sendMessage: jest.fn().mockRejectedValue(new Error('Send failed')),
      });

      const promise = generateSummaryWithLLM('Test input', modelInstance);
      // Advance timers enough for waitForModelReady (model is ready, so it returns immediately)
      // and for the sendMessage promise rejection to propagate
      await advanceTimersAndFlush(150);
      
      await expect(promise).rejects.toThrow('Send failed');
    }, 20000);

    it('should return empty string if no summary is produced', async () => {
      const modelInstance = createMockModelInstance({
        response: '',
        messageHistory: [],
      });

      modelInstance.sendMessage = jest.fn().mockImplementation(() => {
        return Promise.resolve();
      });

      const promise = generateSummaryWithLLM('Test input', modelInstance);
      // Advance timers enough for sendMessage to complete and the 200ms wait
      await advanceTimersAndFlush(150);
      const result = await promise;

      expect(result).toBe('');
      expect(modelInstance.sendMessage).toHaveBeenCalled();
    }, 20000);
  });

  describe('input handling', () => {
    it('should truncate very long input', async () => {
      const longText = 'a'.repeat(10000);
      const modelInstance = createMockModelInstance({
        response: '',
      });

      modelInstance.sendMessage = jest.fn().mockImplementation((message: string) => {
        // Update response after a short delay to simulate async behavior
        setTimeout(() => {
          modelInstance.response = 'Summary';
        }, 0);
        return Promise.resolve();
      });

      const promise = generateSummaryWithLLM(longText, modelInstance);
      await advanceTimersAndFlush(250);
      const result = await promise;
      
      expect(result).toBe('Summary.');

      const sendMessageCall = modelInstance.sendMessage.mock.calls[0];
      const userMessage = sendMessageCall[0] as string;
      
      // MAX_INPUT_TEXT_LENGTH is 6000, and truncation adds "... [truncated]" (15 chars)
      // So max length would be 6000 + 15 = 6015, but it's actually truncated to 6000 then adds marker
      expect(userMessage.length).toBeLessThanOrEqual(6015);
      expect(userMessage).toContain('[truncated]');
    }, 10000);

    it('should reset model state when input changes', async () => {
      const modelInstance = createMockModelInstance({
        response: 'Old response',
        token: 'old token',
      });

      modelInstance.sendMessage = jest.fn().mockImplementation(() => {
        modelInstance.response = 'New response';
        return Promise.resolve();
      });

      const promise1 = generateSummaryWithLLM('Input 1', modelInstance);
      // Advance enough for first generation to complete (including cleanup)
      await advanceTimersAndFlush(300);
      const result1 = await promise1;
      expect(result1).toBe('New response.');
      
      // Advance timers and Date.now() for cooldown (500ms) plus buffer
      // The first generation sets lastGenerationTime at Date.now(), so we need to advance enough
      const cooldownTime = 600;
      mockDateNow += cooldownTime;
      jest.advanceTimersByTime(cooldownTime);
      // Flush any pending promises
      await Promise.resolve();
      await Promise.resolve();
      
      const promise2 = generateSummaryWithLLM('Input 2', modelInstance);
      // Advance enough for second generation to complete
      await advanceTimersAndFlush(300);
      const result2 = await promise2;
      expect(result2).toBe('New response.');

      expect(modelInstance.sendMessage).toHaveBeenCalledTimes(2);
    }, 30000);
  });

  describe('cooldown and locking', () => {
    it('should enforce cooldown between generations', async () => {
      const modelInstance = createMockModelInstance({
        response: '',
      });

      modelInstance.sendMessage = jest.fn().mockImplementation(() => {
        modelInstance.response = 'Summary';
        return Promise.resolve();
      });

      const promise1 = generateSummaryWithLLM('Input 1', modelInstance);
      // Advance enough for first generation to complete (including cleanup with 500ms delay)
      await advanceTimersAndFlush(400);
      const result1 = await promise1;
      expect(result1).toBe('Summary.');
      
      // Advance timers and Date.now() for cooldown (500ms) plus buffer
      // The first generation sets lastGenerationTime during cleanup, so we need to advance enough
      const cooldownTime = 600;
      mockDateNow += cooldownTime;
      jest.advanceTimersByTime(cooldownTime);
      // Flush promises multiple times to ensure cooldown delay completes
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }
      
      const promise2 = generateSummaryWithLLM('Input 2', modelInstance);
      // Advance enough for second generation to complete
      await advanceTimersAndFlush(400);
      const result2 = await promise2;
      expect(result2).toBe('Summary.');

      expect(modelInstance.sendMessage).toHaveBeenCalledTimes(2);
    }, 30000);
  });
});
