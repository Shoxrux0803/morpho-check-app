# morphocheck_backend/routers/ai_router.py

import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import google.generativeai as genai
from routers.auth_router import get_current_user
from models.user import User
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["AI Assistant"])

def get_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[AI ERROR] GEMINI_API_KEY is missing")
        return None, "GEMINI_API_KEY is missing"
    try:
        genai.configure(api_key=api_key)
        # Try a few common model names
        errors = []
        model_candidates = [
            'gemini-2.5-flash', 
            'gemini-2.0-flash', 
            'gemini-flash-latest', 
            'gemini-pro-latest',
            'gemini-flash-lite-latest',
            'gemini-2.0-flash-lite',
            'gemini-1.5-flash', 
            'gemini-pro'
        ]
        for model_name in model_candidates:
            try:
                m = genai.GenerativeModel(model_name)
                # Test if it can generate anything small to verify quota and existence
                m.generate_content("test")
                return m, None
            except Exception as e:
                err_str = f"{model_name} failed: {str(e)}"
                print(f"[AI INFO] {err_str}")
                errors.append(err_str)
                continue
        return None, " | ".join(errors)
    except Exception as e:
        err_msg = f"Failed to configure Gemini: {str(e)}"
        print(f"[AI ERROR] {err_msg}")
        return None, err_msg

# Initial model setup (will be initialized on first request)
model = None

class ChatRequest(BaseModel):
    message: str
    context_page: Optional[str] = None
    context_data: Optional[Dict] = None
    history: Optional[List[Dict[str, str]]] = []
    image_data: Optional[str] = None  # Base64 encoded string
    image_mime_type: Optional[str] = None

class PredictParamsRequest(BaseModel):
    age: int
    gender: str
    target_form: str  # "analysis" or "research"

SYSTEM_PROMPT = """
You are "MorphoAI Assistant", a specialized professional clinical and scientific assistant for the MorphoCheck Pro platform.
Your primary purpose is to help Medical Professionals, Researchers, and Admins with anthropometric analysis, medical morphology, and pediatric physical development.

PROJECT CONTEXT:
1. MorphoCheck Pro analyzes physical development of children/adolescents (0-19 years) based on WHO 2007 Standards.
2. It calculates Z-scores for: Weight-for-age, Height-for-age, BMI-for-age, and Head Circumference.
3. Results categories: Stunting, Underweight, Wasting, Normal, Overweight, Obese.
4. It also supports bioimpedance analysis and complex anatomical research.

RULES FOR PRO LEVEL:
1. SCIENTIFIC RIGOR: Always base your medical and anthropometric assessments on official guidelines (e.g., WHO Growth Standards).
2. MULTIMODAL AWARENESS: If the user provides an image (like an X-ray, lab result, or growth chart), carefully analyze it and provide a structured, professional clinical interpretation.
3. CONTEXT AWARENESS: Utilize any provided "Patient/Form Context Data" to give precise, personalized insights without asking the user to repeat the data.
4. PROFESSIONAL TONE: Be clinical, objective, and precise. Avoid casual conversational filler. Use bullet points for readability.
5. NO HALLUCINATION: Do not invent diagnoses. State clearly: "Ushbu xulosa faqat ma'lumot uchun, yakuniy tashxisni shifokor qo'yishi shart."
6. LANGUAGE: Respond in the same language as the user (Uzbek, Russian, or English).

Current page context: {context_page}
Patient/Form Context Data: {context_data}
"""

@router.post("/chat")
async def ai_chat(req: ChatRequest, current_user: User = Depends(get_current_user)):
    global model
    if not model:
        model, err = get_model()
        if not model:
            raise HTTPException(status_code=503, detail=f"Gemini API bilan bog'lanib bo'lmadi: {err}")
    
    try:
        import json
        context_data_str = json.dumps(req.context_data) if req.context_data else "None provided"
        formatted_prompt = SYSTEM_PROMPT.format(
            context_page=req.context_page or "Unknown",
            context_data=context_data_str
        )
        
        # Build contents array instead of a single string, to support images
        contents = []
        
        # Add system instructions and history as text
        full_text_prompt = formatted_prompt + "\n\n"
        if req.history:
            for h in req.history[-5:]: # Keep last 5 messages for context
                role = "User" if h.get('role') == 'user' else "Assistant"
                content = h.get('content', '')
                if content:
                    full_text_prompt += f"{role}: {content}\n"
        
        full_text_prompt += f"User: {req.message}\nAssistant:"
        
        # If there's an image, decode it and add to contents
        if req.image_data and req.image_mime_type:
            import base64
            try:
                # Strip data URL prefix if present
                base64_data = req.image_data
                if "," in base64_data:
                    base64_data = base64_data.split(",")[1]
                    
                image_bytes = base64.b64decode(base64_data)
                contents.append({
                    "mime_type": req.image_mime_type,
                    "data": image_bytes
                })
            except Exception as img_err:
                print(f"[AI ERROR] Failed to decode image: {img_err}")
        
        # Always add the text prompt
        contents.append(full_text_prompt)
        
        print(f"[AI DEBUG] Sending prompt to Gemini with {len(contents)} parts.")
        try:
            response = model.generate_content(contents)
        except Exception as gen_err:
            # If quota exceeded, try to rotate model
            if "429" in str(gen_err) or "ResourceExhausted" in type(gen_err).__name__:
                print(f"[AI WARNING] Quota exceeded for current model. Rotating...")
                model = None # Reset global model
                model, err = get_model() # Get next available
                if not model:
                     raise HTTPException(status_code=503, detail=f"Barcha AI modellar kivotasi tugadi: {err}")
                response = model.generate_content(contents) # Retry once
            else:
                raise gen_err
        
        if not response or not getattr(response, "candidates", None) or not response.candidates:
             print("[AI ERROR] Empty response from Gemini")
             return {"reply": "Kechirasiz, sun'iy intellekt hozirda javob bera olmayapti. (Empty response)"}
             
        # Check if response was blocked by safety filters
        if response.candidates[0].finish_reason != 1: # 1 is SUCCESS/STOP
            print(f"[AI ERROR] Response blocked. Reason: {response.candidates[0].finish_reason}")
            return {"reply": "Kechirasiz, ushbu savolga javob berish xavfsizlik filtrlari tomonidan cheklandi."}

        try:
            reply_text = response.text
        except ValueError:
            reply_text = "Kechirasiz, sun'iy intellekt bo'sh javob qaytardi."

        return {"reply": reply_text}
    except Exception as e:
        import traceback
        err_type = type(e).__name__
        err_msg = str(e)
        print(f"[AI ERROR] {err_type}: {err_msg}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"AI Response Error [{err_type}]: {err_msg}"
        )

