# MorphoCheck v6.0 formula auditi

Sana: 2026-10-31. Natija: berilgan JSON va Excelning hisoblash qismi o‘zaro mos. Loyihadagi mualliflik indekslari v6.0 ga moslashtirildi.

## Tekshirilgan manbalar

- `MorphoCheck_MUALLIFLIK_INDEX_v6_0_CONFIG.json`: loyihaga aynan nusxalangan konfiguratsiya bilan mazmunan teng.
- `MorphoCheck_MUALLIFLIK_INDEX_v6_0_REFERENCE.xlsx`: 8 varaq, 366 WHO LMS qatori, 10 ichki regressiya qatori, 13 nazorat namunasi.
- Excelning 92 ta formulasi qayta hisoblandi: keshlangan qiymatlarga maksimal farq **0**. Bu tekshiruv havolalar, arifmetika, ABS, MIN, MAX va SUM uchun cheklangan AST hisoblagichi orqali bajarildi; Excel ilovasi ishga tushirilmadi.
- JSONdagi barcha 366 LMS yozuvi va 10 regressiyaning b0/b1/b2/SD qiymatlari Excel bilan teng. K, MCRI vaznlari, yosh markazi va yilga aylantirish konstantalari ham tekshirildi.
- 13 namunadagi oraliq Z qiymatlari, AM, GM va to‘rtta yakuniy indeks tekshirildi. Yakuniy indekslarning Excel manba ustunlariga maksimal farqi **5.6772364587232005 × 10⁻¹²**; qabul chegarasi **10⁻⁸**.
- Manba fayllarining SHA-256 qiymatlari va har bir namunaning xatoligi `index_v6_audit.json` faylida saqlangan.

Excel ichidagi oldindan yozilgan “2038/2038 PASS” matni mustaqil tekshiruv natijasi sifatida qabul qilinmadi. Berilgan faylda 2038 bolaning to‘liq kuzatuvlari yo‘q; mavjud 13 namuna qayta hisoblandi.

## Aniqlangan va tuzatilgan farqlar

| Qism | Loyihada avval | V6.0 dagi yakuniy hisoblash |
|---|---|---|
| HMAI | Taxminiy yosh normasi, sentil yo‘laklari farqi | WHO LMS asosidagi HAZ/WAZ/BAZ; AM va uzluksiz GM ning o‘rtachasi |
| MII | Yog‘ foizi, mushak/FFM sifati va suv qoldig‘i | Ichki referensdagi zFMI, zFFMI va ularning farqi |
| ADI | Yelka kengligi, ko‘krak, son va boldir nisbatlari; 0–8 | Son, boldir va yelka aylanasining bo‘yga nisbatlari logarifmi; 0–100 |
| MCRI | BMI va yog‘ning mutlaq og‘ishi, mushak foizi; eski ADI shkalasi | Musbat BAZ/FMI, manfiy FFMI, yangi ADI va teskari MII |
| Ichki referens | Taxminiy nisbat va diapazonlar | Jinsga xos kvadratik OLS: `(x−(b0+b1*t+b2*t²))/SD`, `t=(oy−60)/12` |
| WHO | Backendda taxminiy o‘rtacha/SD; frontendda boshqa jadval | V6 doirasida berilgan 366 LMS yozuvi; avval LMS interpolatsiyasi, keyin Z hisoblash |
| Chekka WAZ/BAZ | Frontendda oddiy LMS | ±3 SD dan tashqarida o‘lchov birliklarida chiziqli davom ettirish |
| Yosh | Ayrim yo‘llarda faqat butun yil; frontend kunlarida 30.44 | Indeksga yil, oy va `kun/30.4375` uzatiladi; research sanalaridan ham kasrli oy olinadi |
| Yetishmagan o‘lchov | Hisobiy tana tarkibi yoki 0 bilan almashtirish | Indeks faqat o‘zining haqiqiy kirishlari mavjud bo‘lsa hisoblanadi |
| Toifalar | Ayrim ballar og‘ir komponent sabab majburan pasaytirilgan | JSON chegaralari bevosita qo‘llanadi; QC bayrog‘i ball/toifani o‘zgartirmaydi |
| Tavsiyalar | Yuqori HMAI akseleratsiya deb talqin qilingan; sport chegaralari 0.8/0.3 | Eski kompozitga asoslangan diagnostik maslahatlar olib tashlandi; saqlangan sport shartlari 0–100 shkalaga moslandi |
| Hisobotlar | Eski hisob, eski kesh va metadata; PDFda MCRI yo‘q | Yangi hisob, v6 kesh kaliti/metadata, PDF/Wordda bo‘sh natija “—”, MCRI ko‘rsatiladi |
| Ilmiy sahifa | Ko‘rsatilgan formulalar hisoblash kodiga mos emas edi | To‘rtta v6 formula, kirishlar va shkala chegaralari yangilandi |

## Yakuniy formulalar va chegaralar

`K=3`, `d(z)=min(1,|z|/3)`, `R(x)=100*min(1,max(0,x)/3)`.

- `AM=100*(1−min(1,(|HAZ|+|BAZ|)/6))`.
- `GM=100*(1−min(1,|HAZ−WAZ|/3))`, `HMAI=(AM+GM)/2`.
- `MII=100*(1−(d(zFMI)+d(zFFMI)+d(zFMI−zFFMI))/3)`.
- `ADI=100*(d(zlnTh)+d(zlnCa)+d(zlnAr))/3`.
- `MCRI=0.30*R(BAZ)+0.30*R(zFMI)+0.20*R(−zFFMI)+0.10*ADI+0.10*(100−MII)`.

