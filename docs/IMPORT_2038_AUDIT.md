# 2038 yozuvli fayl importi va yosh birligi auditi

Tekshirilgan fayl: `DSc_2038_YAGONA_VALIDATSIYA_TOZALANGAN_2026.xlsx`.

## Xatoning aniq sababi

Faylda 12 ta varaq bor. Excelda saqlangan faol varaq — `02_WHO_2038_ҚИЁС`. Asosiy individual ma’lumotlar esa `01_2038_АСОСИЙ` varag‘ida joylashgan.

Oldingi admin importi `wb.active` varag‘ini olgan. Sarlavhalarni tanimaganida, ustunlarni eski import shabloni tartibiga avtomatik bog‘lagan. Natijada WHO qiyoslash ustunlari bemorning yoshi va tana o‘lchovlari deb talqin qilingan.

| Xato maydon | Aslida o‘qilgan ustun | Misol |
|---|---|---|
| `age` | `Қўлланилган WHO` | `WHO2006` |
| `height` | `WAZ ΔZ` | `0.0009484979751910316` |
| `waist` | `BAZ ΔZ` | `−0.00011287431166340234` |
| `head` | `WHO мослиги` | `\|ΔZ\|<0,004` |

Bu qiymatlar fayldagi noto‘g‘ri bo‘y yoki bel o‘lchovlari emas. Ular boshqa maqsaddagi ustunlardan olingan. Skrinshotdagi xatolar aynan shu yo‘l bilan qayta hosil qilindi.

## Asosiy varaq tekshiruvi

- 2038 qator, 2038 noyob ID; takrorlangan ID yo‘q.
- 1031 o‘g‘il va 1007 qiz.
- 5 hudud: Zarbdor 310, Jizzax shahri 765, G‘allaorol 330, Do‘stlik 288, Baxmal 345.
- Yosh: **36–80.9527721 oy**. Bu ustun yil yoki yilga qo‘shiladigan 0–11 oy qoldig‘i emas.
- Bo‘y: 84.98–130.2 sm; vazn: 9.37–29.2 kg.
- Asosiy, WHO qiyoslash, BIA arxivi va asimmetriya varaqlaridagi ID to‘plamlari teng.
- Faylda Excel xato tipidagi (`#REF!`, `#VALUE!` va boshqalar) katak topilmadi. Bu tekshiruv barcha mumkin bo‘lgan metodologik yoki qurilma xatolarini istisno qilmaydi.
- Barcha 2038 qator uchun BMI va `FM = vazn − FFM` tengligi qayta hisoblanganda farq **0**. PBF bo‘yicha maksimal farq taxminan `7.1×10⁻¹⁵`.
- 292 yozuvda bo‘y 95 sm dan past, 7 yozuvda `|BAZ|>5`. Bular importdagi ustun almashishi xatosidan alohida sifat bayroqlari.

V6 konfiguratsiyasi bilan barcha 2038 yozuv qayta solishtirildi. HAZ va ADI farqi `10⁻⁸` dan kichik. WAZ, BAZ, HMAI, MII va MCRI uchun kichik tafovutlar bor: eng katta farq MII da taxminan **1.31×10⁻⁶**. Barcha tekshirilgan natijalar `10⁻⁵` chegarasida mos, ammo hammasi `10⁻⁸` chegarasida aynan teng emas. Bu kichik tafovutlarning kelib chiqishi alohida tasdiqlanmagan; ular skrinshotdagi import xatolariga sabab bo‘lmagan. Qatorlar bo‘yicha jami tafovutlar va manba SHA-256 qiymati `import_2038_source_audit.json` da berilgan.

## Hali yetishmayotgan ma’lumotlar

Asosiy varaqda admin bemor yozuvi uchun talab qilinadigan quyidagi ustunlar yo‘q:

1. F.I.Sh. — maxfiylik rejimiga qarab talab qilinadi.
2. Ko‘krak aylanasi.
3. Bel aylanasi.
4. Bosh aylanasi.

Shuning uchun faylni mavjud ko‘rinishida to‘liq admin bemor yozuvlariga aylantirish hali mumkin emas. Bu o‘lchovlar son, boldir yoki yelka aylanasidan chiqarib olinmaydi va 0 yoki taxminiy son bilan to‘ldirilmadi. To‘liq admin importi uchun ularni asl qaydlardan ID bo‘yicha birlashtirish kerak. Ushbu sessiyada 2038 yozuv ishlab turgan bazaga import qilinmadi.

## Dasturdagi o‘zgarishlar

- Import endi ustunlarni **sarlavha nomi** orqali moslaydi; noma’lum jadvalga eski pozitsion shablonni qo‘llamaydi.
- Faol varaq noto‘g‘ri bo‘lsa, yagona mos ma’lumotlar varag‘i aniqlanadi. Standart shablonda `Маълумотлар` varag‘i `Намуна`dan ustun qo‘yiladi.
- Takrorlangan sarlavhalar va yetishmagan majburiy ustunlar fayl darajasida aniq xabar bilan qaytariladi.
- Ushbu fayl uchun endi `01_2038_АСОСИЙ` nomi va aynan yetishmagan to‘rtta ustun ko‘rsatiladi. `WHO2006`ni yosh deb tekshirish bosqichiga o‘tilmaydi.
- `Ёш (ой)` umumiy oy sifatida qabul qilinadi. Yangi import shablonida yosh bitta umumiy oy ustunidan iborat. Eski yil/oy/kun sarlavhalari hamon alohida ma’noda qabul qilinadi.
- `47.788501` kabi kasrli oy `age_total_months` maydonida aniq saqlanadi; oldingi yil/oy/kun maydonlari bilan aralashtirilmaydi. Hisoblashlar shu aniq qiymatni oladi.
- XLSX eksportida yosh ustuni `Ёш (ой)` / `Age (months)` deb belgilanadi va raqam sifatida yoziladi. Tahlil formasida, natija va admin jadvalida yosh oyda ko‘rsatiladi.
- O‘lchangan FFM uchun import sarlavhasi ham taniladi va BIA raw maydonida `source=imported` bilan saqlanadi. Bu uning qurilma protokoli mustaqil tasdiqlanganini bildirmaydi.

## Tekshiruv va ishga tushirish

- Backend: **193 test va 6 subtest o‘tdi**.
- Frontend: **9 test o‘tdi**.
- ESLint, tegishli backend fayllari uchun Ruff va production build o‘tdi.
- Haqiqiy import funksiyasi xotiradagi sinov bazasida tekshirildi: noto‘g‘ri faol varaq o‘rniga mos asosiy varaq olindi; `47.788501` oy va o‘lchangan FFM saqlanib, hisoblashga qayta uzatildi. Haqiqiy XLSX eksport funksiyasi ham tekshirildi: shu yosh `Age (months)` ustunida aniq raqam sifatida qaytdi. Migratsiya eski yil qiymatini saqlashi va takroriy ishga tushishi tekshirildi.

Backendni qayta ishga tushirish kerak: startup mavjud bemorlar jadvaliga yangi nullable `age_total_months` ustunini qo‘shadi. Alembic muhitlari uchun `e72e10b2c5d1` migratsiyasi tayyor. Eski yozuvlarning yil qiymatlari oy deb qayta talqin qilinmaydi.
