# morphocheck_backend/routers/ai_router.py

import base64
import binascii
import json
import os
from typing import Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from models.user import User
from routers.auth_router import get_current_user
from services.ai_advice_service import generate_parent_tips
from services.nlp_service import analyze_text
from utils.database import get_db
from utils.i18n import request_lang

load_dotenv(override=True)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)

router = APIRouter(tags=["AI Assistant"])

GEMINI_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
]


def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is missing")
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"[AI ERROR] Failed to configure Gemini client: {str(e)}")
        return None


async def generate_with_fallback(contents):
    """Tries multiple Gemini models until one succeeds."""
    last_error = "No models attempted"
    client = get_gemini_client()
    if client is None:
        raise RuntimeError("Gemini client could not be initialized")
    for model_name in GEMINI_MODELS:
        try:
            print(f"[AI INFO] Attempting generation with {model_name}...")
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=contents,
            )
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
    message: str = Field(default="", max_length=10_000)
    context_page: Optional[str] = None
    context_data: Optional[Dict] = None
    history: List[Dict[str, str]] = Field(default_factory=list, max_length=20)
    image_data: Optional[str] = Field(default=None, max_length=8_000_000)
    image_mime_type: Optional[str] = None


def _build_chat_contents(req: ChatRequest, system_prompt: str):
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=system_prompt)],
        )
    ]
    for item in req.history[-10:]:
        text = str(item.get("content") or "").strip()
        if not text:
            continue
        role = "model" if item.get("role") == "assistant" else "user"
        contents.append(
            types.Content(role=role, parts=[types.Part.from_text(text=text[:10_000])])
        )

    current_parts = [types.Part.from_text(text=req.message or "Describe this image.")]
    if req.image_data and req.image_mime_type:
        allowed_mime_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
        if req.image_mime_type not in allowed_mime_types:
            raise HTTPException(status_code=400, detail="Unsupported image format")
        encoded = req.image_data.split(",", 1)[-1]
        try:
            image_bytes = base64.b64decode(encoded, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise HTTPException(status_code=400, detail="Invalid image data") from exc
        if len(image_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Image is larger than 5 MB")
        current_parts.append(
            types.Part.from_bytes(data=image_bytes, mime_type=req.image_mime_type)
        )
    contents.append(types.Content(role="user", parts=current_parts))
    return contents


class PredictParamsRequest(BaseModel):
    age: int = Field(ge=0, le=120)
    age_months: int = Field(default=0, ge=0, le=11)
    age_days: int = Field(default=0, ge=0, le=31)
    gender: str
    target_form: str


class TextAnalysisRequest(BaseModel):
    text: str
    lang: str = "uz"


@router.get("/chat/public-status")
def get_public_chat_status(db: Session = Depends(get_db)):
    from models.settings import RoleSettings
    setting = db.query(RoleSettings).filter(RoleSettings.role_name == "guest").first()
    return {"ai_chat_enabled": setting.ai_chat_enabled if setting else True}



@router.post("/chat")
async def ai_chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != "superadmin":
            from models.settings import RoleSettings
            setting = db.query(RoleSettings).filter(RoleSettings.role_name == current_user.role).first()
            if setting and not setting.ai_chat_enabled:
                raise HTTPException(status_code=403, detail="Sizning rolingiz uchun AI Chat o'chirilgan.")

        context_data_str = (
            json.dumps(req.context_data) if req.context_data else "None provided"
        )
        lang_code = request_lang.get() or "uz"
        system_prompt = (
            f"You are MorphoAI Assistant. Context: {req.context_page}. Data: {context_data_str}. "
            f"Please respond in language: {lang_code.upper()}."
        )
        contents = _build_chat_contents(req, system_prompt)
        response, model_name = await generate_with_fallback(contents)
        return {"reply": response.text, "model": model_name}
    except HTTPException:
        raise
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

        params = get_typical_params(
            req.age,
            req.gender,
            req.target_form,
            age_months=req.age_months,
            age_days=req.age_days,
        )
        print(f"[AI INFO] Fast Template Prediction for {req.age}yo {req.gender}")
        return {
            "mode": "reference_only",
            "source": "interpolated_anthropometric_template",
            "formula_version": "typical-params-v1",
            "is_measured": False,
            "params": params,
            "units": {
                key: (
                    "kg" if key in {"weight", "fatMass", "muscleMass", "boneMass"}
                    else "%" if key == "fatPercent"
                    else "L" if key == "totalBodyWater"
                    else "" if key in {"visceralFat", "acm", "teeth_count", "menstruation_start"}
                    else "mm" if key.startswith("fat_")
                    else "kgf" if key == "dynamometry"
                    else "cm"
                ) for key in params
            },
        }
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
