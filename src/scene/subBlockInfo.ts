// Sub-block definitions: description + math for every clickable component
// inside ViT and LLM detail views

export interface SubBlockInfo {
  id: string
  title: string
  description: string
  math: string[]
  mathExplanation: string
  codeSnippet?: string
  sourceFile?: string
  qwen3Only?: boolean
}

// ======== SHARED (used in both ViT and LLM) ========

const RMSNORM: SubBlockInfo = {
  id: 'rmsnorm',
  title: 'RMS LayerNorm',
  description: 'Root Mean Square Layer Normalization. Normalizes each token vector independently by its RMS magnitude, then rescales with a learnable parameter. Used before attention and FFN in every layer.',
  math: [
    'RMS(x) = √( 1/n · Σᵢ xᵢ² )',
    '',
    'y = x / (RMS(x) + ε) · γ',
    '',
    'where:',
    '  x ∈ ℝᵈ         — input vector (one token)',
    '  n = d           — dimension size',
    '  ε = 1e-6        — numerical stability',
    '  γ ∈ ℝᵈ          — learnable scale (per-dim)',
  ],
  mathExplanation: 'Unlike standard LayerNorm, RMSNorm does NOT subtract the mean — it only divides by the RMS. This saves one reduction operation and is equally effective for training stability. The learnable γ allows each dimension to have different scales after normalization.',
  codeSnippet: `class Qwen3RMSNorm(nn.Module):
    def __init__(self, dim, eps=1e-6):
        self.weight = nn.Parameter(torch.ones(dim))
        self.eps = eps

    def forward(self, x):
        rms = torch.sqrt(x.pow(2).mean(-1, keepdim=True) + self.eps)
        return x / rms * self.weight`,
  sourceFile: 'models/qwen3/modeling_qwen3.py',
}

const RESIDUAL: SubBlockInfo = {
  id: 'residual',
  title: 'Residual Connection',
  description: 'Adds the input of a sub-layer directly to its output, creating a "skip connection" that bypasses the transformation.',
  math: [
    'y = x + SubLayer(x)',
    '',
    'where SubLayer is either:',
    '  Attention block, or',
    '  Feed-Forward block',
  ],
  mathExplanation: 'Residual connections solve the vanishing gradient problem in deep networks. During backpropagation, gradients can flow directly through the skip path without being attenuated by the sub-layer. This allows training of very deep models (28-36 layers). Without residuals, the gradient signal would decay exponentially with depth.',
}

// ======== VIT-SPECIFIC ========

