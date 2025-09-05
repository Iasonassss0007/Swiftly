'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  User, 
  Calendar, 
  AlertTriangle, 
  Tag, 
  FolderOpen, 
  RotateCcw, 
  Paperclip, 
  CheckSquare, 
  GitBranch, 
  MessageCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  dueDate: Date | null
  completed: boolean
  assignees: string[]
  tags?: string[]
  subtasks?: any[]
  attachments?: any[]
  comments?: any[]
  dependencies?: string[]
  project?: string
  recurrence?: string
}

interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTask: (taskData: Partial<Task>) => Promise<void>
  users: User[]
  existingTasks: Task[]
  isCreating?: boolean
  editingTask?: Task | null
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  users,
  existingTasks,
  isCreating = false,
  editingTask = null
}: CreateTaskModalProps) {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiError, setAiError] = useState(false)
  const [activeToolDropdown, setActiveToolDropdown] = useState<string | null>(null)
  const [showMoreToolsDropdown, setShowMoreToolsDropdown] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Extracted task data from AI processing
  const [extractedData, setExtractedData] = useState({
    assignees: [] as string[],
    dueDate: null as Date | null,
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[],
    project: '',
    recurrence: '',
    attachments: [] as any[],
    subtasks: [] as string[],
    dependencies: [] as string[],
    comments: [] as string[],
    description: '' as string
  })

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState({ hours: 9, minutes: 0 })

  // Sample projects and tags for dropdowns
  const sampleProjects = ['Marketing Campaign', 'Product Development', 'Customer Support', 'Operations']
  const sampleTags = ['urgent', 'review', 'meeting', 'research', 'design', 'development']

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatTime = (hours: number, minutes: number) => {
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const setDateWithTime = (date: Date, hours: number, minutes: number) => {
    const newDate = new Date(date)
    newDate.setHours(hours, minutes, 0, 0)
    return newDate
  }

  // Enhanced date parsing and formatting functions
  const parseFlexibleDate = (input: string): Date | null => {
    if (!input || typeof input !== 'string') return null
    
    const trimmed = input.trim()
    if (!trimmed) return null

    // Try various date formats
    const formats = [
      // Standard formats
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // 2025-09-12
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // 12-09-2025
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // 12/09/2025
      
      // Month name formats
      /^(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+(\d{4}))?$/i,
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?$/i,
      
      // Short month formats
      /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:\s+(\d{4}))?$/i,
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?$/i,
    ]

    const monthNames = {
      'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
      'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5,
      'july': 6, 'jul': 6, 'august': 7, 'aug': 7, 'september': 8, 'sep': 8,
      'october': 9, 'oct': 9, 'november': 10, 'nov': 10, 'december': 11, 'dec': 11
    }

    // Try native Date parsing first
    const nativeDate = new Date(trimmed)
    if (!isNaN(nativeDate.getTime())) {
      return nativeDate
    }

    // Try custom parsing
    for (const format of formats) {
      const match = trimmed.match(format)
      if (match) {
        let year = new Date().getFullYear()
        let month = 0
        let day = 1

        if (format.source.includes('January|February')) {
          // Month name first format
          const monthName = match[1].toLowerCase()
          month = monthNames[monthName as keyof typeof monthNames]
          day = parseInt(match[2])
          if (match[3]) year = parseInt(match[3])
        } else if (format.source.includes('Jan|Feb')) {
          // Short month first format
          const monthName = match[1].toLowerCase()
          month = monthNames[monthName as keyof typeof monthNames]
          day = parseInt(match[2])
          if (match[3]) year = parseInt(match[3])
        } else if (format.source.includes('\\s+(January|')) {
          // Day month format
          day = parseInt(match[1])
          const monthName = match[2].toLowerCase()
          month = monthNames[monthName as keyof typeof monthNames]
          if (match[3]) year = parseInt(match[3])
        } else if (format.source.includes('\\s+(Jan|')) {
          // Day short month format
          day = parseInt(match[1])
          const monthName = match[2].toLowerCase()
          month = monthNames[monthName as keyof typeof monthNames]
          if (match[3]) year = parseInt(match[3])
        } else if (format.source.includes('(\\d{4})-')) {
          // YYYY-MM-DD
          year = parseInt(match[1])
          month = parseInt(match[2]) - 1
          day = parseInt(match[3])
        } else {
          // DD-MM-YYYY or MM/DD/YYYY
          const first = parseInt(match[1])
          const second = parseInt(match[2])
          year = parseInt(match[3])
          
          // Assume DD-MM format for ambiguous cases
          if (first > 12) {
            day = first
            month = second - 1
          } else if (second > 12) {
            month = first - 1
            day = second
          } else {
            // Default to MM/DD for US format
            month = first - 1
            day = second
          }
        }

        const parsedDate = new Date(year, month, day)
        if (!isNaN(parsedDate.getTime()) && 
            parsedDate.getFullYear() === year && 
            parsedDate.getMonth() === month && 
            parsedDate.getDate() === day) {
          return parsedDate
        }
      }
    }

    return null
  }

  const formatDateDisplay = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return ''
    
    const now = new Date()
    const time = formatTime(date.getHours(), date.getMinutes())
    
    // Check if date is within current week
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Start of this week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // End of this week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999)
    
    // If date is within current week, show day name
    if (date >= startOfWeek && date <= endOfWeek) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const dayName = dayNames[date.getDay()]
      return `${dayName}, ${time}`
    }
    
    // Otherwise, show full date format
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    const month = months[date.getMonth()]
    const day = date.getDate().toString().padStart(2, '0')
    
    return `${month} ${day}, ${time}`
  }

  const formatAssigneeDisplay = (assigneeIds: string[]): string => {
    if (assigneeIds.length === 0) return ''
    if (assigneeIds.length === 1) {
      const user = users.find(u => u.id === assigneeIds[0])
      return user ? user.name : '1 assigned'
    }
    return `${assigneeIds.length} assigned`
  }

  const formatPriorityDisplay = (priority: 'low' | 'medium' | 'high'): string => {
    if (priority === 'medium') return ''
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const formatTagsDisplay = (tags: string[]): string => {
    if (tags.length === 0) return ''
    if (tags.length <= 2) return tags.join(', ')
    return `${tags.slice(0, 2).join(', ')} +${tags.length - 2}`
  }

  const formatAttachmentsDisplay = (attachments: any[]): string => {
    if (attachments.length === 0) return ''
    if (attachments.length === 1) return '1 file'
    return `${attachments.length} files`
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Close more tools dropdown
      if (showMoreToolsDropdown && !target.closest('.more-tools-dropdown')) {
        setShowMoreToolsDropdown(false)
      }
      
      // Close active tool dropdown
      if (activeToolDropdown && !target.closest(`[data-tool="${activeToolDropdown}"]`)) {
        setActiveToolDropdown(null)
      }
    }

    if (showMoreToolsDropdown || activeToolDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreToolsDropdown, activeToolDropdown])

  useEffect(() => {
    if (isOpen) {
      // Focus the input when modal opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)

      // Populate form when editing
      if (editingTask) {
        setNaturalLanguageInput(editingTask.description || editingTask.title)
        setExtractedData({
          assignees: editingTask.assignees || [],
          dueDate: editingTask.dueDate,
          priority: editingTask.priority,
          tags: editingTask.tags || [],
          project: editingTask.project || '',
          recurrence: editingTask.recurrence || '',
          attachments: editingTask.attachments || [],
          subtasks: editingTask.subtasks?.map(s => s.title || s) || [],
          dependencies: editingTask.dependencies || [],
          comments: editingTask.comments?.map(c => c.text || c) || [],
          description: editingTask.description || ''
        })
      }

      // Freeze background
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.width = '100%'
      document.body.style.height = '100vh'
      document.body.style.overflow = 'hidden'
      document.body.style.margin = '0'
      document.body.style.padding = '0'
    } else {
      // Restore background
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.height = ''
      document.body.style.overflow = ''
      document.body.style.margin = ''
      document.body.style.padding = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.height = ''
      document.body.style.overflow = ''
      document.body.style.margin = ''
      document.body.style.padding = ''
    }
  }, [isOpen, editingTask])

  // Real Gemini AI-powered natural language processing for task creation
  useEffect(() => {
    if (naturalLanguageInput.length > 10) {
      setIsProcessing(true)
      
      const processWithGemini = async () => {
        try {
          console.log('🤖 [AI PROCESSING] Analyzing with Gemini:', naturalLanguageInput)
          
          // Call Gemini API for task parsing
          const response = await fetch('/api/ai/gemini-parse-task', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: naturalLanguageInput,
              mode: 'task_creation'
            })
          })

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
          }

          const result = await response.json()
          console.log('✅ [AI PROCESSING] Gemini result:', result)

          // Process the AI response
          if (result.hasTaskIntent) {
            let parsedDueDate = null
            
            // Parse due date with time if provided
            if (result.dueDate) {
              try {
                // Handle both date-only and datetime formats
                if (result.dueDate.includes(' ')) {
                  // Has time component (e.g., "2024-01-15 18:00")
                  parsedDueDate = new Date(result.dueDate)
                } else {
                  // Date only (e.g., "2024-01-15")
                  parsedDueDate = new Date(result.dueDate + 'T12:00:00')
                }
                
                // Validate the date
                if (isNaN(parsedDueDate.getTime())) {
                  parsedDueDate = null
                }
              } catch (error) {
                console.warn('⚠️ [AI PROCESSING] Invalid date format:', result.dueDate)
                parsedDueDate = null
              }
            }

            // Map assignees to user IDs if users exist
            const assigneeIds = result.assignees?.map((assigneeName: string) => {
              const foundUser = users.find(user => 
                user.name.toLowerCase().includes(assigneeName.toLowerCase()) ||
                user.email.toLowerCase().includes(assigneeName.toLowerCase())
              )
              return foundUser?.id
            }).filter(Boolean) || []

            // Update extracted data with Gemini results
            setExtractedData(prev => ({
              ...prev,
              dueDate: parsedDueDate || prev.dueDate,
              priority: (result.priority as 'low' | 'medium' | 'high') || prev.priority,
              assignees: assigneeIds.length > 0 ? assigneeIds : prev.assignees,
              tags: result.tags?.length > 0 ? result.tags : prev.tags,
              project: result.project || prev.project,
              description: result.description || prev.description,
              // Keep existing values for fields not extracted by Gemini
              recurrence: prev.recurrence,
              attachments: prev.attachments,
              subtasks: prev.subtasks,
              dependencies: prev.dependencies,
              comments: prev.comments
            }))

            console.log('🎯 [AI PROCESSING] Task data extracted successfully')
          } else {
            console.log('ℹ️ [AI PROCESSING] No task intent detected')
          }

        } catch (error) {
          console.error('❌ [AI PROCESSING] Gemini API error:', error)
          
          // Show user-friendly error indication
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          if (errorMessage.includes('500')) {
            console.warn('⚠️ [AI PROCESSING] Gemini service unavailable - continuing without AI parsing')
          } else if (errorMessage.includes('Failed to fetch')) {
            console.warn('⚠️ [AI PROCESSING] Network error - continuing without AI parsing')
          }
          
          // Set error state for visual feedback
          setAiError(true)
          setTimeout(() => setAiError(false), 3000)
          
          // Fallback: don't update extracted data on error, but don't break the interface
        } finally {
          setIsProcessing(false)
        }
      }

      // Debounce the API call
      const debounceTimer = setTimeout(processWithGemini, 1200)
      return () => clearTimeout(debounceTimer)
      
    } else {
      // Reset extracted data when input is too short
      if (naturalLanguageInput.length === 0) {
        setExtractedData({
          assignees: [],
          dueDate: null,
          priority: 'medium',
          tags: [],
          project: '',
          recurrence: '',
          attachments: [],
          subtasks: [],
          dependencies: [],
          comments: [],
          description: ''
        })
      }
      setIsProcessing(false)
    }
  }, [naturalLanguageInput, users])

  const handleSubmit = async () => {
    if (!naturalLanguageInput.trim()) return

    const taskData = {
      title: naturalLanguageInput.split('\n')[0] || naturalLanguageInput.substring(0, 100),
      ...extractedData,
      description: extractedData.description || naturalLanguageInput
    }

    try {
      await onCreateTask(taskData)
      handleClose()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleClose = () => {
    setNaturalLanguageInput('')
    setExtractedData({
      assignees: [],
      dueDate: null,
      priority: 'medium',
      tags: [],
      project: '',
      recurrence: '',
      attachments: [],
      subtasks: [],
      dependencies: [],
      comments: [],
      description: ''
    })
    setActiveToolDropdown(null)
    setShowMoreToolsDropdown(false)
    setAiError(false)
    onClose()
  }

  const primaryToolItems = [
    {
      id: 'assignee',
      label: 'Assignee',
      icon: User,
      value: formatAssigneeDisplay(extractedData.assignees),
      hasValue: extractedData.assignees.length > 0
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      icon: Calendar,
      value: formatDateDisplay(extractedData.dueDate!),
      hasValue: extractedData.dueDate !== null
    },
    {
      id: 'priority',
      label: 'Priority',
      icon: AlertTriangle,
      value: formatPriorityDisplay(extractedData.priority),
      hasValue: extractedData.priority !== 'medium'
    },
    {
      id: 'tags',
      label: 'Tags',
      icon: Tag,
      value: formatTagsDisplay(extractedData.tags),
      hasValue: extractedData.tags.length > 0
    },
    {
      id: 'attachments',
      label: 'Attachments',
      icon: Paperclip,
      value: formatAttachmentsDisplay(extractedData.attachments),
      hasValue: extractedData.attachments.length > 0
    }
  ]

  const additionalToolItems = [
    {
      id: 'project',
      label: 'Project',
      icon: FolderOpen,
      value: extractedData.project,
      hasValue: extractedData.project !== ''
    },
    {
      id: 'recurrence',
      label: 'Recurrence',
      icon: RotateCcw,
      value: extractedData.recurrence,
      hasValue: extractedData.recurrence !== ''
    },
    {
      id: 'subtasks',
      label: 'Subtasks',
      icon: CheckSquare,
      value: extractedData.subtasks.length > 0 ? `${extractedData.subtasks.length} tasks` : '',
      hasValue: extractedData.subtasks.length > 0
    },
    {
      id: 'dependencies',
      label: 'Dependencies',
      icon: GitBranch,
      value: extractedData.dependencies.length > 0 ? `${extractedData.dependencies.length} deps` : '',
      hasValue: extractedData.dependencies.length > 0
    },
    {
      id: 'comments',
      label: 'Comments',
      icon: MessageCircle,
      value: extractedData.comments.length > 0 ? `${extractedData.comments.length} comments` : '',
      hasValue: extractedData.comments.length > 0
    }
  ]

  if (!isOpen) return null

  return (
    <>
      <style jsx>{`
        .modal-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .modal-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .modal-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .modal-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      
      <AnimatePresence>
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 w-full h-full bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: '1rem'
          }}
          onClick={handleClose}
        >
          <motion.div
            key="modal"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-none sm:max-w-4xl bg-white rounded-2xl shadow-2xl overflow-visible"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 pb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-[#0F1626]">
                  {editingTask ? 'Edit Task' : 'Create Task'}
                </h2>
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Main Content */}
            <div className="px-8 pb-8">
              {/* AI-Powered Natural Language Input */}
              <div className="mb-8">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={naturalLanguageInput}
                    onChange={(e) => setNaturalLanguageInput(e.target.value)}
                    placeholder="Describe your task naturally... e.g., 'Schedule a meeting with Sarah tomorrow about the Q4 budget review, high priority'"
                    className="w-full min-h-[100px] sm:min-h-[120px] p-3 sm:p-6 text-base sm:text-lg border-2 border-gray-200 rounded-xl sm:rounded-2xl resize-none focus:outline-none focus:border-[#111C59] focus:ring-4 focus:ring-[#111C59]/10 transition-all duration-200 placeholder-gray-400"
                    style={{ lineHeight: '1.6' }}
                  />
                  
                  {/* AI Processing Indicator */}
                  {isProcessing && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-[#111C59]">
                      <div className="w-2 h-2 bg-[#111C59] rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">AI analyzing...</span>
                    </div>
                  )}
                  
                  {/* AI Error Indicator */}
                  {aiError && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-orange-600">
                      <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                      <span className="text-sm font-medium">AI unavailable</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Horizontal Tools Bar */}
              <div className="mb-8 relative">
                <div className="flex flex-wrap gap-3">
                  {/* Primary Tools */}
                  {primaryToolItems.map((tool) => {
                    const IconComponent = tool.icon
                    return (
                      <div key={tool.id} className="relative" data-tool={tool.id}>
                        <button
                          onClick={() => setActiveToolDropdown(activeToolDropdown === tool.id ? null : tool.id)}
                          title={tool.label}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border transition-all duration-200 min-w-[80px] h-8 ${
                          tool.hasValue
                            ? 'bg-[#111C59]/5 border-[#111C59]/20 text-[#111C59]'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                        >
                          <IconComponent className="w-4 h-4 flex-shrink-0" />
                          {/* Show label only when no value exists, or for non-dueDate fields */}
                          {(tool.id !== 'dueDate' || !tool.value) && (
                            <span className="font-medium text-xs flex-shrink-0">{tool.label}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            {tool.value && (
                              <span className={`text-xs px-1.5 py-0.5 bg-white rounded border truncate block ${
                                tool.id === 'dueDate' ? 'font-medium' : ''
                              }`}>
                                {tool.value}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Tool Dropdowns */}
                        {activeToolDropdown === tool.id && (
                          <div className={`absolute ${tool.id === 'dueDate' ? 'top-1/2 -translate-y-1/2' : 'top-full mt-2'} left-0 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] p-4 ${tool.id === 'dueDate' ? 'min-w-[320px]' : 'min-w-[250px]'}`}>
                            {tool.id === 'assignee' && (
                              <div>
                                <h3 className="font-medium text-sm text-gray-900 mb-3">Assign to</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {users.map((user) => (
                                    <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={extractedData.assignees.includes(user.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setExtractedData(prev => ({
                                              ...prev,
                                              assignees: [...prev.assignees, user.id]
                                            }))
                                          } else {
                                            setExtractedData(prev => ({
                                              ...prev,
                                              assignees: prev.assignees.filter(id => id !== user.id)
                                            }))
                                          }
                                        }}
                                        className="rounded border-gray-300 text-[#111C59] focus:ring-[#111C59]"
                                      />
                                      <div className="w-8 h-8 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">
                                          {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {tool.id === 'dueDate' && (
                              <div className="w-80">
                                <h3 className="font-medium text-sm text-gray-900 mb-3">Due Date & Time</h3>
                                
                                {/* Flexible Date Input */}
                                <div className="border border-gray-200 rounded-lg p-3 mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter date (e.g., &quot;12 September&quot;, &quot;Sep 12&quot;, &quot;2025-09-12&quot;)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Type any date format..."
                                    onBlur={(e) => {
                                      const input = e.target.value.trim()
                                      if (input) {
                                        const parsedDate = parseFlexibleDate(input)
                                        if (parsedDate) {
                                          const dateWithTime = setDateWithTime(parsedDate, selectedTime.hours, selectedTime.minutes)
                                          setExtractedData(prev => ({ ...prev, dueDate: dateWithTime }))
                                          setCalendarDate(parsedDate)
                                          e.target.style.borderColor = '#10b981'
                                          e.target.style.backgroundColor = '#f0fdf4'
                                        } else {
                                          e.target.style.borderColor = '#ef4444'
                                          e.target.style.backgroundColor = '#fef2f2'
                                          setTimeout(() => {
                                            e.target.style.borderColor = ''
                                            e.target.style.backgroundColor = ''
                                          }, 2000)
                                        }
                                      }
                                    }}
                                    onFocus={(e) => {
                                      e.target.style.borderColor = ''
                                      e.target.style.backgroundColor = ''
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] transition-colors"
                                  />
                                  {extractedData.dueDate && (
                                    <p className="text-xs text-green-600 mt-1">
                                      ✓ Parsed as: {formatDateDisplay(extractedData.dueDate)}
                                    </p>
                                  )}
                                </div>

                                {/* Time Selector */}
                                <div className="border border-gray-200 rounded-lg p-3 mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-gray-600" />
                                      <span className="text-sm font-medium text-gray-900">Time</span>
                                    </div>
                                    {/* Combined Time Selector */}
                                    <select
                                      value={`${selectedTime.hours}:${selectedTime.minutes}`}
                                      onChange={(e) => {
                                        const [hours, minutes] = e.target.value.split(':').map(Number)
                                        setSelectedTime({ hours, minutes })
                                        if (extractedData.dueDate) {
                                          const newDate = setDateWithTime(extractedData.dueDate, hours, minutes)
                                          setExtractedData(prev => ({ ...prev, dueDate: newDate }))
                                        }
                                      }}
                                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 min-w-[120px]"
                                    >
                                      {/* Generate all 15-minute intervals for 24 hours */}
                                      {Array.from({ length: 24 * 4 }).map((_, index) => {
                                        const totalMinutes = index * 15
                                        const hours = Math.floor(totalMinutes / 60)
                                        const minutes = totalMinutes % 60
                                        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
                                        const period = hours < 12 ? 'AM' : 'PM'
                                        const timeLabel = `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
                                        
                                        return (
                                          <option key={`${hours}:${minutes}`} value={`${hours}:${minutes}`}>
                                            {timeLabel}
                                          </option>
                                        )
                                      })}
                                    </select>
                                  </div>
                                </div>

                                {/* Calendar */}
                                <div className="border border-gray-200 rounded-lg p-3 mb-4">
                                  {/* Calendar Header */}
                                  <div className="flex items-center justify-between mb-3">
                                    <button
                                      onClick={() => {
                                        const newDate = new Date(calendarDate)
                                        newDate.setMonth(newDate.getMonth() - 1)
                                        setCalendarDate(newDate)
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    >
                                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <h4 className="font-medium text-sm text-gray-900">
                                      {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </h4>
                                    <button
                                      onClick={() => {
                                        const newDate = new Date(calendarDate)
                                        newDate.setMonth(newDate.getMonth() + 1)
                                        setCalendarDate(newDate)
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    >
                                      <ChevronRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                  </div>

                                  {/* Calendar Grid */}
                                  <div className="grid grid-cols-7 gap-1 text-center">
                                    {/* Day headers */}
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                      <div key={day} className="text-xs font-medium text-gray-500 p-2">
                                        {day}
                                      </div>
                                    ))}
                                    
                                    {/* Empty cells for days before month starts */}
                                    {Array.from({ length: getFirstDayOfMonth(calendarDate) }).map((_, index) => (
                                      <div key={`empty-${index}`} className="p-2"></div>
                                    ))}
                                    
                                    {/* Calendar days */}
                                    {Array.from({ length: getDaysInMonth(calendarDate) }).map((_, index) => {
                                      const day = index + 1
                                      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)
                                      const isSelected = extractedData.dueDate && 
                                        date.toDateString() === extractedData.dueDate.toDateString()
                                      const isToday = date.toDateString() === new Date().toDateString()
                                      
                                      return (
                                        <button
                                          key={day}
                                          onClick={() => {
                                            const newDate = setDateWithTime(date, selectedTime.hours, selectedTime.minutes)
                                            setExtractedData(prev => ({ ...prev, dueDate: newDate }))
                                          }}
                                          className={`p-2 text-xs rounded transition-colors ${
                                            isSelected
                                              ? 'bg-[#111C59] text-white'
                                              : isToday
                                              ? 'bg-blue-100 text-blue-900 font-medium'
                                              : 'hover:bg-gray-100 text-gray-700'
                                          }`}
                                        >
                                          {day}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => {
                                      const today = setDateWithTime(new Date(), selectedTime.hours, selectedTime.minutes)
                                      setExtractedData(prev => ({ ...prev, dueDate: today }))
                                      setCalendarDate(new Date())
                                    }}
                                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                  >
                                    Today
                                  </button>
                                  <button
                                    onClick={() => {
                                      const tomorrow = new Date()
                                      tomorrow.setDate(tomorrow.getDate() + 1)
                                      const tomorrowWithTime = setDateWithTime(tomorrow, selectedTime.hours, selectedTime.minutes)
                                      setExtractedData(prev => ({ ...prev, dueDate: tomorrowWithTime }))
                                      setCalendarDate(tomorrow)
                                    }}
                                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                  >
                                    Tomorrow
                                  </button>
                                  <button
                                    onClick={() => {
                                      const nextWeek = new Date()
                                      nextWeek.setDate(nextWeek.getDate() + 7)
                                      const nextWeekWithTime = setDateWithTime(nextWeek, selectedTime.hours, selectedTime.minutes)
                                      setExtractedData(prev => ({ ...prev, dueDate: nextWeekWithTime }))
                                      setCalendarDate(nextWeek)
                                    }}
                                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                  >
                                    Next Week
                                  </button>
                                  {extractedData.dueDate && (
                                    <button
                                      onClick={() => {
                                        setExtractedData(prev => ({ ...prev, dueDate: null }))
                                      }}
                                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {tool.id === 'priority' && (
                              <div>
                                <h3 className="font-medium text-sm text-gray-900 mb-3">Priority</h3>
                                <div className="space-y-2">
                                  {(['low', 'medium', 'high'] as const).map((priority) => (
                                    <label key={priority} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                      <input
                                        type="radio"
                                        name="priority"
                                        value={priority}
                                        checked={extractedData.priority === priority}
                                        onChange={(e) => {
                                          setExtractedData(prev => ({
                                            ...prev,
                                            priority: e.target.value as 'low' | 'medium' | 'high'
                                          }))
                                        }}
                                        className="text-[#111C59] focus:ring-[#111C59]"
                                      />
                                      <div className={`w-3 h-3 rounded-full ${
                                        priority === 'high' ? 'bg-red-500' :
                                        priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                      }`}></div>
                                      <span className="text-sm font-medium capitalize">{priority}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {tool.id === 'tags' && (
                              <div>
                                <h3 className="font-medium text-sm text-gray-900 mb-3">Tags</h3>
                                
                                {/* Current Tags Display */}
                                {extractedData.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                                    {extractedData.tags.map((tag, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[#111C59] text-white rounded-md"
                                      >
                                        {tag}
                                        <button
                                          onClick={() => {
                                            setExtractedData(prev => ({
                                              ...prev,
                                              tags: prev.tags.filter((_, i) => i !== index)
                                            }))
                                          }}
                                          className="ml-1 text-white hover:text-red-200 transition-colors"
                                          title="Remove tag"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Suggested Tags */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {sampleTags.filter(tag => !extractedData.tags.includes(tag)).map((tag) => (
                                    <button
                                      key={tag}
                                      onClick={() => {
                                        setExtractedData(prev => ({
                                          ...prev,
                                          tags: [...prev.tags, tag]
                                        }))
                                      }}
                                      className="px-2 py-1 text-xs rounded-md border transition-colors bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                                    >
                                      + {tag}
                                    </button>
                                  ))}
                                </div>

                                {/* Custom Tag Input */}
                                <input
                                  type="text"
                                  placeholder="Type and press Enter to add custom tag..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                      const newTag = e.currentTarget.value.trim().toLowerCase()
                                      
                                      // Validation
                                      if (newTag.length < 2) {
                                        e.currentTarget.style.borderColor = '#ef4444'
                                        e.currentTarget.placeholder = 'Tag must be at least 2 characters'
                                        setTimeout(() => {
                                          e.currentTarget.style.borderColor = ''
                                          e.currentTarget.placeholder = 'Type and press Enter to add custom tag...'
                                        }, 2000)
                                        return
                                      }
                                      
                                      if (extractedData.tags.includes(newTag)) {
                                        e.currentTarget.style.borderColor = '#f59e0b'
                                        e.currentTarget.placeholder = 'Tag already exists'
                                        setTimeout(() => {
                                          e.currentTarget.style.borderColor = ''
                                          e.currentTarget.placeholder = 'Type and press Enter to add custom tag...'
                                        }, 2000)
                                        return
                                      }

                                      // Add valid tag
                                      setExtractedData(prev => ({
                                        ...prev,
                                        tags: [...prev.tags, newTag]
                                      }))
                                      e.currentTarget.value = ''
                                      e.currentTarget.style.borderColor = '#10b981'
                                      setTimeout(() => {
                                        e.currentTarget.style.borderColor = ''
                                      }, 1000)
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] transition-colors"
                                />
                                
                                <p className="text-xs text-gray-500 mt-2">
                                  {extractedData.tags.length}/10 tags • Press Enter to add
                                </p>
                              </div>
                            )}

                            {tool.id === 'attachments' && (
                              <div>
                                <h3 className="font-medium text-sm text-gray-900 mb-3">Attachments</h3>
                                
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#111C59] hover:bg-gray-50 transition-colors">
                                  <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-600 mb-2">Drop files here or click to browse</p>
                                  <p className="text-xs text-gray-500 mb-3">Max 10MB per file • Images, documents, PDFs</p>
                                  
                                  <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || [])
                                      const validFiles: File[] = []
                                      const errors: string[] = []
                                      
                                      files.forEach(file => {
                                        // Size validation (10MB)
                                        if (file.size > 10 * 1024 * 1024) {
                                          errors.push(`${file.name}: File too large (max 10MB)`)
                                          return
                                        }
                                        
                                        // Check for duplicates
                                        const isDuplicate = extractedData.attachments.some(
                                          existing => existing.name === file.name && existing.size === file.size
                                        )
                                        if (isDuplicate) {
                                          errors.push(`${file.name}: File already attached`)
                                          return
                                        }
                                        
                                        validFiles.push(file)
                                      })
                                      
                                      if (validFiles.length > 0) {
                                        setExtractedData(prev => ({
                                          ...prev,
                                          attachments: [...prev.attachments, ...validFiles]
                                        }))
                                      }
                                      
                                      // Show errors if any
                                      if (errors.length > 0) {
                                        const input = e.target
                                        input.style.borderColor = '#ef4444'
                                        console.warn('File upload errors:', errors)
                                        setTimeout(() => {
                                          input.style.borderColor = ''
                                        }, 3000)
                                      }
                                      
                                      // Reset input
                                      e.target.value = ''
                                    }}
                                    className="hidden"
                                    id="file-upload"
                                  />
                                  <label
                                    htmlFor="file-upload"
                                    className="inline-block px-4 py-2 bg-[#111C59] text-white text-sm rounded-lg cursor-pointer hover:bg-[#0F1626] transition-colors"
                                  >
                                    Choose Files
                                  </label>
                                </div>

                                {/* File List */}
                                {extractedData.attachments.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                      Attached Files ({extractedData.attachments.length})
                                    </h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {extractedData.attachments.map((file, index) => {
                                        const sizeKB = Math.round(file.size / 1024)
                                        const sizeMB = sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + 'MB' : sizeKB + 'KB'
                                        
                                        return (
                                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium text-gray-900 truncate">
                                                {file.name}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {sizeMB} • {file.type || 'Unknown type'}
                                              </p>
                                            </div>
                                            <button
                                              onClick={() => {
                                                setExtractedData(prev => ({
                                                  ...prev,
                                                  attachments: prev.attachments.filter((_, i) => i !== index)
                                                }))
                                              }}
                                              className="ml-3 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                              title="Remove file"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                        )
                                      })}
                                    </div>
                                    
                                    <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                                      <span>Total: {extractedData.attachments.length} files</span>
                                      <button
                                        onClick={() => {
                                          setExtractedData(prev => ({ ...prev, attachments: [] }))
                                        }}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                      >
                                        Clear all
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* More Tools Button */}
                  <div className="relative more-tools-dropdown">
                    <button
                      onClick={() => setShowMoreToolsDropdown(!showMoreToolsDropdown)}
                      title="More tools"
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border transition-all duration-200 min-w-[80px] h-8 bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300"
                    >
                      <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium text-xs flex-shrink-0">More</span>
                      <div className="flex-1"></div>
                    </button>

                    {/* Additional Tools Dropdown */}
                    {showMoreToolsDropdown && (
                      <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] p-2 min-w-[200px]">
                        {additionalToolItems.map((tool) => {
                          const IconComponent = tool.icon
                          return (
                            <button
                              key={tool.id}
                              onClick={() => {
                                setActiveToolDropdown(activeToolDropdown === tool.id ? null : tool.id)
                                setShowMoreToolsDropdown(false)
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                                tool.hasValue
                                  ? 'bg-[#111C59]/5 text-[#111C59]'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                              <span className="font-medium text-sm flex-1">{tool.label}</span>
                              {tool.value && (
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded border text-gray-600">
                                  {tool.value}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleSubmit}
                  disabled={!naturalLanguageInput.trim() || isCreating}
                  className="px-8 py-3 bg-[#111C59] text-white rounded-xl font-medium hover:bg-[#0F1626] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isCreating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}