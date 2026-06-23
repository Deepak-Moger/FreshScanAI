FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_URL=/api \
    PYTHON_API_URL=http://127.0.0.1:5000 \
    MODEL_THRESHOLD=0.5 \
    MODEL_NEGATIVE_LABEL=Fresh \
    MODEL_POSITIVE_LABEL=Spoiled \
    OCR_TIMEOUT_SECONDS=10

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        git-lfs \
        tesseract-ocr \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN test "$(wc -c < models/food_expiry_model.h5)" -gt 1000000

RUN npm run build

EXPOSE 7860

CMD ["npm", "run", "start:hf"]
