'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useFinetuningStore } from '@/store/finetuningStore'
import { useModelStore } from '@/store/modelStore'
import { STAGES, STATUS_COLORS, STATUS_LABELS } from '@/scene/finetuningConfig'
import { CODE_SNIPPETS } from '@/scene/codeSnippets'

const BLOCK_NAMES: Record<number, string> = {
  0: 'Image Input',
  1: 'Patch Embedding',
  2: 'ViT Encoder',
  3: 'Spatial Merge',
  4: 'Connector',
  5: 'Text Tokens (embed_tokens)',
  6: 'LLM Decoder (model.model)',
  7: 'Trajectory Head (regression_head)',
  8: 'LM Head (lm_head)',
}

export function ComponentDetailPanel() {
  const { selectedComponent, selectedStage, setSelectedComponent } = useFinetuningStore()
  const stage = STAGES.find(s => s.id === selectedStage) ?? STAGES[1]

  if (selectedComponent === null) return null

  const comp = stage.components[selectedComponent]
  if (!comp) return null

  const color = STATUS_COLORS[comp.status]

  return (
    <div className="pointer-events-none fixed right-0 top-0 h-full w-96 flex items-center justify-end pr-6 z-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedStage}-${selectedComponent}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-auto bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-5 max-w-sm shadow-lg"
        >
          <h2 className="text-lg font-semibold text-gray-900">{BLOCK_NAMES[selectedComponent]}</h2>

          {/* Status badge */}
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-sm font-mono font-semibold" style={{ color }}>
              {STATUS_LABELS[comp.status]}
            </span>
          </div>

          {/* Config details */}
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <p>{comp.notes}</p>

            {comp.lr && (
              <div className="flex justify-between text-xs font-mono bg-gray-50 rounded px-2 py-1">
                <span>Learning Rate</span>
                <span className="text-gray-900 font-semibold">{comp.lr}</span>
              </div>
            )}

            {comp.loraRank && (
              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-amber-600">LoRA Configuration</div>
                <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-amber-50 rounded p-2">
                  <span className="text-gray-500">Rank</span><span className="text-gray-900">{comp.loraRank}</span>
                  <span className="text-gray-500">Alpha</span><span className="text-gray-900">{comp.loraAlpha}</span>
                  <span className="text-gray-500">Dropout</span><span className="text-gray-900">{comp.loraDropout}</span>
                  <span className="text-gray-500">Target</span><span className="text-gray-900">All Linear</span>
                  <span className="text-gray-500">Exclude</span><span className="text-gray-900">lm_head, embed_tokens, regression_head</span>
                </div>
              </div>
            )}

            {comp.sourceFile && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-400 font-mono">Source file</div>
                <code className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded block mt-1">
                  {comp.sourceFile}{comp.sourceLine ? `:${comp.sourceLine}` : ''}
                </code>
              </div>
            )}
          </div>

          {/* Code snippet */}
          <CodeSnippetSection blockIndex={selectedComponent} />

          <button
            onClick={() => setSelectedComponent(null)}
            className="mt-4 w-full py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-mono transition-colors"
          >
            Close
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function CodeSnippetSection({ blockIndex }: { blockIndex: number }) {
  const [show, setShow] = useState(false)
  const model = useModelStore((s) => s.model)
  const entry = CODE_SNIPPETS[blockIndex]
  const snippet = entry ? (entry[model.family] ?? entry.shared ?? null) : null
  if (!snippet) return null

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <button onClick={() => setShow(!show)} className="text-xs font-mono text-blue-600 hover:text-blue-800 transition-colors">
        {show ? '▼' : '▶'} Source: {snippet.className}
      </button>
      {show && (
        <div className="mt-2 space-y-1.5">
          <code className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono block truncate">
            {snippet.file}{snippet.lines ? `:${snippet.lines}` : ''}
          </code>
          <pre className="text-[10px] font-mono text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto overflow-y-auto max-h-52 border border-gray-100 leading-relaxed whitespace-pre">
            {snippet.code}
          </pre>
        </div>
      )}
    </div>
  )
}
