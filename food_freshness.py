<<<<<<< HEAD
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array, load_img
import numpy as np
from PIL import Image
import os
import base64
from io import BytesIO

class FreshnessAnalyzer:
    def __init__(self, model_path='food_expiry_model.h5'):
        self.model = load_model(model_path)
        self.target_size = (150, 150)  # Model's expected input size

    def preprocess_image(self, image):
        """Preprocess image for model prediction"""
        if isinstance(image, str):  # If image path is provided
            img = load_img(image, target_size=self.target_size)
        elif isinstance(image, Image.Image):  # If PIL Image is provided
            img = image.resize(self.target_size)
        else:
            raise ValueError("Unsupported image format")
        
        img_array = img_to_array(img) / 255.0
        return np.expand_dims(img_array, axis=0)

    def predict_freshness(self, image):
        """Predict if food is fresh or spoiled"""
        try:
            processed_image = self.preprocess_image(image)
            prediction = self.model.predict(processed_image)[0][0]
            label = "Fresh" if prediction < 0.5 else "Spoiled"
            confidence = (1 - prediction) if prediction < 0.5 else prediction
            return {
                'label': label,
                'confidence': float(confidence * 100)  # Convert to percentage
            }
        except Exception as e:
            return {'error': str(e)}

    def predict_from_base64(self, base64_string):
        """Predict freshness from base64 image string"""
        try:
            # Remove data:image/jpeg;base64, if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64 string
            image_data = base64.b64decode(base64_string)
            image = Image.open(BytesIO(image_data))
            
            return self.predict_freshness(image)
        except Exception as e:
=======
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array, load_img
import numpy as np
from PIL import Image
import os
import base64
from io import BytesIO

class FreshnessAnalyzer:
    def __init__(self, model_path='food_expiry_model.h5'):
        self.model = load_model(model_path)
        self.target_size = (150, 150)  # Model's expected input size

    def preprocess_image(self, image):
        """Preprocess image for model prediction"""
        if isinstance(image, str):  # If image path is provided
            img = load_img(image, target_size=self.target_size)
        elif isinstance(image, Image.Image):  # If PIL Image is provided
            img = image.resize(self.target_size)
        else:
            raise ValueError("Unsupported image format")
        
        img_array = img_to_array(img) / 255.0
        return np.expand_dims(img_array, axis=0)

    def predict_freshness(self, image):
        """Predict if food is fresh or spoiled"""
        try:
            processed_image = self.preprocess_image(image)
            prediction = self.model.predict(processed_image)[0][0]
            label = "Fresh" if prediction < 0.5 else "Spoiled"
            confidence = (1 - prediction) if prediction < 0.5 else prediction
            return {
                'label': label,
                'confidence': float(confidence * 100)  # Convert to percentage
            }
        except Exception as e:
            return {'error': str(e)}

    def predict_from_base64(self, base64_string):
        """Predict freshness from base64 image string"""
        try:
            # Remove data:image/jpeg;base64, if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64 string
            image_data = base64.b64decode(base64_string)
            image = Image.open(BytesIO(image_data))
            
            return self.predict_freshness(image)
        except Exception as e:
>>>>>>> 1c1d17740b03389e4d9faefe4eeec544d17f0494
            return {'error': f'Error processing base64 image: {str(e)}'}