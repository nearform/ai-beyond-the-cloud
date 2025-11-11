/**
 * Core model generation logic (no React dependencies)
 * Model-agnostic implementation that works with any LLM model instance
 * Extracted to break circular dependency with generation-service
 */

import { Message } from 'react-native-executorch';

// ============================================================================
// Types
// ============================================================================

export type ModelInstance = {
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  error: unknown;
  response?: string;
  token?: string;
  messageHistory?: Message[];
  interrupt: () => void;
  configure?: (config: { chatConfig?: { systemPrompt?: string } }) => void;
  sendMessage: (message: string) => Promise<void>;
};

// ============================================================================
// Constants
// ============================================================================

const MIN_GENERATION_COOLDOWN = 500;
const MAX_INPUT_TEXT_LENGTH = 6000;
const MAX_WAIT_TIME = 5 * 60 * 1000;
const READY_CHECK_INTERVAL = 2000;
const INTERRUPTION_WAIT_INTERVAL = 200;
const MAX_INTERRUPTION_WAIT_ATTEMPTS = 25;
const INTERRUPTION_CLEANUP_DELAY = 500;
const CLEANUP_DELAY = 500;

// ============================================================================
// Global State
// ============================================================================

let generationLock: Promise<void> = Promise.resolve();
let lastGenerationTime = 0;
let lastInputHash: string | null = null;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Simple hash function for input change detection
 */
function hashInput(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Wait for model to be ready with timeout
 */
async function waitForModelReady(modelInstance: ModelInstance): Promise<void> {
  if (modelInstance.isReady) {
    return;
  }

  const startTime = Date.now();
  while (!modelInstance.isReady && (Date.now() - startTime) < MAX_WAIT_TIME) {
    await new Promise(resolve => setTimeout(resolve, READY_CHECK_INTERVAL));
  }

  if (!modelInstance.isReady) {
    throw new Error('Model initialization timeout - check download progress');
  }

  if (modelInstance.error) {
    throw new Error(`Model error during initialization: ${String(modelInstance.error)}`);
  }
}

/**
 * Interrupt any ongoing generation and wait for it to complete
 */
async function interruptOngoingGeneration(modelInstance: ModelInstance): Promise<void> {
  if (!modelInstance.isGenerating) {
    return;
  }

  modelInstance.interrupt();

  let waitAttempts = 0;
  while (modelInstance.isGenerating && waitAttempts < MAX_INTERRUPTION_WAIT_ATTEMPTS) {
    await new Promise(resolve => setTimeout(resolve, INTERRUPTION_WAIT_INTERVAL));
    waitAttempts++;
  }

  if (modelInstance.isGenerating) {
    throw new Error('Model is still generating from a previous request. Please wait and try again.');
  }

  await new Promise(resolve => setTimeout(resolve, INTERRUPTION_CLEANUP_DELAY));
}

/**
 * Create prompt messages for summarization
 */
function createPromptMessages(text: string): Message[] {
  const systemPrompt = 'Summarize the following text concisely in 2-3 sentences.';
  const truncatedText = text.length > MAX_INPUT_TEXT_LENGTH
    ? text.substring(0, MAX_INPUT_TEXT_LENGTH) + '... [truncated]'
    : text;
  const userMessage = truncatedText;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];
}

/**
 * Handle generation promise errors
 */
function handleGenerationError(error: unknown, modelInstance: ModelInstance): void {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes('ModelGenerating')) {
    throw new Error('Model is busy generating. Please wait for the current generation to complete.');
  }

  if (errorMessage.includes('error code: 18')) {
    throw new Error('Input is too large for the model. Please try with shorter text or split it into smaller chunks.');
  }

  const isWorkerCrash = errorMessage.includes('null') ||
    errorMessage.includes('segmentation') ||
    errorMessage.includes('EXC_BAD_ACCESS') ||
    errorMessage.includes('SIGSEGV') ||
    errorMessage.includes('invalid address');

  if (isWorkerCrash) {
    try {
      if (modelInstance.interrupt) {
        modelInstance.interrupt();
      }
    } catch {
      // Ignore interrupt errors during crash
    }

    if (!modelInstance.response?.length && !modelInstance.messageHistory?.length) {
      throw new Error('Generation failed due to memory management issue. Please try again with a smaller input.');
    }
  } else if (!modelInstance.response?.length && !modelInstance.messageHistory?.length) {
    throw error;
  }
}

/**
 * Clean up summary text by removing any prompt artifacts or instruction text
 */
function cleanupSummary(summary: string): string {
  // Remove any instruction text that might have been included in the response
  summary = summary.replace(/^Summarize (the following text|this text|in 2-3 sentences).*?:\s*/i, '').trim();

  // Ensure proper punctuation at the end
  if (summary && !summary.match(/[.!?]$/)) {
    summary += '.';
  }

  return summary;
}

/**
 * Perform cleanup after generation
 */
async function performCleanup(modelInstance: ModelInstance): Promise<void> {
  try {
    if (modelInstance.interrupt) {
      modelInstance.interrupt();
      await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY));
    }
    lastGenerationTime = Date.now();
  } catch {
    // Ignore cleanup errors
  }
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Standalone function for generating summaries
 * This is the core generation logic without React dependencies
 * Works with any model instance that implements the ModelInstance interface
 */
