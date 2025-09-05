'use client'

import { useState, FormEvent, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { analyzeAndCreateTask, type TaskIntentResult } from '@/lib/gemini-task-intent'
import { createEnhancedContext, createTaskPrompt, logContextInfo, type EnhancedUserContext } from '@/lib/ai-context-provider'

interface CleanAIChatProps {
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

interface Message {
  id: string
  content: string
  type: 'user' | 'ai' | 'error'
  timestamp: Date
  taskResult?: TaskIntentResult
  hasTask?: boolean
  isTaskCreated?: boolean
  taskId?: string
}

export default function CleanAIChat({ className = '', userContext, sessionId }: CleanAIChatProps) {
  // Core states
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null)
  const [messages, setMessages] = useState<Message[]>([])
  
  // Typing animation states
  const [typingText, setTypingText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [isFocused, setIsFocused] = useState(false)
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_GEMINI_API_URL || 'http://127.0.0.1:8000'

  // Typing animation effect
  useEffect(() => {
    const fullText = "Ask Swiftly…"
    let currentIndex = 0
    
    const typeText = () => {
      if (currentIndex < fullText.length) {
        setTypingText(fullText.slice(0, currentIndex + 1))
        currentIndex++
        typingTimeoutRef.current = setTimeout(typeText, 120) // 120ms per letter
      } else {
        // Wait a bit before restarting
        typingTimeoutRef.current = setTimeout(() => {
          setTypingText('')
          currentIndex = 0
          if (isTyping && !isFocused && !question.trim()) {
            typeText()
          }
        }, 2000) // 2 second pause before restart
      }
    }

    if (isTyping && !isFocused && !question.trim()) {
      typeText()
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [isTyping, isFocused, question])

  // Handle focus events
  const handleFocus = () => {
    setIsFocused(true)
    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (!question.trim()) {
      setIsTyping(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value)
    if (e.target.value.trim()) {
      setIsTyping(false)
    } else {
      setIsTyping(true)
    }
  }





  // Check if user is near bottom of chat
  const checkIfNearBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current
      const threshold = 150 // pixels from bottom
      const isNear = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
      return isNear
    }
    return true
  }, [])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      checkIfNearBottom()
    }, 100)
  }, [checkIfNearBottom])

  // Smooth scroll to bottom without affecting existing messages
  const scrollToBottom = useCallback((force: boolean = false) => {
    if (chatContainerRef.current && (checkIfNearBottom() || force)) {
      const container = chatContainerRef.current
      const targetScrollTop = container.scrollHeight - container.clientHeight
      
      // Use smooth scrolling
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      })
    }
  }, [checkIfNearBottom])

  // Auto-scroll only when new messages arrive and user is near bottom
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        scrollToBottom()
      }, 50)
      
      return () => clearTimeout(timeoutId)
    }
  }, [messages.length, scrollToBottom])

  // Setup scroll listener
  useEffect(() => {
    const container = chatContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        container.removeEventListener('scroll', handleScroll)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }
  }, [handleScroll])



  // Add a new message to the chat
  const addMessage = useCallback((
    content: string, 
    type: 'user' | 'ai' | 'error', 
    isTaskCreated?: boolean,
    taskId?: string
  ) => {
    const message: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content,
      type,
      timestamp: new Date(),
      isTaskCreated,
      taskId
    }
    
    setMessages(prev => {
      // Prevent duplicate messages
      const isDuplicate = prev.some(msg => 
        msg.content === content && 
        msg.type === type && 
        Math.abs(msg.timestamp.getTime() - message.timestamp.getTime()) < 1000
      )
      
      if (isDuplicate) return prev
      return [...prev, message]
    })
  }, [])

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([])
    setQuestion('')
    setIsLoading(false)
  }, [])

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!question.trim() || isLoading) return

    const userQuestion = question.trim()
    
    // Clear input immediately to prevent layout shifts
    setQuestion('')
    
    // Add user message
    addMessage(userQuestion, 'user')
    setIsLoading(true)

    try {
      // Check for task creation intent FIRST, before AI processing
      if (userContext?.user_id) {
        try {
          const intentResult = await analyzeAndCreateTask(userQuestion, userContext.user_id)
          
          if (intentResult.taskCreated && intentResult.taskId) {
            console.log('✅ Task created:', intentResult.taskName)
            
            // Generate natural, conversational responses with task details
            let baseResponses = [
              `Perfect! I've added "${intentResult.taskName}"`,
              `Got it! "${intentResult.taskName}" is ready`,
              `Done! Your "${intentResult.taskName}" task has been created`,
              `All set! I've added "${intentResult.taskName}"`,
              `Great! "${intentResult.taskName}" is now on your list`,
              `Sure thing! I've created "${intentResult.taskName}"`,
              `Absolutely! "${intentResult.taskName}" has been added`,
              `You got it! Your "${intentResult.taskName}" task is ready`,
              `Consider it done! "${intentResult.taskName}" is on your list`
            ]
            
            let response = baseResponses[Math.floor(Math.random() * baseResponses.length)]
            
            // Add natural details if available
            const details = []
            if (intentResult.dueDate) {
              const date = new Date(intentResult.dueDate)
              const dateStr = date.toLocaleDateString()
              const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              if (intentResult.dueDate.includes(':')) {
                details.push(`due ${dateStr} at ${timeStr}`)
              } else {
                details.push(`due ${dateStr}`)
              }
            }
            if (intentResult.priority && intentResult.priority !== 'medium') {
              details.push(`${intentResult.priority} priority`)
            }
            if (intentResult.tags && intentResult.tags.length > 0) {
              details.push(`tagged as ${intentResult.tags.join(', ')}`)
            }
            if (intentResult.assignees && intentResult.assignees.length > 0) {
              details.push(`assigned to ${intentResult.assignees.join(', ')}`)
            }
            
            if (details.length > 0) {
              response += ` with ${details.join(', ')}.`
            } else {
              response += ` to your tasks.`
            }
            
            addMessage(response, 'ai')
            return // Skip normal AI processing entirely
            
          } else if (intentResult.hasTaskIntent && intentResult.needsClarity) {
            console.log('⚠️ Task intent detected but needs clarity')
            
            // Ask for task name naturally like a personal assistant
            const clarityResponses = [
              'What should I call this task?',
              'What would you like to name this task?',
              'What name should I give this task?',
              'How would you like me to label this?',
              'What do you want to call it?',
              'What name works best for this task?',
              'How should I title this task?',
              'What would be a good name for this?'
            ]
            
            // Use clarification message from Gemini if provided, otherwise use random response
            const clarityMessage = intentResult.clarificationMessage || 
              clarityResponses[Math.floor(Math.random() * clarityResponses.length)]
            
            addMessage(clarityMessage, 'ai')
            return // Skip normal AI processing entirely
          }
        } catch (error) {
          console.error('Task creation error:', error)
          // Continue with normal AI processing if task creation fails
        }
      }

      // Only proceed with normal AI chat if no task was processed
      
      // Create enhanced context with real-time information
      let enhancedContext: EnhancedUserContext | null = null
      let enhancedPrompt = userQuestion
      
      if (userContext?.user_id) {
        enhancedContext = createEnhancedContext(
          userContext.user_id,
          userContext.preferences,
          userContext.tasks,
          userContext.reminders
        )
        
        enhancedPrompt = createTaskPrompt(userQuestion, enhancedContext)
        logContextInfo(enhancedContext)
      }
      
      const requestBody: any = {
        content: enhancedPrompt
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
        throw new Error(`Server error: ${response.status}`)
      }

      const data: APIResponse = await response.json()
      addMessage(data.response, 'ai')
      
      if (data.session_id) {
        setCurrentSessionId(data.session_id)
      }
      
    } catch (err) {
      console.error('API Error:', err)
      addMessage('Unable to connect to AI. Please try again.', 'error')
    } finally {
      setIsLoading(false)
      // Focus back to input without affecting scroll
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [question, isLoading, userContext, currentSessionId, API_BASE_URL, addMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (question.trim() && !isLoading) {
        const form = e.currentTarget.closest('form')
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
        }
      }
    }
  }, [question, isLoading])

  // Memoized message bubbles to prevent unnecessary re-renders
  const MessageBubble = useMemo(() => {
    const MessageBubbleComponent = ({ message, index }: { message: Message; index: number }) => {
      const isUser = message.type === 'user'
      const isError = message.type === 'error'
      const isTaskCreated = message.type === 'ai' && message.isTaskCreated
      const isAIWithTask = message.type === 'ai' && message.hasTask
      const isLast = index === messages.length - 1
      
      return (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
          ref={isLast ? lastMessageRef : undefined}
        >
          <div className={`max-w-[75%] ${isUser ? 'ml-16' : 'mr-16'}`}>
            <div className={`px-4 py-3 rounded-2xl ${
              isUser 
                ? 'bg-gradient-to-r from-[#111C59] to-[#4F5F73] text-white shadow-lg' 
                : isError
                  ? 'bg-red-50 border border-red-200 text-red-800 shadow-md'
                  : isTaskCreated
                    ? 'bg-green-50 border border-green-200 text-green-800 shadow-md'
                    : isAIWithTask
                      ? 'bg-green-50 border border-green-200 text-gray-900 shadow-md'
                      : 'bg-white text-gray-900 shadow-md border border-gray-100'
            }`}>
              {isTaskCreated ? (
                // Special styling for task creation messages
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
                </div>
              ) : isAIWithTask ? (
                // Special styling for AI messages that created tasks
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
            {isUser && (
              <div className="text-xs text-gray-400 mt-2 text-right">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {(isTaskCreated || isAIWithTask) && (
              <div className="text-xs text-green-600 mt-2 text-left flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Task added to your task list</span>
              </div>
            )}
          </div>
        </motion.div>
      )
    }
    
    return MessageBubbleComponent
  }, [messages.length])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-6 py-8"
        >
          {/* Loading history indicator */}


          {/* Welcome message when empty */}
                      {messages.length === 0 && !isLoading && (
            <div className="flex justify-start mb-6">
              <div className="max-w-[75%] mr-16">
                <div className="px-4 py-3 rounded-2xl shadow-md bg-white text-gray-900 border border-gray-100">
                  <p className="text-sm leading-relaxed">
                    Hello! I&apos;m your AI assistant. How can I help you today?
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Messages - Render with keys to prevent re-renders */}
          {messages.map((message, index) => (
            <MessageBubble key={message.id} message={message} index={index} />
          ))}
          
          {/* Loading indicator - positioned absolutely to not affect layout */}
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="max-w-[75%] mr-16">
                <div className="px-4 py-3 rounded-2xl shadow-md bg-white text-gray-900 border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Sticky Input Area */}
      <div className="flex-shrink-0 border-t border-gray-200">
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="w-full">
            {/* Single-line Input Container */}
            <div className="relative w-full">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder=""
                className="w-full border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#111C59] focus:border-[#111C59] bg-white transition-all duration-200"
                disabled={isLoading}
                aria-label="Ask Swiftly anything"
              />
              
              {/* Custom Typing Placeholder */}
              {!question.trim() && !isFocused && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <span className="inline-block">
                    {typingText}
                    <span className="animate-pulse">|</span>
                  </span>
                </div>
              )}
              
              {/* Dynamic Button - Speaking or Send */}
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#111C59] hover:bg-[#0F1626] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={question.trim() ? "Send message" : "Start speaking"}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin transition-opacity duration-300"></div>
                ) : question.trim() ? (
                  // Send Button (when text is present) - Upward Arrow
                  <svg className="w-4 h-4 text-white transition-all duration-300 ease-in-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  // Speaking SVG (when input is empty) - 3 Bar Waveform
                  <svg className="w-4 h-4 text-white transition-all duration-300 ease-in-out" viewBox="0 0 16 16" fill="currentColor">
                    {/* Bar 1 - Left */}
                    <rect x="2" y="8" width="2" height="6" rx="1">
                      <animate attributeName="height" values="6;2;6" dur="1.3s" repeatCount="indefinite" />
                      <animate attributeName="y" values="8;12;8" dur="1.3s" repeatCount="indefinite" />
                    </rect>
                    {/* Bar 2 - Center */}
                    <rect x="7" y="6" width="2" height="8" rx="1">
                      <animate attributeName="height" values="8;4;8" dur="1.1s" repeatCount="indefinite" />
                      <animate attributeName="y" values="6;10;6" dur="1.1s" repeatCount="indefinite" />
                    </rect>
                    {/* Bar 3 - Right */}
                    <rect x="12" y="7" width="2" height="7" rx="1">
                      <animate attributeName="height" values="7;3;7" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="y" values="7;11;7" dur="1.5s" repeatCount="indefinite" />
                    </rect>
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}