# AI Beyond the Cloud

An on-device text summarization app built with React Native and Expo. This app demonstrates how to run Large Language Models (LLMs) entirely on-device, providing zero-cost AI functionality with complete privacy—your data never leaves your device.

## Features

- **On-device text summarization** using quantized LLM models
- **Privacy-first**: All processing happens locally, no cloud API calls
- **Zero cost**: No per-token charges or server infrastructure needed
- **Offline capable**: Works without internet connection
- **Multi-model support**: Choose from different quantized models optimized for mobile
- **Smart chunking**: Automatically handles long documents by processing them in chunks
- **Cross-platform**: Runs on both iOS and Android

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- For iOS development:
  - macOS
  - Xcode (latest version)
  - CocoaPods (`sudo gem install cocoapods`)
- For Android development:
  - Android Studio
  - Android SDK
  - Java Development Kit (JDK)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/nearform/ai-beyond-the-cloud.git
cd ai-beyond-the-cloud
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build and Run Development Build

This app uses native modules (`react-native-executorch`) and requires a development build. Expo Go is not supported.

**For iOS:**
```bash
npm run ios
```

This will build the development build and launch it on the iOS simulator or connected device.

**For Android:**
```bash
npm run android
```

This will build the development build and launch it on the Android emulator or connected device.

**Note:** 
- The first build may take a while as it compiles native code
- Subsequent runs will be faster with incremental builds

## Usage

1. **Enter text**: Paste or type the text you want to summarize in the input field
2. **Select model** (optional): Tap the model selector to choose a different quantized model
3. **Generate summary**: Tap the "Summarize" button
4. **View results**: The summary will appear below the input field
5. **Clear**: Tap "Clear" to reset the input and summary

The app automatically handles long texts by:
- Chunking text into manageable pieces
- Processing chunks sequentially with delays to prevent thermal throttling
- Combining chunk summaries into a final result

## Project Structure

```
├── app/
│   ├── _layout.tsx          # App layout and navigation
│   └── index.tsx            # Main screen component
├── components/              # Reusable UI components
├── utils/
│   ├── generation-core.ts   # Core LLM generation logic
│   ├── generation-service.ts # Generation session management
│   ├── model-manager.ts     # Model lifecycle management
│   ├── model-registry.ts    # Available models configuration
│   ├── summarizer.ts        # Text chunking utilities
│   └── use-model.ts         # React hook for model access
├── __tests__/               # Test suites
└── assets/                  # Images and static assets
```

## Available Scripts

- `npm start` - Start the Expo development server (required for development builds)
- `npm run ios` - Build and run on iOS simulator/device
- `npm run android` - Build and run on Android emulator/device
- `npm run web` - Run in web browser (limited functionality - on-device LLM not available)
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint

## Testing

The project includes comprehensive test coverage:

```bash
npm test
```

Tests cover:
- UI component interactions
- Text chunking logic
- Core generation functionality
- Model state management
- Error handling

## Technical Details

### Model Execution

The app uses `react-native-executorch` to run quantized PyTorch models on-device. Models are optimized for mobile with:
- INT4/INT8 quantization for reduced size and power consumption
- ExecuTorch runtime for efficient inference
- Smart memory management to prevent OOM crashes

### Architecture

- **Model Manager**: Handles model loading, initialization, and lifecycle
- **Generation Service**: Manages generation sessions and prevents race conditions
- **Generation Core**: Core LLM inference logic with cooldown and locking mechanisms
- **React Hooks**: `useLLMModel` provides reactive access to model state

### Performance Considerations

- Text is chunked to respect model context windows
- Delays between chunk processing prevent thermal throttling
- Input truncation prevents memory issues
- Generation cooldowns prevent rapid-fire requests

## Troubleshooting

### Model not loading
- Ensure you have sufficient device storage
- Check that the model files are properly bundled
- Try restarting the app

### Slow performance
- Use a smaller model for faster inference
- Reduce input text length
- Close other apps to free up memory

### App crashes
- The app limits input size and chunk count to prevent OOM
- If crashes persist, try a device with more RAM or a smaller model
- Check device logs for specific error messages

## Learn More

For a detailed technical deep-dive into on-device AI, quantization, and the architecture decisions behind this app, see [BLOG.md](./BLOG.md).

## License

This project is private and proprietary.

## Contributing

This is a demonstration project. For questions or issues, please open an issue on GitHub.