export const VIT_SUB_BLOCKS: SubBlockInfo[] = [
  RMSNORM,
  {
    id: 'qkv',
    title: 'Q / K / V Projections',
    description: 'Three linear projections that transform each token into Query, Key, and Value vectors for attention. In the ViT, these are fused into a single matrix multiplication for efficiency.',
    math: [
      'QKV = x · W_qkv     (fused: W_qkv ∈ ℝᵈˣ³ᵈ)',
      '',
      'Then split into:',
      '  Q ∈ ℝˢˣⁿˣᵈₕ      — queries (what am I looking for?)',
      '  K ∈ ℝˢˣⁿˣᵈₕ      — keys (what do I contain?)',
      '  V ∈ ℝˢˣⁿˣᵈₕ      — values (what info to pass)',
      '',
      'where:',
      '  s = seq_len (number of patches)',
      '  n = num_heads',
      '  dₕ = head_dim = hidden_size / num_heads',
    ],
    mathExplanation: 'Each token is projected into three roles: Query (what this token is searching for), Key (what this token represents for matching), and Value (the actual content to aggregate). Fusing QKV into one matmul reduces memory bandwidth overhead vs. three separate projections.',
    codeSnippet: `self.qkv = nn.Linear(dim, dim * 3, bias=True)
# forward:
q, k, v = self.qkv(x).reshape(seq, 3, heads, head_dim)
             .permute(1,0,2,3).unbind(0)`,
    sourceFile: 'models/qwen3_vl/modular_qwen3_vl.py',
  },
  {
    id: 'rope',
    title: 'Rotary Position Embedding (RoPE)',
    description: 'Encodes position information by rotating Q and K vectors in 2D subspaces. The rotation angle depends on the token position, so the dot product between Q and K naturally encodes relative distance.',
    math: [
      'For position m and dimension pair (2i, 2i+1):',
      '',
      '  θᵢ = 1 / 10000^(2i/d)',
      '',
      '  [q\'₂ᵢ  ]   [cos(mθᵢ)  -sin(mθᵢ)] [q₂ᵢ  ]',
      '  [q\'₂ᵢ₊₁] = [sin(mθᵢ)   cos(mθᵢ)] [q₂ᵢ₊₁]',
      '',
      'Key property:',
      '  q\'ₘ · k\'ₙ = f(qₘ, kₙ, m-n)',
      '',
      'The dot product depends only on relative distance (m-n),',
      'not absolute positions.',
    ],
    mathExplanation: 'RoPE encodes position by rotation rather than addition. Each pair of dimensions is rotated by an angle proportional to the position. Higher-frequency rotations encode fine-grained position, lower-frequency ones encode coarse position. The beauty is that Q·K^T automatically becomes a function of relative position (m-n) without explicitly computing it.',
  },
  {
    id: 'attention',
    title: 'Scaled Dot-Product Attention',
    description: 'The core attention mechanism: each token computes similarity scores with all other tokens (via Q·K^T), normalizes them with softmax, and uses the scores to weight-sum the Value vectors.',
    math: [
      'Attention(Q, K, V) = softmax( Q·Kᵀ / √dₖ ) · V',
      '',
      'Step by step:',
      '  1. Scores = Q · Kᵀ           ∈ ℝˢˣˢ',
      '  2. Scaled = Scores / √dₖ      (prevent softmax saturation)',
      '  3. Weights = softmax(Scaled)   ∈ [0,1], rows sum to 1',
      '  4. Output = Weights · V        ∈ ℝˢˣᵈₕ',
      '',
      'Window attention (most ViT layers):',
      '  Only compute attention within local 7×7 windows',
      '',
      'Global attention (layers 7, 15, 23):',
      '  Full s×s attention matrix',
    ],
    mathExplanation: 'The √dₖ scaling prevents the dot products from growing too large as dimension increases (which would push softmax into regions with tiny gradients). Window attention limits the quadratic cost from O(s²) to O(s·w²) where w=window_size, making it feasible for high-resolution images. A few global-attention layers periodically aggregate information across the full image.',
    codeSnippet: `# Scaled dot-product attention
attn_weights = torch.matmul(q, k.transpose(-2, -1)) * self.scaling
attn_weights = nn.functional.softmax(attn_weights, dim=-1)
attn_output = torch.matmul(attn_weights, v)`,
  },
  {
    id: 'attn_scores',
    title: 'Attention Score Matrix',
    description: 'The attention score matrix shows how much each token "attends to" every other token. Each row represents a query token, each column a key token. Bright values = high attention (strong connection), dark = low attention (weak connection).',
    math: [
      'Score matrix:',
      '  S = Q · Kᵀ / √dₖ        ∈ ℝˢˣˢ',
      '',
      '  S[i,j] = (qᵢ · kⱼ) / √dₖ',
      '',
      '  = how much token i should attend to token j',
      '',
      'After softmax (row-wise):',
      '  A[i,:] = softmax(S[i,:])  ∈ [0,1], Σⱼ A[i,j] = 1',
      '',
      'Properties:',
      '  • Each row sums to 1 (probability distribution)',
      '  • A[i,j] ≈ 1: token i focuses almost entirely on token j',
      '  • A[i,j] ≈ 0: token i ignores token j',
      '  • Diagonal A[i,i]: self-attention (token attends to itself)',
      '',
      'Window attention (ViT):',
      '  Score matrix is block-diagonal (7×7 windows)',
      '  Only patches in the same window interact',
      '',
      'Global attention (layers 7, 15, 23):',
      '  Full s×s matrix — all patches can interact',
    ],
    mathExplanation: 'The score matrix is the "routing table" of the transformer. It determines the information flow: which tokens send information to which other tokens. In the ViT, most layers use window attention (each patch only talks to its 7×7 neighbors) for efficiency. A few global-attention layers let ALL patches communicate, enabling long-range spatial reasoning (e.g., a car at the top of the image can influence processing of the road at the bottom).',
  },
  {
    id: 'output_proj',
    title: 'Output Projection',
    description: 'Linear projection that combines the multi-head attention outputs back into a single representation. Concatenates all heads and projects back to the model dimension.',
    math: [
      'MultiHead(Q,K,V) = Concat(head₁, ..., headₙ) · W_o',
      '',
      'where:',
      '  headᵢ = Attention(QWᵢQ, KWᵢK, VWᵢV)',
      '  W_o ∈ ℝⁿᵈₕˣᵈ   (projects n·dₕ → d)',
    ],
    mathExplanation: 'Each attention head attends to different aspects of the input (e.g., one head might focus on spatial neighbors, another on similar colors). The output projection learns to combine these diverse perspectives into a single unified representation.',
  },
  RESIDUAL,
  {
    id: 'ffn_up',
    title: 'FFN Up-Projection + GELU',
    description: 'First layer of the feed-forward network. Expands each token from the hidden dimension to a larger intermediate dimension, then applies GELU non-linearity. This expansion lets the network compute in a higher-dimensional space.',
    math: [
      'h = GELU(x · W₁ + b₁)',
      '',
      'GELU(x) = x · Φ(x)',
      '         ≈ 0.5x · (1 + tanh(√(2/π) · (x + 0.044715x³)))',
      '',
      'Dimensions:',
      '  x ∈ ℝᵈ              — input (hidden_size)',
      '  W₁ ∈ ℝᵈˣᵈ_ff        — weight (d → intermediate)',
      '  b₁ ∈ ℝᵈ_ff           — bias',
      '  h ∈ ℝᵈ_ff            — intermediate activation',
      '',
      'Expansion ratio: d_ff / d = 4× typically',
    ],
    mathExplanation: 'GELU (Gaussian Error Linear Unit) is a smooth non-linearity that allows small negative values to pass through (unlike ReLU which zeroes them). It can be interpreted as a soft gating: each neuron is multiplied by the probability that a standard normal random variable is less than its input. The 4× expansion gives the network more "room" to represent complex transformations before compressing back.',
    codeSnippet: `# Up-projection + activation
self.linear_fc1 = nn.Linear(hidden, intermediate, bias=True)
self.act_fn = nn.GELU()

# forward:
h = self.act_fn(self.linear_fc1(x))  # [B, seq, intermediate]`,
    sourceFile: 'models/qwen3_vl/modular_qwen3_vl.py',
  },
  {
    id: 'ffn_down',
    title: 'FFN Down-Projection',
    description: 'Second layer of the feed-forward network. Projects from the expanded intermediate dimension back to the original hidden dimension. This compression forces the network to distill the high-dimensional computation into a compact representation.',
    math: [
      'y = h · W₂ + b₂',
      '',
      'Dimensions:',
      '  h ∈ ℝᵈ_ff            — intermediate (from up-proj)',
      '  W₂ ∈ ℝᵈ_ffˣᵈ        — weight (intermediate → d)',
      '  b₂ ∈ ℝᵈ              — bias',
      '  y ∈ ℝᵈ               — output (hidden_size)',
      '',
      'Full FFN:',
      '  FFN(x) = W₂ · GELU(W₁ · x + b₁) + b₂',
      '',
      'Note: ViT uses standard 2-layer FFN with bias.',
      'The LLM decoder uses SwiGLU (3 matrices, no bias).',
    ],
    mathExplanation: 'The down-projection acts as an information bottleneck. The network must learn which features computed in the expanded space are most important and compress them back. Together with the up-projection, this forms a "expand → transform → compress" pattern that is the core building block of transformer expressivity. Each token is processed independently (no cross-token interaction in the FFN).',
    codeSnippet: `# Down-projection
self.linear_fc2 = nn.Linear(intermediate, hidden, bias=True)

# forward:
y = self.linear_fc2(h)  # [B, seq, hidden_size]

# Complete forward:
def forward(self, x):
    return self.linear_fc2(self.act_fn(self.linear_fc1(x)))`,
    sourceFile: 'models/qwen3_vl/modular_qwen3_vl.py',
  },
]

