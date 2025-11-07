# 🥫 Food Expiry Prediction and Freshness Detection using AI/ML

## 📌 Project Overview
This project aims to develop an **AI-powered Food Expiry and Freshness Detection System** that helps users identify whether a food item is **fresh or spoiled** and also **extracts expiry/manufacture dates** from packaged food labels using **OCR (Optical Character Recognition)**.

The system integrates **image classification**, **OCR**, and **web-based automation** to help users manage their food items, reduce waste, and ensure food safety.

---

## 🎯 Objectives
- To classify fruits or vegetables as **Fresh** or **Spoiled** using a **Convolutional Neural Network (CNN)**.
- To automatically extract **expiry/manufacture dates** from product labels using **OCR**.
- To store and monitor expiry information for future notifications.
- To build an **end-to-end Flask web application** for user interaction.

---

## 🧠 Features
✅ **Freshness Detection** — Detects if a fruit or vegetable is fresh/spoiled from its image.  
✅ **Expiry Date Extraction** — Uses OCR to extract dates from product labels.  
✅ **Smart Notification System** — Notifies users before expiry.  
✅ **User-Friendly Web Interface** — Simple image upload and instant results.  
✅ **Supports Multiple File Formats** — JPG, PNG, JPEG supported.

---

## 🧩 System Architecture

```
             +--------------------------+
             |      User Uploads Image  |
             +-------------+------------+
                           |
                           v
              +-------------------------+
              |   Image Preprocessing   |
              | (OpenCV + NumPy)        |
              +-------------------------+
                           |
                           v
        +------------------+------------------+
        |                                     |
        v                                     v
+--------------------+           +----------------------+
|  Freshness Model   |           |   OCR Date Extractor |
| (CNN - TensorFlow) |           | (EasyOCR / OCR API)  |
+--------------------+           +----------------------+
        |                                     |
        +------------------+------------------+
                           |
                           v
                +---------------------------+
                |  Flask Web Interface       |
                |  (Prediction + Display)    |
                +---------------------------+
```

---

## ⚙️ Technologies Used

| Technology / Library | Purpose |
|----------------------|----------|
| **Python 3.12** | Programming Language |
| **TensorFlow / Keras** | CNN model for freshness detection |
| **OpenCV** | Image preprocessing (resizing, filtering, thresholding) |
| **NumPy** | Array handling and numerical computation |
| **EasyOCR / OCR.Space API** | Extract expiry/manufacture text from images |
| **Flask** | Web app backend |
| **HTML / CSS / Bootstrap** | Web interface frontend |
| **Matplotlib / Seaborn** | Data visualization (during model training) |

---

## 📁 Project Structure

```
📦 Food_Expiry_Tracker
 ┣ 📂 dataset
 ┃ ┣ 📂 fresh
 ┃ ┗ 📂 spoiled
 ┣ 📂 static
 ┃ ┗ (UI images, CSS, JS)
 ┣ 📂 templates
 ┃ ┣ index.html
 ┃ ┗ result.html
 ┣ 📂 uploads
 ┃ ┗ (uploaded images)
 ┣ 📜 food_freshness.py
 ┣ 📜 ocr_extractor.py
 ┣ 📜 train_model.py
 ┣ 📜 food_expiry_model.h5
 ┣ 📜 app.py
 ┣ 📜 requirements.txt
 ┗ 📜 README.md
```

---

## 🧰 Installation and Setup

### Step 1️⃣ — Clone the Repository
```bash
git clone https://github.com/yourusername/Food-Expiry-Prediction.git
cd Food-Expiry-Prediction
```

### Step 2️⃣ — Create Virtual Environment (Optional)
If using Anaconda:
```bash
conda create -n foodenv python=3.12
conda activate foodenv
```

Or using venv:
```bash
python -m venv env
source env/bin/activate    # (Linux/Mac)
env\Scripts\activate       # (Windows)
```

### Step 3️⃣ — Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4️⃣ — Run the Application
```bash
python app.py
```

Then open the app in your browser at:  
👉 `http://127.0.0.1:5000/`

---

## 🧪 Model Details

### 🔹 **Freshness Detection Model (CNN)**
- Input size: 128×128 pixels  
- Layers: Convolution → ReLU → MaxPooling → Dense → Softmax  
- Output: `Fresh` or `Spoiled`

**Model Training File:** `train_model.py`  
**Trained Model Saved As:** `food_expiry_model.h5`

### 🔹 **OCR Extraction**
- Used **EasyOCR** or **OCR.Space API**  
- Extracts only the boxed text region (for higher accuracy)  
- Detects keywords like `EXP`, `MFG`, `Best Before`, etc.  
- Parses dates using **regex** patterns like:
  ```
  \d{2}/\d{2}/\d{4} or \d{2}-\d{2}-\d{4}
  ```

---

## 💻 Web Application Flow

1. **Upload Image** of a food item or package  
2. System performs:
   - CNN model → Freshness prediction  
   - OCR → Expiry/Manufacture date extraction  
3. **Results Displayed** on `result.html` page:
   - Product freshness status (✅ Fresh / ❌ Spoiled)
   - Detected expiry/manufacture dates
   - Remaining shelf life (if applicable)

---

## 🧮 Algorithms Used

| Task | Algorithm / Model |
|------|-------------------|
| Image Classification | Convolutional Neural Network (CNN) |
| Text Extraction | EasyOCR / OCR.Space API |
| Image Preprocessing | OpenCV Filters & Thresholding |
| Date Recognition | Regex-based text pattern matching |
| File Handling & UI | Flask Web Framework |

---

## 📈 Sample Output

| Input | Output |
|-------|---------|
| 🍎 Apple Image | “Fresh” (Confidence: 0.93) |
| 🍅 Tomato Image | “Spoiled” (Confidence: 0.88) |
| 📦 Packaged Food Label | Extracted: “MFG: 10/09/2024”, “EXP: 10/10/2025” |

---

## ⚠️ Limitations
- OCR accuracy depends on image quality and text clarity.  
- Works best for **printed labels**, not handwritten ones.  
- Requires stable lighting and focused images.  
- Model limited to trained dataset (e.g., specific fruits).

---

## 🚀 Future Enhancements
- 📱 Develop a **mobile app** for live expiry detection.  
- ☁️ Integrate with **cloud database** for auto reminders.  
- 🧾 Generate **PDF reports** for food inventory.  
- 🔍 Extend CNN to classify multiple categories (fruit types).  
- 🤖 Use **transformer-based OCR** (like Tesseract + Vision Transformer).  

---

## 👨‍💻 Contributors
| Name | Role |
|------|------|
| Deepuu | Project Lead, ML Model Development, OCR Integration |
| Team Members | Dataset Collection, Web UI, Testing |

---

## 🏁 Conclusion
This project demonstrates the real-world use of **AI and Computer Vision** in food quality monitoring.  
By combining **deep learning (CNN)** and **OCR**, the system helps users **detect spoiled food**, **track expiry dates**, and **reduce wastage**, making it an innovative and impactful application in smart food management.

---

## 📚 References
- [OpenCV Documentation](https://docs.opencv.org/)
- [TensorFlow Keras API](https://www.tensorflow.org/guide/keras)
- [EasyOCR GitHub](https://github.com/JaidedAI/EasyOCR)
- [OCR.Space API](https://ocr.space/ocrapi)
- [Python Flask Docs](https://flask.palletsprojects.com/)
