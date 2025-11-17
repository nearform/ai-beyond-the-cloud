---
theme: default
background: https://source.unsplash.com/1920x1080/?technology,ai
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## AI Beyond the Cloud
  On-Device Generative AI: Current State and Future
  
  Presentation based on the blog post about on-device LLMs
drawings:
  persist: false
transition: slide-left
title: AI Beyond the Cloud
mdc: true
css: unocss
---

# AI Beyond the Cloud

## The Current and Future State of On-Device Generative AI

**Ruslan Bredikhin** • November 2025

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next page <carbon:arrow-right class="inline"/>
  </span>
</div>

---
layout: default
---

# Stop Paying for Every Token

<div class="text-4xl font-bold text-center mt-20">
  On-device LLMs deliver enterprise AI functionality
</div>

<div class="grid grid-cols-2 gap-8 mt-16">
  <div class="text-center">
    <div class="text-6xl mb-4">💰</div>
    <div class="text-2xl font-semibold">Zero Cloud Costs</div>
  </div>
  <div class="text-center">
    <div class="text-6xl mb-4">🔒</div>
    <div class="text-2xl font-semibold">Total Privacy</div>
  </div>
</div>

<div class="mt-12 text-xl text-center opacity-80">
  All processing happens entirely on the device
</div>

---
layout: section
---

# The Shift is Real

---
layout: default
---

# Why On-Device AI?

<div class="grid grid-cols-2 gap-8 mt-8">
  <div>
    <h3 class="text-2xl font-bold mb-4">Cloud-Based AI</h3>
    <ul class="text-lg space-y-2">
      <li>✅ Great for training</li>
      <li>❌ Expensive per-token costs</li>
      <li>❌ Privacy concerns</li>
      <li>❌ Scaling headaches</li>
      <li>❌ Requires connectivity</li>
    </ul>
  </div>
  <div>
    <h3 class="text-2xl font-bold mb-4">On-Device AI</h3>
    <ul class="text-lg space-y-2">
      <li>✅ Zero per-token costs</li>
      <li>✅ Complete privacy</li>
      <li>✅ Scales effortlessly</li>
      <li>✅ Works offline</li>
      <li>⚠️ Performance trade-offs (for now)</li>
    </ul>
  </div>
</div>

<div class="mt-8 text-center text-xl opacity-80">
  The economics and privacy implications are shifting
</div>

---
layout: section
---

# Privacy and Cost Efficiency

---
layout: default
---

# Privacy by Design

<div class="text-3xl font-bold mb-8 text-center">
  Your Data Never Leaves the Device
</div>

<div class="grid grid-cols-3 gap-6 mt-12">
  <div class="text-center">
    <div class="text-5xl mb-4">🚫</div>
    <div class="text-xl font-semibold">No API Calls</div>
    <div class="text-sm mt-2 opacity-70">No external services</div>
  </div>
  <div class="text-center">
    <div class="text-5xl mb-4">🏠</div>
    <div class="text-xl font-semibold">Local Processing</div>
    <div class="text-sm mt-2 opacity-70">All handled on-device</div>
  </div>
  <div class="text-center">
    <div class="text-5xl mb-4">🔐</div>
    <div class="text-xl font-semibold">Your Control</div>
    <div class="text-sm mt-2 opacity-70">Enterprise data stays private</div>
  </div>
</div>

<div class="mt-12 p-6 bg-blue-500 bg-opacity-20 rounded-lg">
  <div class="text-lg font-semibold mb-2">Modular Architecture</div>
  <div class="text-sm opacity-90">
    Connect to trusted server-side knowledge base for proprietary data<br/>
    while keeping user queries and personal context local
  </div>
</div>

---
layout: default
---

# Zero Cost and Scalability

<div class="grid grid-cols-2 gap-8 mt-8">
  <div>
    <h3 class="text-2xl font-bold mb-4">💰 Cost Savings</h3>
    <ul class="text-lg space-y-3">
      <li>✅ No per-token charges</li>
      <li>✅ No cloud server costs</li>
      <li>✅ No scaling infrastructure</li>
      <li>✅ No rate limit negotiations</li>
    </ul>
  </div>
  <div>
    <h3 class="text-2xl font-bold mb-4">📈 Scaling</h3>
    <ul class="text-lg space-y-3">
      <li>✅ Scales to millions of users</li>
      <li>✅ Each device does its own work</li>
      <li>✅ No GPU provisioning needed</li>
      <li>✅ Launch features without infrastructure changes</li>
    </ul>
  </div>
