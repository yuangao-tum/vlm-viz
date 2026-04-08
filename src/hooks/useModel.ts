'use client'
import { useModelStore } from '@/store/modelStore'

/** Convenience hook to get the current model's VIT and LLM configs */
export function useModel() {
  const model = useModelStore((s) => s.model)
  return { model, vit: model.vit, llm: model.llm }
}
