# 🚀 Quick Deploy: 3 Simple Steps

## 1️⃣ Upload Model to Hugging Face (5 minutes)

Visit: https://huggingface.co/new

1. Create account (free)
2. Click "New Model" → Name it `food-expiry-model`
3. Upload your `food_expiry_model.h5` file
4. Make it public

**Your model URL:** `https://huggingface.co/YOUR_USERNAME/food-expiry-model`

---

## 2️⃣ Update Environment Variable

Create `.env` file:
```bash
HUGGINGFACE_REPO=YOUR_USERNAME/food-expiry-model
GEMINI_API_KEY=your_api_key_here
```

---

## 3️⃣ Deploy to Render (5 minutes)

Visit: https://render.com

1. Sign up (free)
2. "New" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
5. Add Environment Variables (from your `.env`)
6. Click "Create"

**Done!** Your app will be live in ~5 minutes at:
`https://your-app.onrender.com`

---

## Alternative: Google Drive Method

1. Upload model to Google Drive → Get shareable link
2. Extract FILE_ID from URL
3. Set environment variable:
   ```
   GOOGLE_DRIVE_FILE_ID=your_file_id_here
   ```
4. Deploy to Render (same as above)

---

## 💰 Total Cost: $0 (100% FREE)

- ✅ Hugging Face: Free unlimited storage
- ✅ Render: Free tier (512MB RAM, enough for this app)
- ✅ No credit card required

---

## 📚 Need More Help?

See full guide: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