</div>

<div class="mt-8 p-6 bg-green-500 bg-opacity-20 rounded-lg">
  <div class="text-lg font-semibold mb-2">🌐 Bonus: Offline Capability</div>
  <div class="text-sm opacity-90">
    Users in poor connectivity areas or with sensitive data requirements<br/>
    still get full AI functionality
  </div>
</div>

---
layout: section
---

# Overcoming Hardware Limitations

---
layout: default
---

# The Energy Consumption Problem

<div class="text-2xl font-bold mb-8 text-center">
  Mobile devices face fundamental challenges
</div>

<div class="grid grid-cols-2 gap-8 mt-8">
  <div class="p-6 bg-red-500 bg-opacity-20 rounded-lg">
    <div class="text-xl font-semibold mb-4">🔋 Battery Life</div>
    <div class="text-lg">
      <ul class="space-y-2">
        <li>20 iterations of large prompts</li>
        <li>Can cause 16% battery level delta</li>
        <li>Rapid battery depletion</li>
      </ul>
    </div>
  </div>
  <div class="p-6 bg-orange-500 bg-opacity-20 rounded-lg">
    <div class="text-xl font-semibold mb-4">🌡️ Thermal Management</div>
    <div class="text-lg">
      <ul class="space-y-2">
        <li>No thermal management systems</li>
        <li>Device gets hot</li>
        <li>Performance throttles</li>
      </ul>
    </div>
  </div>
</div>

<div class="mt-8 text-center text-lg opacity-80">
  Small models (&lt;1B) are manageable, but scale up and you hit limits quickly
</div>

---
layout: default
---

# What is Quantization?

<div class="text-2xl font-bold mb-6 text-center">
  Reducing model size and computational cost
</div>

<div class="mt-6 p-6 bg-blue-500 bg-opacity-20 rounded-lg">
  <div class="text-lg font-semibold mb-3">Definition</div>
  <div class="text-base opacity-90">
    <strong>Quantization</strong> is the process of converting model weights from high-precision floating-point numbers<br/>
    (like 32-bit or 16-bit) to lower-precision integers (like 8-bit or 4-bit) to reduce memory and computation.
  </div>
</div>

<div class="grid grid-cols-2 gap-6 mt-8">
  <div class="p-6 bg-green-500 bg-opacity-20 rounded-lg">
    <div class="text-xl font-semibold mb-3">Why We Need It</div>
    <ul class="text-base space-y-2 opacity-90">
      <li>📦 Reduce memory footprint</li>
      <li>⚡ Faster inference</li>
      <li>🔋 Lower power consumption</li>
      <li>📱 Enable deployment on mobile</li>
    </ul>
  </div>
  <div class="p-6 bg-yellow-500 bg-opacity-20 rounded-lg">
    <div class="text-xl font-semibold mb-3">What You Get</div>
    <ul class="text-base space-y-2 opacity-90">
      <li>~95-99% quality retention</li>
      <li>Massive size reduction</li>
      <li>Small precision loss (acceptable)</li>
      <li>Worth it for most use cases</li>
    </ul>
  </div>
</div>

<div class="mt-8 p-4 bg-gray-500 bg-opacity-20 rounded-lg">
  <div class="text-sm text-center opacity-80">
    <strong>Simple Analogy:</strong> Like compressing a high-resolution photo to JPEG.<br/>
    You lose some detail, but the file becomes much smaller and still looks great.
  </div>
</div>

---
layout: default
---

# Model Optimization Through Quantization

<div class="text-3xl font-bold mb-8 text-center">
  Converting high-precision to lower-precision
</div>

