# Use official Python image (3.11 for TensorFlow compatibility)
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your files
COPY . .

# Note: Model file is downloaded on first API request (lazy loading)
# Set PORT environment variable (optional, can be overridden)
ENV PORT=7860

# Expose the Hugging Face port
EXPOSE 7860

# Start the Flask API
CMD ["python", "app.py"]
