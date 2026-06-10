from io import BytesIO

import matplotlib.pyplot as plt
import numpy as np

from models.schemas import PatientData


def analyze_patient(data: PatientData):
    # Validatsiya
    if data.age < 2 or data.age > 120:
        raise ValueError("Yosh 2-120 oralig'ida bo'lishi kerak")
    if data.height < 50 or data.height > 250:
        raise ValueError("Bo'y 50-250 sm oralig'ida bo'lishi kerak")
    if data.weight < 3 or data.weight > 300:
        raise ValueError("Vazn 3-300 kg oralig'ida bo'lishi kerak")
    if data.chest < 50 or data.chest > 200:
        raise ValueError("Ko'krak aylanasi 50-200 sm oralig'ida bo'lishi kerak")
    if data.head < 40 or data.head > 70:
        raise ValueError("Bosh aylanasi 40-70 sm oralig'ida bo'lishi kerak")

    # Hisob-kitoblar
    ideal_weight = (data.height - 100) * 0.9
    weight_diff = data.weight - ideal_weight
    z_score = round(weight_diff / 10, 2)
    bmi = round(data.weight / ((data.height / 100) ** 2), 1)

    # BMI kategoriyasi
    if bmi < 18.5:
        bmi_category = "Past vazn"
    elif 18.5 <= bmi < 25:
        bmi_category = "Normal"
    elif 25 <= bmi < 30:
        bmi_category = "Ortiqcha vazn"
    else:
        bmi_category = "Semizlik"

    # Somatotip aniqlash
    if z_score < -1.5:
        somatotype = "ektomorf"
        general_advice = "Siz ektomorf tipsiz. Ovqatlanishingizda kaloriya va oqsil miqdorini oshirishingiz kerak."
    elif z_score > 1.5:
        somatotype = "endomorf"
        general_advice = "Siz endomorf tipsiz. Faollik darajangizni oshirish va yog'li ovqatlarni kamaytirish kerak."
    else:
        somatotype = "mezomorf"
        general_advice = "Siz mezomorf tipsiz. Jismoniy holatingiz yaxshi, muvozanatli ovqatlanishni davom ettiring."

    # Individual maslahatlar
    if z_score < -2:
        advices = {
            "general": general_advice,
            "specialist": "Endokrinolog va gastroenterolog",
            "nutrition": "Kuniga 5-6 marta kichik-kichik ovqatlaning. Oqsilli ovqatlar ko'proq iste'mol qiling.",
            "activity": "Haftada 3-4 marta kuch mashqlari. Yengil kardio (haftada 2-3 marta).",
            "checkups": "Qon tahlili (gemoglobin, vitamin D, temir), gormonal profil, ovqat hazm qilish tizimi tekshiruvi",
        }
    elif z_score > 2:
        advices = {
            "general": general_advice,
            "specialist": "Terapevt, dietolog va kardiolog",
            "nutrition": "Kuniga 3 asosiy ovqat va 2 ta snack. Kam yog'li ovqatlar iste'mol qiling.",
            "activity": "Kuniga 30-60 daqiqa kardio mashqlari. Haftada 2-3 marta kuch mashqlari.",
            "checkups": "Qon bosimi, qand diabeti, lipid profil, EKG, qon shakari tekshiruvlari",
        }
    else:
        advices = {
            "general": general_advice,
            "specialist": "Profilaktika shifokori",
            "nutrition": "Muvozanatli ovqatlanish (meva-sabzavot, don mahsulotlari, yog'siz go'sht).",
            "activity": "Kundalik 30 daqiqa yurish yoki suzish. Haftada 2-3 marta kuch mashqlari.",
            "checkups": "Yillik umumiy tekshiruv, qon tahlili, EKG",
        }

    return {
        "z_score": z_score,
        "somatotype": somatotype,
        "bmi": bmi,
        "bmi_category": bmi_category,
        "ideal_weight": round(ideal_weight, 1),
        "weight_diff": round(weight_diff, 1),
        "advices": advices,
    }


def create_full_analysis_charts(data):
    images = []

    age = data["age"]
    height = data["height"]
    weight = data["weight"]
    gender = data["gender"].lower()

    # Ideal vazn hisoblash
    if age <= 5:
        ideal_weight = 15
    elif age <= 10:
        ideal_weight = 2 * age + 8
    elif age <= 18:
        ideal_weight = 3 * age + 7
    else:
        ideal_weight = (height - 100) * (0.9 if gender == "erkak" else 0.85)

    # 1. Vazn taqqoslash
    fig1, ax1 = plt.subplots(figsize=(4, 3))
    ax1.bar(["Real", "Ideal"], [weight, ideal_weight], color=["blue", "green"])
    ax1.set_title("Vazn taqqoslash")
    ax1.set_ylabel("kg")
    ax1.grid(True)
    buf1 = BytesIO()
    plt.tight_layout()
    plt.savefig(buf1, format="png")
    plt.close(fig1)
    buf1.seek(0)
    images.append(buf1)

    # 2. Yosh bo‘yicha BMI (statik chiziqli grafik)
    ages = np.arange(3, 80, 1)
    bmi_val = weight / ((height / 100) ** 2)
    bmi_list = [bmi_val for _ in ages]

    fig2, ax2 = plt.subplots(figsize=(4, 3))
    ax2.plot(ages, bmi_list, label="Sizning BMI", color="purple")
    ax2.axhspan(18.5, 25, color="green", alpha=0.2, label="Normal BMI")
    ax2.set_title("Yosh bo‘yicha BMI")
    ax2.set_xlabel("Yosh")
    ax2.set_ylabel("BMI")
    ax2.legend()
    ax2.grid(True)
    buf2 = BytesIO()
    plt.tight_layout()
    plt.savefig(buf2, format="png")
    plt.close(fig2)
    buf2.seek(0)
    images.append(buf2)

    # 3. Ko‘krak va bosh aylanasi
    chest = data["chest"]
    head = data["head"]
    fig3, ax3 = plt.subplots(figsize=(4, 3))
    ax3.bar(["Ko‘krak", "Bosh"], [chest, head], color=["orange", "cyan"])
    ax3.set_title("Aylanalar taqqoslash")
    ax3.set_ylabel("sm")
    ax3.grid(True)
    buf3 = BytesIO()
    plt.tight_layout()
    plt.savefig(buf3, format="png")
    plt.close(fig3)
    buf3.seek(0)
    images.append(buf3)

    return images
