import base64
import calendar
import os
import re
from datetime import datetime
from io import BytesIO

import numpy as np
import tensorflow as tf
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, UnidentifiedImageError
from werkzeug.exceptions import BadRequest, ServiceUnavailable

try:
    import pytesseract
    from pytesseract import TesseractError, TesseractNotFoundError
except ImportError:
    pytesseract = None
    TesseractError = Exception
    TesseractNotFoundError = Exception

try:
    import easyocr
except ImportError:
    easyocr = None


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.getenv(
    "MODEL_PATH",
    os.path.join(BASE_DIR, "models", "food_expiry_model.h5"),
)
MODEL_THRESHOLD = float(os.getenv("MODEL_THRESHOLD", "0.5"))
# The sigmoid output is the probability of encoded class 1. With the usual
# alphabetical training-folder order, Fresh is class 0 and Spoiled is class 1.
MODEL_POSITIVE_LABEL = os.getenv("MODEL_POSITIVE_LABEL", "Spoiled")
MODEL_NEGATIVE_LABEL = os.getenv("MODEL_NEGATIVE_LABEL", "Fresh")
MODEL_CLASS_NAMES = [
    label.strip()
    for label in os.getenv("MODEL_CLASS_NAMES", "Fresh,Slightly Aged,Spoiled").split(",")
    if label.strip()
]
OCR_TIMEOUT_SECONDS = int(os.getenv("OCR_TIMEOUT_SECONDS", "10"))

if pytesseract is not None and os.getenv("TESSERACT_CMD"):
    pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_CMD")

app = Flask(__name__)
CORS(app)

model = None
model_load_error = None
model_image_size = (224, 224)
easyocr_reader = None
easyocr_load_error = None


def resolve_model_image_size(loaded_model):
    shape = loaded_model.input_shape
    if isinstance(shape, list):
        shape = shape[0]

    if not shape or len(shape) < 4:
        return (224, 224)

    height = int(shape[1]) if shape[1] else 224
    width = int(shape[2]) if shape[2] else 224
    return (width, height)


def load_inference_model():
    global model, model_image_size, model_load_error

    try:
        loaded_model = tf.keras.models.load_model(MODEL_PATH)
        model = loaded_model
        model_image_size = resolve_model_image_size(loaded_model)
        print(f"[ok] Model loaded from {MODEL_PATH}")
        print(f"[ok] Model image size: {model_image_size[0]}x{model_image_size[1]}")
    except Exception as exc:
        model = None
        model_load_error = str(exc)
        print(f"[error] Could not load model from {MODEL_PATH}: {exc}")


def api_error(error, status_code):
    message = getattr(error, "description", str(error))
    return jsonify({"success": False, "error": message}), status_code


def load_image(image_data):
    try:
        if isinstance(image_data, str):
            if image_data.startswith("data:image"):
                image_data = image_data.split(",", 1)[1]
            image_data = base64.b64decode(image_data)

        image = Image.open(BytesIO(image_data) if isinstance(image_data, bytes) else image_data)
        image.load()
        return ImageOps.exif_transpose(image)
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise BadRequest(f"Unsupported or corrupt image: {exc}") from exc


def preprocess_image(image_data):
    if model is None:
        detail = f": {model_load_error}" if model_load_error else ""
        raise ServiceUnavailable(f"Model is not available{detail}")

    image = load_image(image_data).convert("RGB")
    image = image.resize(model_image_size, Image.Resampling.BILINEAR)

    image_array = np.asarray(image, dtype=np.float32) / 255.0
    return np.expand_dims(image_array, axis=0)


