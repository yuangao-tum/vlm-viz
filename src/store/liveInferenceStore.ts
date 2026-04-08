'use client'
import { create } from 'zustand'
import type { InferenceResponse, TrajectoryPoint, AttentionLayer } from '@/types/inference'

type Status = 'idle' | 'loading' | 'done' | 'error'

interface LiveInferenceState {
  status: Status
  uploadedImage: string | null   // object URL
  uploadedFile: File | null
  result: InferenceResponse | null
  error: string | null
  selectedLayer: number           // which layer to show heatmap for
  selectedHead: number            // which head

  setImage: (file: File) => void
  setStatus: (s: Status) => void
  setResult: (r: InferenceResponse) => void
  setError: (e: string) => void
  setSelectedLayer: (l: number) => void
  setSelectedHead: (h: number) => void
  reset: () => void
}

export const useLiveInferenceStore = create<LiveInferenceState>((set) => ({
  status: 'idle',
  uploadedImage: null,
  uploadedFile: null,
  result: null,
  error: null,
  selectedLayer: 0,
  selectedHead: 0,

  setImage: (file) => set({
    uploadedFile: file,
    uploadedImage: URL.createObjectURL(file),
    status: 'idle',
    result: null,
    error: null,
  }),
  setStatus: (s) => set({ status: s }),
  setResult: (r) => set({ result: r, status: 'done' }),
  setError: (e) => set({ error: e, status: 'error' }),
  setSelectedLayer: (l) => set({ selectedLayer: l }),
  setSelectedHead: (h) => set({ selectedHead: h }),
  reset: () => set({ status: 'idle', uploadedImage: null, uploadedFile: null, result: null, error: null }),
}))
