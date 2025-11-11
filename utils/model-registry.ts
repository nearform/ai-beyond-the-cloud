/**
 * Model Registry - Defines available models and their metadata
 */

import {
  SMOLLM2_1_135M_QUANTIZED,
  SMOLLM2_1_360M_QUANTIZED,
  SMOLLM2_1_1_7B_QUANTIZED,
  QWEN3_0_6B_QUANTIZED,
  QWEN3_1_7B_QUANTIZED,
  QWEN2_5_0_5B_QUANTIZED,
  QWEN2_5_1_5B_QUANTIZED,
  LLAMA3_2_1B_SPINQUANT,
  LLAMA3_2_3B_SPINQUANT,
  HAMMER2_1_0_5B_QUANTIZED,
  HAMMER2_1_1_5B_QUANTIZED,
} from 'react-native-executorch';

export type ModelId = 
  | 'smolLM2-135M-quantized'
  | 'smolLM2-360M-quantized'
  | 'smolLM2-1.7B-quantized'
  | 'qwen3-0.6B-quantized'
  | 'qwen3-1.7B-quantized'
  | 'qwen2.5-0.5B-quantized'
  | 'qwen2.5-1.5B-quantized'
  | 'llama3.2-1B-spinquant'
  | 'llama3.2-3B-spinquant'
  | 'hammer2.1-0.5B-quantized'
  | 'hammer2.1-1.5B-quantized';

export interface ModelInfo {
  id: ModelId;
  name: string;
  description: string;
  size: string;
  modelConfig: any; // The model config from react-native-executorch
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'smolLM2-135M-quantized',
    name: 'smolLM2 135M (Quantized)',
    description: 'Smallest model - fastest, lowest quality',
    size: '~50MB',
    modelConfig: SMOLLM2_1_135M_QUANTIZED,
  },
  {
    id: 'smolLM2-360M-quantized',
    name: 'smolLM2 360M (Quantized)',
    description: 'Small model - fast, decent quality',
    size: '~140MB',
    modelConfig: SMOLLM2_1_360M_QUANTIZED,
  },
  {
    id: 'qwen2.5-0.5B-quantized',
    name: 'Qwen 2.5 0.5B (Quantized)',
    description: 'Small Qwen model - balanced',
    size: '~200MB',
    modelConfig: QWEN2_5_0_5B_QUANTIZED,
  },
  {
    id: 'qwen3-0.6B-quantized',
    name: 'Qwen 3 0.6B (Quantized)',
    description: 'Small Qwen 3 model - good quality',
    size: '~240MB',
    modelConfig: QWEN3_0_6B_QUANTIZED,
  },
  {
    id: 'hammer2.1-0.5B-quantized',
    name: 'Hammer 2.1 0.5B (Quantized)',
    description: 'Small Hammer model',
    size: '~200MB',
    modelConfig: HAMMER2_1_0_5B_QUANTIZED,
  },
  {
    id: 'llama3.2-1B-spinquant',
    name: 'LLaMA 3.2 1B (SpinQuant)',
    description: 'LLaMA 3.2 1B - good balance',
    size: '~1.14GB',
    modelConfig: LLAMA3_2_1B_SPINQUANT,
  },
  {
    id: 'smolLM2-1.7B-quantized',
    name: 'smolLM2 1.7B (Quantized)',
    description: 'Larger smolLM2 - better quality',
    size: '~680MB',
    modelConfig: SMOLLM2_1_1_7B_QUANTIZED,
  },
  {
    id: 'qwen2.5-1.5B-quantized',
    name: 'Qwen 2.5 1.5B (Quantized)',
    description: 'Medium Qwen 2.5 model',
    size: '~600MB',
    modelConfig: QWEN2_5_1_5B_QUANTIZED,
  },
  {
    id: 'qwen3-1.7B-quantized',
    name: 'Qwen 3 1.7B (Quantized)',
    description: 'Medium Qwen 3 model - high quality',
    size: '~680MB',
    modelConfig: QWEN3_1_7B_QUANTIZED,
  },
  {
    id: 'hammer2.1-1.5B-quantized',
    name: 'Hammer 2.1 1.5B (Quantized)',
    description: 'Medium Hammer model',
    size: '~600MB',
    modelConfig: HAMMER2_1_1_5B_QUANTIZED,
  },
  {
    id: 'llama3.2-3B-spinquant',
    name: 'LLaMA 3.2 3B (SpinQuant)',
    description: 'Largest model - best quality, slower',
    size: '~3.4GB',
    modelConfig: LLAMA3_2_3B_SPINQUANT,
  },
];

export const DEFAULT_MODEL_ID: ModelId = 'smolLM2-135M-quantized';

export function getModelInfo(modelId: ModelId): ModelInfo {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  if (!model) {
    throw new Error(`Model not found: ${modelId}`);
  }
  return model;
}

