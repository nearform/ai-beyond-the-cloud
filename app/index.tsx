import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { AVAILABLE_MODELS, DEFAULT_MODEL_ID, ModelId } from '@/utils/model-registry';
import { chunkText, MAX_CHUNK_SIZE } from '@/utils/summarizer';
import { useLLMModel } from '@/utils/use-model';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// MEMORY FIX: Further reduced limits to prevent OOM crashes
const MAX_INPUT_SIZE = 100 * 1024;
const MAX_CHUNKS = 6;

export default function HomeScreen() {
  const [input, setInput] = useState('');
  const [summary, setSummary] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<ModelId>(DEFAULT_MODEL_ID);
  const [showModelPicker, setShowModelPicker] = useState(false);
  
  const model = useLLMModel(selectedModelId);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'tabIconDefault');
  
  // Track current generation to prevent race conditions where old results overwrite new ones
  const currentGenerationRef = useRef<string | null>(null);
  const pendingGenerationRef = useRef<{ id: string; promise: Promise<string> } | null>(null);
  
  // Generation service handles lifecycle independently - no need for unmount interruption
  // Components can unmount/remount without affecting ongoing generation

  // Watch model.response and model.messageHistory for async updates
  useEffect(() => {
    const pendingGen = pendingGenerationRef.current;
    if (!pendingGen) return;

    // Only process if this is still the current generation
    if (currentGenerationRef.current !== pendingGen.id) {
      pendingGenerationRef.current = null;
      return;
    }

    // Extract summary from messageHistory (preferred) or response
    const messageHistory = model.messageHistory || [];
    const lastAssistantMessage = messageHistory.length > 0 
      ? messageHistory.slice().reverse().find(msg => msg.role === 'assistant')
      : null;
    const messageHistorySummary = lastAssistantMessage?.content?.trim() || '';
    const responseSummary = model.response?.trim() || '';

    // Prefer messageHistory as it's the source of truth, but use response if messageHistory is empty
    // If both exist, prefer the longer one (likely more complete)
    let summary = '';
    if (messageHistorySummary && responseSummary) {
      summary = messageHistorySummary.length >= responseSummary.length 
        ? messageHistorySummary 
        : responseSummary;
    } else {
      summary = messageHistorySummary || responseSummary;
    }

    // Update summary as it grows (don't clear pending ref yet - wait for generation to complete)
    if (summary && summary.length > 0) {
      setSummary(summary);
    }

    // Only clear pending ref when generation is complete
    if (!model.isGenerating && summary && summary.length > 0) {
      pendingGenerationRef.current = null;
    }
  }, [model.response, model.messageHistory, model.isGenerating]);

  const handleSummarize = async () => {
    model.clearError();
    
    // CRITICAL FIX: Capture input value at the start to avoid stale closure issues
    // This ensures we always use the current input value, not a stale one
    const currentInput = input.trim();
    
    if (!currentInput) {
      Alert.alert('Error', 'Please enter some text to summarize.');
      return;
    }

    // DEBUG: Log the input we're about to process
    console.log('handleSummarize: Starting summarization', {
      inputLength: currentInput.length,
      inputPreview: currentInput.substring(0, 100),
    });

    // Generate unique ID for this generation
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    currentGenerationRef.current = generationId;
    
    setSummary('');

    let result: string | undefined;

    try {
      let textToSummarize = currentInput;

      if (textToSummarize.length < 100) {
        setSummary(`This text is already concise: ${textToSummarize}`);
        return;
      }

      if (textToSummarize.length > MAX_INPUT_SIZE) {
        textToSummarize = textToSummarize.substring(0, MAX_INPUT_SIZE) + '... [truncated]';
      }

      if (textToSummarize.length > MAX_CHUNK_SIZE) {
        let chunks = chunkText(textToSummarize);
        if (chunks.length > MAX_CHUNKS) {
          const maxTextLength = MAX_CHUNKS * MAX_CHUNK_SIZE;
          textToSummarize = textToSummarize.substring(0, maxTextLength) + '...';
          chunks = chunkText(textToSummarize);
        }

        // Start generation session to keep UI disabled for entire multi-chunk operation
        model.startGenerationSession();

        try {
          const summaryParts: string[] = [];
          
          for (let i = 0; i < chunks.length; i++) {
            try {
              // Add delay between chunks to avoid race conditions
              if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 300));
              }
              
              const chunkSummary = await model.generateSummary(chunks[i]);
              if (chunkSummary && chunkSummary.trim().length > 0) {
                summaryParts.push(chunkSummary);
              }
            } catch (error) {
              // If cancelled, rethrow to stop processing
              if (error instanceof Error && error.message === 'Generation cancelled') {
                throw error;
              }
              
              // Log error but continue with other chunks
              console.log(`Chunk ${i + 1} summary failed:`, error);
            }
          }

          const combinedSummary = summaryParts.join(' ');
        
        if (!combinedSummary || combinedSummary.trim().length === 0) {
          throw new Error('Failed to generate any chunk summaries');
        }

        // Final summary of the combined chunks
        // OPTIMIZATION: If we only had 1 chunk, we already summarized it, so use it directly
        // Only re-summarize if we had multiple chunks (to combine them) or if it's still too long
        if (chunks.length === 1) {
          // Single chunk - already summarized, use it directly
          result = combinedSummary;
        } else {
          // Multiple chunks - final summary to combine them
          // Only summarize again if the combined summary is still very long
          try {
            if (combinedSummary.length > MAX_CHUNK_SIZE) {
              result = await model.generateSummary(combinedSummary);
            } else {
              // Combined summary is reasonable length, use it as-is
              result = combinedSummary;
            }
          } catch {
            // If final summary fails, use the combined summary as fallback
            result = combinedSummary;
          }
        }
        } finally {
          // Always end generation session, even if there was an error
          model.endGenerationSession();
        }
      } else {
        // Fire up generation without awaiting - useEffect will update summary when model.response/messageHistory change
        const generationPromise = model.generateSummary(textToSummarize);
        pendingGenerationRef.current = { id: generationId, promise: generationPromise };
        
        // Handle errors asynchronously
        generationPromise.catch((error) => {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred while generating the summary.';
          
          // Only handle error if this is still the current generation
          if (currentGenerationRef.current === generationId) {
            if (errorMessage === 'Generation cancelled' || errorMessage.includes('Generation was interrupted')) {
              // Don't check for partial result here - useEffect handles that reactively
              // No special handling needed for cancelled/interrupted generations
            } else {
              // Real error - show alert and clear summary
              Alert.alert('Error', errorMessage);
              setSummary('');
            }
          }
          
          // Clear pending ref when error occurs (useEffect will handle partial results)
          pendingGenerationRef.current = null;
        });
        
        // Don't await - let useEffect handle the result
        return;
      }

      // Only set summary if this is still the current generation and we have a result
      // If result is empty, just don't update (reactive updates handle empty state)
      if (currentGenerationRef.current === generationId && result?.trim()) {
        setSummary(result);
      } else {
        console.log('Skipping setSummary - generation ID mismatch (newer generation started)', {
          currentId: currentGenerationRef.current,
          completedId: generationId,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while generating the summary.';
      
      // Check if we have a partial result even if there was an error
      // This handles cases where generation was cancelled but had a result
      if (errorMessage === 'Generation cancelled' || errorMessage.includes('Generation was interrupted')) {
        // Don't clear summary - might have a partial result
        if (result && currentGenerationRef.current === generationId) {
          // We have a result even though it was cancelled - use it
          setSummary(result);
        }
      } else {
        // Real error - show alert and clear summary
        Alert.alert('Error', errorMessage);
        setSummary('');
      }
    }
  };

  const handleClear = () => {
    model.clearError();
    setInput('');
    setSummary('');
    currentGenerationRef.current = null;
    pendingGenerationRef.current = null;
  };

  const isDisabled = model.isGenerating || !model.isReady;


  const handleModelSelect = (modelId: ModelId) => {
    if (modelId !== selectedModelId) {
      // Clear current generation and summary when switching models
      model.interrupt();
      model.clearError();
      setSummary('');
      setInput('');
      currentGenerationRef.current = null;
      pendingGenerationRef.current = null;
      setSelectedModelId(modelId);
    }
    setShowModelPicker(false);
  };

  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ThemedView style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.header}>
            <ThemedText type="title">On-Device Summarizer</ThemedText>
            <ThemedText style={styles.subtitle}>
              Paste text to generate a summary entirely on your device
            </ThemedText>
            
            <ThemedView style={styles.modelSelectorContainer}>
              <ThemedText style={styles.modelSelectorLabel}>Model:</ThemedText>
              <TouchableOpacity
                style={[
                  styles.modelSelectorButton,
                  { borderColor, backgroundColor },
                  isDisabled && styles.modelSelectorButtonDisabled
                ]}
                onPress={() => setShowModelPicker(true)}
                disabled={isDisabled}
              >
                <ThemedText style={[styles.modelSelectorText, { color: textColor }]} numberOfLines={1}>
                  {selectedModel.name}
                </ThemedText>
                <ThemedText style={[styles.modelSelectorSize, { color: borderColor }]}>
                  {selectedModel.size}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.statusContainer}>
              {model.isGenerating ? (
                <ThemedView style={[styles.statusBadge, styles.statusBadgeGenerating]}>
                  <ActivityIndicator size="small" color="#fff" style={styles.statusIndicator} />
                  <ThemedText style={styles.statusText}>Generating...</ThemedText>
                </ThemedView>
              ) : !model.isReady ? (
                <ThemedView style={[styles.statusBadge, styles.statusBadgeLoading]}>
                  <ActivityIndicator size="small" color="#fff" style={styles.statusIndicator} />
                  <ThemedText style={styles.statusText}>
                    {model.downloadProgress < 1 
                      ? `Downloading: ${Math.round(model.downloadProgress * 100)}%`
                      : 'Initializing model...'}
                  </ThemedText>
                </ThemedView>
              ) : (
                <ThemedView style={[styles.statusBadge, styles.statusBadgeReady]}>
                  <ThemedText style={styles.statusText}>✓ Ready</ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor, backgroundColor },
                Platform.OS === 'ios' && styles.inputIOS,
                isDisabled && styles.inputDisabled
              ]}
              placeholder="Paste text here..."
              placeholderTextColor={borderColor}
              value={input}
              onChangeText={(text) => {
                setInput(text);
                model.clearError();
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!isDisabled}
            />
          </ThemedView>

          <ThemedView style={styles.buttonContainer}>
            <TouchableOpacity
              testID="summarize-button"
              style={[
                styles.button, 
                styles.summarizeButton, 
                { backgroundColor: tintColor },
                (isDisabled || !input.trim()) && styles.buttonDisabled
              ]}
              onPress={handleSummarize}
              disabled={isDisabled || !input.trim()}
            >
              {model.isGenerating ? (
                <ActivityIndicator color="#fff" />
              ) : !model.isReady ? (
                <ThemedText style={styles.buttonText}>
                  {model.downloadProgress < 1 
                    ? `Downloading: ${Math.round(model.downloadProgress * 100)}%`
                    : 'Initializing...'}
                </ThemedText>
              ) : (
                <ThemedText style={styles.buttonText}>Summarize</ThemedText>
              )}
            </TouchableOpacity>

            {(input || summary) && (
              <TouchableOpacity
                testID="clear-button"
                style={[
                  styles.button, 
                  styles.clearButton, 
                  { borderColor },
                  model.isGenerating && styles.buttonDisabled
                ]}
                onPress={handleClear}
                disabled={model.isGenerating}
              >
                <ThemedText style={[
                  styles.buttonText, 
                  { color: textColor },
                  model.isGenerating && styles.buttonTextDisabled
                ]}>
                  Clear
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>

          {model.error && (
            <ThemedView style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>Error: {model.error}</ThemedText>
            </ThemedView>
          )}

          {summary && (
            <ThemedView style={styles.summaryContainer}>
              <ThemedText type="subtitle" style={styles.summaryTitle}>Summary</ThemedText>
              <ThemedView style={[styles.summaryBox, { borderColor }]}>
                <ThemedText style={styles.summaryText}>{summary}</ThemedText>
              </ThemedView>
            </ThemedView>
          )}
        </ScrollView>

        <Modal
          visible={showModelPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModelPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowModelPicker(false)}
          >
            <ThemedView 
              style={[styles.modalContent, { backgroundColor, borderColor }]}
              onStartShouldSetResponder={() => true}
            >
              <ThemedView style={styles.modalHeader}>
                <ThemedText type="subtitle" style={styles.modalTitle}>Select Model</ThemedText>
                <TouchableOpacity
                  onPress={() => setShowModelPicker(false)}
                  style={styles.modalCloseButton}
                >
                  <ThemedText style={[styles.modalCloseText, { color: textColor }]}>✕</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              <FlatList
                data={AVAILABLE_MODELS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modelOption,
                      { borderColor },
                      selectedModelId === item.id && { backgroundColor: tintColor + '20' }
                    ]}
                    onPress={() => handleModelSelect(item.id)}
                  >
                    <ThemedView style={styles.modelOptionContent}>
                      <ThemedText style={[
                        styles.modelOptionName,
                        selectedModelId === item.id && styles.modelOptionNameSelected
                      ]}>
                        {item.name}
                      </ThemedText>
                      <ThemedText style={[styles.modelOptionDescription, { color: borderColor }]}>
                        {item.description}
                      </ThemedText>
                      <ThemedText style={[styles.modelOptionSize, { color: borderColor }]}>
                        {item.size}
                      </ThemedText>
                    </ThemedView>
                    {selectedModelId === item.id && (
                      <ThemedText style={styles.modelOptionCheck}>✓</ThemedText>
                    )}
                  </TouchableOpacity>
                )}
                style={styles.modelList}
              />
            </ThemedView>
          </TouchableOpacity>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
  },
  statusContainer: {
    marginTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusBadgeReady: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusBadgeLoading: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  statusBadgeGenerating: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  statusIndicator: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
  },
  inputIOS: {
    paddingTop: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  summarizeButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryTitle: {
    marginBottom: 12,
  },
  summaryBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  errorText: {
    fontSize: 14,
    color: '#ff0000',
  },
  modelSelectorContainer: {
    marginTop: 16,
    marginBottom: 12,
  },
  modelSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modelSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  modelSelectorButtonDisabled: {
    opacity: 0.5,
  },
  modelSelectorText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  modelSelectorSize: {
    fontSize: 12,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    lineHeight: 24,
  },
  modelList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modelOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  modelOptionContent: {
    flex: 1,
  },
  modelOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modelOptionNameSelected: {
    color: '#007AFF',
  },
  modelOptionDescription: {
    fontSize: 13,
    marginBottom: 4,
  },
  modelOptionSize: {
    fontSize: 12,
  },
  modelOptionCheck: {
    fontSize: 20,
    color: '#007AFF',
    marginLeft: 12,
  },
});

