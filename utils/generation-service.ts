/**
 * Generation Service - Manages LLM generation independently of React component lifecycle
 * Ensures generation continues even when components unmount/remount
 */

import { useLLM } from 'react-native-executorch';
import { generateSummaryWithLLM } from './generation-core';

export interface GenerationState {
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  error: string | null;
  currentGenerationId: string | null;
}

export interface GenerationResult {
  generationId: string;
  summary: string;
  error?: string;
}

type GenerationListener = (state: GenerationState) => void;
type GenerationResultListener = (result: GenerationResult) => void;

class SimpleEventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  removeAllListeners() {
    this.listeners.clear();
  }
}

class GenerationService extends SimpleEventEmitter {
  private modelInstance: ReturnType<typeof useLLM> | null = null;
  private currentGeneration: {
    id: string;
    promise: Promise<string>;
    abortController: AbortController;
  } | null = null;
  private generationSessionActive: boolean = false;
  private statePollingInterval: ReturnType<typeof setInterval> | null = null;
  private state: GenerationState = {
    isReady: false,
    isGenerating: false,
    downloadProgress: 0,
    error: null,
    currentGenerationId: null,
  };

  initializeModel(modelInstance: ReturnType<typeof useLLM>) {
    this.modelInstance = modelInstance;
    this.updateState();
    this.startStatePolling();
  }

  private startStatePolling() {
    if (this.statePollingInterval) return;
    
    this.statePollingInterval = setInterval(() => {
      if (this.modelInstance) {
        this.updateState();
      }
    }, 100);
  }

  private stopStatePolling() {
    if (this.statePollingInterval) {
      clearInterval(this.statePollingInterval);
      this.statePollingInterval = null;
    }
  }

  private updateState() {
    if (!this.modelInstance) return;

    const isGenerating = 
      this.modelInstance.isGenerating || 
      !!this.currentGeneration || 
      this.generationSessionActive;

    const newState: GenerationState = {
      isReady: this.modelInstance.isReady,
      isGenerating,
      downloadProgress: this.modelInstance.downloadProgress,
      error: this.modelInstance.error ? String(this.modelInstance.error) : null,
      currentGenerationId: this.currentGeneration?.id || null,
    };

    const stateChanged = JSON.stringify(newState) !== JSON.stringify(this.state);
    this.state = newState;

    if (stateChanged) {
      this.emit('stateChange', this.state);
    }
  }

  getState(): GenerationState {
    return { ...this.state };
  }

  startGenerationSession(): void {
    this.generationSessionActive = true;
    this.updateState();
  }

  endGenerationSession(): void {
    this.generationSessionActive = false;
    this.updateState();
  }

  async generateSummary(text: string): Promise<string> {
    if (!this.modelInstance) {
      throw new Error('Model not initialized. Call initializeModel() first.');
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('Input text is empty or invalid');
    }

    // Cancel previous generation if still running
    if (this.currentGeneration) {
      const previousGen = this.currentGeneration;
      
      // Check if actually still generating (with brief delay to avoid false positives)
      let isActuallyGenerating = this.modelInstance.isGenerating;
      if (isActuallyGenerating) {
        await new Promise(resolve => setTimeout(resolve, 10));
        isActuallyGenerating = this.modelInstance.isGenerating;
      }
      
      if (isActuallyGenerating) {
        previousGen.abortController.abort();
        try {
          this.modelInstance.interrupt();
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn('Error interrupting previous generation:', error);
        }
      } else {
        // Wait briefly for promise to settle
        await Promise.race([
          previousGen.promise.catch(() => {}),
          new Promise(resolve => setTimeout(resolve, 50)),
        ]).catch(() => {});
      }
      
      this.currentGeneration = null;
      this.updateState();
    }

    // Create new generation
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const abortController = new AbortController();
    const generationPromise = this.executeGeneration(text, generationId, abortController);
    
    this.currentGeneration = {
      id: generationId,
      promise: generationPromise,
      abortController,
    };
    this.updateState();

    try {
      const result = await generationPromise;
      
      if (this.currentGeneration?.id === generationId) {
        this.currentGeneration = null;
        this.updateState();
      }

      this.emit('generationComplete', { generationId, summary: result });
      return result;
    } catch (error) {
      if (this.currentGeneration?.id === generationId) {
        this.currentGeneration = null;
        this.updateState();
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (!abortController.signal.aborted && !errorMessage.includes('cancelled')) {
        this.emit('generationError', {
          generationId,
          summary: '',
          error: errorMessage,
        });
      }

      throw error;
    }
  }

  private async executeGeneration(
    text: string,
    generationId: string,
    abortController: AbortController
  ): Promise<string> {
    if (!this.modelInstance) {
      throw new Error('Model instance not available');
    }

    if (abortController.signal.aborted) {
      throw new Error('Generation cancelled');
    }

    if (this.modelInstance.error) {
      throw new Error(`Model error: ${String(this.modelInstance.error)}`);
    }

    const generationPromise = generateSummaryWithLLM(
      text,
      this.modelInstance,
      { current: !abortController.signal.aborted }
    );

    const abortPromise = new Promise<never>((_, reject) => {
      if (abortController.signal.aborted) {
        reject(new Error('Generation cancelled'));
        return;
      }
      
      abortController.signal.addEventListener('abort', () => {
        setTimeout(() => {
          if (abortController.signal.aborted) {
            reject(new Error('Generation cancelled'));
          }
        }, 50);
      });
    });

    try {
      return await Promise.race([generationPromise, abortPromise]);
    } catch (error) {
      // If cancelled but we have a result, return it
      if (abortController.signal.aborted && this.modelInstance?.response) {
        const summary = this.modelInstance.response.trim();
        if (summary.length > 0) {
          return summary;
        }
      }
      
      throw error;
    }
  }

  interrupt() {
    if (this.currentGeneration) {
      this.currentGeneration.abortController.abort();
      if (this.modelInstance) {
        try {
          this.modelInstance.interrupt();
        } catch (error) {
          console.warn('Error interrupting generation:', error);
        }
      }
    }
  }

  onStateChange(listener: GenerationListener, immediate: boolean = false) {
    this.on('stateChange', listener);
    if (immediate) {
      listener(this.getState());
    }
    return () => this.off('stateChange', listener);
  }

  onGenerationComplete(listener: GenerationResultListener) {
    this.on('generationComplete', listener);
    return () => this.off('generationComplete', listener);
  }

  onGenerationError(listener: GenerationResultListener) {
    this.on('generationError', listener);
    return () => this.off('generationError', listener);
  }

  cleanup() {
    this.stopStatePolling();
    this.interrupt();
    this.removeAllListeners();
    this.modelInstance = null;
    this.currentGeneration = null;
  }
}

export const generationService = new GenerationService();

