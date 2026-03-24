import math
from typing import Dict, Any

def get_ideal_height_by_age_and_gender(age: int, gender: str) -> float:
    gender = (gender or "").strip().lower()
    # WHO-ga yaqinlashgan o'rtacha bo'y (sm)
    boys_heights = {
        2: 87.8, 3: 96.1, 4: 103.3, 5: 110.0, 6: 116.0, 7: 121.7, 8: 127.3, 9: 132.6,
        10: 137.8, 11: 143.1, 12: 149.1, 13: 156.0, 14: 163.8, 15: 170.1, 16: 173.4,
        17: 175.2, 18: 176.1
    }
    girls_heights = {
        2: 86.4, 3: 95.1, 4: 102.7, 5: 109.4, 6: 115.1, 7: 120.8, 8: 126.6, 9: 132.5,
        10: 138.6, 11: 145.0, 12: 151.2, 13: 157.1, 14: 160.4, 15: 162.1, 16: 163.1,
        17: 163.5, 18: 163.7
    }

    if age <= 18:
        if "erkak" in gender or "o'g'il" in gender or "ogil" in gender:
            return boys_heights.get(age, 110.0)
        else:
            return girls_heights.get(age, 109.0)
    
    # Kattalar uchun (taxminiy)
    return 175.0 if "erkak" in gender else 165.0

def get_fm_percent_norm(age: int, gender: str) -> tuple:
    """Yoshga va jinsga qarab yog' foizi normasini (past, baland) qaytaradi."""
    gender = (gender or "").lower()
    is_male = "erkak" in gender or "o'g'il" in gender or "ogil" in gender
    
    # WHO/Pediatrik referans (taxminiy)
    # format: age -> (min, max)
    boys_fm = {
        2: (12, 21), 3: (12, 21), 4: (12, 21), 5: (11, 20), 6: (11, 20),
        7: (10, 20), 8: (10, 20), 9: (10, 21), 10: (11, 22), 11: (11, 23),
        12: (11, 23), 13: (11, 23), 14: (11, 23), 15: (11, 23), 16: (11, 23),
        17: (11, 23), 18: (11, 23)
    }
    girls_fm = {
        2: (13, 23), 3: (13, 23), 4: (13, 23), 5: (13, 23), 6: (13, 23),
        7: (12, 24), 8: (12, 24), 9: (13, 25), 10: (14, 26), 11: (15, 27),
        12: (16, 28), 13: (17, 29), 14: (18, 30), 15: (19, 31), 16: (20, 32),
        17: (20, 32), 18: (21, 33)
    }
    
    table = boys_fm if is_male else girls_fm
    age_key = min(max(age, 2), 18)
    return table.get(age_key, (10, 25))

