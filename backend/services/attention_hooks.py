"""PyTorch forward hooks to capture attention weights during inference."""
import numpy as np
from typing import Dict, List, Tuple


class AttentionCapture:
    """Registers forward hooks to capture attention matrices from ViT and LLM layers."""

    def __init__(self):
        self.vit_attentions: Dict[int, np.ndarray] = {}   # layer_idx → [heads, seq, seq]
        self.llm_attentions: Dict[int, np.ndarray] = {}
        self._hooks = []

    def register(self, model):
        """Register forward hooks on the model's attention layers."""
        self.clear()
        self._hooks.clear()

        # ViT: hook every 4th layer
        if hasattr(model, 'visual') and hasattr(model.visual, 'blocks'):
            for i, block in enumerate(model.visual.blocks):
                if i % 4 == 0 or i in (7, 15, 23):  # sample + full-attention layers
                    attn_mod = getattr(block, 'attn', None)
                    if attn_mod is not None:
                        hook = attn_mod.register_forward_hook(
                            self._make_vit_hook(i)
                        )
                        self._hooks.append(hook)

        # LLM: hook every 4th layer
        if hasattr(model, 'model') and hasattr(model.model, 'layers'):
            for i, layer in enumerate(model.model.layers):
                if i % 4 == 0:
                    attn_mod = getattr(layer, 'self_attn', None)
                    if attn_mod is not None:
                        hook = attn_mod.register_forward_hook(
                            self._make_llm_hook(i)
                        )
                        self._hooks.append(hook)

    def _make_vit_hook(self, layer_idx: int):
        def hook(module, input, output):
            if isinstance(output, tuple) and len(output) > 1 and output[1] is not None:
                attn = output[1].detach().float().cpu().numpy()
                self.vit_attentions[layer_idx] = attn[0]  # drop batch dim
        return hook

    def _make_llm_hook(self, layer_idx: int):
        def hook(module, input, output):
            if isinstance(output, tuple) and len(output) > 1 and output[1] is not None:
                attn = output[1].detach().float().cpu().numpy()
                self.llm_attentions[layer_idx] = attn[0]
        return hook

    def clear(self):
        self.vit_attentions.clear()
        self.llm_attentions.clear()

    def remove_hooks(self):
        for hook in self._hooks:
            hook.remove()
        self._hooks.clear()

    def to_dict(self) -> Tuple[Dict, Dict]:
        """Convert captured attentions to JSON-serializable dicts."""
        vit = {}
        for idx, arr in self.vit_attentions.items():
            vit[str(idx)] = {
                "layer_idx": idx,
                "num_heads": arr.shape[0],
                "seq_len": arr.shape[1],
                "weights": arr.tolist(),
            }

        llm = {}
        for idx, arr in self.llm_attentions.items():
            llm[str(idx)] = {
                "layer_idx": idx,
                "num_heads": arr.shape[0],
                "seq_len": arr.shape[1],
                "weights": arr.tolist(),
            }

        return vit, llm
