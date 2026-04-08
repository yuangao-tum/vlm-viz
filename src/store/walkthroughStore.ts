'use client'
import { create } from 'zustand'

interface WalkthroughState {
  activeBlock: number | null
  hoveredBlock: number | null
  activeSubBlock: string | null  // e.g. "rmsnorm", "qkv", "attention", "swiglu"

  setActiveBlock: (block: number | null) => void
  setHoveredBlock: (block: number | null) => void
  setActiveSubBlock: (id: string | null) => void
  goBack: () => void
}

export const useWalkthroughStore = create<WalkthroughState>((set, get) => ({
  activeBlock: null,
  hoveredBlock: null,
  activeSubBlock: null,

  setActiveBlock: (block) => set({ activeBlock: block, activeSubBlock: null }),
  setHoveredBlock: (block) => set({ hoveredBlock: block }),
  setActiveSubBlock: (id) => set({ activeSubBlock: id }),
  goBack: () => {
    const { activeSubBlock } = get()
    if (activeSubBlock) {
      // Go back from sub-block to block-level
      set({ activeSubBlock: null })
    } else {
      // Go back from block to overview
      set({ activeBlock: null })
    }
  },
}))