<div class="grid grid-cols-4 gap-4 mt-8">
  <div class="text-center p-4 bg-blue-500 bg-opacity-20 rounded">
    <div class="text-2xl font-bold">FP32</div>
    <div class="text-sm mt-2">4 bytes</div>
    <div class="text-xs mt-1 opacity-70">Full precision</div>
  </div>
  <div class="text-center p-4 bg-blue-500 bg-opacity-20 rounded">
    <div class="text-2xl font-bold">FP16</div>
    <div class="text-sm mt-2">2 bytes</div>
    <div class="text-xs mt-1 opacity-70">Half precision</div>
  </div>
  <div class="text-center p-4 bg-green-500 bg-opacity-20 rounded">
    <div class="text-2xl font-bold">INT8</div>
    <div class="text-sm mt-2">1 byte</div>
    <div class="text-xs mt-1 opacity-70">4× smaller</div>
  </div>
  <div class="text-center p-4 bg-green-500 bg-opacity-20 rounded">
    <div class="text-2xl font-bold">INT4</div>
    <div class="text-sm mt-2">0.5 byte</div>
    <div class="text-xs mt-1 opacity-70">8× smaller</div>
  </div>
</div>

<div class="mt-8 p-6 bg-yellow-500 bg-opacity-20 rounded-lg">
  <div class="text-lg font-semibold mb-2">Example: 7B Parameter Model</div>
  <div class="grid grid-cols-4 gap-4 text-sm">
    <div>FP32: 28 GB</div>
    <div>FP16: 14 GB</div>
    <div>INT8: 7 GB</div>
    <div>INT4: 3.5 GB</div>
  </div>
</div>

---
layout: default
---

# Quantization Benefits

<div class="grid grid-cols-2 gap-8 mt-8">
  <div>
    <h3 class="text-2xl font-bold mb-4">📦 Size Reduction</h3>
    <ul class="text-lg space-y-3">
      <li>INT8: 4× smaller than FP32</li>
      <li>INT4: 8× smaller than FP32</li>
      <li>Enables LLMs on resource-constrained devices</li>
    </ul>
  </div>
  <div>
    <h3 class="text-2xl font-bold mb-4">⚡ Performance Gains</h3>
    <ul class="text-lg space-y-3">
      <li>INT8: 40% reduction in cost & power</li>
      <li>INT4: 65% reduction in cost & power</li>
      <li>INT4: 4× throughput increase</li>
      <li>INT4: 60% power consumption cut</li>
    </ul>
  </div>
</div>

<div class="mt-8 p-6 bg-green-500 bg-opacity-20 rounded-lg">
  <div class="text-lg font-semibold mb-2">Quality Trade-off</div>
  <div class="text-sm opacity-90">
    INT4 methods like QLoRA demonstrate ~99% of original model performance<br/>
    You get 95% of quality with a fraction of the cost
  </div>
</div>

<div class="mt-6 text-center text-lg opacity-80">
  <strong>Sweet Spot:</strong> Text summarization → INT4 | Complex reasoning → INT8
</div>

---
layout: default
---

# Thermal and Performance Considerations

<div class="text-2xl font-bold mb-8 text-center">
  Smart chunking and thermal management
</div>

<div class="grid grid-cols-2 gap-8 mt-8">
  <div class="p-6 bg-blue-500 bg-opacity-20 rounded-lg">
    <div class="text-xl font-semibold mb-4">✅ Best Practices</div>
    <ul class="text-lg space-y-2">
      <li>Short bursts of inference</li>
      <li>Process text in chunks</li>
      <li>Insert delays between operations</li>
      <li>Give device time to cool</li>
    </ul>
  </div>
  <div class="p-6 bg-red-500 bg-opacity-20 rounded-lg">
    <div class="text-xl font-semibold mb-4">⚠️ Avoid</div>
    <ul class="text-lg space-y-2">
      <li>Continuous generation over minutes</li>
      <li>No thermal management</li>
      <li>Triggering thermal throttling</li>
      <li>Performance degradation</li>
    </ul>
  </div>
</div>

<div class="mt-8 text-center text-lg">
  <div class="font-semibold mb-2">Key Insight</div>
  <div class="opacity-80">
    Once throttling kicks in, everything slows down.<br/>
    Smart chunking maintains consistent performance.
  </div>
</div>

---
layout: section
---

