# 🚀 Backend Deployment Guide - Vercel (Truly FREE & No Card)

## Overview / خلاصہ

Agar Render.com aapse credit card maang raha hai, toh **Vercel** sabse behtreen alternative hai. Yeh bilkul **FREE** hai aur deployment ke liye koi credit card ya card details nahi maangta.

**Vercel ke Fayde (Benefits):**
- ✅ **Koi Card Nahi Chahiye** - Bilkul free sign up
- ✅ **Super Fast** - Global network pe chalta hai
- ✅ **Automatic Deploy** - GitHub se connect hote hi live
- ✅ **HTTPS** - Secure link by default

---

## 📋 Step 1: Code Ko GitHub Pe Update Karein

Maine project mein `vercel.json` add kar di hai. Aapko bas apna naya code GitHub pe push karna hai:

```bash
cd "d:\Local_D\SignUp & Login\backend"
git add .
git commit -m "Add Vercel configuration"
git push origin main
```

---

## 🌐 Step 2: Vercel Account Setup

1. [Vercel.com](https://vercel.com) pe jao.
2. **Sign Up** click karein aur **Continue with GitHub** select karein.
3. Apna GitHub account connect karein.

---

## 🚀 Step 3: Project Deploy Karein

1. Vercel dashboard mein **Add New...** → **Project** click karein.
2. Apni repository `auth-backend` ke saamne **Import** button click karein.
3. **Configure Project** screen pe:
   - **Project Name**: `auth-backend` (ya jo aap chahein)
   - **Framework Preset**: `Other` (Node.js select ho jayega)
   - **Root Directory**: `./`

### 🔐 Step 4: Environment Variables Set Karein
Deploy button ke upar **Environment Variables** ka section hoga. Wahan in keys ko add karein:

| Key | Value |
|-----|-------|
| `MONGO_URI` | Apne `.env` se copy karein |
| `SECRET_KEY` | Apne `.env` se copy karein |
| `EMAIL_USER` | `team.mediapp@gmail.com` |
| `EMAIL_PASS` | `xhsdwtvniwgdlyrc` |
| `TWILIO_ACCOUNT_SID` | `ACb...` |
| `TWILIO_AUTH_TOKEN` | `cd9...` |
| `TWILIO_PHONE_NUMBER` | `+16...` |

4. **Deploy** click karein!

---

## ✅ Step 5: Test Karein

Vercel aapko ek link dega (e.g., `https://auth-backend.vercel.app`).

Check karne ke liye browser mein kholo:
`https://your-app.vercel.app/api/usercount`

---

## ⚠️ Important Note (Vercel Limitations)

Vercel **Serverless** hai, iska matlab:
1. **Persistent Files**: Agar aap app se koi image upload karenge (`Uploads/` folder mein), toh woh kuch der baad delete ho jayegi kyunki Vercel server hamesha reset hota rehta hai. 
   - *Test base ke liye theek hai*, lekin final app ke liye hum image upload ke liye **Cloudinary** use karenge.
2. **First Request**: Agar kaafi der tak koi use na kare, toh pehli request thoda time legi (Cold Start).

---

## 📱 Frontend Connect Karo

Mobile app mein API URL change karein:
```javascript
const API_URL = 'https://your-app.vercel.app';
```

---

*Guide prepared for MediApp Backend - Vercel Deployment*
