# Project Status

FreshScan is now wired for the real backend model flow instead of mock API responses.

## What Is Connected

- Next.js UI calls `/api/analyze`, `/api/predict_webcam`, and `/api/upload`.
- Next API routes proxy those requests to Flask at `PYTHON_API_URL`, defaulting to `http://localhost:5000`.
- Flask loads `models/food_expiry_model.h5` at startup.
- Backend preprocessing uses the model's actual input shape, currently `150x150x3`.
- The binary sigmoid output is converted into a label and confidence with configurable env vars.
- `/api/upload` performs OCR with pytesseract first and EasyOCR as a fallback, then parses expiry dates.

## Run Commands

```bash
npm install
python -m pip install -r requirements.txt
npm run dev:full
```

Open `http://localhost:3000`.

## Verification Run

Current checks performed:

- `python -m py_compile app.py`
- `npx tsc --noEmit`
- `npm run build`
- Flask test-client smoke test for `/api/analyze`
- Flask test-client smoke test for `/api/upload`

The OCR smoke test used EasyOCR fallback and extracted `15/09/2026` from a generated label image.

## Important Model Note

The `.h5` model does not contain class-name metadata. The backend currently uses:

```env
MODEL_THRESHOLD=0.5
MODEL_NEGATIVE_LABEL=Fresh
MODEL_POSITIVE_LABEL=Spoiled
```

The sigmoid output is interpreted as encoded class `1` when it is above the threshold. If the original training data encoded class `1` as fresh, swap those two label env vars before running Flask.