FMI=`(vazn−FFM)/(bo‘y_m²)`. FFMI=`FFM/(bo‘y_m²)`. Aylana logarifmlarida aylana va bo‘y bir xil birlikda — sm — olinadi. Indeks hisoblashda BMI oldindan bir xonagacha yaxlitlanmaydi. Hisobning ichki aniqligi saqlanib, interfeys va PDF/Wordda indeks ikki xona bilan ko‘rsatiladi.

| Indeks | Toifalar |
|---|---|
| HMAI, MII | `<40` past; `40–<60` chegaraviy; `60–<80` qoniqarli; `80–100` yuqori |
| ADI | `<37.5` mutanosib; `37.5–<75` o‘rtacha; `75–100` yuqori disproportsiya |
| MCRI | `<30` past; `30–<50` o‘rtacha; `50–<70` yuqori; `70–100` juda yuqori |

Bu modelning qo‘llanish doirasi **30–90 oy**, ikkala chegara ham kiradi. Doiradan tashqarida to‘rtta mualliflik indeksi `null` qaytaradi. Kengroq yoshlar uchun avvalgi umumiy skrining hisoblari alohida manba belgisi bilan qolgan; ular v6 indeksi sifatida ko‘rsatilmaydi.

## O‘lchovlar, QC va integratsiya

- MII faqat **o‘lchangan FFM** bilan hisoblanadi. Yog‘ foizi, suv yoki taxminiy mushakdan FFM yasab, indeksga kiritilmaydi. HMAI FFMga bog‘liq emas; ADI uchun uchta aylana kerak. MCRI barcha tegishli komponentlarni talab qiladi.
- Mustaqil FM qiymati `vazn−FFM` o‘rnini bosmaydi. Farq `>0.1 kg` bo‘lsa bayroq chiqadi.
- Bo‘y `<95 sm` va `|BAZ|>5` holatlari alohida bayroq oladi. Raw o‘lchovlar o‘zgartirilmaydi.
- Oddiy tahlilda FFM `bodyComposition.ffmMeasuredKg`, yelka aylanasi `shoulderCircumference` orqali uzatiladi. FFM maydoni formaga qo‘shildi.
- Research yozuviga `ffm_measured_kg` qo‘shildi: model, API, forma, import/export va schema yangilanishi mavjud. Yelka aylanasi mavjud `arm_circumference_total` maydonidan olinadi.
- Saqlangan tahlildan PDF/Word qayta tuzilganda FFM raw BIA yozuvidan olinadi; oy va kun hisobga olinadi. Hisobot Z qiymati qayta hisoblangan natijaga mos keladi.
- Brauzer kalkulyatori, o‘sish grafiklari va backend v6 yosh doirasida bir xil LMS manbasidan foydalanadi. Frontenddagi 366 qatorning backend konfiguratsiyasiga tengligi test bilan himoyalangan.

## Tekshiruvlar

- Backend: **171 test va 6 subtest o‘tdi**.
- Frontend: **3 test to‘plami, 7 test o‘tdi**.
- ESLint: o‘tdi.
- O‘zgartirilgan backend hisoblash/integratsiya fayllari va audit skripti uchun Ruff: o‘tdi.
- Frontend production build: o‘tdi. Bundlening umumiy hajmi bo‘yicha build ogohlantirishi bor.
- Git whitespace tekshiruvi: o‘tdi.

Testlar Excel nazorat qiymatlari, ikki jins, kasrli yosh, 30/60/60.5/61/90 oy, ±3 SD ekstrapolatsiyasi, yetishmagan/noto‘g‘ri FFM va aylanalar, QC chegaralari, toifa chegaralari, real patient/research hisoblash yo‘llari va additiv migratsiya takroran bajarilishini qamrab oladi.

## Ishga tushirish va audit chegarasi

Backendni yangi kod bilan qayta ishga tushirish kerak. `ensure_schema_updates()` mavjud `research_records` jadvaliga faqat yangi nullable FFM ustunini qo‘shadi. Alembic ishlatiladigan muhit uchun `d62d09a1b4c0` migratsiyasi ham tayyor. Migratsiya xotiradagi SQLite bazada sinovdan o‘tdi; ishlab turgan tashqi bazaga bu sessiyada alohida migratsiya buyrug‘i yuborilmadi.

Eski yozuvlar ommaviy qayta yozilmadi, yo‘q FFM kiritilmadi. Oldindan saqlangan umumiy statistikalar tarixiy qiymatlarni saqlashi mumkin; yangi hisoblash va qayta hosil qilingan hisobotlar v6 mexanizmidan foydalanadi.

Berilgan fayllarning o‘zi WHO jadvali manbasi, 60/61 oy o‘tishi va InBody 770S protokoli mustaqil tekshirilmaganini bildiradi. Ushbu audit **fayllarga matematik va dasturiy muvofiqlikni** tasdiqlaydi; WHO rasmiy manbasiga mustaqil moslik, qurilma protokoli va klinik validatsiyani tasdiqlamaydi.

Auditni qayta bajarish:

```powershell
venv/Scripts/python.exe scripts/audit_index_v6.py --config "C:/Users/user/Desktop/MorphoCheck_MUALLIFLIK_INDEX_v6_0_CONFIG.json" --reference "C:/Users/user/Desktop/MorphoCheck_MUALLIFLIK_INDEX_v6_0_REFERENCE.xlsx"
```
