
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"Testing API Key: {api_key[:10]}...")

GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
]

genai.configure(api_key=api_key)

for model_name in GEMINI_MODELS:
    try:
        print(f"Testing {model_name}...")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say hello")
        print(f"SUCCESS: {model_name} responded: {response.text}")
    except Exception as e:
        print(f"FAILED: {model_name} error: {str(e)}")
