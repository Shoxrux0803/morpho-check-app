# Python bazaviy image
FROM python:3.10-slim

# Ishchi katalog
WORKDIR /app

# Requirements o‘rnatish
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Loyiha fayllarini nusxalash
COPY . .

# FastAPI serverini ishga tushirish
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
