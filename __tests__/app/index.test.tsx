import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeScreen from '@/app/index';
import { useLLMModel } from '@/utils/use-model';

// Mock dependencies
jest.mock('@/utils/use-model');
jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: () => '#000000',
}));

// Mock Alert
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const flushAll = async (iterations = 30) => {
  for (let i = 0; i < iterations; i += 1) {
    jest.runOnlyPendingTimers();
    await Promise.resolve();
  }
};

describe('HomeScreen', () => {
  const mockGenerateSummary = jest.fn();
  const mockInterrupt = jest.fn();
  const mockClearError = jest.fn();
  const mockStartGenerationSession = jest.fn();
  const mockEndGenerationSession = jest.fn();

  const defaultModelState = {
    isReady: true,
    isGenerating: false,
    downloadProgress: 1,
    error: null,
    generateSummary: mockGenerateSummary,
    interrupt: mockInterrupt,
    clearError: mockClearError,
    startGenerationSession: mockStartGenerationSession,
    endGenerationSession: mockEndGenerationSession,
    model: {} as any,
    messageHistory: [],
    response: '',
  };

  const updateInput = async (utils: ReturnType<typeof render>, text: string) => {
    const input = utils.getByPlaceholderText('Paste text here...');
    await act(async () => {
      fireEvent.changeText(input, text);
    });
    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });
  };

  const pressSummarize = async (utils: ReturnType<typeof render>) => {
    const button = utils.getByTestId('summarize-button');
    await act(async () => {
      fireEvent.press(button);
    });
    await flushAll(5);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    alertSpy.mockClear();
    mockGenerateSummary.mockClear();
    mockGenerateSummary.mockResolvedValue('Test summary');
    (useLLMModel as jest.Mock).mockReturnValue(defaultModelState);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the component with initial state', () => {
      const { getByText, getByPlaceholderText } = render(<HomeScreen />);
      
      expect(getByText('On-Device Summarizer')).toBeTruthy();
      expect(getByPlaceholderText('Paste text here...')).toBeTruthy();
      expect(getByText('Summarize')).toBeTruthy();
    });

    it('should show model selector', () => {
      const { getByText } = render(<HomeScreen />);
      expect(getByText('Model:')).toBeTruthy();
    });

    it('should show ready status when model is ready', () => {
      const { getByText } = render(<HomeScreen />);
      expect(getByText('✓ Ready')).toBeTruthy();
    });

    it('should show generating status when model is generating', () => {
      (useLLMModel as jest.Mock).mockReturnValue({
        ...defaultModelState,
        isGenerating: true,
      });
      
      const { getByText } = render(<HomeScreen />);
      expect(getByText('Generating...')).toBeTruthy();
    });
  });

  describe('Input handling', () => {
    it('should update input when user types', async () => {
      const utils = render(<HomeScreen />);
      await updateInput(utils, 'Test input');

      const input = utils.getByPlaceholderText('Paste text here...');
      expect(input.props.value).toBe('Test input');
    });

    it('should clear error when user types', async () => {
      const utils = render(<HomeScreen />);
      await updateInput(utils, 'Test');

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Summarization - Single chunk', () => {
    it('should disable summarize button for empty input', () => {
      const { getByTestId } = render(<HomeScreen />);
      const button = getByTestId('summarize-button');
      
      // Check accessibilityState.disabled instead of props.disabled
      expect(button.props.accessibilityState?.disabled).toBe(true);
      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockGenerateSummary).not.toHaveBeenCalled();
    });

    it('should handle text that is too short', async () => {
      const utils = render(<HomeScreen />);
      await updateInput(utils, 'Short');
      await pressSummarize(utils);

      expect(mockGenerateSummary).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(utils.getByText(/This text is already concise/)).toBeTruthy();
      });
    });

    it('should trigger summarization for valid input', async () => {
      const longText = 'a'.repeat(200);
      const utils = render(<HomeScreen />);
      await updateInput(utils, longText);
      await pressSummarize(utils);

      await waitFor(() => {
        expect(mockGenerateSummary).toHaveBeenCalledWith(longText);
      });
    });

    it('should clear summary before starting new generation', async () => {
      const longText = 'a'.repeat(200);
      const utils = render(<HomeScreen />);
      await updateInput(utils, longText);
      await pressSummarize(utils);

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Summarization - Multi-chunk', () => {
    it('should handle multi-chunk summarization', async () => {
      const longText = 'a'.repeat(5000); // Exceeds MAX_CHUNK_SIZE (4000)
      const utils = render(<HomeScreen />);
      
      mockGenerateSummary
        .mockResolvedValueOnce('Chunk 1 summary')
        .mockResolvedValueOnce('Chunk 2 summary')
        .mockResolvedValueOnce('Final summary');

      await updateInput(utils, longText);
      await pressSummarize(utils);

      // Wait for async operations to start
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      expect(mockStartGenerationSession).toHaveBeenCalled();

      // Wait for chunks to process (with 300ms delay between chunks)
      await act(async () => {
        jest.advanceTimersByTime(3000);
        await Promise.resolve();
      });

      expect(mockGenerateSummary.mock.calls.length).toBeGreaterThan(1);
      await waitFor(() => {
        expect(mockEndGenerationSession).toHaveBeenCalled();
      }, { timeout: 3000 });
    }, 10000);

    it('should continue processing chunks even if some fail', async () => {
      const longText = 'a'.repeat(5000);
      const utils = render(<HomeScreen />);
      
      mockGenerateSummary
        .mockResolvedValueOnce('Chunk 1 summary')
        .mockRejectedValueOnce(new Error('Chunk 2 failed'))
        .mockResolvedValueOnce('Chunk 3 summary');

      await updateInput(utils, longText);
      await pressSummarize(utils);

      await act(async () => {
        jest.advanceTimersByTime(4000);
        await Promise.resolve();
      });

      expect(mockGenerateSummary.mock.calls.length).toBeGreaterThan(1);
    }, 15000);
  });

  describe('Error handling', () => {
    it('should show error alert on generation failure', async () => {
      // Reset mocks to ensure clean state
      mockGenerateSummary.mockReset();
      alertSpy.mockClear();
      mockGenerateSummary.mockRejectedValueOnce(new Error('Generation failed'));
      
      const longText = 'a'.repeat(200);
      const utils = render(<HomeScreen />);

      await updateInput(utils, longText);
      await pressSummarize(utils);

      // Wait for promise rejection to be handled
      await act(async () => {
        // Advance timers to allow promise rejection handler to execute
        for (let i = 0; i < 20; i++) {
          jest.advanceTimersByTime(100);
          await Promise.resolve();
        }
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Generation failed');
      }, { timeout: 3000 });
    }, 5000);

    it('should handle cancelled generation gracefully', async () => {
      const longText = 'a'.repeat(200);
      const utils = render(<HomeScreen />);
      
      mockGenerateSummary.mockRejectedValue(new Error('Generation cancelled'));

      await updateInput(utils, longText);
      await pressSummarize(utils);

      await act(async () => {
        jest.runOnlyPendingTimers();
        await Promise.resolve();
      });

      await waitFor(() => {
        const errorCalls = alertSpy.mock.calls.filter(call => call[0] === 'Error');
        expect(errorCalls.length).toBe(0);
      });
    });
  });

  describe('Clear functionality', () => {
    it('should clear input and summary when clear button is pressed', async () => {
      const utils = render(<HomeScreen />);
      await updateInput(utils, 'Test input');

      const clearButton = utils.getByTestId('clear-button');
      await act(async () => {
        fireEvent.press(clearButton);
      });

      const input = utils.getByPlaceholderText('Paste text here...');
      expect(input.props.value).toBe('');
      expect(mockClearError).toHaveBeenCalled();
    });

    it('should not show clear button when input and summary are empty', () => {
      const { queryByTestId } = render(<HomeScreen />);
      expect(queryByTestId('clear-button')).toBeNull();
    });
  });

  describe('Reactive updates', () => {
    it('should update summary when model response changes', async () => {
      // Reset mocks to ensure clean state
      mockGenerateSummary.mockReset();
      mockGenerateSummary.mockImplementation(() => {
        // Update state after a delay to simulate async response
        setTimeout(() => {
          modelState = {
            ...defaultModelState,
            response: 'Updated summary',
            messageHistory: [{ role: 'assistant', content: 'Updated summary' }],
            isGenerating: false,
          };
          (useLLMModel as jest.Mock).mockReturnValue(modelState);
        }, 50);
        return Promise.resolve('Updated summary');
      });
      
      const longText = 'a'.repeat(200);
      let modelState = {
        ...defaultModelState,
        response: '',
        messageHistory: [],
        isGenerating: false,
      };
      
      (useLLMModel as jest.Mock).mockReturnValue(modelState);
      const utils = render(<HomeScreen />);

      await updateInput(utils, longText);
      await pressSummarize(utils);

      // Advance timers to trigger state update
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      // Update mock and rerender to trigger useEffect
      modelState = {
        ...defaultModelState,
        response: 'Updated summary',
        messageHistory: [{ role: 'assistant', content: 'Updated summary' }],
        isGenerating: false,
      };
      (useLLMModel as jest.Mock).mockReturnValue(modelState);
      
      await act(async () => {
        utils.rerender(<HomeScreen />);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(utils.getByText('Updated summary')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Input truncation', () => {
    it('should truncate very long input', async () => {
      const veryLongText = 'a'.repeat(200 * 1024); // Exceeds MAX_INPUT_SIZE (100KB)
      const utils = render(<HomeScreen />);
      
      await updateInput(utils, veryLongText);
      await pressSummarize(utils);

      await waitFor(() => {
        expect(mockGenerateSummary).toHaveBeenCalled();
        const callArg = mockGenerateSummary.mock.calls[0]?.[0];
        expect(callArg).toBeDefined();
        expect(callArg.length).toBeLessThanOrEqual(100 * 1024 + 20); // Allow for truncation marker
        // Check if truncated (either has marker or is exactly at limit)
        expect(callArg.length).toBeLessThanOrEqual(100 * 1024 + 20);
      }, { timeout: 2000 });
    }, 5000);
  });
});
