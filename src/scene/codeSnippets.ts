// Code snippets extracted from local transformers source
// Qwen3-VL: transformers/models/qwen3_vl/modular_qwen3_vl.py
// Qwen2.5-VL: transformers/models/qwen2_5_vl/modeling_qwen2_5_vl.py
// Qwen3 LLM: transformers/models/qwen3/modeling_qwen3.py

export interface CodeSnippet {
  title: string
  className: string
  file: string
  lines: string
  code: string
}

export const CODE_SNIPPETS: Record<number, { qwen3?: CodeSnippet; 'qwen2.5'?: CodeSnippet; shared?: CodeSnippet }> = {

  // Block 1: Patch Embedding
  1: {
    qwen3: {
      title: 'Patch Embedding',
      className: 'Qwen3VLVisionPatchEmbed',
      file: 'models/qwen3_vl/modular_qwen3_vl.py',
      lines: '341-352',
      code: `class Qwen3VLVisionPatchEmbed(PatchEmbed):
    def __init__(self, config):
        super().__init__()
        self.patch_size = config.patch_size          # 16
        self.temporal_patch_size = config.temporal_patch_size  # 2
        self.in_channels = config.in_channels        # 3
        self.embed_dim = config.hidden_size           # 1024

        kernel_size = [self.temporal_patch_size,
                       self.patch_size, self.patch_size]
        self.proj = nn.Conv3d(
            self.in_channels, self.embed_dim,
            kernel_size=kernel_size,
            stride=kernel_size, bias=True)  # note: bias=True (vs False in 2.5)

    # forward inherited from PatchEmbed:
    # hidden_states = hidden_states.view(-1, C, T, H, W)
    # return self.proj(hidden_states).view(-1, embed_dim)`,
    },
    'qwen2.5': {
      title: 'Patch Embedding',
      className: 'Qwen2_5_VisionPatchEmbed',
      file: 'models/qwen2_5_vl/modeling_qwen2_5_vl.py',
      lines: '67-90',
      code: `class Qwen2_5_VisionPatchEmbed(nn.Module):
    def __init__(self, patch_size=14, temporal_patch_size=2,
                 in_channels=3, embed_dim=1280):
        super().__init__()
        kernel_size = [temporal_patch_size, patch_size, patch_size]
        self.proj = nn.Conv3d(
            in_channels, embed_dim,
            kernel_size=kernel_size,
            stride=kernel_size, bias=False)  # note: bias=False

    def forward(self, hidden_states):
        hidden_states = hidden_states.view(
            -1, self.in_channels,
            self.temporal_patch_size,
            self.patch_size, self.patch_size)
        hidden_states = self.proj(hidden_states.to(self.proj.weight.dtype))
        return hidden_states.view(-1, self.embed_dim)`,
    },
  },

  // Block 2: ViT Encoder (Attention + Block)
  2: {
    qwen3: {
      title: 'Vision Attention + Block',
      className: 'Qwen3VLVisionAttention + Qwen3VLVisionBlock',
      file: 'models/qwen3_vl/modular_qwen3_vl.py',
      lines: '373-387',
      code: `class Qwen3VLVisionAttention(VisionAttention):
    # Inherits from shared VisionAttention base class
    # QKV fused projection + RoPE + scaled dot-product
    def __init__(self, config):
        self.dim = config.hidden_size        # 1024
        self.num_heads = config.num_heads    # 16
        self.head_dim = self.dim // self.num_heads  # 64
        self.qkv = nn.Linear(self.dim, self.dim * 3, bias=True)
        self.proj = nn.Linear(self.dim, self.dim)

class Qwen3VLVisionBlock(Qwen2_5_VLVisionBlock):
    def __init__(self, config):
        self.norm1 = nn.LayerNorm(config.hidden_size, eps=1e-6)
        self.norm2 = nn.LayerNorm(config.hidden_size, eps=1e-6)
        self.attn = Qwen3VLVisionAttention(config)
        self.mlp = Qwen3VLVisionMLP(config)

    # forward (inherited):
    # x = x + self.attn(self.norm1(x), ...)
    # x = x + self.mlp(self.norm2(x))

class Qwen3VLVisionMLP(nn.Module):
    def __init__(self, config):
        self.linear_fc1 = nn.Linear(hidden, intermediate, bias=True)
        self.linear_fc2 = nn.Linear(intermediate, hidden, bias=True)
        self.act_fn = ACT2FN[config.hidden_act]

    def forward(self, x):
        return self.linear_fc2(self.act_fn(self.linear_fc1(x)))`,
    },
    'qwen2.5': {
      title: 'Vision Attention',
      className: 'Qwen2_5_VLVisionAttention',
      file: 'models/qwen2_5_vl/modeling_qwen2_5_vl.py',
      lines: '182-220',
      code: `class Qwen2_5_VLVisionAttention(nn.Module):
    def __init__(self, config):
        self.dim = config.hidden_size        # 1280
        self.num_heads = config.num_heads    # 16
        self.head_dim = self.dim // self.num_heads  # 80
        self.qkv = nn.Linear(self.dim, self.dim * 3, bias=True)
        self.proj = nn.Linear(self.dim, self.dim)
        self.scaling = self.head_dim ** -0.5

    def forward(self, hidden_states, cu_seqlens, position_embeddings):
        seq_length = hidden_states.shape[0]
        q, k, v = self.qkv(hidden_states).reshape(
            seq_length, 3, self.num_heads, -1
        ).permute(1, 0, 2, 3).unbind(0)

        cos, sin = position_embeddings
        q, k = apply_rotary_pos_emb_vision(q, k, cos, sin)

        attn = scaled_dot_product_attention(q, k, v)
        return self.proj(attn)`,
    },
  },

  // Block 3: Spatial Merge
  3: {
    qwen3: {
      title: 'Spatial Merge (Patch Merger)',
      className: 'Qwen3VLVisionPatchMerger',
      file: 'models/qwen3_vl/modular_qwen3_vl.py',
      lines: '357-370',
      code: `class Qwen3VLVisionPatchMerger(nn.Module):
    def __init__(self, config, use_postshuffle_norm=False):
        super().__init__()
        # 2x2 spatial merge: 4 patches concatenated
        self.hidden_size = config.hidden_size * (config.spatial_merge_size ** 2)
        self.use_postshuffle_norm = use_postshuffle_norm
        self.norm = nn.LayerNorm(
            self.hidden_size if use_postshuffle_norm
            else config.hidden_size, eps=1e-6)
        self.linear_fc1 = nn.Linear(self.hidden_size, self.hidden_size)
        self.act_fn = nn.GELU()
        self.linear_fc2 = nn.Linear(self.hidden_size, config.out_hidden_size)

    def forward(self, x):
        x = self.norm(x.view(-1, self.hidden_size)
                      if self.use_postshuffle_norm
                      else x).view(-1, self.hidden_size)
        x = self.linear_fc2(self.act_fn(self.linear_fc1(x)))
        return x  # [N/4, out_hidden_size]`,
    },
    'qwen2.5': {
      title: 'Spatial Merge (Patch Merger)',
      className: 'Qwen2_5_VLPatchMerger',
      file: 'models/qwen2_5_vl/modeling_qwen2_5_vl.py',
      lines: '107-120',
      code: `class Qwen2_5_VLPatchMerger(nn.Module):
    def __init__(self, dim, context_dim, spatial_merge_size=2):
        super().__init__()
        self.hidden_size = context_dim * (spatial_merge_size ** 2)
        self.ln_q = Qwen2RMSNorm(context_dim, eps=1e-6)
        self.mlp = nn.Sequential(
            nn.Linear(self.hidden_size, self.hidden_size),
            nn.GELU(),
            nn.Linear(self.hidden_size, dim),
        )

    def forward(self, x):
        x = self.mlp(self.ln_q(x).view(-1, self.hidden_size))
        return x  # [N/4, dim]`,
    },
  },

  // Block 4: Connector + DeepStack mergers
  4: {
    qwen3: {
      title: 'Connector + DeepStack Mergers',
      className: 'Qwen3VLVisionModel',
      file: 'models/qwen3_vl/modular_qwen3_vl.py',
      lines: '537-580, 676-735',
      code: `class Qwen3VLVisionModel(Qwen3VLPreTrainedModel):
    def __init__(self, config):
        # Main merger: final ViT output -> LLM dim
        self.merger = Qwen3VLVisionPatchMerger(
            config, use_postshuffle_norm=False)

        # DeepStack: one merger per extraction layer
        self.deepstack_visual_indexes = config.deepstack_visual_indexes
        self.deepstack_merger_list = nn.ModuleList([
            Qwen3VLVisionPatchMerger(
                config, use_postshuffle_norm=True)
            for _ in config.deepstack_visual_indexes
        ])

    def forward(self, hidden_states, grid_thw):
        hidden_states = self.patch_embed(hidden_states)
        hidden_states = hidden_states + self.fast_pos_embed_interpolate(grid_thw)

        deepstack_feature_lists = []
        for layer_num, blk in enumerate(self.blocks):
            hidden_states = blk(hidden_states, ...)
            # Extract intermediate features for DeepStack
            if layer_num in self.deepstack_visual_indexes:
                idx = self.deepstack_visual_indexes.index(layer_num)
                feat = self.deepstack_merger_list[idx](hidden_states)
                deepstack_feature_lists.append(feat)

        hidden_states = self.merger(hidden_states)
        return hidden_states, deepstack_feature_lists`,
    },
    'qwen2.5': {
      title: 'Connector (Visual Projection)',
      className: 'Qwen2_5_VLModel.get_image_features',
      file: 'models/qwen2_5_vl/modeling_qwen2_5_vl.py',
      lines: '1216-1270',
      code: `class Qwen2_5_VLModel(Qwen2_5_VLPreTrainedModel):
    def get_image_features(self, pixel_values, grid_thw):
        # Run ViT encoder + merger (spatial merge)
        image_embeds = self.visual(pixel_values, grid_thw)
        # Returns ONLY final embeddings (no deepstack)
        return image_embeds  # [N/4, out_hidden_size]

    def forward(self, input_ids, pixel_values, ...):
        inputs_embeds = self.embed_tokens(input_ids)
        # Get visual features
        image_embeds = self.get_image_features(pixel_values, ...)
        image_embeds = torch.cat(image_embeds, dim=0)
        # Replace placeholder tokens with visual features
        image_mask = self.get_placeholder_mask(input_ids)
        inputs_embeds = inputs_embeds.masked_scatter(
            image_mask, image_embeds)
        # No DeepStack - visual info enters only at input
        return self.language_model(inputs_embeds)`,
    },
  },

  // Block 5: Text Tokens
  5: {
    shared: {
      title: 'Token Embedding',
      className: 'nn.Embedding',
      file: 'models/qwen3/modeling_qwen3.py',
      lines: '',
      code: `class Qwen3Model(nn.Module):
    def __init__(self, config):
        self.embed_tokens = nn.Embedding(
            config.vocab_size,      # 151,936
            config.hidden_size)     # 2048 / 2560 / 4096

    def forward(self, input_ids):
        inputs_embeds = self.embed_tokens(input_ids)
        # [B, seq_len, hidden_size]
        return inputs_embeds`,
    },
  },

  // Block 6: LLM GQA Attention + SwiGLU
  6: {
    qwen3: {
      title: 'GQA Attention + SwiGLU FFN',
      className: 'Qwen3VLTextAttention + Qwen3MLP',
      file: 'models/qwen3/modeling_qwen3.py + qwen3_vl/modular_qwen3_vl.py',
      lines: '158-230, 70-83, 447-495',
      code: `# === Qwen3 GQA Attention (with QK-Norm) ===
class Qwen3Attention(nn.Module):
    def __init__(self, config, layer_idx):
        self.head_dim = config.head_dim              # 128
        self.num_kv_groups = num_heads // num_kv_heads
        self.q_proj = nn.Linear(hidden, num_heads * head_dim)
        self.k_proj = nn.Linear(hidden, num_kv_heads * head_dim)
        self.v_proj = nn.Linear(hidden, num_kv_heads * head_dim)
        self.o_proj = nn.Linear(num_heads * head_dim, hidden)
        # Qwen3 specific: QK-Norm (RMSNorm on head_dim)
        self.q_norm = Qwen3RMSNorm(head_dim)
        self.k_norm = Qwen3RMSNorm(head_dim)

    def forward(self, hidden_states, position_embeddings, mask):
        q = self.q_norm(self.q_proj(hidden_states))  # + QK-Norm
        k = self.k_norm(self.k_proj(hidden_states))  # + QK-Norm
        v = self.v_proj(hidden_states)
        q, k = apply_rotary_pos_emb(q, k, cos, sin)  # MROPE
        attn_out = attention(q, k, v, mask, scaling=head_dim**-0.5)
        return self.o_proj(attn_out)

# Qwen3-VL overrides: removes sliding_window
class Qwen3VLTextAttention(Qwen3Attention):
    def __init__(self, config, layer_idx):
        super().__init__(config, layer_idx)
        del self.sliding_window  # VL model uses full attention

# === SwiGLU FFN ===
class Qwen3MLP(nn.Module):
    def __init__(self, config):
        self.gate_proj = nn.Linear(hidden, intermediate, bias=False)
        self.up_proj = nn.Linear(hidden, intermediate, bias=False)
        self.down_proj = nn.Linear(intermediate, hidden, bias=False)
        self.act_fn = nn.SiLU()

    def forward(self, x):
        return self.down_proj(self.act_fn(self.gate_proj(x)) * self.up_proj(x))`,
    },
    'qwen2.5': {
      title: 'GQA Attention + SwiGLU FFN',
      className: 'Qwen2_5_VLTextAttention + Qwen2MLP',
      file: 'models/qwen2_5_vl/modeling_qwen2_5_vl.py',
      lines: '',
      code: `# === Qwen2.5-VL Attention (no QK-Norm) ===
class Qwen2Attention(nn.Module):
    def __init__(self, config, layer_idx):
        self.head_dim = hidden // num_heads
        self.q_proj = nn.Linear(hidden, num_heads * head_dim)
        self.k_proj = nn.Linear(hidden, num_kv_heads * head_dim)
        self.v_proj = nn.Linear(hidden, num_kv_heads * head_dim)
        self.o_proj = nn.Linear(num_heads * head_dim, hidden)
        # No QK-Norm in Qwen2.5 (key difference vs Qwen3)

    def forward(self, hidden_states, position_embeddings, mask):
        q = self.q_proj(hidden_states)  # no QK-Norm
        k = self.k_proj(hidden_states)  # no QK-Norm
        v = self.v_proj(hidden_states)
        q, k = apply_rotary_pos_emb(q, k, cos, sin)  # MROPE
        attn_out = attention(q, k, v, mask)
        return self.o_proj(attn_out)

# === SwiGLU FFN (same structure as Qwen3) ===
class Qwen2MLP(nn.Module):
    def __init__(self, config):
        self.gate_proj = nn.Linear(hidden, intermediate, bias=False)
        self.up_proj = nn.Linear(hidden, intermediate, bias=False)
        self.down_proj = nn.Linear(intermediate, hidden, bias=False)

    def forward(self, x):
        return self.down_proj(silu(self.gate_proj(x)) * self.up_proj(x))`,
    },
  },

  // Block 7: Trajectory Head
  7: {
    shared: {
      title: 'Trajectory Regression Head',
      className: 'Qwen3VLForTrajectorySFT',
      file: 'VLM_trajectory_generation/src/trajectory_model.py',
      lines: '144-148, 214-217',
      code: `# === Head definition (trajectory_model.py:144) ===
self.regression_head = nn.Sequential(
    nn.Linear(hidden_size, hidden_size // 2),
    nn.ReLU(),
    nn.Linear(hidden_size // 2, trajectory_dim)  # -> 55
)

# Learnable uncertainty weights for multi-task loss
self.log_sigma_sq_ce = nn.Parameter(torch.tensor(0.0))
self.log_sigma_sq_reg = nn.Parameter(torch.tensor(0.0))

# === Forward pass (train_sft.py:307-323) ===
hidden = outputs.hidden_states[-1]         # last layer [B,S,H]
mask = (labels != -100).unsqueeze(-1)      # label mask
pooled = (hidden * mask).sum(1) / mask.sum(1)  # weighted avg [B,H]

pred = self.regression_head(pooled)        # [B, 55]
loss_reg = kinematic_trajectory_loss(pred, targets)

# Multi-task uncertainty weighting:
L_ce  = exp(-log_σ²_ce) * loss_ce + 0.5 * log_σ²_ce
L_reg = 0.5 * (exp(-log_σ²_reg) * loss_reg + log_σ²_reg)
total = L_ce + L_reg`,
    },
  },

  // Block 8: LM Head
  8: {
    shared: {
      title: 'Language Model Head',
      className: 'Qwen3ForCausalLM (lm_head)',
      file: 'models/qwen3/modeling_qwen3.py',
      lines: '',
      code: `class Qwen3ForCausalLM(nn.Module):
    def __init__(self, config):
        self.model = Qwen3Model(config)
        self.lm_head = nn.Linear(
            config.hidden_size,    # 2048 / 2560 / 4096
            config.vocab_size,     # 151,936
            bias=False)

    def forward(self, input_ids, labels=None):
        hidden = self.model(input_ids)
        logits = self.lm_head(hidden)     # [B, seq, vocab]

        if labels is not None:
            shift_logits = logits[..., :-1, :]
            shift_labels = labels[..., 1:]
            loss = CrossEntropyLoss()(
                shift_logits.view(-1, self.config.vocab_size),
                shift_labels.view(-1))
        return CausalLMOutput(loss=loss, logits=logits)`,
    },
  },
}
