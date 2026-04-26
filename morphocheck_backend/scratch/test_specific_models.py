
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

models_to_test = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest"
]

for model_name in models_to_test:
    try:
        print(f"Testing {model_name}...")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say hello")
        print(f"SUCCESS: {model_name} responded: {response.text}")
    except Exception as e:
        print(f"FAILED: {model_name} error: {str(e)}")
