# 🚀 AWS Amplify Deployment Guide

## ⚠️ **CRITICAL: Environment Variables Setup**

Your deployment is failing because AWS Amplify can't find the required environment variables. Here's how to fix it:

## 🔧 **Step 1: Configure Environment Variables in AWS Amplify Console**

### **Go to AWS Amplify Console:**
1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app
3. Go to **App settings** → **Environment variables**

### **Add These Required Variables:**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Your Supabase anon key |

## 📋 **Step 2: Get Your Supabase Credentials**

### **From Supabase Dashboard:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🎯 **Step 3: Set Variables in Amplify**

### **In Amplify Console:**
1. Click **Add environment variable**
2. Add each variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://your-project.supabase.co`
   - **Branch**: `main` (or your deployment branch)
3. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Save**

## 🔄 **Step 4: Redeploy**

1. **Trigger a new deployment** by pushing to your branch
2. Or **Redeploy** from Amplify Console
3. **Monitor the build** - it should now succeed!

## 📁 **File Structure (Updated)**

```
Swiftly/
├── .gitignore          ← Updated to exclude .env files
├── .env.example        ← Template for reference
├── app/                ← Your Next.js app
├── components/         ← React components
├── lib/               ← Utilities and config
└── ...                ← Other files
```

## 🚫 **What NOT to Do**

- ❌ **Never commit `.env.local` to Git**
- ❌ **Don't hardcode secrets in your code**
- ❌ **Don't ignore environment variable setup**

## ✅ **What TO Do**

- ✅ **Set variables in AWS Amplify Console**
- ✅ **Use `.env.example` as a template**
- ✅ **Keep secrets secure and separate**
- ✅ **Test locally with `.env.local`**

## 🔍 **Troubleshooting**

### **Build Still Failing?**
1. **Check variable names** - must be exact
2. **Verify values** - copy from Supabase exactly
3. **Check branch** - variables must be set for your deployment branch
4. **Redeploy** - after setting variables

### **Common Errors:**
- `Environment variable not found` → Variable not set in Amplify
- `Invalid URL` → Check Supabase URL format
- `Authentication failed` → Check anon key

## 📞 **Need Help?**

1. **Check AWS Amplify logs** for specific error messages
2. **Verify Supabase credentials** are correct
3. **Ensure variables are set for the correct branch**

---

## 🎉 **After Setup**

Once environment variables are configured:
1. **Push any code changes** to trigger deployment
2. **Monitor build progress** in Amplify Console
3. **Your app should deploy successfully!**

**Remember**: Environment variables in Amplify Console are the key to successful deployment!
