# morphocheck_backend/routers/ai_router.py

import json
import os
from typing import Dict, List, Optional

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from models.user import User
from routers.auth_router import get_current_user
from services.ai_advice_service import generate_parent_tips
from services.nlp_service import analyze_text
from utils.i18n import request_lang

load_dotenv(override=True)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)

router = APIRouter(tags=["AI Assistant"])

GEMINI_MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-pro-latest",
]


def get_gemini_model(model_name: str):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is missing")
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel(model_name)
    except Exception as e:
        print(f"[AI ERROR] Failed to configure {model_name}: {str(e)}")
        return None


async def generate_with_fallback(contents):
    """Tries multiple Gemini models until one succeeds."""
    last_error = "No models attempted"
    for model_name in GEMINI_MODELS:
        try:
            print(f"[AI INFO] Attempting generation with {model_name}...")
            model = get_gemini_model(model_name)
            response = model.generate_content(contents)
            if (
                response
                and getattr(response, "candidates", None)
                and response.candidates
            ):
                return response, model_name
        except Exception as e:
            last_error = str(e)
            print(f"[AI WARNING] {model_name} failed: {last_error}")
            continue
    raise Exception(f"All Gemini models failed. Last error: {last_error}")


class ChatRequest(BaseModel):
    message: str
    context_page: Optional[str] = None
    context_data: Optional[Dict] = None
    history: Optional[List[Dict[str, str]]] = []
    image_data: Optional[str] = None
    image_mime_type: Optional[str] = None


class PredictParamsRequest(BaseModel):
    age: int
    gender: str
    target_form: str


class TextAnalysisRequest(BaseModel):
    text: str
    lang: str = "uz"


@router.post("/chat")
async def ai_chat(req: ChatRequest, current_user: User = Depends(get_current_user)):
    try:
        context_data_str = (
            json.dumps(req.context_data) if req.context_data else "None provided"
        )
        lang_code = request_lang.get() or "uz"
        system_prompt = (
            f"You are MorphoAI Assistant. Context: {req.context_page}. Data: {context_data_str}. "
            f"Please respond in language: {lang_code.upper()}."
        )
        contents = [system_prompt, req.message]
        response, model_name = await generate_with_fallback(contents)
        return {"reply": response.text, "model": model_name}
    except Exception as e:
        error_text = str(e)
        print(f"[AI CHAT ERROR] {error_text}")
        detail = "Gemini xizmatidan javob olib bo'lmadi."
        if "API_KEY_INVALID" in error_text or "API Key not found" in error_text:
            detail = "Gemini API kaliti noto'g'ri yoki faol emas. GEMINI_API_KEY ni yangilang."
        elif "GEMINI_API_KEY is missing" in error_text:
            detail = (
                "Gemini API kaliti topilmadi. GEMINI_API_KEY ni .env faylga qo'shing."
            )
        raise HTTPException(status_code=503, detail=detail)


@router.post("/predict-params")
async def predict_params(
    req: PredictParamsRequest, current_user: User = Depends(get_current_user)
):
    """
    Returns typical (normative) anthropometric parameters instantly using templates.
    """
    try:
        from services.norms_service import get_typical_params

        params = get_typical_params(req.age, req.gender, req.target_form)
        print(f"[AI INFO] Fast Template Prediction for {req.age}yo {req.gender}")
        return {"params": params}
    except Exception as e:
        print(f"[AI PREDICT ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail="Error predicting parameters")


@router.post("/analyze-text")
async def analyze_text_fast(
    req: TextAnalysisRequest, current_user: User = Depends(get_current_user)
):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Matn bo'sh bo'lmasligi kerak.")
    return analyze_text(req.text, lang=req.lang)


@router.post("/generate-parent-tips")
async def ai_parent_tips(req: Dict, current_user: User = Depends(get_current_user)):
    try:
        patient_data = req.get("patient_data", {})
        ml_predictions = req.get("ml_predictions", {})
        lang = req.get("lang") or request_lang.get() or "uz"
        tips = generate_parent_tips(patient_data, ml_predictions, lang=lang)
        return {"tips": tips}
    except Exception:
        return {"tips": []}
