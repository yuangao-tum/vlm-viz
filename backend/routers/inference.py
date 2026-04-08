"""Inference API endpoint."""
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from PIL import Image
import io

from ..services.model_service import model_service
from ..schemas.response import InferenceResponse

router = APIRouter()


@router.post("/inference", response_model=InferenceResponse)
async def run_inference(
    image: UploadFile = File(...),
    vehicle_state: str = Form('{"position": [0, 0], "velocity": 5.0}'),
    style: str = Form("Default"),
):
    if not model_service.model_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded yet. Please wait.")

    try:
        contents = await image.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    try:
        result = await model_service.run_inference(pil_img, vehicle_state, style)
        return InferenceResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")
