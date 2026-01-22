# 🚀 Vercel Quick Deploy (No Card Required)

## 1. Push to GitHub
```bash
git add .
git commit -m "Setup for Vercel deployment"
git push origin main
```

## 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Login with GitHub
3. Import `auth-backend` repo
4. Add **Environment Variables** (check your `.env` file)
5. Click **Deploy**

## 3. Test API
Open: `https://your-project.vercel.app/api/usercount`

## 4. Update Frontend
```javascript
const API_URL = 'https://your-project.vercel.app';
```

---
**Note:** No credit card needed on Vercel!
