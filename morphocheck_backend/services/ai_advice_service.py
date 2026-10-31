# morphocheck_backend/services/ai_advice_service.py

import os
import random
from typing import Dict, List, Optional

from google import genai

from utils.i18n import request_lang

# ─────────────────────────────────────────────────────────────────────────────
# ЭКСПЕРТНАЯ БАЗА ЗНАНИЙ (SCIENTIFIC TEMPLATES)
# ─────────────────────────────────────────────────────────────────────────────
EXPERT_TIPS_LIBRARY = {
    "nutrition": {
        "v_low": {
            "uz": [
                "Ratsion kaloriyasini oqsillar hisobiga oshiring.",
                "Menyoga foydali yog'lar va yong'oqlarni qo'shing.",
                "Tez-tez va kichik porsiyalarda ovqatlanishni tashkil qiling.",
            ],
            "ru": [
                "Увеличьте калорийность рациона за счет белков.",
                "Добавьте в меню полезные жиры и орехи.",
                "Организуйте частое питание небольшими порциями.",
            ],
            "en": [
                "Increase caloric intake with proteins.",
                "Add healthy fats and nuts to the menu.",
                "Organize frequent small meals.",
            ],
            "kz": [
                "Рацион калориясын ақуыздар есебінен арттырыңыз.",
                "Мәзірге пайдалы майлар мен жаңғақтар қосыңыз.",
                "Жиі және аз порциямен тамақтануды ұйымдастырыңыз.",
            ],
        },
        "low": {
            "uz": [
                "Sog'lom vazn yig'ish uchun oqsilli taomlarni ko'paytiring.",
                "Tabiiy sharbatlar va kalsiyga boy mahsulotlar bering.",
                "Ovqatlanish rejimiga qat'iy amal qiling.",
            ],
            "ru": [
                "Увеличьте потребление белка для здорового набора веса.",
                "Давайте натуральные соки и продукты, богатые кальцием.",
                "Строго соблюдайте режим питания.",
            ],
            "en": [
                "Increase protein intake for healthy weight gain.",
                "Provide natural juices and calcium-rich foods.",
                "Follow a strict meal schedule.",
            ],
            "kz": [
                "Салауатты салмақ қосу үшін ақуызды тағамдарды көбейтіңіз.",
                "Табиғи шырындар мен кальцийге бай өнімдер беріңіз.",
                "Тамақтану режимін қатаң сақтаңыз.",
            ],
        },
        "normal": {
            "uz": [
                "Oqsil, yog' va uglevodlar muvozanatini saqlang.",
                "Mavsumiy sabzavot va mevalar xilma-xilligini ta'minlang.",
                "Toza suv ichish rejimini nazorat qiling.",
            ],
            "ru": [
                "Поддерживайте баланс белков, жиров и углеводов.",
                "Обеспечьте разнообразие сезонных овощей и фруктов.",
                "Контролируйте режим питья чистой воды.",
            ],
            "en": [
                "Maintain balance of proteins, fats, and carbs.",
                "Ensure variety of seasonal fruits and vegetables.",
                "Monitor clean water intake regimen.",
            ],
            "kz": [
                "Ақуыз, май және көмірсулар тепе-теңдігін сақтаңыз.",
                "Маусымдық көкөністер мен жемістердің әртүрлілігін қамтамасыз етіңіз.",
                "Таза су ішу режимін бақылаңыз.",
            ],
        },
        "high": {
            "uz": [
                "Tez hazm bo'luvchi uglevodlar va shakarni cheklang.",
                "Kechki ovqatni uxlashdan 3 soat oldin rejalashtiring.",
                "Ratsionda kletchatka (sabzavotlar) miqdorini oshiring.",
            ],
            "ru": [
                "Ограничьте быстрые углеводы и добавленный сахар.",
                "Планируйте ужин за 3 часа до сна.",
                "Увеличьте количество клетчатки (овощей) в рационе.",
            ],
            "en": [
                "Limit fast carbs and added sugars.",
                "Plan dinner 3 hours before sleep.",
                "Increase fiber (vegetables) in the diet.",
            ],
            "kz": [
                "Тез қорытылатын көмірсулар мен қантты шектеңіз.",
                "Кешкі асты ұйықтаудан 3 сағат бұрын жоспарлаңыз.",
                "Рациондағы жасұнық (көкөністер) мөлшерін арттырыңыз.",
            ],
        },
        "v_high": {
            "uz": [
                "Fast-fud va gazli ichimliklarni butunlay cheklang.",
                "Porsiyalar hajmini nazorat qiling va sekin chaynashga o'rgating.",
                "Diyetolog mutaxassis bilan maslahatlashing.",
            ],
            "ru": [
                "Полностью исключите фастфуд и газировку.",
                "Контролируйте размер порций и учите тщательно жевать.",
                "Проконсультируйтесь с врачом-диетологом.",
            ],
            "en": [
                "Completely exclude fast food and sodas.",
                "Monitor portion sizes and encourage slow chewing.",
                "Consult a professional nutritionist.",
            ],
            "kz": [
                "Фастфуд пен газдалған сусындарды толығымен шектеңіз.",
                "Порция көлемін бақылаңыз және жақсылап шайнауға үйретіңіз.",
                "Диетолог маманмен кеңесіңіз.",
            ],
        },
    },
    "development": {
        "accel": {
            "uz": [
                "Jadal o'sish davrida kalsiy va D vitaminiga e'tibor bering.",
                "Suyak va mushak tizimini chiniqtirish mashqlarini bajaring.",
                "Uyqu davomiyligi kamida 8-9 soat bo'lishini ta'minlang.",
            ],
            "ru": [
                "В период активного роста важны кальций и витамин D.",
                "Выполняйте упражнения для укрепления костно-мышечной системы.",
                "Обеспечьте сон продолжительностью не менее 8-9 часов.",
            ],
            "en": [
                "Focus on Calcium and Vitamin D during growth spurts.",
                "Do exercises to strengthen the musculoskeletal system.",
                "Ensure at least 8-9 hours of sleep.",
            ],
            "kz": [
                "Қарқынды өсу кезеңінде кальций мен D дәруменіне назар аударыңыз.",
                "Сүйек-бұлшықет жүйесін шынықтыру жаттығуларын жасаңыз.",
                "Ұйқының кем дегенде 8-9 сағат болуын қамтамасыз етіңіз.",
            ],
        },
        "slow": {
            "uz": [
                "Immunitetni mustahkamlash va chiniqtirish muolajalarini o'tkazing.",
                "Toza havoda jismoniy faollikni 1-2 soatga oshiring.",
                "Rivojlanish dinamikasini mutaxassis bilan kuzatib boring.",
            ],
            "ru": [
                "Проводите процедуры по укреплению иммунитета и закаливанию.",
                "Увеличьте активность на свежем воздухе до 1-2 часов.",
                "Следите за динамикой развития вместе со специалистом.",
            ],
            "en": [
                "Perform immunity-boosting and hardening procedures.",
                "Increase outdoor activity to 1-2 hours daily.",
                "Monitor developmental dynamics with a specialist.",
            ],
            "kz": [
                "Иммунитетті нығайту және шынықтыру шараларын жүргізіңіз.",
                "Таза ауадағы белсенділікті 1-2 сағатқа арттырыңыз.",
                "Даму динамикасын маманмен бірге бақылаңыз.",
            ],
        },
        "harmonious": {
            "uz": [
                "Garmonik rivojlanishni suzish yoki gimnastika bilan qo'llab-quvvatlang.",
                "Ijodiy va intellektual yuklamalarni jismoniy faollik bilan navbatlang.",
                "Hozirgi sog'lom turmush tarzini davom ettiring.",
            ],
            "ru": [
                "Поддержите гармоничное развитие плаванием или гимнастикой.",
                "Чередуйте умственные нагрузки с физической активностью.",
                "Продолжайте текущий здоровый образ жизни.",
            ],
            "en": [
                "Support harmonious development with swimming or gymnastics.",
                "Alternate mental tasks with physical activity.",
                "Continue with the current healthy lifestyle.",
            ],
            "kz": [
                "Үйлесімді дамуды жүзу немесе гимнастикамен қолдаңыз.",
                "Интеллектуалды жүктемелерді дене белсенділігімен кезектестіріңіз.",
                "Қазіргі салауатты өмір салтын жалғастырыңыз.",
            ],
        },
    },
    "risk": {
        "metabolic": {
            "uz": [
                "Shakar iste'molini minimal darajaga tushiring.",
                "Muntazam ravishda qon bosimi va qand miqdorini tekshiring.",
                "Faol harakatli o'yinlarni kun tartibiga kiriting.",
            ],
            "ru": [
                "Снизьте потребление сахара до минимума.",
                "Регулярно проверяйте давление и уровень сахара.",
                "Включите активные подвижные игры в режим дня.",
            ],
            "en": [
                "Minimize sugar consumption.",
                "Regularly check blood pressure and sugar levels.",
                "Include active games in the daily routine.",
            ],
            "kz": [
                "Қант тұтынуды минимумға дейін азайтыңыз.",
                "Қан қысымы мен қант мөлшерін үнемі тексеріп тұрыңыз.",
                "Күн тәртібіне белсенді қозғалыс ойындарын енгізіңіз.",
            ],
        },
        "musculoskeletal": {
            "uz": [
                "Qomatni to'g'ri tutish (osanka) mashqlarini bajaring.",
                "Og'ir yuk ko'tarishdan va uzoq vaqt o'tirishdan saqlaning.",
                "Ortopedik poyabzal va qulay ish joyini ta'minlang.",
            ],
            "ru": [
                "Выполняйте упражнения для коррекции осанки.",
                "Избегайте поднятия тяжестей и долгого сидения.",
                "Обеспечьте ортопедическую обувь и удобное место.",
            ],
            "en": [
                "Do posture correction exercises.",
                "Avoid lifting heavy weights and prolonged sitting.",
                "Ensure orthopedic shoes and a comfortable workspace.",
            ],
            "kz": [
                "Сымбаттылықты (осанка) түзету жаттығуларын жасаңыз.",
                "Ауыр жүк көтеруден және ұзақ отырудан аулақ болыңыз.",
                "Ортопедиялық аяқ киім мен ыңғайлы жұмыс орнын қамтамасыз етіңіз.",
            ],
        },
    },
}

