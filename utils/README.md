# Summarizer Utility

This module provides text summarization functionality with support for:
- Text chunking for long documents
- URL fetching and content extraction
- Progressive summarization for very long texts
- On-device LLM integration (placeholder)

## Current Implementation

The current implementation uses a simple extractive summarization approach as a placeholder. To enable actual on-device LLM summarization, you need to integrate one of the following:

## On-Device LLM Integration Options

### Option 1: react-native-ai (Recommended)
```bash
npm install react-native-ai
```

Uses MLC LLM engine and provides Vercel AI SDK compatibility.

### Option 2: react-native-executorch
```bash
npm install react-native-executorch
```

Similar to expo-stt-blog approach, uses PyTorch Executorch for model execution.

### Option 3: Apple Foundation Models (iOS 26+)
For iOS, you can use Apple's native Foundation Models APIs. Requires iOS 26+.

### Option 4: Custom Native Module
Create a custom native module that loads a quantized model (e.g., GGUF format) and runs inference.

## Implementation Steps

1. Choose an LLM integration option above
2. Download/configure a quantized model (e.g., 1B-3B parameter model with INT4/INT8 quantization)
3. Replace the `generateSummaryWithLLM` function in `summarizer.ts` with actual LLM inference
4. Update model loading and initialization code
5. Handle model asset bundling for mobile apps

## Notes

- Text chunking respects context windows (default: 2000 characters)
- Progressive summarization handles very long documents by summarizing chunks, then summarizing the summaries
- URL fetching includes basic HTML tag removal (for production, consider a proper HTML parser)

