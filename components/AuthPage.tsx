'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

type AuthMode = 'signin' | 'signup' | 'forgot'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Form states
  const [signInData, setSignInData] = useState({ email: '', password: '' })
  const [signUpData, setSignUpData] = useState({ fullName: '', email: '', password: '' })
  const [forgotData, setForgotData] = useState({ email: '' })
  
  const { signIn, signUp, resetPassword, authLoading } = useAuth()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    try {
      const { error } = await signIn(signInData.email, signInData.password)
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setMessage({ type: 'error', text: 'No account found with this email.' })
        } else {
          setMessage({ type: 'error', text: error.message })
        }
      } else {
        setMessage({ type: 'success', text: 'Signing you in and setting up your profile...' })
        // Don't manually redirect - auth-context will handle it
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' })
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    try {
      const { error } = await signUp(signUpData.email, signUpData.password, signUpData.fullName)
      
      if (error) {
        if (error.message.includes('User already registered')) {
          setMessage({ type: 'error', text: 'An account with this email already exists.' })
        } else {
          setMessage({ type: 'error', text: error.message })
        }
      } else {
        setMessage({ type: 'success', text: 'Account created successfully! Setting up your profile...' })
        // Don't manually redirect - auth-context will handle it
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' })
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    try {
      const { error } = await resetPassword(forgotData.email)
      
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Check your inbox for reset instructions.' })
        setTimeout(() => setMode('signin'), 3000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' })
    }
  }

  const clearMessage = () => setMessage(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1626] via-[#111C59] to-[#4F5F73] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <g fill="none" fillRule="evenodd">
            <g fill="#ffffff" fillOpacity="0.1">
              <circle cx="30" cy="30" r="1"/>
            </g>
          </g>
        </svg>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-32 h-32 bg-[#ADB3BD]/30 rounded-full blur-xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-40 left-20 w-24 h-24 bg-[#4F5F73]/30 rounded-full blur-xl"
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold bg-gradient-to-r from-white to-[#ADB3BD] bg-clip-text text-transparent mb-2"
          >
            Swiftly
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/80 text-lg"
          >
            {mode === 'signin' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
          </motion.p>
        </div>

        {/* Auth Forms */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8"
        >
          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="signin-email"
                    type="email"
                    required
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#111C59] focus:border-transparent transition-all"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#111C59] focus:border-transparent transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#111C59] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0F1A4A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[#111C59] hover:text-[#0F1A4A] text-sm font-medium transition-colors"
                >
                  Forgot your password?
                </button>
              </div>

              <div className="text-center text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[#111C59] hover:text-[#0F1A4A] font-medium transition-colors"
                >
                  Sign up
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div>
                <label htmlFor="signup-fullname" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="signup-fullname"
                    type="text"
                    required
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#111C59] focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#111C59] focus:border-transparent transition-all"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#111C59] focus:border-transparent transition-all"
                    placeholder="Create a password (min. 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#111C59] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0F1A4A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-[#111C59] hover:text-[#0F1A4A] font-medium transition-colors"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotData.email}
                    onChange={(e) => setForgotData({ email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#111C59] focus:border-transparent transition-all"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#111C59] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0F1A4A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-[#111C59] hover:text-[#0F1A4A] font-medium transition-colors flex items-center justify-center mx-auto"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Message Display */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 p-4 rounded-lg flex items-center ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                ) : (
                  <div className="w-5 h-5 mr-2 text-red-600">⚠️</div>
                )}
                <span className="text-sm font-medium">{message.text}</span>
                <button
                  onClick={clearMessage}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <button
            onClick={() => window.location.href = '/'}
            className="text-white/80 hover:text-white transition-colors text-sm"
          >
            ← Back to Home
          </button>
        </motion.div>
      </div>
    </div>
  )
}
