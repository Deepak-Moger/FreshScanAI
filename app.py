from flask import Flask, request, render_template, redirect, url_for, jsonify
import os
from food_freshness import FreshnessAnalyzer
from ocr_extractor import OCRHandler
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
        file.save(file_path)
        result = freshness_analyzer.predict_freshness(file_path)
        return jsonify(result)
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/predict_webcam', methods=['POST'])
def predict_webcam():
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({"error": "No image data provided"}), 400
    result = freshness_analyzer.predict_from_base64(data['image'])
    return jsonify(result)

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Process image with OCR handler
        result = ocr_handler.process_image(file_path)
        return jsonify(result)
    
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(debug=True)