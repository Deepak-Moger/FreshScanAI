# Use official Python image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your files
COPY . .

# Run your script to download the huge .h5 file during the build!
RUN python download_model.py

# Expose the Hugging Face port
EXPOSE 7860

# Start the Flask API
CMD ["python", "app.py"]
