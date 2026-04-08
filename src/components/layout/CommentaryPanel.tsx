'use client'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWalkthroughStore } from '@/store/walkthroughStore'
import { useModelStore } from '@/store/modelStore'
import { getSteps } from '@/components/walkthrough/StepRegistry'
import { CODE_SNIPPETS } from '@/scene/codeSnippets'
import { VIT_SUB_BLOCK_MAP, LLM_SUB_BLOCK_MAP, type SubBlockInfo } from '@/scene/subBlockInfo'

export function CommentaryPanel() {
  const activeBlock = useWalkthroughStore((s) => s.activeBlock)
  const hoveredBlock = useWalkthroughStore((s) => s.hoveredBlock)
  const activeSubBlock = useWalkthroughStore((s) => s.activeSubBlock)
  const goBack = useWalkthroughStore((s) => s.goBack)
  const model = useModelStore((s) => s.model)
  const [showCode, setShowCode] = useState(false)

  const steps = useMemo(() => getSteps(model), [model])

  const displayBlock = activeBlock ?? hoveredBlock
  if (displayBlock === null) return null

  // If a sub-block is selected, show sub-block info
  if (activeSubBlock && activeBlock !== null) {
    const subMap = activeBlock === 2 ? VIT_SUB_BLOCK_MAP : activeBlock === 6 ? LLM_SUB_BLOCK_MAP : null
    const subInfo = subMap?.[activeSubBlock]
    if (subInfo) {
      const blockTitle = activeBlock === 2 ? 'ViT Layer' : 'LLM Layer'
      return <SubBlockPanel subInfo={subInfo} blockTitle={blockTitle} goBack={goBack} />
    }
  }

  const step = steps[displayBlock]
  if (!step) return null

  const snippetEntry = CODE_SNIPPETS[displayBlock]
  const snippet = snippetEntry ? (snippetEntry[model.family] ?? snippetEntry.shared ?? null) : null

  return (
    <div className="pointer-events-none fixed right-0 top-14 bottom-0 w-[520px] flex items-start justify-end pr-4 pt-4 z-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${model.id}-${step.id}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="pointer-events-auto bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-5 w-full shadow-lg max-h-[calc(100vh-80px)] overflow-y-auto"
        >
          <h2 className="text-lg font-semibold text-gray-900 leading-tight">{step.title}</h2>
          <p className="text-sm text-gray-400 mt-0.5 mb-3">{step.subtitle}</p>

          <div className="text-sm text-gray-600 leading-relaxed space-y-2 pr-1">
            {step.commentary.split('\n\n').map((para, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: formatProse(para) }} />
            ))}
          </div>

          {/* Math section — shown for ALL blocks */}
          {step.math && activeBlock !== null && (
            <div className="mt-3">
              <div className="text-xs font-mono font-semibold text-blue-600 mb-1.5">{step.math.title}</div>
              <pre className="text-[11px] font-mono text-gray-800 bg-blue-50 rounded-lg p-3 overflow-x-auto border border-blue-100 leading-relaxed whitespace-pre">
                {step.math.formulas.join('\n')}
              </pre>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{step.math.explanation}</p>
            </div>
          )}

          {snippet && activeBlock !== null && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button onClick={() => setShowCode(!showCode)} className="text-xs font-mono text-blue-600 hover:text-blue-800 transition-colors">
                {showCode ? '▼' : '▶'} Source Code: {snippet.className}
              </button>
              {showCode && (
                <div className="mt-2 space-y-1.5">
                  <code className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono truncate block">
                    {snippet.file}{snippet.lines ? `:${snippet.lines}` : ''}
                  </code>
                  <pre className="text-[10px] font-mono text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto overflow-y-auto max-h-64 border border-gray-100 leading-relaxed whitespace-pre">
                    {snippet.code}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeBlock !== null && (
            <button onClick={() => { goBack(); setShowCode(false) }}
              className="mt-4 w-full py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-mono transition-colors">
              ← Back to Overview
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ============ Sub-Block Panel (math + description) ============

function SubBlockPanel({ subInfo, blockTitle, goBack }: { subInfo: SubBlockInfo; blockTitle: string; goBack: () => void }) {
  const [showCode, setShowCode] = useState(false)

  return (
    <div className="pointer-events-none fixed right-0 top-14 bottom-0 w-[520px] flex items-start justify-end pr-4 pt-4 z-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={subInfo.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-auto bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-5 w-full shadow-lg max-h-[calc(100vh-80px)] overflow-y-auto"
        >
          {/* Breadcrumb */}
          <div className="text-xs text-gray-400 font-mono mb-2">
            {blockTitle} › <span className="text-gray-700">{subInfo.title}</span>
          </div>

          <h2 className="text-lg font-semibold text-gray-900">{subInfo.title}</h2>

          {/* Description */}
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{subInfo.description}</p>

          {/* Math formulas */}
          <div className="mt-4">
            <div className="text-xs font-mono font-semibold text-blue-600 mb-1.5">Mathematical Formula</div>
            <pre className="text-[11px] font-mono text-gray-800 bg-blue-50 rounded-lg p-4 overflow-x-auto border border-blue-100 leading-relaxed whitespace-pre">
              {subInfo.math.join('\n')}
            </pre>
          </div>

          {/* Math explanation */}
          <div className="mt-3">
            <div className="text-xs font-mono font-semibold text-gray-500 mb-1">Intuition</div>
            <p className="text-sm text-gray-600 leading-relaxed">{subInfo.mathExplanation}</p>
          </div>

          {/* Code snippet */}
          {subInfo.codeSnippet && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button onClick={() => setShowCode(!showCode)} className="text-xs font-mono text-blue-600 hover:text-blue-800 transition-colors">
                {showCode ? '▼' : '▶'} PyTorch Implementation
              </button>
              {showCode && (
                <div className="mt-2">
                  {subInfo.sourceFile && (
                    <code className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono block mb-1.5">
                      {subInfo.sourceFile}
                    </code>
                  )}
                  <pre className="text-[10px] font-mono text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto max-h-48 border border-gray-100 leading-relaxed whitespace-pre">
                    {subInfo.codeSnippet}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Back button */}
          <button onClick={goBack}
            className="mt-4 w-full py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-mono transition-colors">
            ← Back to {blockTitle}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function formatProse(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="text-blue-600 font-mono text-xs bg-gray-100 px-1 rounded">$1</code>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}
