from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from food_freshness import FreshnessAnalyzer
from ocr_extractor import OCRHandler
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"]}})

# Configuration
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'bmp','webp'}

# Download model if not exists (for deployment)
MODEL_PATH = 'food_expiry_model.h5'
if not os.path.exists(MODEL_PATH):
    print("⚠️  Model file not found. Attempting to download...")
    try:
        from download_model import download_model_from_huggingface, download_from_google_drive

        # Try Hugging Face first
        huggingface_repo = os.getenv('HUGGINGFACE_REPO', '')
        google_drive_id = os.getenv('GOOGLE_DRIVE_FILE_ID', '')

        if huggingface_repo:
            download_model_from_huggingface(huggingface_repo, MODEL_PATH, MODEL_PATH)
        elif google_drive_id:
            download_from_google_drive(google_drive_id, MODEL_PATH)
        else:
            print("❌ No model source configured. Please set HUGGINGFACE_REPO or GOOGLE_DRIVE_FILE_ID")
    except Exception as e:
        print(f"❌ Failed to download model: {e}")
        print("Please ensure the model file exists or configure download settings.")

# Initialize analyzers
freshness_analyzer = FreshnessAnalyzer(MODEL_PATH)
ocr_handler = OCRHandler()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint for deployment monitoring"""
    return jsonify({"status": "healthy"}), 200

@app.route('/predict', methods=['POST'])
def predict():
    """Predict food freshness from uploaded image file"""
    try:
        # Input validation: Check if file is present
        if 'file' not in request.files:
            logger.warning("Prediction request missing file part")
            return jsonify({
                "success": False,
                "error": "No file part in request"
            }), 400
        
        file = request.files['file']
        
        # Input validation: Check if file is selected
        if file.filename == '':
            logger.warning("Prediction request with empty filename")
            return jsonify({
                "success": False,
                "error": "No file selected"
            }), 400
        
        # Input validation: Check file type
        if not allowed_file(file.filename):
            logger.warning(f"Invalid file type: {file.filename}")
            return jsonify({
                "success": False,
                "error": f"Invalid file type. Allowed types: {', '.join(app.config['ALLOWED_EXTENSIONS'])}"
            }), 400
        
        # Save and process file
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
        file.save(file_path)
        logger.info(f"Processing file: {file.filename}")
        
        # ML inference (wrapped in try-except)
        try:
            result = freshness_analyzer.predict_freshness(file_path)
            logger.info(f"Prediction successful for {file.filename}")
            return jsonify({
                "success": True,
                "data": result
            }), 200
        except Exception as ml_error:
            logger.error(f"ML model error: {str(ml_error)}")
            return jsonify({
                "success": False,
                "error": "Model inference failed"
            }), 500
        
    except Exception as e:
        logger.error(f"Prediction endpoint error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Internal server error during prediction"
        }), 500

@app.route('/predict_webcam', methods=['POST'])
def predict_webcam():
    """Predict food freshness from base64 encoded image (webcam)"""
    try:
        # Input validation: Check if JSON data exists
        data = request.get_json()
        if not data:
            logger.warning("Webcam prediction request with no JSON data")
            return jsonify({
                "success": False,
                "error": "No JSON data provided"
            }), 400
        
        # Input validation: Check if image data is present
        if 'image' not in data:
            logger.warning("Webcam prediction request missing image field")
            return jsonify({
                "success": False,
                "error": "No image data provided"
            }), 400
        
        logger.info("Processing webcam image")
        
        # ML inference (wrapped in try-except)
        try:
            result = freshness_analyzer.predict_from_base64(data['image'])
            logger.info("Webcam prediction successful")
            return jsonify({
                "success": True,
                "data": result
            }), 200
        except Exception as ml_error:
            logger.error(f"ML model error: {str(ml_error)}")
            return jsonify({
                "success": False,
                "error": "Model inference failed"
            }), 500
        
    except Exception as e:
        logger.error(f"Webcam prediction endpoint error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Internal server error during prediction"
        }), 500

@app.route('/upload', methods=['POST'])
def upload_image():
    """Extract expiry date information from uploaded image using OCR"""
    try:
        # Input validation: Check if file is present
        if 'file' not in request.files:
            logger.warning("Upload request missing file part")
            return jsonify({
                "success": False,
                "error": "No file part in request"
            }), 400
        
        file = request.files['file']
        
        # Input validation: Check if file is selected
        if file.filename == '':
            logger.warning("Upload request with empty filename")
            return jsonify({
                "success": False,
                "error": "No file selected"
            }), 400
        
        # Input validation: Check file type
        if not allowed_file(file.filename):
            logger.warning(f"Invalid file type for OCR: {file.filename}")
            return jsonify({
                "success": False,
                "error": f"Invalid file type. Allowed types: {', '.join(app.config['ALLOWED_EXTENSIONS'])}"
            }), 400
        
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        logger.info(f"Processing OCR for file: {filename}")
        
        # OCR processing (wrapped in try-except)
        try:
            result = ocr_handler.process_image(file_path)
            logger.info(f"OCR processing successful for {filename}")
            return jsonify({
                "success": True,
                "data": result
            }), 200
        except Exception as ocr_error:
            logger.error(f"OCR processing error: {str(ocr_error)}")
            return jsonify({
                "success": False,
                "error": "OCR processing failed"
            }), 500
        
    except Exception as e:
        logger.error(f"Upload endpoint error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Internal server error during upload"
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500

if __name__ == '__main__':
    # Hugging Face requires port 7860
    app.run(host='0.0.0.0', port=7860, debug=False)