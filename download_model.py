"""
Script to download the trained model from Hugging Face Hub
This runs automatically on deployment when the model file is not found locally
"""
import os
import requests
from tqdm import tqdm

def download_model_from_huggingface(repo_id, filename, local_path):
    """
    Download model from Hugging Face Hub

    Args:
        repo_id: Your HuggingFace repository ID (e.g., 'username/food-expiry-model')
        filename: Name of the model file (e.g., 'food_expiry_model.h5')
        local_path: Where to save the model locally
    """
    if os.path.exists(local_path):
        print(f"✅ Model already exists at {local_path}")
        return

    print(f"📥 Downloading model from Hugging Face Hub...")

    # Construct the download URL
    url = f"https://huggingface.co/{repo_id}/resolve/main/{filename}"

    try:
        # Stream download with progress bar
        response = requests.get(url, stream=True)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))

        with open(local_path, 'wb') as file:
            with tqdm(total=total_size, unit='B', unit_scale=True, desc=filename) as pbar:
                for chunk in response.iter_content(chunk_size=8192):
                    file.write(chunk)
                    pbar.update(len(chunk))

        print(f"✅ Model downloaded successfully to {local_path}")

    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        print(f"\nPlease manually download from:")
        print(f"{url}")
        raise

def download_from_google_drive(file_id, local_path):
    """
    Alternative: Download from Google Drive

    Args:
        file_id: Google Drive file ID from shareable link
        local_path: Where to save the model
    """
    if os.path.exists(local_path):
        print(f"✅ Model already exists at {local_path}")
        return

    print(f"📥 Downloading model from Google Drive...")

    url = f"https://drive.google.com/uc?export=download&id={file_id}"

    try:
        session = requests.Session()
        response = session.get(url, stream=True)

        # Handle large file confirmation
        for key, value in response.cookies.items():
            if key.startswith('download_warning'):
                url = f"https://drive.google.com/uc?export=download&confirm={value}&id={file_id}"
                response = session.get(url, stream=True)

        with open(local_path, 'wb') as file:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    file.write(chunk)

        print(f"✅ Model downloaded successfully to {local_path}")

    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        raise

if __name__ == "__main__":
    # Configuration - UPDATE THESE VALUES AFTER UPLOADING TO HUGGING FACE
    HUGGINGFACE_REPO = os.getenv('HUGGINGFACE_REPO', 'username/food-expiry-model')
    MODEL_FILENAME = 'food_expiry_model.h5'
    LOCAL_MODEL_PATH = 'food_expiry_model.h5'

    # Alternative: Google Drive file ID (if you prefer Google Drive)
    GOOGLE_DRIVE_FILE_ID = os.getenv('GOOGLE_DRIVE_FILE_ID', '')

    # Try Hugging Face first, fallback to Google Drive
    try:
        if HUGGINGFACE_REPO != 'username/food-expiry-model':
            download_model_from_huggingface(HUGGINGFACE_REPO, MODEL_FILENAME, LOCAL_MODEL_PATH)
        elif GOOGLE_DRIVE_FILE_ID:
            download_from_google_drive(GOOGLE_DRIVE_FILE_ID, LOCAL_MODEL_PATH)
        else:
            print("⚠️  Please configure HUGGINGFACE_REPO or GOOGLE_DRIVE_FILE_ID")
            print("See DEPLOYMENT.md for instructions")
    except Exception as e:
        print(f"\n❌ Failed to download model: {e}")
        print("\nPlease download manually and place in the root directory")
