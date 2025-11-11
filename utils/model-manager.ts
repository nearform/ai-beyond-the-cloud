/**
 * Model Manager - Tracks which models are being used
 * Note: Actual model instances are managed by React hooks in components
 * This manager just tracks state and provides utilities
 */

import { ModelId } from './model-registry';

class ModelManager {
  private activeModels: Set<ModelId> = new Set();

  /**
   * Mark a model as active (being used)
   */
  registerModel(modelId: ModelId): void {
    this.activeModels.add(modelId);
  }

  /**
   * Unregister a model (no longer in use)
   */
  unregisterModel(modelId: ModelId): void {
    this.activeModels.delete(modelId);
  }

  /**
   * Check if a model is currently active
   */
  isModelActive(modelId: ModelId): boolean {
    return this.activeModels.has(modelId);
  }

  /**
   * Get all active model IDs
   */
  getActiveModelIds(): ModelId[] {
    return Array.from(this.activeModels);
  }
}

// Export singleton instance
export const modelManager = new ModelManager();

