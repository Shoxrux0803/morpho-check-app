import sys
import os

# Add backend to path to import utils
sys.path.append('d:\\BOT\\morpho-check-app\\morphocheck_backend')

from utils.translit import cyr2lat

test_cases = {
    "Иззатилло Изланувчи-ўғли": "Izzatillo Izlanuvchi-o'g'li",
    "12-ихтисослаштирилган давлат мактаб-интернати": "12-ixtisoslashtirilgan davlat maktab-internati",
    "тошкент вилояти, Чирчиқ шаҳри": "toshkent viloyati, Chirchiq shahri",
    "Чирчиқ": "Chirchiq",
    "Ўзбек": "O'zbek",
    "туғилгандан буён шу ҳудудда": "tug'ilgandan buyon shu hududda",
    "аъло даражада (шахсий ҳовли, барча қулайликлар)": "a'lo darajada (shaxsiy hovli, barcha qulayliklar)",
    "кунлик дарслар ва спорт тўгараклари": "kunlik darslar va sport to'garaklari",
    "грипп (мавсумий), қизамиқ (2022-йилда)": "gripp (mavsumiy), qizamiq (2022-yilda)",
    "табиий (1.5 ёшгача она сути)": "tabiiy (1.5 yoshgacha ona suti)",
    "Яқин қариндош емас": "Yaqin qarindosh emas", # Note: 'е' in 'емас' is handled as 'e', which is fine.
    "соғлом, сурункали касалликлари ёъқ": "sog'lom, surunkali kasalliklari yo'q"
}

print("Testing cyr2lat transliteration:")
all_passed = True
for cyr, expected in test_cases.items():
    result = cyr2lat(cyr)
    if result.lower() == expected.lower():
        print(f"PASS: -> '{result}'")
    else:
        print(f"FAIL: Expected: '{expected}', Got: '{result}'")
        all_passed = False

if all_passed:
    print("\nAll tests passed successfully!")
else:
    print("\nSome tests failed.")
