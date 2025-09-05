'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  X, Calendar, Flag, Users, Tag, Plus, ChevronDown, Check, 
  FileText, UserPlus, Paperclip, Upload, Trash2, Eye, EyeOff,
  Clock, MapPin, Link, AlertCircle, CheckCircle2, Zap,
  ChevronRight, Search, Hash, Sparkles, Brain,
  GripVertical, MoreHorizontal, Bell, Repeat, GitBranch,
  Save, Edit3, Type, AlignLeft, Bold, Italic, List,
  ChevronUp, Send, Loader2
} from 'lucide-react'
import { Task } from './TaskRow'

interface AITaskCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: Omit<Task, 'id'>) => void
  onUpdate?: (task: Task) => void
  editTask?: Task | null
  initialStatus?: Task['status']
  availableUsers: Array<{
    id: string
    name: string
    email: string
    avatarUrl?: string
  }>
  availableTags: string[]
  availableProjects?: Array<{
    id: string
    name: string
    color: string
  }>
}

interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  preview?: string
}

interface Subtask {
  id: string
  title: string
  completed: boolean
}

interface AIParsingResult {
  title: string
  dueDate?: Date
  priority?: 'low' | 'medium' | 'high'
  assignees?: string[]
  tags?: string[]
  description?: string
}

const PRIORITY_LEVELS = [
  { 
    value: 'low', 
    label: 'Low', 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-50 hover:bg-gray-100', 
    borderColor: 'border-gray-200',
    accentColor: 'bg-gray-400' 
  },
  { 
    value: 'medium', 
    label: 'Medium', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50 hover:bg-blue-100', 
    borderColor: 'border-blue-200',
    accentColor: 'bg-blue-500' 
  },
  { 
    value: 'high', 
    label: 'High', 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50 hover:bg-orange-100', 
    borderColor: 'border-orange-200',
    accentColor: 'bg-orange-500' 
  }
] as const

