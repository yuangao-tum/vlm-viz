export type ComponentStatus = 'frozen' | 'trainable' | 'lora' | 'new'

export const STATUS_COLORS: Record<ComponentStatus, string> = {
  frozen:    '#9CA3AF',
  trainable: '#22C55E',
  lora:      '#F59E0B',
  new:       '#EF4444',
}

export const STATUS_LABELS: Record<ComponentStatus, string> = {
  frozen:    'Frozen',
  trainable: 'Trainable',
  lora:      'LoRA',
  new:       'New (added)',
}

export interface ComponentConfig {
  status: ComponentStatus
  lr?: string
  loraRank?: number
  loraAlpha?: number
  loraDropout?: number
  notes: string
  sourceFile: string
  sourceLine?: string
}

export interface StageConfig {
  id: number
  name: string
  description: string
  // Keys map to block indices in the pipeline
  components: Record<number, ComponentConfig>
}

export interface LossComponent {
  name: string
  weight: number
  color: string
  description: string
}

export interface DatasetExample {
  input: string
  output: string
  notes: string
}

export interface TrainingModeConfig {
  id: string
  name: string
  description: string
  lossFormula: string
  components: LossComponent[]
  sourceFile: string
  sourceLine: string
  datasetFormat: DatasetExample
  datasetFile: string
}

// ==================== STAGES ====================

export const STAGES: StageConfig[] = [
  {
    id: 1,
    name: 'Regression Head Only',
    description: 'Freeze everything, train only the new trajectory head. Safest starting point.',
    components: {
      0: { status: 'frozen', notes: 'Input — no parameters', sourceFile: '' },
      1: { status: 'frozen', notes: 'freeze_vision_tower=True', sourceFile: 'src/train/train_sft.py', sourceLine: '146' },
      2: { status: 'frozen', notes: 'freeze_vision_tower=True', sourceFile: 'src/train/train_sft.py', sourceLine: '146' },
      3: { status: 'frozen', notes: 'freeze_merger=True', sourceFile: 'src/train/train_sft.py', sourceLine: '154' },
      4: { status: 'frozen', notes: 'freeze_merger=True', sourceFile: 'src/train/train_sft.py', sourceLine: '154' },
      5: { status: 'frozen', notes: 'Part of frozen LLM', sourceFile: '' },
      6: { status: 'frozen', notes: 'freeze_llm=True', sourceFile: 'src/train/train_sft.py', sourceLine: '161' },
      8: { status: 'frozen', notes: 'Excluded from training', sourceFile: '' },
      7: { status: 'new', lr: '1e-5', notes: 'New MLP head: Linear(hidden→1024)→ReLU→Linear(1024→55). Trained with regression_head_lr.', sourceFile: 'src/trajectory_model.py', sourceLine: '115' },
    },
  },
  {
    id: 2,
    name: 'LoRA + Vision (Recommended)',
    description: 'LoRA adapters on LLM + trainable vision tower and merger. Best quality/efficiency tradeoff.',
    components: {
      0: { status: 'frozen', notes: 'Input — no parameters', sourceFile: '' },
      1: { status: 'trainable', notes: 'freeze_vision_tower=False. Patch embedding weights updated.', sourceFile: 'src/train/train_sft.py', sourceLine: '146' },
      2: { status: 'trainable', notes: 'freeze_vision_tower=False. All ViT layers trainable.', sourceFile: 'src/train/train_sft.py', sourceLine: '146' },
      3: { status: 'trainable', notes: 'freeze_merger=False. Spatial merge projection updated.', sourceFile: 'src/train/train_sft.py', sourceLine: '154' },
      4: { status: 'trainable', lr: '1e-5', notes: 'freeze_merger=False. Connector projection trainable with merger_lr.', sourceFile: 'src/train/train_sft.py', sourceLine: '154' },
      5: { status: 'frozen', notes: 'embed_tokens excluded from LoRA via lora_namespan_exclude', sourceFile: 'src/train/train_sft.py', sourceLine: '125' },
      6: { status: 'lora', lr: '5e-5', loraRank: 128, loraAlpha: 256, loraDropout: 0.05, notes: 'freeze_llm=True + lora_enable=True. LoRA on all Linear layers except lm_head, embed_tokens, regression_head.', sourceFile: 'scripts/finetune_lora.sh', sourceLine: '24' },
      8: { status: 'frozen', notes: 'lm_head excluded from LoRA via lora_namespan_exclude', sourceFile: 'src/train/train_sft.py', sourceLine: '125' },
      7: { status: 'trainable', lr: '1e-5', notes: 'Regression head trained with separate optimizer group and regression_head_lr.', sourceFile: 'src/trainer/sft_trainer.py', sourceLine: '41' },
    },
  },
  {
    id: 3,
    name: 'Full Finetuning',
    description: 'All parameters trainable. Most expensive, use with caution (risk of catastrophic forgetting).',
    components: {
      0: { status: 'frozen', notes: 'Input — no parameters', sourceFile: '' },
      1: { status: 'trainable', notes: 'All vision parameters trainable', sourceFile: 'src/train/train_sft.py', sourceLine: '146' },
      2: { status: 'trainable', notes: 'All ViT layers trainable. Or use unfreeze_topk_vision=N for top-K only.', sourceFile: 'src/train/train_sft.py', sourceLine: '168' },
      3: { status: 'trainable', notes: 'Merger fully trainable', sourceFile: 'src/train/train_sft.py', sourceLine: '154' },
      4: { status: 'trainable', notes: 'Connector fully trainable', sourceFile: 'src/train/train_sft.py', sourceLine: '154' },
      5: { status: 'trainable', notes: 'Token embeddings updated', sourceFile: '' },
      6: { status: 'trainable', notes: 'freeze_llm=False, lora_enable=False. All LLM layers trainable. Or use unfreeze_topk_llm=N.', sourceFile: 'src/train/train_sft.py', sourceLine: '161' },
      8: { status: 'trainable', notes: 'LM head trained jointly', sourceFile: '' },
      7: { status: 'trainable', lr: '1e-5', notes: 'Regression head trained with separate LR', sourceFile: 'src/trajectory_model.py', sourceLine: '115' },
    },
  },
]

