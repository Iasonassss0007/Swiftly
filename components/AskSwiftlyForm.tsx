'use client'

import { useState, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AskSwiftlyFormProps {
  className?: string
  userContext?: UserContext
  sessionId?: string
}

interface APIResponse {
  response: string
  processing_time: number
  session_id: string
}

interface UserContext {
  user_id?: string
  tasks?: string[]
  reminders?: string[]
  preferences?: Record<string, any>
}

export default function AskSwiftlyForm({ className = '', userContext, sessionId }: AskSwiftlyFormProps) {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentSessionId, setCurrentSessionId] = useState(sessionId)

  const API_BASE_URL = process.env.NEXT_PUBLIC_GEMINI_API_URL || 'http://127.0.0.1:8000'

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!question.trim()) {
      setError('Please enter a question')
      return
    }

    setIsLoading(true)
    setError('')
    setResponse('')

    try {
      const requestBody: any = {
        content: question.trim()
      }

      if (userContext) {
        requestBody.user_context = userContext
      }

      if (currentSessionId) {
        requestBody.session_id = currentSessionId
      }

      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Swiftly AI is temporarily unavailable. Please wait a moment and try again.')
        } else if (response.status === 500) {
          throw new Error('Swiftly AI service is temporarily unavailable. Please try again.')
        } else {
          throw new Error(`Server error: ${response.status}`)
        }
      }

      const data: APIResponse = await response.json()
      setResponse(data.response)
      
      // Store session ID for conversation continuity
      if (data.session_id) {
        setCurrentSessionId(data.session_id)
      }
      
    } catch (err) {
      console.error('API Error:', err)
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
          setError('Unable to connect to Swiftly AI. Please check if the Python API server is running.')
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const clearResponse = () => {
    setResponse('')
    setError('')
    // Optionally reset session for a fresh start
    // setCurrentSessionId(undefined)
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Ask Swiftly Form */}
      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="ask-swiftly" className="sr-only">
          Ask Swiftly anything
        </label>
        <input
          id="ask-swiftly"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask Swiftly to schedule, remind, or fetch notes..."
          className="w-full px-6 py-4 pr-32 text-lg border border-[#ADB3BD]/30 rounded-xl focus:ring-2 focus:ring-[#111C59] focus:border-[#111C59] transition-all duration-200 placeholder-[#4F5F73]/60 bg-white/95 backdrop-blur-sm shadow-sm"
          aria-describedby="ask-description"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-[#111C59] to-[#4F5F73] text-white font-semibold rounded-lg hover:from-[#0F1626] hover:to-[#111C59] focus:ring-2 focus:ring-[#111C59] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isLoading ? 'Asking...' : 'Ask'}
        </button>
      </form>

      {/* Response Display */}
      <AnimatePresence mode="wait">
        {(response || error) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            {error ? (
              // Error Display
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Connection Error
                      </h3>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={clearResponse}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    aria-label="Clear error"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              // AI Response Display
              <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-[#ADB3BD]/30 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[#0F1626]">Swiftly AI Response</h3>
                  </div>
                  <button
                    onClick={clearResponse}
                    className="text-[#4F5F73] hover:text-[#111C59] transition-colors"
                    aria-label="Clear response"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="prose prose-sm max-w-none">
                  <p className="text-[#0F1626] leading-relaxed whitespace-pre-wrap">
                    {response}
                  </p>
                </div>
                
                {/* Question Context */}
                <div className="mt-4 pt-4 border-t border-[#ADB3BD]/20">
                  <p className="text-sm text-[#4F5F73]">
                    <span className="font-medium">Your question:</span> {question}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-[#ADB3BD]/30 p-6 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0F1626]">Thinking...</h3>
                  <p className="text-sm text-[#4F5F73]">Swiftly AI is processing your request</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden description for accessibility */}
      <p id="ask-description" className="sr-only">
        Ask Swiftly anything about scheduling, reminders, notes, or task management
      </p>
    </div>
  )
}