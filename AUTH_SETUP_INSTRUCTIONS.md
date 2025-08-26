# Swiftly Authentication Setup Instructions

## 🚀 Complete Authentication System Setup

This guide will help you set up the fully functional authentication system for your Swiftly app.

## 📋 Prerequisites

- A Supabase project (free tier works)
- Node.js and npm installed
- Your Swiftly app running locally

## 🔧 Step 1: Supabase Project Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be ready (usually 2-3 minutes)

### 1.2 Get Your Credentials
1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## 🔑 Step 2: Environment Variables

### 2.1 Create .env.local file
Create a `.env.local` file in your project root with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.2 Replace the placeholder values
- Replace `your_supabase_project_url_here` with your actual Project URL
- Replace `your_supabase_anon_key_here` with your actual Anon Key

## 🗄️ Step 3: Database Setup

### 3.1 Run the SQL Script
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire content of `SUPABASE_SETUP.sql`
3. Paste it into the SQL Editor
4. Click **Run** to execute the script

### 3.2 Verify the Setup
After running the script, you should see:
- `api.profiles` table created
- `api.user_sessions` table created
- RLS policies enabled
- Functions and triggers created

## 🎯 Step 4: Test the Authentication

### 4.1 Start Your App
```bash
npm run dev
```

### 4.2 Test Sign Up
1. Go to `http://localhost:3000/auth`
2. Click "Sign up" to switch to signup mode
3. Fill in:
   - **Full Name**: Your name
   - **Email**: Your email
   - **Password**: At least 6 characters
4. Click "Create Account"

### 4.3 Test Sign In
1. After successful signup, you'll be redirected to signin
2. Use your email and password to sign in
3. You should be redirected to `/dashboard`

### 4.4 Test Forgot Password
1. On the signin form, click "Forgot your password?"
2. Enter your email
3. Check your inbox for reset instructions

## 🔍 Step 5: Verify Everything Works

### 5.1 Check Dashboard Access
- After signing in, you should see your dashboard
- The dashboard should display your real name and email
- You should see "Welcome back, [Your Name]!"

### 5.2 Check Profile Data
- Your profile should be automatically created in `api.profiles`
- You can verify this in Supabase Dashboard → Table Editor → `api.profiles`

### 5.3 Test Logout
- Click the logout button in the dashboard
- You should be redirected to `/auth`

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Missing Supabase environment variables"
- Make sure `.env.local` exists and has the correct values
- Restart your development server after adding environment variables

#### 2. "Failed to fetch" errors
- Check your Supabase URL and key are correct
- Ensure your Supabase project is active
- Check the browser console for specific error messages

#### 3. "Profile not found" errors
- Make sure you ran the `SUPABASE_SETUP.sql` script
- Check that the `api.profiles` table exists
- Verify RLS policies are enabled

#### 4. Authentication redirects not working
- Check that your `NEXT_PUBLIC_APP_URL` is set correctly
- Ensure your Supabase project allows your localhost domain

### Debug Steps
1. Check browser console for errors
2. Verify environment variables are loaded
3. Check Supabase dashboard for any error logs
4. Ensure all SQL scripts ran successfully

## 🔒 Security Features

### What's Protected
- **Row Level Security (RLS)**: Users can only access their own data
- **Authentication Required**: Dashboard requires valid login
- **Secure Password Reset**: Email-based password reset flow
- **Session Management**: Automatic session handling

### RLS Policies
- Users can only view/edit their own profile
- Users can only access their own sessions
- All database operations require authentication

## 📱 Features Included

### ✅ Sign Up Form
- Full name, email, and password fields
- Email validation
- Password strength requirements (min 6 chars)
- Automatic profile creation

### ✅ Sign In Form
- Email and password fields
- Error handling for invalid credentials
- "No account found" specific error message

### ✅ Forgot Password
- Email-based password reset
- Success message with instructions
- Automatic redirect back to signin

### ✅ User Experience
- Loading states on all forms
- Success/error message display
- Smooth transitions between forms
- Responsive design for all devices
- Matches your homepage design

### ✅ Dashboard Integration
- Automatic redirect after successful auth
- Real user data display
- Protected route access
- Logout functionality

## 🎨 Design Features

### Visual Design
- Matches your homepage color scheme
- Smooth animations with Framer Motion
- Glass morphism effects
- Floating background elements
- Responsive for all screen sizes

### User Experience
- Clear form validation
- Helpful error messages
- Loading indicators
- Smooth form transitions
- Age-friendly design

## 🚀 Next Steps

### After Setup
1. **Customize the design** if needed
2. **Add additional fields** to the profile table
3. **Implement email verification** if required
4. **Add social login** (Google, GitHub, etc.)
5. **Enhance security** with additional measures

### Optional Enhancements
- Email verification flow
- Two-factor authentication
- Social login providers
- Profile picture upload
- Account deletion
- Password change functionality

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all steps were completed correctly
3. Check Supabase dashboard for errors
4. Review browser console for detailed error messages

## 🎉 Congratulations!

You now have a fully functional, secure authentication system that:
- ✅ Integrates seamlessly with your existing design
- ✅ Provides a smooth user experience
- ✅ Includes proper error handling
- ✅ Follows security best practices
- ✅ Is ready for production use

Your users can now sign up, sign in, reset passwords, and access their personalized dashboard!