// ==================== TRAINING MODES ====================

export const TRAINING_MODES: TrainingModeConfig[] = [
  {
    id: 'sft',
    name: 'SFT',
    description: 'Supervised Fine-Tuning with multi-task uncertainty-weighted loss',
    lossFormula: 'L = exp(-σ_ce) × L_ce + σ_ce + 0.5 × (exp(-σ_reg) × L_reg + σ_reg)',
    components: [
      { name: 'Position', weight: 2.0, color: '#EF4444', description: 'Huber loss on (x, y) coordinates' },
      { name: 'Velocity', weight: 0.5, color: '#F59E0B', description: 'Huber loss on velocity magnitude' },
      { name: 'Acceleration', weight: 0.5, color: '#22C55E', description: 'Huber loss on acceleration' },
      { name: 'Heading', weight: 0.5, color: '#3B82F6', description: 'Huber loss on heading angle' },
      { name: 'Kinematic', weight: 1.5, color: '#8B5CF6', description: 'Physics: P[t+1] ≈ P[t] + V·Δt + ½A·Δt²' },
    ],
    sourceFile: 'src/train/train_sft.py',
    sourceLine: '51',
    datasetFile: 'carla_train.json',
    datasetFormat: {
      input: `<image>
Act as the autonomous driving system.
Based on the provided ego-centric front-view image
and structured vehicle state data, plan a
Safety-Conservative future trajectory for the next
3 seconds.

Structured Vehicle State Data:
{"ego_vehicle": {"current_state":
  {"position_xy": [0.0, 0.0],
   "velocity_mps": 14.43,
   "acceleration_mps2": -0.26,
   "heading_radian": 0.0},
 "historical_trajectory": [...]},
 "dynamic_obstacles": [...]}`,
      output: `{"trajectory": {
  "position": [[0,0],[7.17,-0.35],[14.18,-1.81],...],
  "velocity": [14.43, 14.32, 14.39, ...],
  "acceleration": [-0.26, 0.01, 0.09, ...],
  "heading_radian": [0.0, -0.12, -0.32, ...]
}}`,
      notes: 'Multi-turn conversation format: human provides image + vehicle state, GPT responds with trajectory JSON. 7 timesteps (3s) or 11 timesteps (5s).',
    },
  },
  {
    id: 'grpo',
    name: 'GRPO',
    description: 'Group Relative Policy Optimization with trajectory reward functions',
    lossFormula: 'L = -E[A(s,a) × log π(a|s)] + β × KL[π || π_ref]',
    components: [
      { name: 'Format', weight: 0.10, color: '#9CA3AF', description: 'Valid JSON + correct structure' },
      { name: 'ADE', weight: 0.35, color: '#EF4444', description: 'Average Displacement Error < 10m' },
      { name: 'FDE', weight: 0.25, color: '#F59E0B', description: 'Final Displacement Error < 15m' },
      { name: 'Physics', weight: 0.15, color: '#22C55E', description: 'Kinematic plausibility check' },
      { name: 'Safety', weight: 0.15, color: '#3B82F6', description: 'Velocity, jerk, heading constraints' },
    ],
    sourceFile: 'src/train/reward_funcs.py',
    sourceLine: '374',
    datasetFile: 'carla_train.json (same as SFT)',
    datasetFormat: {
      input: `Same image + vehicle state prompt as SFT.
Model generates num_generations=N completions
per prompt (temperature=0.9).`,
      output: `<think>
Scene Analysis: Straight road, one vehicle ahead...
Ego Strategy: Maintain safe following distance...
</think>
{"trajectory": {"position": [...], ...}}`,
      notes: 'Each completion is scored by reward functions (format, ADE, FDE, physics, safety). Group relative advantages computed across N completions. Requires SFT checkpoint as starting point.',
    },
  },
  {
    id: 'dpo',
    name: 'DPO',
    description: 'Direct Preference Optimization — learns from trajectory preference pairs',
    lossFormula: 'L = -log σ(β × (log π(y_w|x) - log π(y_l|x) - log π_ref(y_w|x) + log π_ref(y_l|x)))',
    components: [
      { name: 'Preference', weight: 1.0, color: '#8B5CF6', description: 'β=0.1, sigmoid loss on chosen vs rejected' },
    ],
    sourceFile: 'src/params.py',
    sourceLine: '175',
    datasetFile: 'dpo_train.json',
    datasetFormat: {
      input: `Same image + vehicle state prompt.`,
      output: `{
  "chosen": {"trajectory": ...},   // better trajectory
  "rejected": {"trajectory": ...}  // worse trajectory
}`,
      notes: 'Each sample has a chosen (preferred) and rejected response. The model learns to prefer trajectories with lower ADE/FDE and better kinematic plausibility. Requires paired data generation.',
    },
  },
]
