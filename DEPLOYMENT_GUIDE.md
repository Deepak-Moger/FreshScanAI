# 🚀 FREE Deployment Guide for Food Expiry Tracker

Since your trained model file (56MB) is too large for GitHub, here are the **BEST FREE** hosting solutions:

---

## 🎯 Option 1: Hugging Face Hub (RECOMMENDED - 100% FREE)

### Why Hugging Face?
✅ **FREE unlimited model hosting**
✅ Made for ML models
✅ Fast CDN downloads worldwide
✅ Professional & reliable
✅ Easy Python integration

### Step-by-Step Setup:

#### 1. Upload Model to Hugging Face

```bash
# Install Hugging Face CLI
pip install huggingface_hub

# Login to Hugging Face
huggingface-cli login
# Enter your token from https://huggingface.co/settings/tokens

# Create a new model repository
huggingface-cli repo create food-expiry-model --type model

# Upload your model
huggingface-cli upload food-expiry-model ./food_expiry_model.h5 food_expiry_model.h5
```

**OR** Upload manually:
1. Go to https://huggingface.co/new
2. Create new Model repository: `food-expiry-model`
3. Click "Files" → "Add file" → Upload `food_expiry_model.h5`

#### 2. Configure Your App

Update your `.env` file:
```bash
HUGGINGFACE_REPO=YOUR_USERNAME/food-expiry-model
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 3. Deploy to Render (FREE)

1. **Push to GitHub:**
```bash
git add .
git commit -m "Add model auto-download for deployment"
git push origin main
```

2. **Deploy on Render:**
   - Go to https://render.com (Sign up free)
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Configure:
     - **Name:** food-expiry-tracker
     - **Environment:** Python 3
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `gunicorn app:app`
   - Add Environment Variables:
     - `HUGGINGFACE_REPO` = `your-username/food-expiry-model`
     - `GEMINI_API_KEY` = `your-api-key`
   - Click "Create Web Service"

**That's it!** Your app will be live at `https://food-expiry-tracker.onrender.com`

---

## 🎯 Option 2: Google Drive + Railway/Render (FREE)

### Step-by-Step:

#### 1. Upload Model to Google Drive

1. Upload `food_expiry_model.h5` to Google Drive
2. Right-click → "Get link" → Set to "Anyone with the link"
3. Copy the link, it looks like:
   ```
   https://drive.google.com/file/d/1ABC123XYZ_FILE_ID_HERE/view?usp=sharing
   ```
4. Extract the FILE_ID from the URL (the part between `/d/` and `/view`)

#### 2. Configure Environment Variable

Add to `.env`:
```bash
GOOGLE_DRIVE_FILE_ID=1ABC123XYZ_FILE_ID_HERE
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 3. Deploy (same as Option 1, step 3)

---

## 🎯 Option 3: Git LFS (GitHub Large File Storage)

### Setup:

```bash
# Install Git LFS
git lfs install

# Track .h5 files
git lfs track "*.h5"

# Add and commit
git add .gitattributes
git add food_expiry_model.h5
git commit -m "Add model with Git LFS"
git push origin main
```

**Note:** GitHub Free tier includes:
- 1GB storage
- 1GB bandwidth/month

For deployment, use **Render** or **Railway** (both support Git LFS).

---

## 🎯 Other FREE Deployment Platforms

### 1. **Railway** (https://railway.app)
- 500 hours/month free
- Supports Git LFS
- Auto-deploys from GitHub
- Setup same as Render

### 2. **Fly.io** (https://fly.io)
- Free tier available
- Good performance
- Supports Docker

### 3. **PythonAnywhere** (https://pythonanywhere.com)
- Free tier: 512MB storage
- May need to upgrade for your model

---

## 📊 Comparison Table

| Platform | Storage | Bandwidth | Best For |
|----------|---------|-----------|----------|
| **Hugging Face** | Unlimited | Unlimited | ⭐ BEST for models |
| **Google Drive** | 15GB free | Unlimited | Good alternative |
| **Git LFS** | 1GB free | 1GB/mo | Small models only |
| **Render** | ✅ Free tier | ✅ Free tier | ⭐ BEST for hosting app |
| **Railway** | ✅ 500hrs/mo | ✅ Free tier | Great for hosting |

---

## 🎯 My Recommendation

**Best Setup (100% FREE):**
1. **Model:** Upload to Hugging Face Hub
2. **App:** Deploy on Render
3. **Cost:** $0/month
4. **Reliability:** ⭐⭐⭐⭐⭐

---

## 🔧 Testing Model Download Locally

Before deploying, test the download script:

```bash
# Set environment variable
export HUGGINGFACE_REPO=your-username/food-expiry-model
# Or for Windows:
set HUGGINGFACE_REPO=your-username/food-expiry-model

# Rename your current model to test download
mv food_expiry_model.h5 food_expiry_model.h5.backup

# Run the download script
python download_model.py

# If successful, you should see the model downloaded
ls -lh food_expiry_model.h5
```

---

## 🆘 Troubleshooting

### Model download fails on deployment:
1. Check environment variable is set correctly
2. Verify model is public on Hugging Face
3. Check deployment logs for errors

### Out of memory errors:
- Use Render's free tier (512MB RAM)
- Consider upgrading if needed (still very cheap)
- Optimize model size if possible

---

## 📝 Quick Start Commands

```bash
# 1. Upload to Hugging Face
huggingface-cli login
huggingface-cli repo create food-expiry-model --type model
huggingface-cli upload food-expiry-model ./food_expiry_model.h5 food_expiry_model.h5

# 2. Update .env
echo "HUGGINGFACE_REPO=YOUR_USERNAME/food-expiry-model" >> .env

# 3. Push to GitHub
git add .
git commit -m "Add deployment configuration"
git push origin main

# 4. Deploy on Render (via website)
# → https://render.com
```

---

## 🎉 Success!

Once deployed, your app will:
- ✅ Automatically download the model on first startup
- ✅ Cache it for subsequent requests
- ✅ Be accessible worldwide
- ✅ Cost you $0

**Live URL Example:** `https://your-app.onrender.com`

Share it with the world! 🌍