def predict_freshness(image_array):
    if model is None:
        detail = f": {model_load_error}" if model_load_error else ""
        raise ServiceUnavailable(f"Model is not available{detail}")

    try:
        prediction = np.asarray(model.predict(image_array, verbose=0))
        values = prediction.reshape((prediction.shape[0], -1))[0].astype(float)

        if values.size == 1:
            score = float(np.clip(values[0], 0.0, 1.0))
            is_positive = score >= MODEL_THRESHOLD
            label = MODEL_POSITIVE_LABEL if is_positive else MODEL_NEGATIVE_LABEL
            confidence = score if is_positive else 1.0 - score

            return {
                "label": label,
                "confidence": round(confidence * 100, 1),
                "raw_score": round(score, 4),
                "threshold": MODEL_THRESHOLD,
                "labels": {
                    "negative": MODEL_NEGATIVE_LABEL,
                    "positive": MODEL_POSITIVE_LABEL,
                },
            }

        class_names = MODEL_CLASS_NAMES
        if len(class_names) != values.size:
            class_names = [f"Class {index}" for index in range(values.size)]

        class_index = int(np.argmax(values))
        return {
            "label": class_names[class_index],
            "confidence": round(float(values[class_index]) * 100, 1),
            "class_scores": {
                class_names[index]: round(float(score), 4)
                for index, score in enumerate(values)
            },
        }
    except ServiceUnavailable:
        raise
    except Exception as exc:
        raise BadRequest(f"Error during prediction: {exc}") from exc


def upscale_for_ocr(image):
    width, height = image.size
    max_dimension = max(width, height)

    if max_dimension >= 1800:
        return image

    scale = min(3.0, 1800 / max_dimension)
    new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
    return image.resize(new_size, Image.Resampling.LANCZOS)


def build_ocr_variants(image):
    base = upscale_for_ocr(image.convert("RGB"))
    grayscale = ImageOps.grayscale(base)
    grayscale = ImageOps.autocontrast(grayscale)
    grayscale = ImageEnhance.Contrast(grayscale).enhance(1.7)
    sharpened = grayscale.filter(ImageFilter.SHARPEN)
    thresholded = sharpened.point(lambda pixel: 255 if pixel > 165 else 0)

    return [base, sharpened, thresholded]


def get_easyocr_reader():
    global easyocr_reader, easyocr_load_error

    if easyocr_reader is not None:
        return easyocr_reader

    if easyocr is None:
        easyocr_load_error = "easyocr is not installed"
        return None

    try:
        easyocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        return easyocr_reader
    except Exception as exc:
        easyocr_load_error = str(exc)
        return None


def extract_text_with_tesseract(image):
    if pytesseract is None:
        return "", ["pytesseract is not installed"]

    text_chunks = []
    ocr_errors = []

    for variant in build_ocr_variants(image):
        try:
            text = pytesseract.image_to_string(
                variant,
                config="--psm 6",
                timeout=OCR_TIMEOUT_SECONDS,
            )
            if text and text.strip():
                text_chunks.append(text.strip())
        except RuntimeError as exc:
            ocr_errors.append(f"Tesseract timed out after {OCR_TIMEOUT_SECONDS}s: {exc}")
        except (TesseractNotFoundError, TesseractError) as exc:
            ocr_errors.append(str(exc))

    return "\n".join(text_chunks), ocr_errors


def extract_text_with_easyocr(image):
    reader = get_easyocr_reader()
    if reader is None:
        return "", [easyocr_load_error or "easyocr is not available"]

    text_chunks = []
    ocr_errors = []

    for variant in build_ocr_variants(image):
        try:
            result = reader.readtext(np.asarray(variant), detail=0, paragraph=True)
            text = "\n".join(str(item) for item in result if str(item).strip())
            if text.strip():
                text_chunks.append(text.strip())
        except Exception as exc:
            ocr_errors.append(str(exc))

    return "\n".join(text_chunks), ocr_errors


def normalize_ocr_text(text_chunks):
    unique_lines = []
    seen = set()
    for chunk in text_chunks.splitlines():
        clean_line = re.sub(r"\s+", " ", chunk).strip()
        key = clean_line.lower()
        if clean_line and key not in seen:
            seen.add(key)
            unique_lines.append(clean_line)

    return "\n".join(unique_lines)