# RAG and Integration

---
layout: default
---

# Retrieval-Augmented Generation (RAG)

<div class="text-3xl font-bold mb-8 text-center">
  Improving Output Quality and Relevance
</div>

<div class="mt-8 p-6 bg-blue-500 bg-opacity-20 rounded-lg">
  <div class="text-lg font-semibold mb-4">What is RAG?</div>
  <div class="text-base opacity-90">
    RAG improves LLM responses by supplementing the model with relevant information<br/>
    retrieved from a local knowledge base. Accuracy, relevance, and context all improve.
  </div>
</div>

<div class="grid grid-cols-2 gap-8 mt-8">
  <div>
    <h3 class="text-xl font-semibold mb-3">❌ Without RAG</h3>
    <ul class="text-sm space-y-2 opacity-80">
      <li>Relies solely on training data</li>
      <li>May be outdated</li>
      <li>Generic responses</li>
    </ul>
  </div>
  <div>
    <h3 class="text-xl font-semibold mb-3">✅ With RAG</h3>
    <ul class="text-sm space-y-2 opacity-80">
      <li>Access to domain-specific info</li>
      <li>Up-to-date knowledge base</li>
      <li>Accurate, relevant, helpful</li>
    </ul>
  </div>
</div>

---
layout: default
---

# RAG Workflow

<div class="text-2xl font-bold mb-8 text-center">
  Structured Generation Process
</div>

<div class="grid grid-cols-4 gap-4 mt-12">
  <div class="text-center p-6 bg-blue-500 bg-opacity-20 rounded-lg">
    <div class="text-4xl mb-4">1️⃣</div>
    <div class="text-xl font-semibold">Question</div>
    <div class="text-sm mt-2 opacity-70">User query comes in</div>
  </div>
  <div class="text-center p-6 bg-green-500 bg-opacity-20 rounded-lg">
    <div class="text-4xl mb-4">2️⃣</div>
    <div class="text-xl font-semibold">Retrieve</div>
    <div class="text-sm mt-2 opacity-70">Search knowledge base</div>
  </div>
  <div class="text-center p-6 bg-yellow-500 bg-opacity-20 rounded-lg">
    <div class="text-4xl mb-4">3️⃣</div>
    <div class="text-xl font-semibold">Augment</div>
    <div class="text-sm mt-2 opacity-70">Create context-rich prompt</div>
  </div>
  <div class="text-center p-6 bg-purple-500 bg-opacity-20 rounded-lg">
    <div class="text-4xl mb-4">4️⃣</div>
    <div class="text-xl font-semibold">Generate</div>
    <div class="text-sm mt-2 opacity-70">LLM produces answer</div>
  </div>
</div>

<div class="mt-8 p-6 bg-gray-500 bg-opacity-20 rounded-lg">
  <div class="text-sm opacity-90">
    <strong>Key:</strong> Knowledge base is pre-indexed and stored locally.<br/>
    Retrieval happens fast via vector similarity search on embedded documents.
  </div>
</div>

---
layout: default
---

# On-Device Integration

<div class="text-2xl font-bold mb-8 text-center">
  The ecosystem is maturing rapidly
</div>

<div class="grid grid-cols-2 gap-8 mt-8">
  <div class="p-6 bg-blue-500 bg-opacity-20 rounded-lg">
    <div class="text-xl font-semibold mb-4">📱 React Native</div>
    <ul class="text-lg space-y-2">
      <li><code>react-native-executorch</code></li>
      <li>PyTorch ExecuTorch runtime</li>
      <li><code>react-native-ai</code></li>
      <li>MLC LLM & Vercel AI SDK</li>
    </ul>
  </div>
  <div class="p-6 bg-green-500 bg-opacity-20 rounded-lg">
    <div class="text-xl font-semibold mb-4">🍎 iOS 18+</div>
    <ul class="text-lg space-y-2">
      <li>Apple Foundation Models</li>
      <li>Instant AI features natively</li>
      <li>Text generation, embeddings</li>
      <li>Transcription, speech synthesis</li>
    </ul>
  </div>
</div>

