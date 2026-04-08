import type { ModelConfig } from '@/scene/modelConstants'

export interface IStep {
  id: string
  title: string
  subtitle: string
  commentary: string
  math?: {
    title: string
    formulas: string[]
    explanation: string
  }
}

export function getSteps(m: ModelConfig): Record<number, IStep> {
  const { vit, llm } = m
  const patchPixels = vit.patch_size * vit.patch_size * 3
  const patchGrid = Math.round(Math.sqrt(vit.tokens_before_merge))

  return {
    0: {
      id: 'image-input',
      title: 'Driving Scene Image',
      subtitle: 'Front-view camera input from CARLA',
      commentary: `The model receives a **front-view camera image** from the CARLA driving simulator. The image is divided into a grid of non-overlapping **${vit.patch_size}×${vit.patch_size} pixel patches** — producing **${vit.tokens_before_merge} patches** total.`,
      math: {
        title: 'Image Patchification',
        formulas: [
          `Image: H × W × C  (e.g. 224 × 224 × 3)`,
          ``,
          `Patch grid: (H/${vit.patch_size}) × (W/${vit.patch_size}) = ${patchGrid} × ${patchGrid}`,
          ``,
          `Total patches: ${patchGrid}² = ${vit.tokens_before_merge}`,
          ``,
          `Each patch: ${vit.patch_size} × ${vit.patch_size} × 3 = ${patchPixels} raw values`,
          ``,
          `With temporal_patch_size=2 (video):`,
          `  Input: [B, C, T, H, W] → [N, ${patchPixels}×2] per temporal group`,
        ],
        explanation: `The image is split into a regular grid of non-overlapping patches. Each patch becomes one "visual token" — the atomic unit of processing in the Vision Transformer, analogous to a word token in NLP.`,
      },
    },

    1: {
      id: 'patch-embed',
      title: 'Patch Embedding',
      subtitle: 'Patches become token vectors',
      commentary: `Each ${vit.patch_size}×${vit.patch_size}×3 patch (${patchPixels} raw values) is projected by a **Conv3d layer** to a **${vit.hidden_size}-dimensional vector**. This creates ${vit.tokens_before_merge} token vectors. 2D positional embeddings encode spatial location.`,
      math: {
        title: 'Patch Embedding Projection',
        formulas: [
          `Conv3d: ℝ^(C×T×P×P) → ℝ^d`,
          ``,
          `Kernel: [${vit.patch_size === 16 ? '2' : '2'}, ${vit.patch_size}, ${vit.patch_size}]`,
          `Stride: same as kernel (non-overlapping)`,
          ``,
          `Input:  [B, 3, T, H, W]`,
          `Output: [N, ${vit.hidden_size}]  where N = ${vit.tokens_before_merge}`,
          ``,
          `Then add positional embedding:`,
          `  x = Conv3d(patches) + pos_embed`,
          `  pos_embed ∈ ℝ^(${vit.tokens_before_merge} × ${vit.hidden_size})  (learnable)`,
        ],
        explanation: `Unlike NLP where tokens come from a discrete vocabulary, visual tokens are created by projecting continuous pixel patches through a Conv3d. The 3D convolution handles temporal patches for video (2 frames per temporal patch). Position embeddings are added so the model knows each patch's spatial location.`,
      },
    },

    2: {
      id: 'vit-layer',
      title: 'Vision Transformer Layer',
      subtitle: 'Self-attention + feed-forward',
      commentary: `Each of the **${vit.depth} ViT layers**: RMSNorm → Multi-Head Attention (${vit.num_heads} heads) → Residual → RMSNorm → FFN (${vit.hidden_size}→${vit.intermediate_size}→${vit.hidden_size}) → Residual.

${m.family === 'qwen3' ? `**DeepStack**: Features from layers **${vit.deep_fusion_layers.join(', ')}** are extracted and injected into the LLM.` : `Full attention at layers **${vit.full_attn_layers.join(', ')}**.`}

**Click any block in the 3D scene** for detailed math.`,
      math: {
        title: 'Transformer Block',
        formulas: [
          `x₁ = x + Attention(RMSNorm(x))     — attention + residual`,
          `x₂ = x₁ + FFN(RMSNorm(x₁))         — FFN + residual`,
          ``,
          `Attention(Q,K,V) = softmax(QKᵀ/√dₖ) · V`,
          `FFN(x) = W₂ · GELU(W₁ · x + b₁) + b₂`,
          `RMSNorm(x) = x / √(mean(x²) + ε) · γ`,
          ``,
          `Per layer: ${vit.num_heads} heads × dim ${vit.hidden_size / vit.num_heads}`,
          `FFN: ${vit.hidden_size} → ${vit.intermediate_size} → ${vit.hidden_size}`,
        ],
        explanation: `Each layer applies self-attention (global mixing across all patches) followed by a feed-forward network (per-token transformation). RMSNorm stabilizes training, residual connections enable gradient flow through all ${vit.depth} layers.`,
      },
    },

    3: {
      id: 'spatial-merge',
      title: 'Spatial Merge',
      subtitle: `${vit.tokens_before_merge} → ${vit.tokens_after_merge} visual tokens`,
      commentary: `${vit.spatial_merge_size}×${vit.spatial_merge_size} neighboring patches are concatenated and projected to ${vit.output_dim}-dim, reducing from **${vit.tokens_before_merge} → ${vit.tokens_after_merge} tokens**.`,
      math: {
        title: 'Spatial Merge Operation',
        formulas: [
          `Group ${vit.spatial_merge_size}×${vit.spatial_merge_size} = ${vit.spatial_merge_size * vit.spatial_merge_size} adjacent tokens:`,
          `  x_group = Concat(x_i, x_j, x_k, x_l)  ∈ ℝ^(${vit.hidden_size}×${vit.spatial_merge_size * vit.spatial_merge_size})`,
          ``,
          `Project through MLP:`,
          `  h = GELU(x_group · W₁)    ∈ ℝ^(${vit.hidden_size * vit.spatial_merge_size * vit.spatial_merge_size})`,
          `  y = h · W₂                ∈ ℝ^${vit.output_dim}`,
          ``,
          `With LayerNorm before or after concatenation.`,
          ``,
          `Token reduction: ${vit.tokens_before_merge} → ${vit.tokens_before_merge}/${vit.spatial_merge_size * vit.spatial_merge_size} = ${vit.tokens_after_merge}`,
          `Dim change: ${vit.hidden_size} → ${vit.output_dim}`,
        ],
        explanation: `Spatial merge reduces the number of visual tokens by grouping neighboring patches, cutting the sequence length for the LLM by ${vit.spatial_merge_size * vit.spatial_merge_size}×. Each merged token covers a ${vit.patch_size * vit.spatial_merge_size}×${vit.patch_size * vit.spatial_merge_size} pixel region. The dimension is also projected to match the LLM's hidden size.`,
      },
    },

    4: {
      id: 'connector',
      title: 'Cross-Modal Connector',
      subtitle: 'Visual tokens join language space',
      commentary: `Projects ViT output (${vit.hidden_size}-dim) to LLM dimension (${vit.output_dim}-dim).

${m.family === 'qwen3' ? `**Qwen3-VL**: Also prepares DeepStack features from ViT layers ${vit.deep_fusion_layers.join(', ')}, each through its own merger.` : `**Qwen2.5-VL**: Visual tokens replace placeholder tokens via masked_scatter.`}`,
      math: {
        title: m.family === 'qwen3' ? 'Connector + DeepStack Mergers' : 'Visual-Language Projection',
        formulas: m.family === 'qwen3' ? [
          `Main merger (final ViT output):`,
          `  y = GELU(LN(x_concat) · W₁) · W₂`,
          `  Input: ${vit.tokens_after_merge} × ${vit.hidden_size * vit.spatial_merge_size * vit.spatial_merge_size}`,
          `  Output: ${vit.tokens_after_merge} × ${vit.output_dim}`,
          ``,
          `DeepStack mergers (one per extraction layer):`,
          `  For each l ∈ {${vit.deep_fusion_layers.join(', ')}}:`,
          `    feat_l = GELU(PostLN(x_l_concat) · W₁_l) · W₂_l`,
          `    feat_l ∈ ℝ^(${vit.tokens_after_merge} × ${vit.output_dim})`,
          ``,
          `Returns: (main_embeds, [feat_${vit.deep_fusion_layers[0]}, feat_${vit.deep_fusion_layers[1]}, feat_${vit.deep_fusion_layers[2]}])`,
        ] : [
          `Merger MLP:`,
          `  h = GELU(RMSNorm(x_concat) · W₁)`,
          `  y = h · W₂`,
          ``,
          `Input: ${vit.tokens_after_merge} × ${vit.hidden_size * vit.spatial_merge_size * vit.spatial_merge_size}`,
          `Output: ${vit.tokens_after_merge} × ${vit.output_dim}`,
          ``,
          `Token insertion:`,
          `  embeds = embed_tokens(input_ids)`,
          `  embeds[image_mask] = visual_tokens  (masked_scatter)`,
        ],
        explanation: m.family === 'qwen3' ? `Qwen3-VL has multiple mergers: one main merger for the final ViT output, plus one per DeepStack extraction layer. Each produces visual features in the LLM's dimension space for injection at different depths.` : `Qwen2.5-VL uses a single merger that projects all visual features at once. These tokens then replace placeholder positions in the text embedding sequence via masked_scatter — a simple but effective single-point injection.`,
      },
    },

    5: {
      id: 'tokenization',
      title: 'Text Tokenization',
      subtitle: 'Driving context as language tokens',
      commentary: `Text prompt tokenized using **BPE vocabulary** (${llm.vocab_size.toLocaleString()} tokens) and embedded into ${llm.hidden_size}-dim space. Includes ego vehicle state, dynamic obstacles, and driving style.`,
      math: {
        title: 'Token Embedding',
        formulas: [
          `Tokenize: text → [t₁, t₂, ..., tₙ]  (integer IDs)`,
          ``,
          `Embed: E(tᵢ) = W_embed[tᵢ]  (lookup row tᵢ)`,
          ``,
          `W_embed ∈ ℝ^(${llm.vocab_size.toLocaleString()} × ${llm.hidden_size})`,
          ``,
          `Each token tᵢ → one ${llm.hidden_size}-dim vector`,
          ``,
          `Special tokens:`,
          `  <|vision_start|> (151652) — marks visual span begin`,
          `  <|vision_end|>   (151653) — marks visual span end`,
          `  <|image_pad|>    (151655) — placeholder for each visual token`,
        ],
        explanation: `BPE (Byte-Pair Encoding) iteratively merges frequent character pairs into subword tokens. The embedding matrix has one row per vocabulary entry — a simple lookup replaces each token ID with its learned dense vector. Special tokens mark where visual information is inserted into the sequence.`,
      },
    },

    6: {
      id: 'llm-layer',
      title: 'LLM Decoder Layer',
      subtitle: `GQA + SwiGLU · ${llm.hidden_size}-dim`,
      commentary: `Each of the **${llm.num_layers} layers**: RMSNorm → GQA (${llm.num_heads}Q/${llm.num_kv_heads}KV, dim=${llm.head_dim}) → Residual → RMSNorm → SwiGLU (${llm.hidden_size}→${llm.intermediate_size}→${llm.hidden_size}) → Residual.

${m.family === 'qwen3' ? `**DeepStack**: At layers [${vit.deep_fusion_layers.join(', ')}], visual features are additively fused: h[vis_pos] += deepstack_feat.` : `MROPE provides 3D positional encoding for visual tokens (T, H, W).`}

**Click any block in the 3D scene** for detailed math.`,
      math: {
        title: 'Decoder Block with GQA + SwiGLU',
        formulas: [
          `x₁ = x + GQA(RMSNorm(x))`,
          `x₂ = x₁ + SwiGLU(RMSNorm(x₁))`,
          ``,
          `GQA: Q ∈ ℝ^(${llm.num_heads}×${llm.head_dim}), K,V ∈ ℝ^(${llm.num_kv_heads}×${llm.head_dim})`,
          `  Attn = softmax(QKᵀ/√${llm.head_dim} + causal_mask) · V`,
          `${m.family === 'qwen3' ? `  Q,K: RMSNorm after projection (QK-Norm)` : ''}`,
          ``,
          `SwiGLU(x) = (SiLU(x·W_gate) ⊙ x·W_up) · W_down`,
          `  SiLU(x) = x · σ(x) = x / (1 + e⁻ˣ)`,
          `  Dims: ${llm.hidden_size} → ${llm.intermediate_size} → ${llm.hidden_size}`,
          `${m.family === 'qwen3' ? `\nDeepStack at layers [${vit.deep_fusion_layers.join(',')}]:\n  h[vis_pos] += feat_from_vit_layer` : ''}`,
        ],
        explanation: `The LLM decoder uses Grouped-Query Attention (GQA) where ${llm.num_kv_heads} KV-heads are shared across ${llm.num_heads} Q-heads (${llm.num_heads / llm.num_kv_heads}:1 ratio), reducing KV-cache memory. SwiGLU replaces standard FFN with a gated mechanism for better training dynamics.`,
      },
    },

    7: {
      id: 'traj-head',
      title: 'Trajectory Regression Head',
      subtitle: 'Finetuned prediction layer',
      commentary: `Custom MLP head added during finetuning. Predicts **55-dim** trajectory = **11 timesteps × 5 features** (x, y, v, a, θ). Uses kinematic loss for physics-consistent trajectories.`,
      math: {
        title: 'Regression Head + Kinematic Loss',
        formulas: [
          `Pooling:`,
          `  h = Σᵢ(hidden[i] · mask[i]) / Σᵢ(mask[i])`,
          `  where mask[i] = (label[i] ≠ -100)`,
          ``,
          `MLP:`,
          `  pred = Linear(ReLU(Linear(h)))`,
          `  h ∈ ℝ^${llm.hidden_size} → ℝ^${llm.hidden_size / 2} → ℝ^55`,
          ``,
          `Kinematic loss (per timestep t):`,
          `  L_pos = Huber(pred_xy, target_xy) × 2.0`,
          `  L_vel = Huber(pred_v, target_v) × 0.5`,
          `  L_acc = Huber(pred_a, target_a) × 0.5`,
          `  L_head = Huber(pred_θ, target_θ) × 0.5`,
          `  L_kin = MSE(p_next, p + v·cos(θ)·Δt + ½a·cos(θ)·Δt²) × 1.5`,
          ``,
          `Multi-task weighting:`,
          `  L = exp(-σ²_ce)·L_ce + 0.5·σ²_ce`,
          `    + 0.5·(exp(-σ²_reg)·L_reg + σ²_reg)`,
          `  σ²_ce, σ²_reg: learnable (init=0)`,
        ],
        explanation: `The regression head pools the LLM's last-layer hidden states (weighted by label mask), then projects through a 2-layer MLP to predict the trajectory. The kinematic consistency loss enforces Newtonian physics: predicted positions must be consistent with predicted velocities and accelerations. The multi-task uncertainty weighting learns to automatically balance CE (text) and regression (trajectory) losses.`,
      },
    },

    8: {
      id: 'lm-head',
      title: 'Language Model Head',
      subtitle: 'Text generation from hidden states',
      commentary: `Standard output layer: **Linear(${llm.hidden_size} → ${llm.vocab_size.toLocaleString()})** projects hidden states to vocabulary logits, then **softmax** for next-token prediction.`,
      math: {
        title: 'Language Model Head + Cross-Entropy',
        formulas: [
          `Projection:`,
          `  logits = h · W_lm     W_lm ∈ ℝ^(${llm.hidden_size} × ${llm.vocab_size.toLocaleString()})`,
          `  logits ∈ ℝ^vocab_size`,
          ``,
          `Next-token prediction:`,
          `  P(token_t | token_<t) = softmax(logits_t)`,
          `  softmax(z)ᵢ = eᶻⁱ / Σⱼ eᶻʲ`,
          ``,
          `Cross-entropy loss:`,
          `  L_ce = -1/T · Σₜ log P(target_t | context_<t)`,
          ``,
          `With label shifting (causal LM):`,
          `  shift_logits = logits[..., :-1, :]`,
          `  shift_labels = labels[..., 1:]`,
          `  L = CE(shift_logits, shift_labels)`,
        ],
        explanation: `The LM head is a single linear layer (no bias) that projects from the hidden dimension to the full vocabulary. During training, cross-entropy loss measures how well the model predicts the next token. During inference, the model generates one token at a time, feeding each prediction back as input for the next step (autoregressive generation).`,
      },
    },

    // Block 9: DeepStack (Qwen3 only)
    9: {
      id: 'deepstack',
      title: 'DeepStack: Multi-Layer Visual Injection',
      subtitle: `Qwen3-VL exclusive — additive fusion at LLM layers [${vit.deep_fusion_layers.join(', ')}]`,
      commentary: m.family === 'qwen3'
        ? `**DeepStack** is the key architectural innovation in Qwen3-VL that differentiates it from Qwen2.5-VL.

Instead of injecting visual features only once at the LLM input, DeepStack extracts intermediate features from the ViT encoder at layers **${vit.deep_fusion_layers.join(', ')}** and injects them **additively** into the corresponding LLM decoder layers.

Each extraction layer has its own **dedicated merger** (with post-shuffle LayerNorm) that projects the intermediate ViT features to the LLM dimension (${vit.output_dim}).

**Qwen2.5-VL comparison**: Visual tokens are injected only at the input via \`masked_scatter\` — a single point of fusion. DeepStack provides multi-level fusion, allowing the LLM to access visual features at different abstraction levels.`
        : `DeepStack is only available in Qwen3-VL models. Switch to a Qwen3 model to see this feature.`,
      math: m.family === 'qwen3' ? {
        title: 'DeepStack Additive Fusion',
        formulas: [
          `ViT feature extraction:`,
          `  For each l ∈ {${vit.deep_fusion_layers.join(', ')}}:`,
          `    feat_l = DeepStackMerger_l(ViT_hidden_states[l])`,
          `    feat_l = GELU(PostLN(concat_2x2(h_l)) · W₁) · W₂`,
          `    feat_l ∈ ℝ^(${vit.tokens_after_merge} × ${vit.output_dim})`,
          ``,
          `LLM injection (during forward pass):`,
          `  For i = 0, 1, 2  (mapping to ViT layers ${vit.deep_fusion_layers.join(', ')}):`,
          `    h = LLM_layer_${vit.deep_fusion_layers[0]}(h)`,
          `    h[visual_positions, :] += feat_${vit.deep_fusion_layers[0]}`,
          ``,
          `In code:`,
          `  def _deepstack_process(h, vis_mask, vis_embeds):`,
          `      local = h[vis_mask, :].clone() + vis_embeds`,
          `      h[vis_mask, :] = local`,
          `      return h`,
          ``,
          `Key: ADDITIVE (+=), not replacement.`,
          `Visual features refine the LLM hidden states`,
          `at multiple abstraction levels.`,
        ],
        explanation: `DeepStack allows the LLM to access visual information at multiple levels of abstraction — early ViT layers capture low-level features (edges, textures), while later layers capture high-level semantics (objects, spatial relationships). By injecting at multiple LLM depths, each decoder layer can attend to the visual features most relevant to its level of reasoning. This is analogous to feature pyramid networks in computer vision, but applied to the language-vision interface.`,
      } : undefined,
    },
  }
}
