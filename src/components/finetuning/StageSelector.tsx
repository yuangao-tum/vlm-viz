'use client'
import { useFinetuningStore } from '@/store/finetuningStore'
import { STAGES, TRAINING_MODES } from '@/scene/finetuningConfig'

export function StageSelector() {
  const { selectedStage, setSelectedStage, trainingMode, setTrainingMode } = useFinetuningStore()

  return (
    <div className="space-y-4">
      {/* Stage selector */}
      <div>
        <h3 className="text-xs font-mono text-gray-400 mb-2">Training Stage</h3>
        <div className="space-y-1.5">
          {STAGES.map((stage) => (
            <button
              key={stage.id}
              onClick={() => setSelectedStage(stage.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                selectedStage === stage.id
                  ? 'bg-blue-50 border border-blue-200 text-blue-900'
                  : 'bg-gray-50 border border-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="font-semibold">Stage {stage.id}: {stage.name}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{stage.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Training mode */}
      <div>
        <h3 className="text-xs font-mono text-gray-400 mb-2">Training Mode</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {TRAINING_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setTrainingMode(mode.id)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-mono transition-all ${
                trainingMode === mode.id
                  ? 'bg-white text-gray-900 shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode.name}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          {TRAINING_MODES.find(m => m.id === trainingMode)?.description}
        </p>
      </div>
    </div>
  )
}