<div class="mt-8 p-6 bg-yellow-500 bg-opacity-20 rounded-lg">
  <div class="text-lg font-semibold mb-2">🚀 Integration Story</div>
  <div class="text-sm opacity-90">
    A year ago: custom native code + significant optimization work<br/>
    Now: pull in a library and have basic inference working in an afternoon
  </div>
</div>

---
layout: section
---

# Demo: On-Device Text Summarization

---
layout: default
---

# The Demo Application

<div class="text-2xl font-bold mb-8 text-center">
  Real-world on-device summarization
</div>

<div class="grid grid-cols-2 gap-8 mt-8">
  <div>
    <h3 class="text-xl font-semibold mb-4">✨ Features</h3>
    <ul class="text-lg space-y-2">
      <li>✅ Paste text directly</li>
      <li>✅ Process locally</li>
      <li>✅ Generate summary on-device</li>
      <li>✅ No API calls</li>
      <li>✅ No cloud infrastructure</li>
      <li>✅ Zero per-request costs</li>
    </ul>
  </div>
  <div>
    <h3 class="text-xl font-semibold mb-4">🏗️ Architecture</h3>
    <ul class="text-lg space-y-2">
      <li>Text chunking for long documents</li>
      <li>Local vector embeddings for RAG</li>
      <li>Progressive summarization</li>
      <li>Optimized quantized weights</li>
      <li>Fast and power-efficient</li>
    </ul>
  </div>
</div>

<div class="mt-8 text-center">
  <div class="text-lg font-semibold mb-2">Built with</div>
  <div class="text-base opacity-80">
    <code>react-native-executorch</code> + quantized models
  </div>
</div>

---
layout: image-right
image: /qwen-result.png
backgroundSize: contain
---

# Demo Results

<div class="mt-8">
  <h3 class="text-2xl font-bold mb-6">Qwen 2.5 0.5B Results</h3>
  
  <div class="space-y-4 text-lg">
    <div class="p-4 bg-green-500 bg-opacity-20 rounded">
      <div class="font-semibold">✅ Best Balance</div>
      <div class="text-sm mt-1 opacity-80">
        ~200MB model size<br/>
        Good quality output<br/>
        Reasonable performance<br/>
        Manageable memory usage
      </div>
    </div>
  </div>
</div>

<div class="mt-8 p-4 bg-blue-500 bg-opacity-20 rounded">
  <div class="text-sm">
    <strong>Try it:</strong> Clone the repo, install dependencies,<br/>
    run <code>npm run ios</code> or <code>npm run android</code>
  </div>
</div>

---
layout: image-right
image: /model-selection.png
backgroundSize: contain
---

# Model Selection

<div class="mt-8">
  <h3 class="text-2xl font-bold mb-6">Available Models</h3>
  
  <div class="space-y-3 text-base">
    <div class="p-3 bg-red-500 bg-opacity-20 rounded">
      <div class="font-semibold">SMOLLM2 135M</div>
      <div class="text-xs mt-1 opacity-70">50MB • Fastest • Lowest quality</div>
    </div>
    <div class="p-3 bg-green-500 bg-opacity-20 rounded">
      <div class="font-semibold">QWEN 2.5 0.5B ⭐</div>
      <div class="text-xs mt-1 opacity-70">200MB • Best balance</div>
    </div>
    <div class="p-3 bg-yellow-500 bg-opacity-20 rounded">
      <div class="font-semibold">LLAMA 3.2 3B</div>
      <div class="text-xs mt-1 opacity-70">3.4GB • Best quality • Memory issues</div>
    </div>
  </div>
</div>

<div class="mt-6 text-sm opacity-80">
  Switch between models to see trade-offs in real-time
</div>

---
layout: image-right
image: /smollm2-result.png
backgroundSize: contain
---

# Model Comparison

