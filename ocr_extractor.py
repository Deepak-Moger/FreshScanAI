import os
import cv2
import easyocr
import requests
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import numpy as np
import re

# Flask App Configuration
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'bmp'}

# OCRHandler Class for Modularity
class OCRHandler:
    def __init__(self):
        # Initialize EasyOCR Reader
        self.reader = easyocr.Reader(['en'], verbose=False)

        # Gemini API Configuration
        self.API_KEY = "AIzaSyDEzTyYnAZ9eolGvuW5Rkg3646Cf_QKpc4"  # Replace with your Gemini API key
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={self.API_KEY}"

    def extract_text(self, image):
        """Extract text from an image using EasyOCR."""
        try:
            if isinstance(image, str):  # If image path is provided
                image = cv2.imread(image)
            elif isinstance(image, np.ndarray):  # If numpy array
                pass
            else:
                raise ValueError("Unsupported image format")

            results = self.reader.readtext(image)
            if results:
                extracted_text = "\n".join([text for _, text, _ in results])
                return extracted_text
            return "No text detected in the image."
        except Exception as e:
            return f"Failed to process the image: {e}"

    def process_with_gemini(self, extracted_text):
        """Send extracted text to Gemini API and get expiry date."""
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": f"{extracted_text}. Extract only the expiry date from the ocr extracted text."}]}]
        }

        try:
            response = requests.post(self.url, headers=headers, json=payload)
            if response.status_code == 200:
                result = response.json()
                gemini_response = result['candidates'][0]['content']['parts'][0]['text']
                
                # Print the Gemini response to the terminal explicitly
                print(f"Gemini Response: {gemini_response}")
                
                return gemini_response
            else:
                return None  # Return None if Gemini doesn't respond correctly
        except Exception as e:
            print(f"Error processing with Gemini: {e}")
            return None  # Return None on error

    def extract_expiry_date(self, extracted_text):
        """Fallback mechanism to extract expiry date using regex."""
        date_pattern = r'\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b'
        matches = re.findall(date_pattern, extracted_text)
        if matches:
            return matches[0]  # Return the first matched date
        return "No valid expiry date found."

    def process_image(self, image_path):
        """Process image and return both extracted text and expiry date."""
        try:
            # Extract text from image
            extracted_text = self.extract_text(image_path)
            
            # Attempt to get expiry date from Gemini API
            gemini_response = self.process_with_gemini(extracted_text)
            
            # If Gemini fails, use regex as fallback
            if not gemini_response:
                gemini_response = self.extract_expiry_date(extracted_text)
            
            return {
                'success': True,
                'extracted_text': extracted_text,
                'expiry_date': gemini_response
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

# Initialize OCRHandler
ocr_handler = OCRHandler()

# Helper Function to Check Allowed File Types
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Route for the Home Page
@app.route('/')
def index():
    return render_template('index.html')

# Route for Image Upload
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

        # Process the uploaded image
        result = ocr_handler.process_image(file_path)

        # Return JSON response
        if result['success']:
            return jsonify({
                'extracted_text': result['extracted_text'],
                'expiry_date': result['expiry_date']
            })
        else:
            return jsonify({'error': result['error']}), 500
    else:
        return jsonify({'error': 'Invalid file type'}), 400

# Start the Flask App
if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True)
