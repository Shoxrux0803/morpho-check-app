
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=api_key)
    
    model_candidates = [
        'gemini-2.5-flash',
        'gemini-3-flash-preview',
        'gemini-2.0-flash', 
    ]
    
    for model_name in model_candidates:
        print(f"Trying model: {model_name}")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Hello")
            print(f"Success with {model_name}: {response.text}")
            return
        except Exception as e:
            print(f"Failed with {model_name}: {e}")

if __name__ == "__main__":
    test_gemini()
