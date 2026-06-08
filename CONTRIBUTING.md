# Loyihaga hissa qo'shish

MorphoCheck Pro loyihasiga hissa qo'shmoqchi bo'lganingiz uchun rahmat. Ushbu qo'llanma yangi dasturchilarga loyihani lokal ishga tushirish, o'zgarish kiritish va tekshiruvdan o'tkazishda yordam beradi.

## Ishni boshlash

Kerakli vositalar:

- Node.js 18 yoki undan yuqori
- npm 9 yoki undan yuqori
- Python 3.11 yoki undan yuqori
- Docker va Docker Compose, agar konteyner orqali ishlatmoqchi bo'lsangiz

Repozitoriyani klonlagandan keyin konfiguratsiya fayllarini yarating:

```powershell
Copy-Item .env.example .env
Copy-Item morphocheck_backend\.env.example morphocheck_backend\.env
```

Maxfiy kalitlar, lokal baza fayllari, yuklangan fayllar va boshqa runtime ma'lumotlarni Git'ga qo'shmang.

## Frontend

Frontend React, CRACO, Material UI va Tailwind CSS asosida yozilgan.

```powershell
npm install
npm start
```

Frontend odatda `http://localhost:3000` manzilida ishlaydi. Development API so'rovlari `http://localhost:8000` backend manziliga proxy qilinadi.

Foydali buyruqlar:

```powershell
npm run lint
npm test -- --watchAll=false
npm run build
```

## Backend

Backend FastAPI, SQLAlchemy va Pydantic asosida yozilgan.

```powershell
cd morphocheck_backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend odatda `http://localhost:8000` manzilida ishlaydi.

Health check:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

Backend sintaksisini tekshirish:

```powershell
cd morphocheck_backend
python -m compileall .
```

## Docker orqali ishga tushirish

```powershell
docker compose up --build
```

Ishga tushgandan keyin backend holatini tekshiring:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

## Ish jarayoni

1. Yangi branch yarating.
2. O'zgarishni kichik va aniq maqsadli qiling.
3. Mavjud kod uslubi va komponent strukturasiga mos yozing.
4. Frontend o'zgarishlari uchun `npm run lint` va kerak bo'lsa `npm test -- --watchAll=false` ishlating.
5. Backend o'zgarishlari uchun kamida `python -m compileall .` va tegishli smoke testlarni bajaring.
6. `git status --short` orqali faqat kerakli fayllar o'zgarganini tekshiring.
7. Pull request yoki commit tavsifida nima o'zgargani va qanday tekshirilganini yozing.

## Kod uslubi

- Frontendda mavjud React komponentlari, helperlar va styling yondashuvlaridan foydalaning.
- UI o'zgarishlarida responsive holatlarni tekshiring.
- Backendda biznes mantiqni imkon qadar `services/`, API endpointlarni `routers/`, umumiy yordamchi kodni `utils/` ichida saqlang.
- Konfiguratsiya qiymatlarini kodga qattiq yozmang; `.env.example` orqali hujjatlashtiring.
- Katta refaktorlarni alohida PR sifatida yuboring.

## Pull requestdan oldin

PR yuborishdan oldin quyidagilarni tekshiring:

- Ilova lokal ishga tushadi.
- Lint, test yoki build natijalari muvaffaqiyatli.
- Yangi yoki o'zgargan konfiguratsiya `.env.example` fayllarida aks etgan.
- Runtime fayllar, baza fayllari, uploadlar va cache Git'ga qo'shilmagan.
- README yoki ushbu faylga ta'sir qiladigan workflow o'zgargan bo'lsa, hujjatlar yangilangan.

## Muammo haqida xabar berish

Bug yoki taklif ochganda quyidagilarni kiriting:

- Kutilgan natija
- Haqiqiy natija
- Qayta takrorlash qadamlari
- Brauzer yoki muhit ma'lumotlari
- Tegishli loglar yoki skrinshotlar, agar mavjud bo'lsa

