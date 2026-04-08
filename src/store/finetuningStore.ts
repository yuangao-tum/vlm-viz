'use client'
import { create } from 'zustand'

interface FinetuningState {
  selectedStage: number        // 1, 2, or 3
  trainingMode: string         // 'sft', 'grpo', 'dpo'
  selectedComponent: number | null  // block index when clicked
  hoveredComponent: number | null

  setSelectedStage: (stage: number) => void
  setTrainingMode: (mode: string) => void
  setSelectedComponent: (idx: number | null) => void
  setHoveredComponent: (idx: number | null) => void
}

export const useFinetuningStore = create<FinetuningState>((set) => ({
  selectedStage: 2,  // default to recommended stage
  trainingMode: 'sft',
  selectedComponent: null,
  hoveredComponent: null,

  setSelectedStage: (stage) => set({ selectedStage: stage }),
  setTrainingMode: (mode) => set({ trainingMode: mode }),
  setSelectedComponent: (idx) => set({ selectedComponent: idx }),
  setHoveredComponent: (idx) => set({ hoveredComponent: idx }),
}))
