import sys
import os

# Add morphocheck_backend to sys.path
sys.path.append(os.path.join(os.getcwd(), "morphocheck_backend"))

try:
    from deep_translator import GoogleTranslator
    translator = GoogleTranslator(source='uz', target='ru')
    
    test_cases = [
        "O'zbek",
        "Tabiiy",
        "Toshkent viloyati",
        "Sog'lom",
        "Muassasaga qabul qilingan",
        "Xonobod qishlog'i",
    ]

    print("Starting deep_translator tests...")
    for input_str in test_cases:
        try:
            result = translator.translate(input_str)
            print(f"'{input_str}' -> '{result}'")
        except Exception as e:
            print(f"'{input_str}' -> ERROR: {str(e)}")
            
except ImportError:
    print("deep_translator not found in venv")