@router.post("/predict-params")
async def predict_params(req: PredictParamsRequest, current_user: User = Depends(get_current_user)):
    global model
    if not model:
        model, err = get_model()
        if not model:
            raise HTTPException(status_code=503, detail=f"Gemini API key not configured or invalid: {err}")
    
    try:
        gender_map = {"Boy": "male", "Girl": "female", "Male": "male", "Female": "female", "Erkak": "male", "Ayol": "female", "erkak": "male", "ayol": "female"}
        gender_norm = gender_map.get(req.gender, req.gender)
        
        # Define fields based on target_form
        fields_str = ""
        if req.target_form == 'analysis':
            fields_str = """
            height, bodyLength, weight, chest, waist, head, 
            shoulderLength, shoulderBreadth, shoulderCircumference, 
            armElbowLength, handLength, thighLength, thighCircumference, 
            calfLength, calfCircumference, footLength,
            totalBodyWater, fatPercent, fatMass, muscleMass, boneMass, acm, visceralFat
            """
        else:
            fields_str = """
            lower_leg_spina_iliaca, lower_leg_symphysion, tibiale_height, pelvic_width, 
            thigh_length, thigh_circumference, calf_length, calf_circumference, 
            foot_length, teeth_count, menstruation_start,
            skull_longitudinal, skull_transverse, head_circumference, 
            forehead_transverse, skull_height, skull_base_length, skull_base_width,
            face_bizygomatic, face_bigonial, face_morphological_height, 
            face_physiognomic_height, nose_height, nose_width, outer_canthal_width, 
            inner_canthal_width, lips_mucosa_height, mouth_width,
            chest_standing_height, chest_sitting_height, weight, trunk_length, 
            torso_length, chest_circumference_pause, chest_circumference_inhale, 
            chest_circumference_exhale, waist_circumference, abdomen_circumference, 
            upper_segment_length, chest_transverse_diameter, chest_anteroposterior_diameter, 
            chest_height, arm_length, shoulder_length, shoulder_width, 
            shoulder_circumference_rest, shoulder_circumference_flexed, 
            forearm_length, hand_length, dynamometry,
            fat_triceps, fat_biceps, fat_subscapular, fat_iliac, fat_popliteal
            """

        prompt = f"""
        Act as a professional medical anthropometry expert. 
        Provide typical (average/normative/WHO standard based) anthropometric measurements for a {req.age} year old {gender_norm} individual.
        The data is intended for a '{req.target_form}' form in the MorphoCheck Pro system.
        
        Target fields to populate:
        {fields_str}
        
        CRITICAL INSTRUCTIONS:
        1. Return ONLY a valid JSON object.
        2. Keys MUST match the target fields exactly as written above.
        3. Values MUST be numbers (floats or ints), except for 'menstruation_start' which should be a string (e.g., "12 years" or "none" if male/too young).
        4. ANATOMICAL CONSISTENCY: Ensure all values (height, limb lengths, circumferences, weights) are anatomically proportional and realistic for a {req.age}-year-old {gender_norm}.
        5. No markdown code blocks, no conversational text, no explanations. Just the JSON object.
        """
        
        try:
            response = model.generate_content(prompt)
        except Exception as gen_err:
            if "429" in str(gen_err) or "ResourceExhausted" in type(gen_err).__name__:
                print(f"[AI WARNING] Quota exceeded for current model in predict. Rotating...")
                model = None
                model, err = get_model()
                if not model:
                     raise HTTPException(status_code=503, detail=f"Barcha AI modellar kivotasi tugadi: {err}")
                response = model.generate_content(prompt)
            else:
                raise gen_err
        try:
            text = response.text.strip()
        except ValueError:
            raise HTTPException(status_code=500, detail="Empty AI response")
        
        # Robust JSON extraction
        if "{" in text and "}" in text:
            start = text.find("{")
            end = text.rfind("}") + 1
            json_str = text[start:end]
        else:
            json_str = text
            
        import json
        import ast
        try:
            params = json.loads(json_str)
        except json.JSONDecodeError:
            try:
                # Fallback to ast.literal_eval for single quotes or trailing commas
                params = ast.literal_eval(json_str)
            except Exception as eval_e:
                print(f"[AI PREDICT JSON ERROR] {str(eval_e)}. String: {json_str}")
                raise HTTPException(status_code=500, detail="Invalid JSON format from AI")
                
        return {"params": params}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AI PREDICT ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail="Error predicting parameters")