<div class="mt-8">
  <h3 class="text-2xl font-bold mb-6">Testing Results</h3>
  
  <div class="space-y-4 text-base">
    <div class="p-4 bg-red-500 bg-opacity-20 rounded">
      <div class="font-semibold mb-2">Smallest: SMOLLM2 135M</div>
      <div class="text-sm opacity-80">
        ✅ Incredibly fast<br/>
        ❌ Doesn't produce best results
      </div>
    </div>
    <div class="p-4 bg-green-500 bg-opacity-20 rounded">
      <div class="font-semibold mb-2">Recommended: QWEN 2.5 0.5B</div>
      <div class="text-sm opacity-80">
        ✅ Good quality output<br/>
        ✅ Reasonable performance<br/>
        ✅ Manageable memory usage
      </div>
    </div>
    <div class="p-4 bg-yellow-500 bg-opacity-20 rounded">
      <div class="font-semibold mb-2">Largest: LLAMA 3.2 3B</div>
      <div class="text-sm opacity-80">
        ✅ Best quality<br/>
        ❌ Memory issues on many devices
      </div>
    </div>
  </div>
</div>

---
layout: section
---

# Conclusion

---
layout: default
---

# The Future is On-Device First

<div class="grid grid-cols-2 gap-8 mt-8">
  <div>
    <h3 class="text-2xl font-bold mb-4">✅ What's Working</h3>
    <ul class="text-lg space-y-3">
      <li>Privacy by design</li>
      <li>Zero cost scaling</li>
      <li>Offline capability</li>
      <li>RAG runs locally</li>
      <li>Quantization enables deployment</li>
    </ul>
  </div>
  <div>
    <h3 class="text-2xl font-bold mb-4">🚀 What's Coming</h3>
    <ul class="text-lg space-y-3">
      <li>Better hardware</li>
      <li>Maturing tooling</li>
      <li>Economics shifting</li>
      <li>Easier deployment</li>
      <li>Continuous innovation</li>
    </ul>
  </div>
</div>

<div class="mt-8 p-6 bg-blue-500 bg-opacity-20 rounded-lg">
  <div class="text-lg font-semibold mb-2">Key Metrics</div>
  <div class="text-sm opacity-90">
    • Up to 68% model size reduction<br/>
    • Up to 65% computational cost reduction<br/>
    • Powerful AI systems viable on average smartphones
  </div>
</div>

---
layout: default
---

# When to Use On-Device AI

<div class="text-2xl font-bold mb-8 text-center">
  Not every app needs an LLM, but when it matters...
</div>

<div class="grid grid-cols-3 gap-6 mt-12">
  <div class="text-center p-6 bg-blue-500 bg-opacity-20 rounded-lg">
    <div class="text-5xl mb-4">🔒</div>
    <div class="text-xl font-semibold mb-2">Privacy Matters</div>
    <div class="text-sm opacity-70">Sensitive data requirements</div>
  </div>
  <div class="text-center p-6 bg-green-500 bg-opacity-20 rounded-lg">
    <div class="text-5xl mb-4">💰</div>
    <div class="text-xl font-semibold mb-2">Cost Matters</div>
    <div class="text-sm opacity-70">Scale without infrastructure</div>
  </div>
  <div class="text-center p-6 bg-purple-500 bg-opacity-20 rounded-lg">
    <div class="text-5xl mb-4">🌐</div>
    <div class="text-xl font-semibold mb-2">Offline Matters</div>
    <div class="text-sm opacity-70">Poor connectivity areas</div>
  </div>
</div>

<div class="mt-12 text-center text-xl">
  <div class="font-semibold mb-2">The Path Forward</div>
  <div class="text-lg opacity-80">
    Continuous innovation in model compression<br/>
    Better collaboration between LLM researchers and mobile hardware developers<br/>
    Tools that make on-device AI as easy as cloud-based alternatives
  </div>
</div>

---
layout: center
class: text-center
---

# Thank You!

<div class="text-3xl font-bold mt-12 mb-8">
  AI Beyond the Cloud
</div>

<div class="text-xl opacity-80 mb-12">
  On-Device Generative AI<br/>
  Current State and Future
</div>

<div class="text-lg opacity-70">
  <div class="mb-4">
    <strong>Demo:</strong> <code>github.com/nearform/ai-beyond-the-cloud</code>
  </div>
  <div>
    <strong>Try it:</strong> <code>npm run ios</code> or <code>npm run android</code>
  </div>
</div>

<div class="mt-16 text-sm opacity-60">
  Ruslan Bredikhin • November 2025
</div>
