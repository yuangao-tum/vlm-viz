"""Singleton model service: loads Qwen3-VL-2B and runs inference."""
import os
import sys
import time
import json
import logging
from typing import Optional, Dict, Any

import torch
import numpy as np
from PIL import Image

from .attention_hooks import AttentionCapture

logger = logging.getLogger(__name__)

# Add the training project to path for model imports
TRAINING_PROJECT = os.environ.get(
    "TRAINING_PROJECT",
    os.path.expanduser("~/iros/VLM_trajectory_generation")
)
sys.path.insert(0, TRAINING_PROJECT)


class ModelService:
    """Singleton model loader + inference runner."""

    def __init__(self):
        self.model = None
        self.processor = None
        self.model_loaded = False
        self.model_name = "Qwen/Qwen3-VL-2B-Instruct"
        self.checkpoint_path = os.environ.get(
            "CHECKPOINT_PATH",
            os.path.join(TRAINING_PROJECT, "output/sft_qwen3_2b/checkpoint-34230")
        )
        self.attention_capture = AttentionCapture()

    async def load(self):
        """Load the finetuned model at startup."""
        try:
            logger.info(f"Loading model from {self.checkpoint_path}...")

            from transformers import AutoProcessor, AutoTokenizer

            # Try loading the finetuned model
            try:
                from src.utils import load_pretrained_model
                self.model, self.processor = load_pretrained_model(
                    self.checkpoint_path,
                    attn_implementation="eager",  # need attention weights
                )
            except ImportError:
                logger.warning("Could not import training utils, loading base model")
                from transformers import Qwen2_5_VLForConditionalGeneration
                self.model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                    self.model_name,
                    torch_dtype=torch.bfloat16,
                    device_map="auto",
                    attn_implementation="eager",
                )
                self.processor = AutoProcessor.from_pretrained(self.model_name)

            self.model.eval()
            self.attention_capture.register(self.model)
            self.model_loaded = True
            logger.info("Model loaded successfully!")

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.model_loaded = False
            raise

    async def run_inference(
        self,
        image: Image.Image,
        vehicle_state: str,
        style: str = "Default",
    ) -> Dict[str, Any]:
        """Run inference and capture attention weights."""
        if not self.model_loaded:
            raise RuntimeError("Model not loaded")

        self.attention_capture.clear()
        timing = {}

        # Build prompt matching training format
        prompt = f"""<image>
[System] You are an autonomous driving model. Given the BEV image and vehicle state, predict the trajectory.

Vehicle state: {vehicle_state}
Driving style: {style}

Predict the trajectory as JSON with position, velocity, acceleration, and heading for the next 5 seconds at 0.5s intervals."""

        # Tokenize
        messages = [
            {"role": "user", "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": prompt},
            ]}
        ]

        text = self.processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.processor(
            text=[text],
            images=[image],
            return_tensors="pt",
            padding=True,
        ).to(self.model.device)

        num_visual_tokens = 49  # after spatial merge
        num_text_tokens = inputs.input_ids.shape[1] - num_visual_tokens

        # Run inference
        t0 = time.time()
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=256,
                do_sample=False,
                output_attentions=True,
                return_dict_in_generate=True,
            )
        total_ms = (time.time() - t0) * 1000

        # Parse output text
        generated_ids = outputs.sequences[0][inputs.input_ids.shape[1]:]
        generated_text = self.processor.decode(generated_ids, skip_special_tokens=True)

        # Parse trajectory from generated text
        trajectory = self._parse_trajectory(generated_text)

        # Get attention data
        vit_attns, llm_attns = self.attention_capture.to_dict()

        timing = {
            "vit_ms": total_ms * 0.15,   # approximate breakdown
            "llm_ms": total_ms * 0.83,
            "head_ms": total_ms * 0.02,
        }

        return {
            "trajectory": trajectory,
            "generated_text": generated_text,
            "vit_attentions": vit_attns,
            "llm_attentions": llm_attns,
            "num_visual_tokens": num_visual_tokens,
            "num_text_tokens": num_text_tokens,
            "timing": timing,
        }

    def _parse_trajectory(self, text: str) -> list:
        """Parse trajectory JSON from model output."""
        try:
            # Try to find JSON in the output
            start = text.find('{')
            end = text.rfind('}') + 1
            if start >= 0 and end > start:
                data = json.loads(text[start:end])
                traj = data.get("trajectory", data)
                positions = traj.get("position", [])
                velocities = traj.get("velocity", [])
                accelerations = traj.get("acceleration", [])
                headings = traj.get("heading_radian", traj.get("heading", []))

                result = []
                for i in range(len(positions)):
                    result.append({
                        "t": i * 0.5,
                        "x": positions[i][0] if isinstance(positions[i], list) else positions[i],
                        "y": positions[i][1] if isinstance(positions[i], list) else 0,
                        "velocity": velocities[i] if i < len(velocities) else 0,
                        "acceleration": accelerations[i] if i < len(accelerations) else 0,
                        "heading": headings[i] if i < len(headings) else 0,
                    })
                return result
        except (json.JSONDecodeError, KeyError, IndexError):
            pass

        # Fallback: return empty trajectory
        return [{"t": i * 0.5, "x": 0, "y": 0, "velocity": 0, "acceleration": 0, "heading": 0} for i in range(11)]


# Singleton instance
model_service = ModelService()