def calculate_detailed_indices(
    age: int, 
    gender: str, 
    height: float, 
    weight: float, 
    bmi: float,
    manual_data: Dict[str, Any] = None
) -> Dict[str, Any]:
    gender_norm = (gender or "").strip().lower()
    is_male = "erkak" in gender_norm or "o'g'il" in gender_norm or "ogil" in gender_norm
    m = manual_data or {}

    # 1. Ideal ko'rsatkichlarni olish
    ideal_h = get_ideal_height_by_age_and_gender(age, gender_norm)
    # Soddalashtirilgan ideal vazn
    if age <= 18:
        if is_male:
            boys_weights = {
                3: 14.3, 4: 16.3, 5: 18.3, 6: 20.5, 7: 22.9, 8: 25.6, 9: 28.5,
                10: 31.9, 11: 35.6, 12: 39.9, 13: 45.3, 14: 50.8, 15: 56.5, 16: 61.5,
                17: 66.0, 18: 70.3
            }
            ideal_w = boys_weights.get(age, 20.0)
        else:
            girls_weights = {
                3: 13.9, 4: 15.7, 5: 17.6, 6: 19.7, 7: 22.0, 8: 24.5, 9: 27.2,
                10: 30.1, 11: 33.4, 12: 37.0, 13: 41.1, 14: 45.3, 15: 49.1, 16: 52.1,
                17: 54.4, 18: 56.0
            }
            ideal_w = girls_weights.get(age, 19.0)
    else:
        ideal_w = (height - 100) * (0.9 if is_male else 0.85)

    ideal_bmi = ideal_w / ((ideal_h / 100) ** 2)

    # 2. Body Composition
    # TBW (Total Body Water)
    if m.get("total_body_water") is not None:
        tbw = float(m["total_body_water"])
    else:
        if is_male:
            if height > 132.7:
                tbw = -21.993 + (0.406 * weight) + (0.209 * height)
            else:
                tbw = -1.927 + (0.465 * weight) + (0.045 * height)
        else:
            if height > 110.8:
                tbw = -10.313 + (0.252 * weight) + (0.154 * height)
            else:
                tbw = 0.076 + (0.507 * weight) + (0.013 * height)
    
    # Soddalashtirilgan ideal TBW
    ideal_tbw = 0.61 * ideal_w if is_male else 0.58 * ideal_w

    # FFM (Fat-Free Mass) va FM (Fat Mass)
    ffm = tbw / 0.732
    
    if m.get("fat_mass") is not None:
        fm = float(m["fat_mass"])
    else:
        fm = max(0, weight - ffm)
        
    ffm_percent = (ffm / weight) * 100 if weight > 0 else 0
    
    if m.get("fat_percent") is not None:
        fm_percent = float(m["fat_percent"])
    else:
        fm_percent = (fm / weight) * 100 if weight > 0 else 0

    # 3. Additional Bioimpedance Parameters
    if m.get("muscle_mass") is not None:
        muscle_mass = float(m["muscle_mass"])
    else:
        muscle_mass = ffm * 0.8  # muscle mass is ~80% of lean mass
        
    if m.get("bone_mass") is not None:
        bone_mass = float(m["bone_mass"])
    else:
        bone_mass = ffm * 0.15   # skeletal weight is ~15% of lean mass
        
    if m.get("acm") is not None:
        acm = float(m["acm"])
    else:
        acm = tbw * 0.55         # Active Cell Mass is ~55% of TBW
        
    if m.get("visceral_fat") is not None:
        visceral_fat = float(m["visceral_fat"])
    else:
        visceral_fat = 1.0       # Standard for children/adolescents (Level 1-4 is normal)

    # Norm ranges
    low_fm, high_fm = get_fm_percent_norm(age, gender_norm)
    fm_norm_str = f"{low_fm}-{high_fm}%"
    
    # FM kg norm (WHO standards proxy)
    fm_kg_low = round(weight * (low_fm / 100), 1)
    fm_kg_high = round(weight * (high_fm / 100), 1)
    fm_kg_norm_str = f"{fm_kg_low}-{fm_kg_high} кг"
    fm_norm = fm_norm_str

    tbw_min, tbw_max = (60.0, 70.0) if is_male else (55.0, 65.0)
    tbw_norm_str = f"{int(tbw_min)}-{int(tbw_max)}%"
    
    muscle_min, muscle_max = (35.0, 45.0) if is_male else (30.0, 40.0)
    muscle_norm_str = f"{int(muscle_min)}-{int(muscle_max)}%"
    
    bone_norm = "4-6%"
    acm_norm = "50-60%"
    visceral_norm = "1-4"
    visceral_max = 4.0

    # 4. Z-scores calculation (WHO 2007 reference approximations)
    # Using approx Standard Deviations based on WHO LMS tables
    sd_h = 4.0 + (age * 0.2)   # approx SD for height (5-7y: ~5.0)
    sd_w = ideal_w * 0.14 if ideal_w > 0 else 1.0 # approx SD for weight (~14-16% of mean)
    sd_bmi = 1.4              # approx SD for BMI for children 5-10y
    sd_tbw = ideal_tbw * 0.1 if ideal_tbw > 0 else 1.0

    z_h = round((height - ideal_h) / sd_h, 2)
    z_w = round((weight - ideal_w) / sd_w, 2)
    z_bmi = round((bmi - ideal_bmi) / sd_bmi, 2)
    z_tbw = round((tbw - ideal_tbw) / sd_tbw, 2)

    # 5. Main Indices
    hmai = round((z_h + z_w + z_bmi + z_tbw) / 4, 2)
    mii = round((ffm / (fm + 1.0)) * (height / weight), 2) if weight > 0 else 0
    adi = round(abs(z_h) + abs(z_w) + abs(z_bmi), 2)

    # Interpretation
    if abs(hmai) <= 0.5:
        hmai_desc = "муҳитга оптимал морфологик мослашув"
    elif hmai > 0.5:
        hmai_desc = "акселерация / юқори морфологик ривожланиш"
    else:
        hmai_desc = "адаптацион стресс ёки кечиккан ривожланиш"

    if mii > 2.5:
        mii_desc = "юқори соматик компонентлар яхши интеграциялашган"
    elif 1.5 <= mii <= 2.5:
        mii_desc = "ўрта нормал морфологик баланс"
    else:
        mii_desc = "паст морфологик дисбаланс"

    if adi <= 1:
        adi_desc = "гармоник ривожланиш"
    elif 1 < adi <= 2:
        adi_desc = "ўртача дисгармония"
    else:
        adi_desc = "юқори дисгармония"

    # 6. Morphological and Biological assessment
    if z_bmi < -1.0:
        morphological_type = "astenik"
    elif z_bmi > 1.0:
        morphological_type = "giperstenik"
    else:
        morphological_type = "normostenik"

    if -1.0 <= z_h <= 1.0:
        biological_age_status = "mos"
    else:
        biological_age_status = "mos_emas"

    if z_h > 1.0:
        secular_trend = "mavjud"
    else:
        secular_trend = "yoq"

    # 7. Personalized Advice for parents (Uzbek Latin)
    advice = []
    
    # HMAI (Adaptation)
    if hmai > 0.8:
        advice.append("Bolada juda jadal o'sish va rivojlanish jarayoni (akseleratsiya) kuzatilmoqda. Bu davrda suyak va muskul tizimini qo'llab-quvvatlash uchun oqsil, kalsiy (sut mahsulotlari) va D vitamini juda muhim.")
    elif hmai > 0.5:
        advice.append("Bolada o'sish sur'atlari yuqori. Ratsionda vitamin va minerallar miqdorini oshirish, jismoniy faollikni muvofiqlashtirish tavsiya etiladi.")
    elif hmai < -0.8:
        advice.append("Organizmda adaptatsion stress yoki rivojlanishdan biroz ortda qolish belgilari bor. Bolaning uyqu rejimi, toza havoda sayr qilishi va ruhiy xotirjamligiga alohida e'tibor bering.")
    elif hmai < -0.5:
        advice.append("Adaptatsiya jarayoni biroz sustlashgan. Immunitetni mustahkamlash, chiniqtirish muolajalari va to'g'ri dam olishni tashkil qiling.")
    else:
        advice.append("Bolaning tashqi muhitga moslashuvi (adaptatsiyasi) me'yorda. Hozirgi sog'lom turmush tarzini davom ettiring.")

    # MII (Integration)
    if mii < 1.0:
        advice.append("Tana komponentlari o'rtasida kuchli nomutanosiblik (disbalans) sezilmoqda. Maxsus jismoniy mashqlar kompleksi va mutaxassis maslahati zarur.")
    elif mii < 1.5:
        advice.append("Morfologik balans biroz buzulgan. Jismoniy faollikni oshirish (suzish, gimnastika) va oqsilga boy taomlar (go'sht, tuxum, dukkaklilar) iste'molini ko'paytiring.")
    elif mii > 3.0:
        advice.append("Tana tuzilishi komponentlari juda yaxshi integratsiyalashgan, jismoniy rivojlanish darajasi yuqori.")

    # ADI (Disharmony)
    if adi > 3.0:
        advice.append("Rivojlanishda yuqori darajadagi disgarmoniya (nomuvofiqlik) aniqlandi. Pediatr, endokrinolog ko'rigidan o'tish tavsiya etiladi.")
    elif adi > 2.0:
        advice.append("Rivojlanishda o'rtacha disgarmoniya kuzatilmoqda. Bo'y va vazn o'zgarishini muntazam kuzatib boring va ovqatlanishni me'yorlashtiring.")
    elif adi <= 1.0:
        advice.append("Bolaning rivojlanishi garmonik (mutanosib) holatda.")

    # BMI (Vazn holati)
    if z_bmi < -2.0:
        advice.append("⚠️ Bolada vazn tanqisligi (juda kam vazn) yuqori darajada. Bu o'sish va rivojlanishga salbiy ta'sir qilishi mumkin. Kaloriyaga va oqsilga boy taomlar bilan birga endokrinolog ko'rigi tavsiya etiladi.")
    elif z_bmi < -1.0:
        advice.append("⚠️ Bolada vazn yetishmovchiligi sezilmoqda. Kunlik ratsionda energiya miqdorini oshirish, tez-tez va to'yimli ovqatlantirish zarur.")
    elif z_bmi > 2.0:
        advice.append("⚠️ Bolada vazn me'yordan ancha yuqori (semizlik). Shirinliklar, xamir ovqatlar va fast-fudlarni cheklash, faol harakat rejimini kuchaytirish shart.")
    elif z_bmi > 1.0:
        advice.append("⚠️ Bolada vazn biroz ortiqcha. Ovqatlanishda ratsionni muvozanatlashtirish va jismoniy mashg'ulotlarni ko'paytirish tavsiya etiladi.")

    # Somatotip (Tana tuzilishi)
    if morphological_type == "astenik":
        advice.append("🎨 Bolaning tana tuzilishi bilan bog'liq (astenik tur): moddalar almashinuvi juda tez. Mushaklarni mustahkamlash uchun kuch mashqlari va oqsilga boy parhez juda muhim.")
    elif morphological_type == "giperstenik":
        advice.append("🎨 Bolaning tana tuzilishi (giperstenik tur): vazn to'plashga moyillik bor. Faol jismoniy harakatlar (yugurish, suzish) va kamroq uglevod iste'moli sog'liqni saqlashga yordam beradi.")
    else:
        advice.append("🎨 Bolaning tana tuzilishi (normostenik) mutanosib rivojlanmoqda. Holatni saqlab qolish uchun muvozanatli ovqatlanish rejimiga amal qiling.")

    # Bioimpedance parameters
    fm_p = (fm / weight) * 100 if weight > 0 else 0
    if fm_p > high_fm:
        advice.append("Tanada yog' miqdori me'yordan yuqori. Shirinliklar, gazli ichimliklar va xamir ovqatlarni cheklab, ko'proq sabzavotlar va mevalar bering.")
    elif fm_p < low_fm:
        advice.append("Tana yog' massasi normadan past. Ratsionda sog'lom yog'lar (yong'oqlar, zaytun moyi) miqdorini biroz oshirish tavsiya etiladi.")
    
    m_p = (muscle_mass / weight) * 100 if weight > 0 else 0
    if m_p < muscle_min:
        advice.append("Mushak massasi yetarli emas. Bolaning jismoniy faolligini (sport to'garaklari) va oqsilli taomlar iste'molini oshirish lozim.")

    tbw_p = (tbw / weight) * 100 if weight > 0 else 0
    if tbw_p < tbw_min:
        advice.append("Organizmda suv miqdori (gidratatsiya) kam. Kun davomida ko'proq toza suv ichish tartibiga rioya qiling.")

    if visceral_fat > visceral_max:
        advice.append("Ichki (visseral) yog' miqdori yuqori. Bu kelajakda moddalar almashinuvi buzilishiga olib kelishi mumkin. Sog'lom parhez va kardio mashqlar zarur.")

    return {
        "z_h": z_h,
        "z_w": z_w,
        "z_bmi": z_bmi,
        "z_tbw": z_tbw,
        "tbw": round(tbw, 1),
        "tbw_percent": round((tbw / weight) * 100, 1) if weight > 0 else 0,
        "tbw_norm": tbw_norm_str,
        "ffm": round(ffm, 1),
        "fm": round(fm, 1),
        "fm_percent": round(fm_percent, 1),
        "fm_norm": fm_norm,
        "fm_kg_norm": fm_kg_norm_str,
        "muscle_mass": round(muscle_mass, 1),
        "muscle_norm": muscle_norm_str,
        "bone_mass": round(bone_mass, 1),
        "bone_norm": bone_norm,
        "acm": round(acm, 1),
        "acm_percent": round((acm / tbw) * 100, 1) if tbw > 0 else 0,
        "acm_norm": acm_norm,
        "visceral_fat": visceral_fat,
        "visceral_norm": visceral_norm,
        "hmai": hmai,
        "hmai_desc": hmai_desc,
        "mii": mii,
        "mii_desc": mii_desc,
        "adi": adi,
        "adi_desc": adi_desc,
        "morphological_type": morphological_type,
        "biological_age_status": biological_age_status,
        "secular_trend": secular_trend,
        "advice": advice
    }