def extract_text_from_image(image_data):
    image = load_image(image_data)
    errors = []

    tesseract_text, tesseract_errors = extract_text_with_tesseract(image)
    if tesseract_text.strip():
        return normalize_ocr_text(tesseract_text), "tesseract"
    errors.extend(tesseract_errors)

    easyocr_text, easyocr_errors = extract_text_with_easyocr(image)
    if easyocr_text.strip():
        return normalize_ocr_text(easyocr_text), "easyocr"
    errors.extend(easyocr_errors)

    if errors:
        unique_errors = []
        for error in errors:
            if error and error not in unique_errors:
                unique_errors.append(error)
        raise ServiceUnavailable("; ".join(unique_errors))

    return "", "none"


MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}

EXPIRY_KEYWORDS = (
    "exp",
    "expiry",
    "expires",
    "expiration",
    "use by",
    "use before",
    "best before",
    "best by",
    "bbd",
    "bb",
    "sell by",
    "valid until",
)

PRODUCTION_KEYWORDS = (
    "mfg",
    "mfd",
    "manufactured",
    "packed",
    "pkd",
    "production",
    "prod",
)

NUMERIC_DMY_PATTERN = re.compile(
    r"\b(?P<day>[0-3]?\d)[\s/.-](?P<month>0?\d|1[0-2])[\s/.-](?P<year>\d{2,4})\b"
)
NUMERIC_YMD_PATTERN = re.compile(
    r"\b(?P<year>\d{4})[\s/.-](?P<month>0?\d|1[0-2])[\s/.-](?P<day>[0-3]?\d)\b"
)
MONTH_NAME_DMY_PATTERN = re.compile(
    r"\b(?P<day>[0-3]?\d)\s*(?P<month>jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?,?\s*(?P<year>\d{2,4})\b",
    re.IGNORECASE,
)
MONTH_NAME_MDY_PATTERN = re.compile(
    r"\b(?P<month>jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s*(?P<day>[0-3]?\d),?\s*(?P<year>\d{2,4})\b",
    re.IGNORECASE,
)
MONTH_YEAR_PATTERN = re.compile(
    r"(?<![\d/.-])(?P<month>0?[1-9]|1[0-2])[\s/.-](?P<year>\d{2,4})\b"
)


def normalize_year(value):
    year = int(value)
    if year < 100:
        return 2000 + year if year < 70 else 1900 + year
    return year


def make_date(year, month, day):
    try:
        return datetime(int(year), int(month), int(day)).date()
    except ValueError:
        return None


def month_number(value):
    return MONTHS[value.lower().strip(".")]


def score_date_candidate(text, start, end):
    context = text[max(0, start - 60) : min(len(text), end + 30)].lower()
    has_expiry_keyword = any(keyword in context for keyword in EXPIRY_KEYWORDS)
    has_production_keyword = any(keyword in context for keyword in PRODUCTION_KEYWORDS)

    score = 0
    if has_expiry_keyword:
        score += 100
    if has_production_keyword and not has_expiry_keyword:
        score -= 25

    return score, context.strip()


def add_candidate(candidates, text, match, date_value):
    if date_value is None:
        return

    score, context = score_date_candidate(text, match.start(), match.end())
    candidates.append(
        {
            "date": date_value,
            "score": score,
            "raw": match.group(0),
            "context": context,
        }
    )


def find_expiry_date(text):
    cleaned_text = re.sub(r"[|]", "/", text)
    candidates = []

    for match in NUMERIC_DMY_PATTERN.finditer(cleaned_text):
        date_value = make_date(
            normalize_year(match.group("year")),
            int(match.group("month")),
            int(match.group("day")),
        )
        add_candidate(candidates, cleaned_text, match, date_value)

    for match in NUMERIC_YMD_PATTERN.finditer(cleaned_text):
        date_value = make_date(
            normalize_year(match.group("year")),
            int(match.group("month")),
            int(match.group("day")),
        )
        add_candidate(candidates, cleaned_text, match, date_value)

    for match in MONTH_NAME_DMY_PATTERN.finditer(cleaned_text):
        date_value = make_date(
            normalize_year(match.group("year")),
            month_number(match.group("month")),
            int(match.group("day")),
        )
        add_candidate(candidates, cleaned_text, match, date_value)

    for match in MONTH_NAME_MDY_PATTERN.finditer(cleaned_text):
        date_value = make_date(
            normalize_year(match.group("year")),
            month_number(match.group("month")),
            int(match.group("day")),
        )
        add_candidate(candidates, cleaned_text, match, date_value)

    for match in MONTH_YEAR_PATTERN.finditer(cleaned_text):
        score, _context = score_date_candidate(cleaned_text, match.start(), match.end())
        if score < 100:
            continue

        year = normalize_year(match.group("year"))
        month = int(match.group("month"))
        last_day = calendar.monthrange(year, month)[1]
        add_candidate(candidates, cleaned_text, match, make_date(year, month, last_day))

    if not candidates:
        return None

    candidates.sort(key=lambda candidate: (candidate["score"], candidate["date"]), reverse=True)
    best = candidates[0]

    return {
        "date": best["date"].strftime("%d/%m/%Y"),
        "raw": best["raw"],
        "context": best["context"],
        "source": "keyword" if best["score"] >= 100 else "inferred",
    }


