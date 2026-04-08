'use client'
import { useState } from 'react'
import { useFinetuningStore } from '@/store/finetuningStore'
import { TRAINING_MODES } from '@/scene/finetuningConfig'

export function LossBreakdownPanel() {
  const trainingMode = useFinetuningStore((s) => s.trainingMode)
  const mode = TRAINING_MODES.find(m => m.id === trainingMode) ?? TRAINING_MODES[0]
  const maxWeight = Math.max(...mode.components.map(c => c.weight))
  const [showDataset, setShowDataset] = useState(false)
  const [showDetails, setShowDetails] = useState(true)

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-mono text-gray-400 font-semibold">
        {mode.name} Loss / Reward
      </h3>

      {/* Main formula */}
      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
        <div className="text-[10px] text-gray-400 font-mono mb-1">Loss formula:</div>
        <code className="text-[10px] text-gray-700 font-mono leading-relaxed break-all">
          {mode.lossFormula}
        </code>
      </div>

      {/* SFT-specific: multi-task explanation */}
      {trainingMode === 'sft' && (
        <div className="space-y-2">
          <button onClick={() => setShowDetails(!showDetails)} className="text-xs font-mono text-blue-600 hover:text-blue-800">
            {showDetails ? '▼' : '▶'} Multi-Task Loss Details
          </button>

          {showDetails && (
            <div className="space-y-2 text-[10px] text-gray-600 bg-blue-50/50 rounded-lg p-2.5 border border-blue-100">
              {/* Step 1: Hidden state extraction */}
              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 1: Extract hidden states</div>
                <code className="text-gray-500 block">hidden = model.hidden_states[-1]  # last layer</code>
                <code className="text-gray-500 block">pooled = weighted_avg(hidden, label_mask)  # [B, hidden_dim]</code>
                <div className="text-gray-400 mt-0.5">Label mask: tokens where labels != -100 (ignores padding)</div>
              </div>

              {/* Step 2: Regression head */}
              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 2: Regression head forward</div>
                <code className="text-gray-500 block">pred = Linear(h_dim, h_dim//2) → ReLU → Linear(h_dim//2, 55)</code>
                <code className="text-gray-500 block">pred shape: [B, 55] → reshape [B, 11, 5]</code>
                <div className="text-gray-400 mt-0.5">Features per step: [x, y, velocity, accel, heading]</div>
              </div>

              {/* Step 3: Trajectory loss */}
              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 3: KinematicTrajectoryLoss</div>
                <div className="text-gray-400">HuberLoss (reduction=none) for each component, masked by valid timesteps (NaN handling):</div>
              </div>

              {/* Step 4: Multi-task weighting */}
              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 4: Uncertainty weighting</div>
                <code className="text-gray-500 block">L_ce_term = exp(-σ²_ce) × L_ce + 0.5 × σ²_ce</code>
                <code className="text-gray-500 block">L_reg_term = 0.5 × (exp(-σ²_reg) × L_reg + σ²_reg)</code>
                <code className="text-gray-500 block">total = L_ce_term + L_reg_term</code>
                <div className="text-gray-400 mt-0.5">σ²_ce, σ²_reg are <strong>learnable</strong> parameters (init=0.0)</div>
                <div className="text-gray-400">Config: <code className="bg-gray-100 px-1 rounded">sigma_lr</code> sets their LR (default: None = same as base)</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRPO-specific detailed explanation */}
      {trainingMode === 'grpo' && (
        <div className="space-y-2">
          <button onClick={() => setShowDetails(!showDetails)} className="text-xs font-mono text-amber-600 hover:text-amber-800">
            {showDetails ? '▼' : '▶'} GRPO Pipeline Details
          </button>

          {showDetails && (
            <div className="space-y-2 text-[10px] text-gray-600 bg-amber-50/50 rounded-lg p-2.5 border border-amber-100">
              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 1: Load reference model</div>
                <div className="text-gray-400">SFT checkpoint serves as π_ref (frozen reference policy)</div>
                <code className="text-gray-500 block">ref_model = load_sft_checkpoint()</code>
              </div>

              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 2: Generate N completions per prompt</div>
                <code className="text-gray-500 block">for each prompt: generate N trajectories</code>
                <code className="text-gray-500 block">  temperature=0.9, top_p=1.0, top_k=50</code>
                <code className="text-gray-500 block">  max_completion_length=256 tokens</code>
                <div className="text-gray-400 mt-0.5">Model generates with <code className="bg-gray-100 px-1 rounded">&lt;think&gt;</code> CoT reasoning + trajectory JSON</div>
              </div>

              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 3: Score each completion</div>
                <div className="text-gray-400">Each trajectory scored by 5 reward functions:</div>
                <code className="text-gray-500 block">R = 0.10×format + 0.35×ADE + 0.25×FDE</code>
                <code className="text-gray-500 block">  + 0.15×physics + 0.15×safety</code>
              </div>

              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 4: Compute group advantages</div>
                <code className="text-gray-500 block">A_i = (R_i - mean(R_group)) / std(R_group)</code>
                <div className="text-gray-400 mt-0.5">Relative ranking within each prompt's N completions</div>
              </div>

              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 5: Policy gradient update</div>
                <code className="text-gray-500 block">L = -E[A_i × log π(y_i|x)]</code>
                <code className="text-gray-500 block">  + β × KL[π || π_ref]</code>
                <div className="text-gray-400 mt-0.5">β=0.04 prevents divergence from reference policy</div>
              </div>

              <div className="border-t border-amber-200 pt-1.5">
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Reward function details:</div>
                <div className="space-y-0.5 text-gray-400">
                  <div><strong>Format</strong> (0.10): 0.2 for &lt;think&gt; tags + 0.3 for valid JSON + 0.5 for correct fields</div>
                  <div><strong>ADE</strong> (0.35): clip(1 - ADE/10, 0, 1). ADE&lt;0.5m→~1.0, ADE&gt;10m→0.0</div>
                  <div><strong>FDE</strong> (0.25): clip(1 - FDE/15, 0, 1). FDE&lt;1m→~1.0, FDE&gt;15m→0.0</div>
                  <div><strong>Physics</strong> (0.15): 0.4×vel_err + 0.3×acc_err + 0.3×kinematic_consistency</div>
                  <div><strong>Safety</strong> (0.15): 0.25 each for: vel≥0, acc∈[-6,4], jerk&lt;5, yaw_rate&lt;0.5</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DPO-specific detailed explanation */}
      {trainingMode === 'dpo' && (
        <div className="space-y-2">
          <button onClick={() => setShowDetails(!showDetails)} className="text-xs font-mono text-purple-600 hover:text-purple-800">
            {showDetails ? '▼' : '▶'} DPO Pipeline Details
          </button>

          {showDetails && (
            <div className="space-y-2 text-[10px] text-gray-600 bg-purple-50/50 rounded-lg p-2.5 border border-purple-100">
              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 1: Prepare preference data</div>
                <div className="text-gray-400">Each sample contains a (chosen, rejected) trajectory pair for the same prompt</div>
                <code className="text-gray-500 block">chosen = trajectory with lower ADE/FDE</code>
                <code className="text-gray-500 block">rejected = trajectory with higher ADE/FDE</code>
              </div>

              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 2: Load reference model</div>
                <div className="text-gray-400">SFT checkpoint as π_ref. Can precompute ref log-probs for speed:</div>
                <code className="text-gray-500 block">precompute_ref_log_probs = False (default)</code>
              </div>

              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 3: Compute log probabilities</div>
                <code className="text-gray-500 block">log_π(y_w|x)   # policy on chosen</code>
                <code className="text-gray-500 block">log_π(y_l|x)   # policy on rejected</code>
                <code className="text-gray-500 block">log_π_ref(y_w|x), log_π_ref(y_l|x)  # reference</code>
              </div>

              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 4: DPO loss (sigmoid variant)</div>
                <code className="text-gray-500 block">r_w = log_π(y_w|x) - log_π_ref(y_w|x)</code>
                <code className="text-gray-500 block">r_l = log_π(y_l|x) - log_π_ref(y_l|x)</code>
                <code className="text-gray-500 block">L = -log σ(β × (r_w - r_l))</code>
                <div className="text-gray-400 mt-0.5">β=0.1 controls how much to deviate from reference</div>
              </div>

              <div>
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Step 5: Intuition</div>
                <div className="text-gray-400">
                  The model increases probability of chosen trajectories and decreases probability of rejected ones, while staying close to the SFT reference. No explicit reward model needed — preferences are encoded directly in the data pairs.
                </div>
              </div>

              <div className="border-t border-purple-200 pt-1.5">
                <div className="font-mono font-semibold text-gray-700 mb-0.5">Key hyperparameters:</div>
                <div className="space-y-0.5 text-gray-400">
                  <div><strong>β</strong> = 0.1 (higher → more conservative, closer to reference)</div>
                  <div><strong>dpo_loss</strong> = "sigmoid" (also supports "hinge", "ipo")</div>
                  <div><strong>precompute_ref_log_probs</strong> = False (True saves GPU memory)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Component weight bars */}
      <div>
        <div className="text-[10px] font-mono text-gray-400 mb-1.5">
          {trainingMode === 'sft' ? 'L_reg component weights:' : trainingMode === 'grpo' ? 'Reward function weights:' : 'Loss components:'}
        </div>
        <div className="space-y-2">
          {mode.components.map((comp) => {
            const barWidth = (comp.weight / maxWeight) * 100
            return (
              <div key={comp.name}>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700 font-medium">{comp.name}</span>
                  <span className="text-gray-400 font-mono">{comp.weight.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full mt-0.5">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: comp.color }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{comp.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* How to change weights */}
      <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
        <div className="text-[10px] font-mono font-semibold text-gray-500 mb-1">How to configure:</div>
        {trainingMode === 'sft' && (
          <div className="text-[10px] text-gray-500 space-y-1">
            <div>Weights: Edit <code className="bg-gray-100 px-1 rounded">KinematicTrajectoryLoss.__init__</code> weights dict</div>
            <div>Regression LR: <code className="bg-gray-100 px-1 rounded">--regression_head_lr 1e-5</code></div>
            <div>Sigma LR: <code className="bg-gray-100 px-1 rounded">--sigma_lr 1e-5</code></div>
            <div>Trajectory dim: <code className="bg-gray-100 px-1 rounded">--trajectory_dim 55</code> (55=5s, 35=3s)</div>
            <div>Delta-t: <code className="bg-gray-100 px-1 rounded">delta_t=0.5</code> in KinematicTrajectoryLoss</div>
          </div>
        )}
        {trainingMode === 'grpo' && (
          <div className="text-[10px] text-gray-500 space-y-1">
            <div>Reward weights: Edit <code className="bg-gray-100 px-1 rounded">trajectory_combined_reward()</code></div>
            <div>Beta: <code className="bg-gray-100 px-1 rounded">--beta 0.04</code></div>
            <div>Temperature: <code className="bg-gray-100 px-1 rounded">--temperature 0.9</code></div>
            <div>Reward type: <code className="bg-gray-100 px-1 rounded">--reward_funcs_type trajectory</code></div>
          </div>
        )}
        {trainingMode === 'dpo' && (
          <div className="text-[10px] text-gray-500 space-y-1">
            <div>Beta: <code className="bg-gray-100 px-1 rounded">--beta 0.1</code></div>
            <div>Loss: <code className="bg-gray-100 px-1 rounded">--dpo_loss sigmoid</code></div>
          </div>
        )}
      </div>

      {/* Source file */}
      <code className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded block">
        {mode.sourceFile}:{mode.sourceLine}
      </code>

      {/* Dataset format toggle */}
      <div className="pt-2 border-t border-gray-100">
        <button onClick={() => setShowDataset(!showDataset)} className="text-xs font-mono text-blue-600 hover:text-blue-800 transition-colors">
          {showDataset ? '▼' : '▶'} Dataset Format Example
        </button>

        {showDataset && (
          <div className="mt-2 space-y-2">
            <div className="text-[10px] text-gray-400 font-mono">File: {mode.datasetFile}</div>

            <div>
              <div className="text-[10px] font-mono font-semibold text-gray-500 mb-0.5">Input (human)</div>
              <pre className="text-[9px] font-mono text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto border border-gray-100">
                {mode.datasetFormat.input}
              </pre>
            </div>

            <div>
              <div className="text-[10px] font-mono font-semibold text-gray-500 mb-0.5">Output (gpt)</div>
              <pre className="text-[9px] font-mono text-gray-600 bg-green-50 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto border border-green-100">
                {mode.datasetFormat.output}
              </pre>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">{mode.datasetFormat.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
