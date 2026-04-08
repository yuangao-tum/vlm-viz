'use client'
import { useLiveInferenceStore } from '@/store/liveInferenceStore'
import { useInference } from '@/hooks/useInference'

export function InferencePanel() {
  const { status, uploadedFile, result, error } = useLiveInferenceStore()
  const { mutate } = useInference()

  const handleRun = () => {
    if (!uploadedFile) return
    mutate({
      image: uploadedFile,
      vehicle_state: JSON.stringify({
        position: [0, 0],
        velocity: 5.0,
        acceleration: 0.0,
        heading: 0.0,
      }),
      style: 'Default',
    })
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-mono text-muted">Inference</h3>

      <button
        onClick={handleRun}
        disabled={!uploadedFile || status === 'loading'}
        className="w-full py-2 px-4 rounded bg-accent text-white text-sm font-mono disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/80 transition-colors"
      >
        {status === 'loading' ? 'Running...' : 'Run Inference'}
      </button>

      {status === 'error' && (
        <p className="text-xs text-red-400 font-mono">{error}</p>
      )}

      {result && (
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between text-muted">
            <span>ViT</span>
            <span>{result.timing.vit_ms.toFixed(0)}ms</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>LLM</span>
            <span>{result.timing.llm_ms.toFixed(0)}ms</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Head</span>
            <span>{result.timing.head_ms.toFixed(0)}ms</span>
          </div>
          <div className="pt-2 border-t border-border flex justify-between text-white">
            <span>Total</span>
            <span>{(result.timing.vit_ms + result.timing.llm_ms + result.timing.head_ms).toFixed(0)}ms</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Visual tokens</span>
            <span>{result.num_visual_tokens}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Text tokens</span>
            <span>{result.num_text_tokens}</span>
          </div>
        </div>
      )}
    </div>
  )
}