@app.route("/api/analyze", methods=["POST"])
def analyze():
    try:
        if "file" not in request.files:
            return api_error(BadRequest("No file provided"), 400)

        file = request.files["file"]
        if file.filename == "":
            return api_error(BadRequest("No file selected"), 400)

        image_array = preprocess_image(file.read())
        result = predict_freshness(image_array)

        return jsonify({"success": True, "data": result})
    except BadRequest as exc:
        return api_error(exc, 400)
    except ServiceUnavailable as exc:
        return api_error(exc, 503)
    except Exception as exc:
        return api_error(Exception(f"Server error: {exc}"), 500)


@app.route("/api/predict_webcam", methods=["POST"])
def predict_webcam():
    try:
        data = request.get_json(silent=True) or {}
        if "image" not in data:
            return api_error(BadRequest("No image provided"), 400)

        image_array = preprocess_image(data["image"])
        result = predict_freshness(image_array)

        return jsonify({"success": True, "data": result})
    except BadRequest as exc:
        return api_error(exc, 400)
    except ServiceUnavailable as exc:
        return api_error(exc, 503)
    except Exception as exc:
        return api_error(Exception(f"Server error: {exc}"), 500)


@app.route("/api/upload", methods=["POST"])
def upload():
    try:
        if "file" not in request.files:
            return api_error(BadRequest("No file provided"), 400)

        file = request.files["file"]
        if file.filename == "":
            return api_error(BadRequest("No file selected"), 400)

        extracted_text, ocr_engine = extract_text_from_image(file.read())
        expiry_date = find_expiry_date(extracted_text) if extracted_text else None

        return jsonify(
            {
                "success": True,
                "data": {
                    "extracted_text": extracted_text,
                    "expiry_date": expiry_date["date"] if expiry_date else "",
                    "expiry_source": expiry_date["source"] if expiry_date else "not_found",
                    "expiry_match": expiry_date["raw"] if expiry_date else "",
                    "ocr_engine": ocr_engine,
                },
            }
        )
    except BadRequest as exc:
        return api_error(exc, 400)
    except ServiceUnavailable as exc:
        return api_error(exc, 503)
    except Exception as exc:
        return api_error(Exception(f"Server error: {exc}"), 500)


@app.route("/health", methods=["GET"])
def health():
    width, height = model_image_size
    status = "healthy" if model is not None else "degraded"

    return jsonify(
        {
            "status": status,
            "model_loaded": model is not None,
            "model_path": MODEL_PATH,
            "model_load_error": model_load_error,
            "model_input_size": {"width": width, "height": height},
            "model_threshold": MODEL_THRESHOLD,
            "model_labels": {
                "negative": MODEL_NEGATIVE_LABEL,
                "positive": MODEL_POSITIVE_LABEL,
            },
            "ocr_engines": {
                "tesseract_package_loaded": pytesseract is not None,
                "easyocr_package_loaded": easyocr is not None,
                "easyocr_model_loaded": easyocr_reader is not None,
                "easyocr_load_error": easyocr_load_error,
            },
        }
    )


load_inference_model()

if __name__ == "__main__":
    if model is None:
        print("WARNING: Model failed to load. Check MODEL_PATH and TensorFlow installation.")
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=False, host="0.0.0.0", port=5000)
