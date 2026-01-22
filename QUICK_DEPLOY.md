# Quick Deployment Checklist for Render.com

## ✅ Pre-Deployment (Already Done)
- [x] Start script added to package.json
- [x] .gitignore created
- [x] Server configured for production
- [x] Documentation ready

---

## 🚀 Your Action Items

### Step 1: Push to GitHub (5 minutes)

Open terminal in backend folder and run:

```bash
# Initialize Git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Backend ready for deployment"

# Create GitHub repo at github.com/new
# Then connect and push:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

### Step 2: Deploy on Render (10 minutes)

1. **Sign Up:**
   - Go to [render.com](https://render.com)
   - Click "Get Started for Free"
   - Sign up with GitHub

2. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Select your repository
   - Click "Connect"

3. **Configuration:**
   ```
   Name: mediapp-backend
   Region: Singapore
   Branch: main
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

4. **Environment Variables:**
   Click "Add Environment Variable" for each:
   
   ```
   MONGO_URI = your_mongodb_connection_string_here
   
   SECRET_KEY = your_secure_random_secret_key
   
   EMAIL_USER = your_email@gmail.com
   
   EMAIL_PASS = your_gmail_app_password
   
   TWILIO_ACCOUNT_SID = your_twilio_account_sid
   
   TWILIO_AUTH_TOKEN = your_twilio_auth_token
   
   TWILIO_PHONE_NUMBER = +1234567890
   ```

   > **Note:** Use your actual credentials from your `.env` file when setting these on Render.

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 2-5 minutes
   - Copy your URL: `https://your-app.onrender.com`

---

### Step 3: Test API (2 minutes)

Open in browser:
```
https://your-app.onrender.com/api/usercount
```

Should show: `{"count":1}` or similar ✅

---

### Step 4: Update Frontend

In your mobile app, change API URL to:
```javascript
const API_URL = 'https://your-app.onrender.com';
```

---

## 🎉 Done!

Your backend is now live and accessible from anywhere!

**Note:** First request may take 30 seconds (cold start on free plan).

---

For detailed guide, see [DEPLOYMENT.md](./DEPLOYMENT.md)