export default function AITaskCreator({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editTask = null,
  initialStatus = 'todo',
  availableUsers,
  availableTags,
  availableProjects = []
}: AITaskCreatorProps) {
  // Core form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [status, setStatus] = useState<Task['status']>(initialStatus)
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [dueTime, setDueTime] = useState('')
  const [assignees, setAssignees] = useState<Task['assignees']>([])
  const [tags, setTags] = useState<string[]>([])
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [attachments, setAttachments] = useState<FileAttachment[]>([])

  // Natural language parsing
  const [isAIParsing, setIsAIParsing] = useState(false)
  const [aiSuggestions, setAISuggestions] = useState<AIParsingResult | null>(null)
  const [showAISuggestions, setShowAISuggestions] = useState(false)

  // UI state
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Expandable sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  
  // Dropdown states
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [showTagsDropdown, setShowTagsDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Search states
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [newSubtask, setNewSubtask] = useState('')

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const parseTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize form with edit task data
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title)
      setDescription(editTask.description || '')
      setPriority(editTask.priority)
      setStatus(editTask.status)
      setDueDate(editTask.dueDate)
      setAssignees(editTask.assignees || [])
      setTags(editTask.tags || [])
      setSubtasks(editTask.subtasks || [])
      setAttachments(editTask.attachments?.map(att => ({
        id: att.id,
        name: att.name,
        size: 0,
        type: att.type
      })) || [])
      if (editTask.description) {
        setIsDescriptionExpanded(true)
      }
    } else {
      // Reset form for new task
      setTitle('')
      setDescription('')
      setPriority('medium')
      setStatus(initialStatus)
      setDueDate(null)
      setDueTime('')
      setAssignees([])
      setTags([])
      setSubtasks([])
      setAttachments([])
      setIsDescriptionExpanded(false)
      setShowMoreOptions(false)
      setExpandedSections(new Set())
    }
    setErrors({})
    setAISuggestions(null)
    setShowAISuggestions(false)
  }, [editTask, initialStatus, isOpen])

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 200)
    }
  }, [isOpen])

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  // AI-powered natural language parsing
  const parseTaskTitle = useCallback(async (input: string) => {
    if (!input.trim() || input.length < 10) return

    setIsAIParsing(true)
    
    // Simulated AI parsing - in production, this would call your AI service
    try {
      await new Promise(resolve => setTimeout(resolve, 800)) // Simulate API call
      
      const result: AIParsingResult = {
        title: input
      }

      // Simple pattern matching for demo purposes
      const lowerInput = input.toLowerCase()
      
      // Parse due dates
      if (lowerInput.includes('today')) {
        result.dueDate = new Date()
      } else if (lowerInput.includes('tomorrow')) {
        result.dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      } else if (lowerInput.includes('friday')) {
        const friday = new Date()
        friday.setDate(friday.getDate() + (5 - friday.getDay() + 7) % 7)
        result.dueDate = friday
      } else if (lowerInput.includes('next week')) {
        result.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }

      // Parse priority
      if (lowerInput.includes('urgent') || lowerInput.includes('asap') || lowerInput.includes('high priority')) {
        result.priority = 'high'
      } else if (lowerInput.includes('low priority')) {
        result.priority = 'low'
      }

      // Parse assignees
      const assigneeNames = availableUsers
        .filter(user => lowerInput.includes(user.name.toLowerCase()))
        .map(user => user.name)
      if (assigneeNames.length > 0) {
        result.assignees = assigneeNames
      }

      // Parse tags
      const possibleTags = availableTags
        .filter(tag => lowerInput.includes(tag.toLowerCase()))
      if (possibleTags.length > 0) {
        result.tags = possibleTags
      }

      setAISuggestions(result)
      setShowAISuggestions(true)
    } catch (error) {
      console.error('AI parsing error:', error)
    } finally {
      setIsAIParsing(false)
    }
  }, [availableUsers, availableTags])

  // Debounced AI parsing
  useEffect(() => {
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current)
    }

    if (title && !editTask) {
      parseTimeoutRef.current = setTimeout(() => {
        parseTaskTitle(title)
      }, 1500)
    }

    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current)
      }
    }
  }, [title, editTask, parseTaskTitle])

  // Apply AI suggestions
  const applyAISuggestions = () => {
    if (!aiSuggestions) return

    if (aiSuggestions.dueDate) {
      setDueDate(aiSuggestions.dueDate)
    }
    if (aiSuggestions.priority) {
      setPriority(aiSuggestions.priority)
    }
    if (aiSuggestions.assignees) {
      const suggestedUsers = availableUsers.filter(user => 
        aiSuggestions.assignees?.includes(user.name)
      )
      setAssignees(prev => [...prev, ...suggestedUsers.filter(user => 
        !prev.some(existing => existing.id === user.id)
      )])
    }
    if (aiSuggestions.tags) {
      setTags(prev => [...new Set([...prev, ...aiSuggestions.tags!])])
    }

    setShowAISuggestions(false)
    setAISuggestions(null)
  }

  // Toggle expandable sections
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  // Subtask management
  const addSubtask = () => {
    if (!newSubtask.trim()) return
    
    const subtask: Subtask = {
      id: `subtask-${Date.now()}`,
      title: newSubtask.trim(),
      completed: false
    }
    
    setSubtasks(prev => [...prev, subtask])
    setNewSubtask('')
  }

  const removeSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id))
  }

  const toggleSubtask = (id: string) => {
    setSubtasks(prev => prev.map(st => 
      st.id === id ? { ...st, completed: !st.completed } : st
    ))
  }

  // File handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const attachment: FileAttachment = {
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAttachments(prev => prev.map(att => 
            att.id === attachment.id 
              ? { ...att, preview: e.target?.result as string }
              : att
          ))
        }
        reader.readAsDataURL(file)
      }

      setAttachments(prev => [...prev, attachment])
    })

    event.target.value = ''
  }

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Task title is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [title])

  // Handle form submission
  const handleSubmit = useCallback(async (saveAsDraft = false) => {
    if (!validateForm()) return

    setIsSubmitting(true)
    setIsDraft(saveAsDraft)

    try {
      let finalDueDate = dueDate
      if (finalDueDate && dueTime) {
        const [hours, minutes] = dueTime.split(':').map(Number)
        finalDueDate.setHours(hours, minutes)
      }

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status: saveAsDraft ? 'todo' as const : status,
        dueDate: finalDueDate,
        assignees,
        tags,
        subtasks,
        completed: status === 'done',
        attachments: attachments.map(att => ({
          id: att.id,
          name: att.name,
          url: '',
          type: att.type
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (editTask) {
        onUpdate?.({ ...editTask, ...taskData })
      } else {
        onSave(taskData)
      }

      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
      setErrors({ submit: 'Failed to save task. Please try again.' })
    } finally {
      setIsSubmitting(false)
      setIsDraft(false)
    }
  }, [validateForm, dueDate, dueTime, title, description, priority, status, assignees, tags, subtasks, attachments, editTask, onUpdate, onSave, onClose])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSubmit()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handleSubmit])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed top-0 left-0 right-0 bottom-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-[9999] p-0 md:p-6"
        style={{ margin: 0, width: '100vw', height: '100vh' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          ref={modalRef}
          initial={{ 
            scale: 0.96, 
            opacity: 0, 
            y: 20 
          }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: 0 
          }}
          exit={{ 
            scale: 0.96, 
            opacity: 0, 
            y: 20 
          }}
          transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editTask ? 'Edit Task' : 'Create Task'}
                </h2>
                <p className="text-sm text-gray-500">
                  AI-powered task creation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 space-y-6">
              
              {/* Prominent Task Title */}
              <div className="relative">
                <div className="relative">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className={`w-full px-4 md:px-6 py-4 md:py-4 text-lg md:text-xl font-medium border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 placeholder-gray-400 ${
                      errors.title 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500 focus:shadow-lg'
                    }`}
                    style={{ 
                      lineHeight: '1.3'
                    }}
                  />
                  
                  {/* AI Parsing Indicator */}
                  {isAIParsing && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">AI parsing...</span>
                      </div>
                    </div>
                  )}
                </div>

                {errors.title && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}

                {/* AI Suggestions */}
                <AnimatePresence>
                  {showAISuggestions && aiSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">AI Suggestions</span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {aiSuggestions.dueDate && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-3 h-3" />
                            Due: {aiSuggestions.dueDate.toLocaleDateString()}
                          </div>
                        )}
                        {aiSuggestions.priority && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Flag className="w-3 h-3" />
                            Priority: {aiSuggestions.priority}
                          </div>
                        )}
                        {aiSuggestions.assignees && aiSuggestions.assignees.length > 0 && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Users className="w-3 h-3" />
                            Assign to: {aiSuggestions.assignees.join(', ')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={applyAISuggestions}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          Apply All
                        </button>
                        <button
                          onClick={() => setShowAISuggestions(false)}
                          className="px-3 py-1.5 text-gray-600 text-sm hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Equal Prominence: Due Date & Assignee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Due Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  
                  {dueDate && (
                    <div className="mt-2">
                      <input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assignee
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {assignees.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {assignees[0].name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <span className="text-gray-900">{assignees[0].name}</span>
                          {assignees.length > 1 && (
                            <span className="text-gray-500 text-sm">+{assignees.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-500">Select assignee...</span>
                        </>
                      )}
                      <ChevronDown className={`w-5 h-5 text-gray-400 ml-auto transition-transform ${showAssigneeDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showAssigneeDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-48 overflow-hidden"
                        >
                          <div className="p-3 border-b border-gray-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={assigneeSearch}
                                onChange={(e) => setAssigneeSearch(e.target.value)}
                                placeholder="Search team members..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                          </div>

                          <div className="max-h-32 overflow-y-auto">
                            {availableUsers
                              .filter(user => 
                                !assignees.some(assignee => assignee.id === user.id) &&
                                (user.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                                 user.email.toLowerCase().includes(assigneeSearch.toLowerCase()))
                              )
                              .map(user => (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => {
                                    setAssignees(prev => [...prev, user])
                                    setShowAssigneeDropdown(false)
                                    setAssigneeSearch('')
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                                >
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">
                                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Selected Assignees */}
                  {assignees.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {assignees.map((assignee) => (
                        <div
                          key={assignee.id}
                          className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm border border-blue-200"
                        >
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1)}
                            </span>
                          </div>
                          {assignee.name}
                          <button
                            onClick={() => setAssignees(prev => prev.filter(a => a.id !== assignee.id))}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PRIORITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setPriority(level.value)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                        priority === level.value
                          ? `${level.bgColor} ${level.color} ${level.borderColor} shadow-sm`
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${level.accentColor}`} />
                      <span className="text-sm font-medium">{level.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Collapsible Description */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors mb-3"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${isDescriptionExpanded ? 'rotate-90' : ''}`} />
                  Description
                  {description.trim() && !isDescriptionExpanded && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </button>

                <AnimatePresence>
                  {isDescriptionExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a detailed description..."
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Collapsible Sections */}
              <div className="space-y-4">
                {/* Subtasks */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection('subtasks')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors mb-3"
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedSections.has('subtasks') ? 'rotate-90' : ''}`} />
                    Subtasks
                    {subtasks.length > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {subtasks.length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedSections.has('subtasks') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden space-y-2"
                      >
                        {subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <button
                              onClick={() => toggleSubtask(subtask.id)}
                              className="flex-shrink-0"
                            >
                              {subtask.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                              )}
                            </button>
                            <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {subtask.title}
                            </span>
                            <button
                              onClick={() => removeSubtask(subtask.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                            placeholder="Add subtask..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          <button
                            onClick={addSubtask}
                            disabled={!newSubtask.trim()}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tags */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection('tags')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors mb-3"
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedSections.has('tags') ? 'rotate-90' : ''}`} />
                    Tags
                    {tags.length > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {tags.length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedSections.has('tags') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {tags.map((tag) => (
                              <div
                                key={tag}
                                className="flex items-center gap-2 bg-purple-50 text-purple-700 rounded-full px-3 py-1 text-sm border border-purple-200"
                              >
                                <Hash className="w-3 h-3" />
                                {tag}
                                <button
                                  onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                                  className="text-purple-600 hover:text-purple-800"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 mb-2">Suggested tags:</div>
                          <div className="flex flex-wrap gap-1">
                            {availableTags.filter(tag => !tags.includes(tag)).slice(0, 8).map(tag => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setTags(prev => [...prev, tag])}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Attachments */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection('attachments')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors mb-3"
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedSections.has('attachments') ? 'rotate-90' : ''}`} />
                    Attachments
                    {attachments.length > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {attachments.length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedSections.has('attachments') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
                        >
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-blue-600">+ Add File</span> or drag and drop
                          </p>
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        {attachments.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {attachments.map((file) => (
                              <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                {file.preview ? (
                                  <Image src={file.preview} alt="" width={32} height={32} className="w-8 h-8 rounded object-cover" />
                                ) : (
                                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                    <Paperclip className="w-4 h-4 text-blue-600" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                                <button
                                  onClick={() => setAttachments(prev => prev.filter(f => f.id !== file.id))}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* More Options */}
              <div className="border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showMoreOptions ? 'rotate-180' : ''}`} />
                  More Options
                </button>

                <AnimatePresence>
                  {showMoreOptions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <button className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                          <Repeat className="w-4 h-4 text-gray-600" />
                          <span>Set Recurring</span>
                        </button>
                        <button className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                          <Bell className="w-4 h-4 text-gray-600" />
                          <span>Add Reminder</span>
                        </button>
                        <button className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                          <GitBranch className="w-4 h-4 text-gray-600" />
                          <span>Dependencies</span>
                        </button>
                        <button className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                          <Eye className="w-4 h-4 text-gray-600" />
                          <span>Add Watchers</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Action Bar */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 md:px-6 py-4 md:py-4">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.submit}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={!title.trim() || isSubmitting}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDraft && isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save as Draft
                </button>
              </div>
              
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!title.trim() || isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2 min-w-[140px] justify-center"
              >
                {isSubmitting && !isDraft ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {editTask ? 'Update Task' : 'Create Task'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
