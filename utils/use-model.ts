/**
 * React hook for managing on-device LLM model instances
 * Model-agnostic implementation that works with any model from the registry
 * 
 * Note: Models are downloaded from HuggingFace on first use
 * and cached on the device for subsequent uses.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLLM } from 'react-native-executorch';
import { generateSummaryWithLLM } from './generation-core';
import { generationService } from './generation-service';
import { modelManager } from './model-manager';
import { DEFAULT_MODEL_ID, ModelId, getModelInfo } from './model-registry';

// Re-export for backward compatibility
export { generateSummaryWithLLM };

/**
 * React hook for managing model instance in components
 * 
 * The model will be downloaded from HuggingFace on first use
 * Download progress is available via downloadProgress property
 * 
 * @param modelId - The ID of the model to use (defaults to DEFAULT_MODEL_ID)
 */
export function useLLMModel(modelId: ModelId = DEFAULT_MODEL_ID) {
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState(generationService.getState());
  const modelInfo = getModelInfo(modelId);
  const model = useLLM({ model: modelInfo.modelConfig });
  const modelRef = useRef(model);
  const initializedRef = useRef(false);
  modelRef.current = model;

  // Register model with manager
  useEffect(() => {
    modelManager.registerModel(modelId);
    return () => {
      modelManager.unregisterModel(modelId);
    };
  }, [modelId]);

  // Reset initialization when model changes
  useEffect(() => {
    initializedRef.current = false;
  }, [modelId]);

  // Initialize service with model instance (only once per model)
  useEffect(() => {
    if (!initializedRef.current) {
      generationService.initializeModel(model);
      initializedRef.current = true;
    }
    
    // Subscribe to state changes (don't call immediately to avoid infinite loops)
    const unsubscribe = generationService.onStateChange((newState) => {
      // Only update if state actually changed to prevent unnecessary re-renders
      setState(prevState => {
        if (JSON.stringify(prevState) === JSON.stringify(newState)) {
          return prevState; // No change, return previous to prevent re-render
        }
        return newState;
      });
      
      // Update error if it changed
      setError(prevError => {
        if (newState.error !== prevError) {
          return newState.error;
        }
        return prevError;
      });
    });

    // Subscribe to generation errors
    const unsubscribeError = generationService.onGenerationError((result) => {
      if (result.error) {
        setError(result.error);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeError();
      // NOTE: We DON'T interrupt generation on unmount anymore
      // The service manages generation lifecycle independently
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount to avoid infinite loops

  // Update model instance reference when it changes
  // Only log when isReady actually changes to reduce log noise
  const lastIsReadyRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    // Always update the service with the latest model instance
    // This ensures we have the current reference even if the component remounts
    if (model) {
      const isReadyChanged = lastIsReadyRef.current !== model.isReady;
      if (isReadyChanged) {
        console.log('Model ready state changed:', {
          wasReady: lastIsReadyRef.current,
          isReady: model.isReady,
        });
        lastIsReadyRef.current = model.isReady;
      }
      generationService.initializeModel(model);
      modelRef.current = model;
      initializedRef.current = true;
    }
  }, [model]);

  const generateSummary = useCallback(async (text: string): Promise<string> => {
    try {
      // Use service for generation - it handles lifecycle independently
      return await generationService.generateSummary(text);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(errorMessage);
      console.log('Model generation error:', err);

      console.log('Model state:', {
        isReady: model.isReady,
        isGenerating: model.isGenerating,
        downloadProgress: model.downloadProgress,
        error: model.error,
      });

      throw new Error(errorMessage);
    }
  }, [model]);

  const interrupt = useCallback(() => {
    generationService.interrupt();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startGenerationSession = useCallback(() => {
    generationService.startGenerationSession();
  }, []);

  const endGenerationSession = useCallback(() => {
    generationService.endGenerationSession();
  }, []);

  // Use service state, but fall back to hook state for immediate updates
  const isReady = state.isReady || model.isReady;
  const isGenerating = state.isGenerating || model.isGenerating;
  const downloadProgress = state.downloadProgress !== 0 ? state.downloadProgress : model.downloadProgress;
  const currentError = error || state.error || (model.error ? String(model.error) : null);

  return {
    isReady,
    isGenerating,
    downloadProgress,
    error: currentError,
    generateSummary,
    interrupt,
    clearError,
    startGenerationSession,
    endGenerationSession,
    model,
    messageHistory: model.messageHistory,
    response: model.response,
  };
}