export async function generateSummaryWithLLM(
  text: string,
  modelInstance: ModelInstance,
  isMountedRef?: { current: boolean }
): Promise<string> {
  if (!modelInstance) {
    throw new Error('Model instance is null or undefined');
  }

  // Wait for any previous generation to complete and enforce cooldown
  await generationLock;

  const timeSinceLastGeneration = Date.now() - lastGenerationTime;
  if (timeSinceLastGeneration < MIN_GENERATION_COOLDOWN) {
    const cooldownDelay = MIN_GENERATION_COOLDOWN - timeSinceLastGeneration;
    await new Promise(resolve => setTimeout(resolve, cooldownDelay));
  }

  // Create a new lock for this generation
  let generationResolve: (() => void) | undefined;
  generationLock = new Promise<void>(resolve => {
    generationResolve = resolve;
  });

  try {
    // Create hash of input for reliable change detection
    const inputHash = hashInput(text);
    const isFirstGeneration = lastInputHash === null;
    const inputChanged = !isFirstGeneration && lastInputHash !== inputHash;
    
    // Reset model state when input content changes
    if (isFirstGeneration || inputChanged) {
      if (inputChanged && modelInstance.isGenerating) {
        modelInstance.interrupt();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Clear response and token, but NOT messageHistory (model manages it internally)
      if (typeof modelInstance.response === 'string' && modelInstance.response.length > 0) {
        modelInstance.response = '';
      }
      if (typeof modelInstance.token === 'string' && modelInstance.token.length > 0) {
        modelInstance.token = '';
      }
    }
    
    await waitForModelReady(modelInstance);
    await interruptOngoingGeneration(modelInstance);

    const messages = createPromptMessages(text);

    // Verify sendMessage is available
    if (!modelInstance.sendMessage || typeof modelInstance.sendMessage !== 'function') {
      throw new Error('Model instance does not have a valid sendMessage function');
    }

    // Verify message structure (should always be system + user from createPromptMessages)
    if (messages.length !== 2 || messages[0].role !== 'system' || messages[1].role !== 'user') {
      throw new Error('Invalid message structure: expected system and user messages');
    }

    console.log('About to call sendMessage():', {
      isReady: modelInstance.isReady,
      isGenerating: modelInstance.isGenerating,
      responseLength: modelInstance.response?.length || 0,
      messageHistoryLength: modelInstance.messageHistory?.length || 0,
      messagesCount: messages.length,
      firstMessagePreview: messages[0]?.content?.substring(0, 50) || '',
    });

    // Configure model with system prompt for sendMessage()
    if (modelInstance.configure) {
      try {
        modelInstance.configure({
          chatConfig: {
            systemPrompt: messages[0].content,
          },
        });
      } catch (configureError) {
        console.log('Model configuration failed:', configureError);
      }
    }
    
    const userMessage = messages[1].content;
    
    try {
      const sendMessagePromise = modelInstance.sendMessage(userMessage);
      if (!sendMessagePromise || typeof sendMessagePromise.then !== 'function') {
        throw new Error('sendMessage() did not return a valid promise');
      }
      await sendMessagePromise;
      
      // Response may populate slightly after promise resolves, so do a single short wait if needed
      let messageHistory = modelInstance.messageHistory || [];
      let lastAssistantMessage = messageHistory.slice().reverse().find(msg => msg.role === 'assistant');
      let hasAssistantMessage = lastAssistantMessage && lastAssistantMessage.content && lastAssistantMessage.content.trim().length > 0;
      let hasResponse = modelInstance.response && modelInstance.response.trim().length > 0;

      if (!hasResponse && !hasAssistantMessage) {
        // Single short wait for response to populate
        await new Promise(resolve => setTimeout(resolve, 200));
        // Re-check after wait
        messageHistory = modelInstance.messageHistory || [];
        lastAssistantMessage = messageHistory.slice().reverse().find(msg => msg.role === 'assistant');
      }
      
      // Extract summary from messageHistory (preferred) or response field
      // messageHistory is more reliable as it contains the actual conversation
      const messageHistorySummary = lastAssistantMessage?.content?.trim() || '';
      const responseSummary = modelInstance.response?.trim() || '';
      
      // Prefer messageHistory as it's the source of truth, but use response if messageHistory is empty
      // If both exist, prefer the longer one (likely more complete)
      let summary = '';
      if (messageHistorySummary && responseSummary) {
        // Both exist - use the longer one (likely more complete)
        summary = messageHistorySummary.length >= responseSummary.length 
          ? messageHistorySummary 
          : responseSummary;
      } else {
        // Use whichever exists
        summary = messageHistorySummary || responseSummary;
      }
      
      if (summary && summary.length > 0) {
        const cleanedSummary = cleanupSummary(summary);
        await performCleanup(modelInstance);
        // Update input hash only on successful generation
        lastInputHash = inputHash;
        return cleanedSummary;
      }
      
      // If no summary found, return empty string (reactive updates will handle UI state)
      await performCleanup(modelInstance);
      return '';
    } catch (sendMessageError) {
      console.log('sendMessage() failed:', sendMessageError);
      handleGenerationError(sendMessageError, modelInstance);
      throw sendMessageError;
    }
  } catch (error) {
    throw error;
  } finally {
    if (generationResolve) {
      generationResolve();
    }
  }
}

