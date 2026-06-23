# FreshScan AI

FreshScan is a Next.js + Flask application for food freshness prediction and expiry-date extraction. The UI runs in Next.js, while Flask loads the checked-in TensorFlow model at `models/food_expiry_model.h5` and performs OCR with Tesseract when available, falling back to EasyOCR.

## Features

- Food freshness prediction from uploaded photos using the real `.h5` model
- Webcam capture routed through the same model backend
- OCR extraction for product labels with expiry-date parsing
- Recent scan history in the browser session
- Dark/light theme support

## Stack

- Frontend: Next.js 16, React 19, TypeScript
- Backend: Flask, TensorFlow/Keras
- OCR: pytesseract plus EasyOCR fallback
- Model file: `models/food_expiry_model.h5`

## Setup

Prerequisites:

- Node.js 20+
- Python 3.12
- npm

Install JavaScript dependencies:

```bash
npm install
```

Install Python dependencies:

```bash
python -m pip install -r requirements.txt
```

The project is configured with:

```env
NEXT_PUBLIC_API_URL=/api
PYTHON_API_URL=http://localhost:5000
```

The browser calls Next routes under `/api`; those routes proxy to Flask on port `5000`.

## Running

Start both servers:

```bash
npm run dev:full
```

Open:

```text
http://localhost:3000
```

You can also run the processes separately:

```bash
npm run dev:backend
npm run dev
```

## API

### `GET http://localhost:5000/health`

Reports whether the TensorFlow model loaded, the model input size, the label mapping, and available OCR engines.

### `POST /api/analyze`

Accepts `multipart/form-data` with a `file` image field. Returns a freshness label and confidence from the Flask model.

### `POST /api/predict_webcam`

Accepts JSON:

```json
{
  "image": "data:image/jpeg;base64,..."
}
```

Returns the same freshness result shape as `/api/analyze`.

### `POST /api/upload`

Accepts `multipart/form-data` with a `file` image field. Returns OCR text plus the parsed expiry date when one can be detected.

## Model Configuration

The checked-in model is a binary sigmoid classifier with `150x150x3` input. Because the `.h5` file does not include class-name metadata, label mapping is configurable:

```env
MODEL_THRESHOLD=0.5
MODEL_NEGATIVE_LABEL=Fresh
MODEL_POSITIVE_LABEL=Spoiled
```

For this binary sigmoid model, scores above the threshold are interpreted as the encoded class `1`. If your training labels used the opposite class order, swap `MODEL_NEGATIVE_LABEL` and `MODEL_POSITIVE_LABEL` in the backend environment.

## Verification

Useful checks:

```bash
python -m py_compile app.py
npx tsc --noEmit
npm run build
```

For a backend smoke check, start Flask and call:

```bash
curl http://localhost:5000/health
```

## Notes

- First EasyOCR use can be slow because PyTorch models are initialized.
- A system Tesseract install is optional; EasyOCR is used when Tesseract is unavailable.
- The app does not return mock predictions. If Flask is down or the model fails to load, API calls return errors.
