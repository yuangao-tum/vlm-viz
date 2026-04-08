'use client'
import { create } from 'zustand'
import { MODELS, DEFAULT_MODEL, type ModelConfig } from '@/scene/modelConstants'

interface ModelState {
  selectedModelId: string
  model: ModelConfig

  selectModel: (id: string) => void
}

export const useModelStore = create<ModelState>((set) => ({
  selectedModelId: DEFAULT_MODEL,
  model: MODELS[DEFAULT_MODEL],

  selectModel: (id) => {
    const m = MODELS[id]
    if (m) set({ selectedModelId: id, model: m })
  },
}))