for _section in EXPERT_TIPS_LIBRARY.values():
    for _item in _section.values():
        if "tm" not in _item:
            _item["tm"] = _item.get("uz", [])
        if "tr" not in _item:
            _item["tr"] = _item.get("uz", [])
GEMINI_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
]


def get_gemini_client():
    """Returns a client for the supported Google Gen AI SDK."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"[AI ERROR] Failed to configure Gemini client: {str(e)}")
        return None


def get_expert_tips(
    patient_data: Dict, ml_predictions: Dict, lang: Optional[str] = None
) -> List[str]:
    """
    Выбирает 3 совета из экспертной библиотеки на основе данных анализа.
    Работает мгновенно.
    """
    tips = []
    active_lang = lang or request_lang.get() or "uz"
    language = (
        active_lang if active_lang in ["uz", "ru", "en", "kz", "tm", "tr"] else "uz"
    )

    # 1. Совет по питанию (на основе ИМТ / Z-score)
    z = patient_data.get("z_score", 0)
    if z < -2:
        cat = "v_low"
    elif z < -1:
        cat = "low"
    elif z <= 1:
        cat = "normal"
    elif z <= 2:
        cat = "high"
    else:
        cat = "v_high"

    nutr_options = EXPERT_TIPS_LIBRARY["nutrition"].get(
        cat, EXPERT_TIPS_LIBRARY["nutrition"]["normal"]
    )[language]
    tips.append(random.choice(nutr_options))

    # 2. Совет по развитию (на основе адаптации или возраста)
    dev_cat = "harmonious"
    if abs(z) > 1.5:
        dev_cat = "slow" if z < 0 else "accel"

    dev_options = EXPERT_TIPS_LIBRARY["development"].get(
        dev_cat, EXPERT_TIPS_LIBRARY["development"]["harmonious"]
    )[language]
    tips.append(random.choice(dev_options))

    # 3. Совет по рискам (на основе ML прогнозов)
    risks = ml_predictions.get("risks", {})
    metabolic = risks.get("metabolic_syndrome_risk", 0)
    musculo = risks.get("musculoskeletal_risk", 0)

    if metabolic > 40:
        risk_tips = EXPERT_TIPS_LIBRARY["risk"]["metabolic"][language]
    elif musculo > 40:
        risk_tips = EXPERT_TIPS_LIBRARY["risk"]["musculoskeletal"][language]
    else:
        risk_tips = EXPERT_TIPS_LIBRARY["nutrition"]["normal"][language]

    tips.append(random.choice(risk_tips))

    return tips[:3]


def generate_parent_tips(
    patient_data: Dict, ml_predictions: Dict, lang: Optional[str] = None, use_ai: bool = False
) -> List[str]:
    """
    Генерирует 3 совета для родителей.
    По умолчанию использует мгновенные экспертные шаблоны.
    Если use_ai=True и есть ключ, пытается использовать Gemini.
    """
    active_lang = lang or request_lang.get() or "uz"

    # 1. Всегда сначала готовим экспертные советы (мгновенно)
    expert_tips = get_expert_tips(patient_data, ml_predictions, active_lang)

    # 2. Если ИИ не требуется или ключа нет — возвращаем шаблоны сразу
    if not use_ai or not os.getenv("GEMINI_API_KEY"):
        print("[AI TIPS INFO] Using Expert Templates (Fast Mode)")
        return expert_tips

    # 3. Попытка использовать ИИ (если явно запрошено)
    age = patient_data.get("age", 0)
    gender = patient_data.get("gender", "unknown")
    bmi = patient_data.get("bmi", 0)
    z_score = patient_data.get("z_score", 0)
    risks = ml_predictions.get("risks", {})

    prompt = f"""
    Act as a professional pediatric anthropometrist.
    Based on the following data for a {age}-year-old {gender} child, provide exactly 3 ultra-short advice/tips for their parents.
    DATA: BMI {bmi}, Z-Score {z_score}, Risks: Metabolic {risks.get("metabolic_syndrome_risk") or 0}%, Musculoskeletal {risks.get("musculoskeletal_risk") or 0}%
    INSTRUCTIONS: Respond in {active_lang.upper()}. 3 bullet points. Max 5-7 words per point. Practical and positive. No jargon. Return ONLY list.
    """

    client = get_gemini_client()
    if client is None:
        return expert_tips

    for model_name in GEMINI_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            if (
                not response
                or not getattr(response, "candidates", None)
                or not response.candidates
            ):
                continue
            text = response.text.strip()
            ai_tips = []
            for line in text.split("\n"):
                line = line.strip().lstrip("•-0123456789.() ").strip()
                if line:
                    ai_tips.append(line)

            if ai_tips:
                print(f"[AI TIPS SUCCESS] Tips generated using {model_name}")
                return ai_tips[:3]
        except Exception:
            continue

    # Fallback to expert tips if AI failed
    print("[AI TIPS WARNING] AI failed, falling back to Expert Templates")
    return expert_tips
