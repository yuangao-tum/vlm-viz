'use client'
import { useLiveInferenceStore } from '@/store/liveInferenceStore'
import { VIT, LLM } from '@/scene/modelConstants'

export function LayerSelector() {
  const { selectedLayer, selectedHead, result, setSelectedLayer, setSelectedHead } = useLiveInferenceStore()

  if (!result) return null

  const vitLayers = Object.keys(result.vit_attentions).map(Number).sort((a, b) => a - b)
  const llmLayers = Object.keys(result.llm_attentions).map(Number).sort((a, b) => a - b)
  const allLayers = [...vitLayers.map(l => ({ type: 'vit', idx: l })), ...llmLayers.map(l => ({ type: 'llm', idx: l }))]

  const currentLayer = allLayers[selectedLayer] ?? allLayers[0]
  const maxHeads = currentLayer?.type === 'vit' ? VIT.NUM_HEADS : LLM.NUM_HEADS

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-mono text-muted">Attention Layer</h3>

      <div>
        <label className="text-xs text-muted font-mono">Layer ({currentLayer?.type?.toUpperCase()} {currentLayer?.idx})</label>
        <input
          type="range"
          min={0}
          max={allLayers.length - 1}
          value={selectedLayer}
          onChange={(e) => setSelectedLayer(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <div>
        <label className="text-xs text-muted font-mono">Head ({selectedHead})</label>
        <input
          type="range"
          min={0}
          max={maxHeads - 1}
          value={selectedHead}
          onChange={(e) => setSelectedHead(Number(e.target.value))}
          className="w-full accent-amber"
        />
      </div>
    </div>
  )
}
