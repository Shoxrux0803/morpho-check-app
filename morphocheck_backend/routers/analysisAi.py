from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import openai
import traceback
load_dotenv()
router = APIRouter()

openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("OPENAI_API_KEY muhit o'zgaruvchisi o'rnatilmagan")

client = openai.OpenAI(api_key=openai_api_key)

class AIAdviceRequest(BaseModel):
    age: int
    gender: str
    height: float
    weight: float
    bmi: float
    somatotype: str
    goal: str

@router.post("/analyze/ai-advices")
async def get_ai_advice(data: AIAdviceRequest):
    prompt = (
        f"Foydalanuvchi haqida ma'lumot: yosh {data.age}, jins: {data.gender}, bo'y: {data.height} sm, "
        f"vazn: {data.weight} kg, BMI: {data.bmi}, somatotip: {data.somatotype}. "
        f"Maqsad: {data.goal}. Iltimos, shu ma'lumotlarga mos aniq va foydali maslahatlar bering."
    )
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.7,
        )
        advice_text = response.choices[0].message.content.strip()
        return {"status": "success", "advice": advice_text}
    except Exception as e:
        error_message = traceback.format_exc()
        print(f"AI tavsiya olishda xato:\n{error_message}")
        raise HTTPException(status_code=500, detail=f"AI tavsiya olishda xato: {str(e)}")
