from pydantic import BaseModel
from typing import Dict, List, Optional


class AttentionLayer(BaseModel):
    layer_idx: int
    num_heads: int
    seq_len: int
    weights: List[List[List[float]]]  # [heads, seq, seq]


class TrajectoryPoint(BaseModel):
    t: float
    x: float
    y: float
    velocity: float
    acceleration: float
    heading: float


class InferenceResponse(BaseModel):
    trajectory: List[TrajectoryPoint]
    generated_text: str
    vit_attentions: Dict[str, AttentionLayer]
    llm_attentions: Dict[str, AttentionLayer]
    num_visual_tokens: int
    num_text_tokens: int
    timing: Dict[str, float]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: Optional[str] = None
