'use client'

import { useState, FormEvent, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { processAIForTasks, TaskCreationResult } from '@/lib/ai-task-service'
import { emitTaskCreated } from '@/lib/use-ai-task-integration'
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
  type: 'user' | 'ai' | 'error' | 'task-created'
  timestamp: Date
  taskResult?: TaskCreationResult // For task creation messages
  hasTask?: boolean // Indicates if this AI message created a task
}

export default function CleanAIChat({ className = '', userContext, sessionId }: CleanAIChatProps) {
  // Core states
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(sessionId)
  const [messages, setMessages] = useState<Message[]>([])
  const [isUserNearBottom, setIsUserNearBottom] = useState(true)
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_GEMINI_API_URL || 'http://127.0.0.1:8000'

  // Check if user is near bottom of chat
  const checkIfNearBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current
      const threshold = 150 // pixels from bottom
      const isNear = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
      setIsUserNearBottom(isNear)
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
    if (chatContainerRef.current && (isUserNearBottom || force)) {
      const container = chatContainerRef.current
      const targetScrollTop = container.scrollHeight - container.clientHeight
      
      // Use smooth scrolling
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      })
    }
  }, [isUserNearBottom])

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

  // Auto-resize textarea without affecting scroll or layout
  const handleTextareaResize = useCallback(() => {
    if (inputRef.current) {
      const textarea = inputRef.current
      const previousScrollTop = chatContainerRef.current?.scrollTop || 0
      
      // Reset height to calculate new height
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 120)
      textarea.style.height = newHeight + 'px'
      
      // Restore scroll position to prevent jump
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = previousScrollTop
      }
    }
  }, [])

  useEffect(() => {
    handleTextareaResize()
  }, [question, handleTextareaResize])

  // Add a new message to the chat without affecting existing messages
  const addMessage = useCallback((content: string, type: 'user' | 'ai' | 'error') => {
    const message: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content,
      type,
      timestamp: new Date()
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
        
        // Create task-aware prompt with real-time context
        enhancedPrompt = createTaskPrompt(userQuestion, enhancedContext)
        
        // Log context for debugging
        logContextInfo(enhancedContext)
      }
      
      const requestBody: any = {
        content: enhancedPrompt // Use enhanced prompt instead of raw user question
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

      // Process AI response for task creation with enhanced context
      if (userContext?.user_id && enhancedContext) {
        try {
          console.log('Processing AI response for task creation with real-time context...')
          const taskResult = await processAIForTasks(
            userContext.user_id,
            userQuestion,
            data.response,
            enhancedContext.realTime // Pass real-time context for better date parsing
          )
          
          if (taskResult.success && taskResult.task) {
            // Generate a friendly, natural confirmation message to append to AI response
            const friendlyConfirmations = [
              `Got it! I created a task named '${taskResult.task.title}' for you.`,
              `All set! '${taskResult.task.title}' is now on your tasks page.`,
              `Done! I've added '${taskResult.task.title}' to your tasks.`,
              `Perfect! Task '${taskResult.task.title}' has been created.`,
              `✅ Created! '${taskResult.task.title}' is ready on your task list.`,
              `Task created! You'll find '${taskResult.task.title}' in your tasks now.`
            ]
            
            // Build the confirmation message with task details
            let confirmationMessage = friendlyConfirmations[Math.floor(Math.random() * friendlyConfirmations.length)]
            
            // Add due date info if available
            if (taskResult.task.dueDate) {
              const dueDateStr = taskResult.task.dueDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })
              confirmationMessage += ` Due date is set for ${dueDateStr}.`
            }
            
            // Add priority info if high priority
            if (taskResult.task.priority === 'high') {
              confirmationMessage += ` I've marked it as high priority.`
            }
            
            // Replace the AI's response with our friendly confirmation
            setMessages(prev => {
              const updatedMessages = [...prev]
              // Find and update the last AI message
              for (let i = updatedMessages.length - 1; i >= 0; i--) {
                if (updatedMessages[i].type === 'ai') {
                  updatedMessages[i] = {
                    ...updatedMessages[i],
                    content: confirmationMessage,
                    hasTask: true // Mark this message as having created a task
                  }
                  break
                }
              }
              return updatedMessages
            })
            
            // Emit event for cross-component updates
            emitTaskCreated(userContext.user_id, taskResult.task)
            
            console.log('Task created successfully from AI chat:', taskResult.task)
          } else if (taskResult.detected && !taskResult.success) {
            // Task was detected but creation failed
            console.log('Task creation failed:', taskResult.error)
            const errorMessage = `⚠️ I detected you wanted to create a task, but there was an issue: ${taskResult.error}`
            addMessage(errorMessage, 'error')
          }
          // If not detected, no message needed - it's just regular chat
          
        } catch (taskError) {
          console.error('Error in task creation process:', taskError)
          // Don't add error message for task processing failures
          // to avoid disrupting normal chat flow
        }
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
      const isTaskCreated = message.type === 'task-created'
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
          {/* Welcome message when empty */}
          {messages.length === 0 && !isLoading && (
            <div className="flex justify-start mb-6">
              <div className="max-w-[75%] mr-16">
                <div className="px-4 py-3 rounded-2xl shadow-md bg-white text-gray-900 border border-gray-100">
                  <p className="text-sm leading-relaxed">
                    Hello! I&apos;m an AI assistant. How can I help you today?
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
        <div className="px-6 py-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            {/* Input Container */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything…"
                className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#111C59] focus:border-[#111C59] placeholder-gray-400 resize-none overflow-hidden min-h-[48px] max-h-[120px] shadow-sm"
                disabled={isLoading}
                rows={1}
                style={{ height: 'auto' }}
              />
              {/* Microphone Icon */}
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200"
                aria-label="Voice input"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="flex-shrink-0 w-12 h-14 bg-gradient-to-r from-[#111C59] to-[#4F5F73] text-white rounded-2xl hover:shadow-lg focus:ring-2 focus:ring-[#111C59] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}