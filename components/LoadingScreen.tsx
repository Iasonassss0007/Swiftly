'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Zap, Target, Calendar, Users, BarChart3 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface LoadingScreenProps {
  isLoading?: boolean
  message?: string
  type?: 'app' | 'auth' | 'tasks' | 'dashboard' | 'custom'
}

const loadingMessages = {
  app: [
    'Initializing Swiftly...',
    'Setting up your workspace...',
    'Loading your data...',
    'Almost ready...'
  ],
  auth: [
    'Authenticating...',
    'Verifying credentials...',
    'Setting up session...',
    'Welcome back!'
  ],
  tasks: [
    'Loading your tasks...',
    'Syncing data...',
    'Organizing priorities...',
    'Ready to be productive!'
  ],
  dashboard: [
    'Preparing dashboard...',
    'Loading analytics...',
    'Gathering insights...',
    'Your overview is ready!'
  ],
  custom: ['Loading...']
}

const typeIcons = {
  app: Zap,
  auth: Users,
  tasks: CheckSquare,
  dashboard: BarChart3,
  custom: Target
}

export default function LoadingScreen({ 
  isLoading = true, 
  message, 
  type = 'app' 
}: LoadingScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [displayMessage, setDisplayMessage] = useState(message || loadingMessages[type][0])
  
  const Icon = typeIcons[type]
  const messages = loadingMessages[type]

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        const nextIndex = (prev + 1) % messages.length
        setDisplayMessage(message || messages[nextIndex])
        return nextIndex
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isLoading, message, messages])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-white z-[9999] flex items-center justify-center"
        >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111C59' fill-opacity='1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative flex flex-col items-center space-y-8">
        {/* Logo and Brand */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center space-y-4"
        >
          {/* Logo Container */}
          <div className="relative">
            {/* Main Logo Circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-br from-[#111C59] to-[#4F5F73] rounded-2xl flex items-center justify-center shadow-lg"
            >
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
              >
                <Icon className="w-9 h-9 text-white" strokeWidth={2.5} />
              </motion.div>
            </motion.div>

            {/* Orbiting Icons */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
              className="absolute inset-0 w-20 h-20"
            >
              {/* Task Icon */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rounded-lg shadow-md flex items-center justify-center"
              >
                <CheckSquare className="w-3 h-3 text-[#111C59]" />
              </motion.div>

              {/* Target Icon */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rounded-lg shadow-md flex items-center justify-center"
              >
                <Target className="w-3 h-3 text-[#4F5F73]" />
              </motion.div>
            </motion.div>
          </div>

          {/* Brand Name */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.6 }}
            className="text-3xl font-bold bg-gradient-to-r from-[#111C59] to-[#4F5F73] bg-clip-text text-transparent"
          >
            Swiftly
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.8 }}
            className="text-gray-500 text-sm font-medium tracking-wide"
          >
            Intelligent Task Management
          </motion.p>
        </motion.div>

        {/* Loading Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="flex flex-col items-center space-y-4"
        >
          {/* Progress Bar */}
          <div className="w-64 h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 2,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatDelay: 0.5
              }}
              className="h-full w-1/3 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full"
            />
          </div>

          {/* Loading Message */}
          <motion.p
            key={displayMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-gray-400 text-sm font-medium"
          >
            {displayMessage}
          </motion.p>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating Dot 1 */}
          <motion.div
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 4,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: 0
            }}
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#111C59]/20 rounded-full"
          />

          {/* Floating Dot 2 */}
          <motion.div
            animate={{
              y: [20, -20, 20],
              x: [10, -10, 10],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 5,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: 1
            }}
            className="absolute top-3/4 right-1/4 w-3 h-3 bg-[#4F5F73]/20 rounded-full"
          />

          {/* Floating Dot 3 */}
          <motion.div
            animate={{
              y: [-15, 15, -15],
              x: [15, -15, 15],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{
              duration: 3.5,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: 2
            }}
            className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-[#111C59]/30 rounded-full"
          />
        </div>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Preset loading screens for different contexts
export const AppLoadingScreen = () => (
  <LoadingScreen type="app" />
)

export const AuthLoadingScreen = () => (
  <LoadingScreen type="auth" />
)

export const TasksLoadingScreen = () => (
  <LoadingScreen type="tasks" />
)

export const DashboardLoadingScreen = () => (
  <LoadingScreen type="dashboard" />
)
