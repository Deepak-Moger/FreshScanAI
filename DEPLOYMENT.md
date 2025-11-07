# 🚀 Deployment Guide - Food Expiry Tracker

This guide will help you deploy your Food Expiry Tracker application online for free.

## 📋 Prerequisites

- GitHub account
- Git installed on your local machine
- Your Gemini API key

---

## 🌟 Option 1: Deploy on Render.com (RECOMMENDED)

**Best for:** Apps with large dependencies like TensorFlow and EasyOCR

### Step 1: Prepare Your Code

1. Create a `.env` file in your project root (for local testing):
```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

2. Make sure `.env` is in your `.gitignore` (already done!)

### Step 2: Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Food Expiry Tracker"

# Create a new repository on GitHub (https://github.com/new)
# Then link and push:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render

1. **Sign up** at [Render.com](https://render.com) (free with GitHub)

2. **Create a New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your repository

3. **Configure the service:**
   - **Name:** `food-expiry-tracker` (or any name)
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free

4. **Set Environment Variables:**
   - Click "Environment" tab
   - Add: `GEMINI_API_KEY` = `your_gemini_api_key`

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes for initial build
   - Your app will be live at: `https://food-expiry-tracker.onrender.com`

### Important Notes for Render:
- ⚠️ Free tier apps sleep after 15 min inactivity (30s wake time)
- ✅ First build takes 10+ minutes (TensorFlow is large)
- ✅ Model file (`food_expiry_model.h5`) will persist

---

## 🚂 Option 2: Deploy on Railway.app

**Best for:** $5/month free credit (enough for moderate usage)

### Steps:

1. **Sign up** at [Railway.app](https://railway.app)

2. **Deploy from GitHub:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure:**
   - Railway auto-detects Python
   - Add environment variable: `GEMINI_API_KEY`

4. **Generate domain:**
   - Go to Settings → Generate Domain
   - Your app will be at: `https://your-app.up.railway.app`

### Important Notes:
- ⚠️ $5 credit = ~500 hours of runtime
- ✅ No cold starts
- ✅ Better for production use

---

## 🤗 Option 3: Hugging Face Spaces

**Best for:** ML applications with unlimited free tier

### Steps:

1. **Sign up** at [Hugging Face](https://huggingface.co)

2. **Create a new Space:**
   - Go to Spaces → Create new Space
   - Name: `food-expiry-tracker`
   - SDK: **Gradio** or **Streamlit** (requires UI rewrite)
   - License: Apache 2.0

3. **Upload files:**
   - Push your code via git or web interface
   - Set secrets in Settings → Repository secrets

### Important Notes:
- ⚠️ Requires adapting your Flask app to Gradio/Streamlit
- ✅ Unlimited free hosting for ML models
- ✅ Automatic GPU acceleration available

---

## 🐍 Option 4: PythonAnywhere

**Best for:** Simple Flask apps (may struggle with large dependencies)

### Steps:

1. **Sign up** at [PythonAnywhere](https://www.pythonanywhere.com)

2. **Upload your code:**
   - Use "Files" tab to upload
   - Or clone from GitHub using Bash console

3. **Configure Web App:**
   - Web tab → Add new web app
   - Python 3.10 → Flask
   - Set working directory: `/home/yourusername/foodexpirytracker`
   - Edit WSGI file to point to `app.py`

4. **Install requirements:**
```bash
pip install --user -r requirements.txt
```

### Important Notes:
- ⚠️ Free tier has 512MB storage (TensorFlow might be too large)
- ⚠️ Limited CPU time on free tier
- ✅ Always-on (no cold starts)

---

## 🔒 Security Best Practices

1. **Never commit your `.env` file** ✅ (already in .gitignore)
2. **Always use environment variables** for API keys ✅ (already implemented)
3. **Regenerate your Gemini API key** if accidentally exposed
4. **Enable GitHub repository security scanning**

---

## 📊 Cost Comparison

| Platform | Free Tier | Cold Starts | ML Support | Best For |
|----------|-----------|-------------|------------|----------|
| **Render** | 750hrs/mo | Yes (30s) | ✅ Excellent | Your app! |
| **Railway** | $5 credit | No | ✅ Excellent | Production |
| **HF Spaces** | Unlimited | No | ✅ Best | ML demos |
| **PythonAnywhere** | Limited | No | ⚠️ Limited | Simple apps |

---

## 🎯 Recommended: Render.com

For your food expiry tracker, **Render.com** is the best choice because:

1. ✅ Handles TensorFlow & EasyOCR without issues
2. ✅ Free tier is generous (750 hours)
3. ✅ Simple deployment process
4. ✅ Persistent storage for model file
5. ✅ Auto-deploys on git push

---

## 🆘 Troubleshooting

### Build fails on Render:
- Check logs for specific error
- Ensure `food_expiry_model.h5` is committed to git
- Verify `requirements.txt` has all dependencies

### App crashes after deployment:
- Check environment variables are set
- Verify `GEMINI_API_KEY` is correct
- Check application logs

### Slow cold starts:
- Normal for free tiers with ML models
- Consider Railway for no cold starts
- Or implement a keep-alive ping service

---

## 📱 Testing Your Deployment

After deployment, test:
1. ✅ Homepage loads
2. ✅ Upload image for freshness detection
3. ✅ Upload image for expiry date extraction
4. ✅ Webcam capture works (may need HTTPS)
5. ✅ Results display correctly

---

## 🔄 Continuous Deployment

Once set up, future updates are automatic:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push

# Your hosting platform auto-deploys! 🎉
```

---

## 📞 Need Help?

- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Hugging Face Docs: https://huggingface.co/docs
- PythonAnywhere: https://help.pythonanywhere.com

---

**Ready to deploy? Start with Render.com!** 🚀