// ======== LLM-SPECIFIC ========

export const LLM_SUB_BLOCKS: SubBlockInfo[] = [
  RMSNORM,
  {
    id: 'qkv',
    title: 'Q / K / V Projections (GQA)',
    description: 'Grouped-Query Attention uses separate projection matrices for Q, K, V — with fewer K/V heads than Q heads. This reduces KV-cache memory while keeping expressive queries.',
    math: [
      'Q = RMSNorm(x · W_q)     ∈ ℝˢˣⁿ_Qˣᵈₕ',
      'K = RMSNorm(x · W_k)     ∈ ℝˢˣⁿ_KVˣᵈₕ',
      'V = x · W_v               ∈ ℝˢˣⁿ_KVˣᵈₕ',
      '',
      'Grouped-Query Attention (GQA):',
      '  n_Q = num_attention_heads     (e.g. 16 or 32)',
      '  n_KV = num_key_value_heads    (e.g. 8 or 2)',
      '  group_size = n_Q / n_KV       (e.g. 2 or 16)',
      '',
      'Each KV head is shared by group_size Q heads.',
      '',
      'QK-Norm (Qwen3 specific):',
      '  Q and K are RMS-normalized AFTER projection,',
      '  BEFORE RoPE. Stabilizes attention scores.',
    ],
    mathExplanation: 'GQA is a memory optimization: instead of n_Q separate K/V heads, only n_KV are stored. During attention, each K/V head is repeated to match the Q heads in its group. This reduces KV-cache by n_Q/n_KV × (e.g., 4× for Qwen2.5-VL-7B with 16Q/2KV). QK-Norm in Qwen3 additionally normalizes Q and K vectors to prevent attention logits from growing unbounded in deep layers.',
    codeSnippet: `# Qwen3 GQA with QK-Norm
q = self.q_norm(self.q_proj(x).view(*shape, -1, head_dim))
k = self.k_norm(self.k_proj(x).view(*shape, -1, head_dim))
v = self.v_proj(x).view(*shape, -1, head_dim)
q, k = apply_rotary_pos_emb(q, k, cos, sin)  # MROPE`,
  },
  {
    id: 'mrope',
    title: 'Multi-dimensional RoPE (MROPE)',
    description: 'Extension of RoPE for multimodal tokens. Visual tokens get 3D positional encoding (Temporal, Height, Width) while text tokens get 1D encoding.',
    math: [
      'Standard RoPE: θ is 1D (position in sequence)',
      '',
      'MROPE: θ = [θ_T, θ_H, θ_W]  (3 dimensions)',
      '',
      'For visual tokens (image patches):',
      '  θ_T = temporal position (frame index)',
      '  θ_H = height position (row in grid)',
      '  θ_W = width position (column in grid)',
      '',
      'For text tokens:',
      '  θ_T = θ_H = θ_W = text_position',
      '  (all 3 dimensions encode the same 1D position)',
      '',
      'Head dim split into 3 sections:',
      '  mrope_section = [24, 20, 20]  (for dim=128)',
      '  First 24 dims: temporal frequencies',
      '  Next 20 dims: height frequencies',
      '  Last 20 dims: width frequencies',
    ],
    mathExplanation: 'MROPE lets the model know WHERE in the image each visual token came from — both its 2D spatial position (H, W) and temporal position (T, for video frames). The head dimension is split into three sections, each receiving rotations from one spatial axis. This allows attention to naturally compute distance-aware scores in 3D: a query patch will attend more strongly to keys that are spatially nearby.',
  },
  {
    id: 'attention',
    title: 'Causal Self-Attention',
    description: 'Same scaled dot-product attention as ViT, but with a causal mask that prevents tokens from attending to future positions. Visual tokens can attend to all other visual tokens; text tokens can only see previous tokens.',
    math: [
      'Attention(Q, K, V) = softmax( Q·Kᵀ/√dₖ + M ) · V',
      '',
      'Causal mask M:',
      '  M[i,j] = 0     if j ≤ i  (can attend)',
      '  M[i,j] = -∞     if j > i  (cannot attend)',
      '',
      'After softmax: positions with -∞ become 0 weight.',
      '',
      'For GQA: K,V are repeated to match Q heads:',
      '  K_expanded = repeat_kv(K, n_groups)',
      '  V_expanded = repeat_kv(V, n_groups)',
    ],
    mathExplanation: 'The causal mask enforces autoregressive generation: each token can only condition on tokens that appeared before it. This is essential for next-token prediction during training. During inference, the KV-cache stores previously computed K and V, so only the new token needs to compute attention — making generation O(s) instead of O(s²) per step.',
  },
  {
    id: 'causal_mask',
    title: 'Causal Attention Mask',
    description: 'The causal mask is a lower-triangular matrix that prevents each token from attending to future tokens. This enforces the autoregressive property: the prediction for position t can only depend on positions 0..t-1.',
    math: [
      'Mask matrix M ∈ ℝˢˣˢ:',
      '',
      '  M = ┌                          ┐',
      '      │  0    -∞    -∞    -∞    │  token 0: sees only itself',
      '      │  0     0    -∞    -∞    │  token 1: sees 0,1',
      '      │  0     0     0    -∞    │  token 2: sees 0,1,2',
      '      │  0     0     0     0    │  token 3: sees all',
      '      └                          ┘',
      '',
      'Applied BEFORE softmax:',
      '  A = softmax(Q·Kᵀ/√dₖ + M)',
      '',
      'Since softmax(−∞) = 0:',
      '  Future positions get zero attention weight.',
      '',
      'For multimodal sequences:',
      '  [vis_start, img₁..img₄₉, vis_end, text₁..textₙ]',
      '  • Visual tokens: can attend to ALL visual tokens',
      '    (bidirectional within the visual span)',
      '  • Text tokens: can attend to all visual tokens',
      '    + all preceding text tokens (causal)',
      '',
      'KV-Cache (inference optimization):',
      '  • Store K,V from all previous tokens',
      '  • New token only computes 1 new Q row',
      '  • Attention: 1 × s instead of s × s',
      '  • Makes generation O(s) per token, not O(s²)',
    ],
    mathExplanation: 'The causal mask is what makes language models autoregressive — able to generate text one token at a time. Without it, each token could "cheat" by looking at future tokens during training. The mask creates a triangular attention pattern: early tokens have very limited context (only themselves), while later tokens can attend to the full history. For VLMs, the visual tokens form a bidirectional block (they can all see each other), but text tokens remain strictly causal.',
    codeSnippet: `# Causal mask generation
def _make_causal_mask(seq_len, dtype):
    mask = torch.full((seq_len, seq_len), float("-inf"))
    mask = torch.triu(mask, diagonal=1)  # upper triangle = -inf
    return mask

# During attention:
attn_weights = q @ k.transpose(-2, -1) * scaling
attn_weights = attn_weights + causal_mask  # add -inf
attn_weights = F.softmax(attn_weights, dim=-1)  # -inf → 0

# KV-Cache during generation:
if past_key_values is not None:
    k, v = past_key_values.update(k, v, layer_idx)
    # k,v now contain ALL previous tokens' K,V`,
    sourceFile: 'models/qwen3/modeling_qwen3.py',
  },
  RESIDUAL,
  {
    id: 'swiglu',
    title: 'SwiGLU Feed-Forward Network',
    description: 'A gated FFN variant that outperforms standard ReLU/GELU FFNs. Uses SiLU activation on a "gate" path multiplied element-wise with an "up" path, then projects down.',
    math: [
      'SwiGLU(x) = (SiLU(x · W_gate) ⊙ (x · W_up)) · W_down',
      '',
      'SiLU(x) = x · σ(x) = x / (1 + e⁻ˣ)',
      '',
      'Dimensions:',
      '  W_gate ∈ ℝᵈˣᵈ_ff    (d → intermediate)',
      '  W_up  ∈ ℝᵈˣᵈ_ff    (d → intermediate)',
      '  W_down ∈ ℝᵈ_ffˣᵈ    (intermediate → d)',
      '',
      '⊙ = element-wise multiplication',
      '',
      'Note: 3 weight matrices (vs 2 in standard FFN),',
      'so intermediate_size is typically 2/3 of what',
      'a standard FFN would use for equal param count.',
    ],
    mathExplanation: 'The "gate" controls HOW MUCH of each intermediate neuron passes through, while "up" determines WHAT the neuron computes. SiLU (Sigmoid Linear Unit) is a smooth gating function: it passes large positive values nearly unchanged, suppresses large negatives, and provides a smooth transition around zero. This gating mechanism allows the network to selectively activate different "experts" in the intermediate space for different inputs.',
    codeSnippet: `class Qwen3MLP(nn.Module):
    def forward(self, x):
        return self.down_proj(
            self.act_fn(self.gate_proj(x))  # SiLU gate
            * self.up_proj(x))               # element-wise multiply`,
  },
]

// Index by ID for quick lookup
export const VIT_SUB_BLOCK_MAP: Record<string, SubBlockInfo> = {}
VIT_SUB_BLOCKS.forEach(b => { VIT_SUB_BLOCK_MAP[b.id] = b })

export const LLM_SUB_BLOCK_MAP: Record<string, SubBlockInfo> = {}
LLM_SUB_BLOCKS.forEach(b => { LLM_SUB_BLOCK_MAP[b.id] = b })
