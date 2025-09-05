'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  X, Calendar, Flag, Users, Tag, Plus, ChevronDown, Check, 
  FileText, UserPlus, Paperclip, Upload, Trash2, Eye, EyeOff,
  Clock, MapPin, Link, AlertCircle, CheckCircle2, Zap,
  ChevronRight, Search, Hash, Brain,
  GripVertical, MoreHorizontal, Bell, Repeat, GitBranch,
  Save, Edit3, Type, AlignLeft, Bold, Italic, List,
  ChevronUp, Loader2, CalendarDays, User
} from 'lucide-react'
import { Task } from './TaskRow'

interface StreamlinedTaskCreatorProps {
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
    color: 'text-[#4F5F73]', 
    bgColor: 'bg-[#F8FAFC]', 
    hoverColor: 'hover:bg-gray-100',
    borderColor: 'border-[#ADB3BD]/30',
    accentColor: 'bg-[#ADB3BD]' 
  },
  { 
    value: 'medium', 
    label: 'Medium', 
    color: 'text-[#111C59]', 
    bgColor: 'bg-[#111C59]/5', 
    hoverColor: 'hover:bg-[#111C59]/10',
    borderColor: 'border-[#111C59]/20',
    accentColor: 'bg-[#111C59]' 
  },
  { 
    value: 'high', 
    label: 'High', 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50', 
    hoverColor: 'hover:bg-orange-100',
    borderColor: 'border-orange-200',
    accentColor: 'bg-orange-500' 
  }
] as const

export default function StreamlinedTaskCreator({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editTask = null,
  initialStatus = 'todo',
  availableUsers,
  availableTags,
  availableProjects = []
}: StreamlinedTaskCreatorProps) {
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
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Search states
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [newSubtask, setNewSubtask] = useState('')

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const parseTimeoutRef = useRef<NodeJS.Timeout>()
  const priorityDropdownRef = useRef<HTMLDivElement>(null)
  const assigneeDropdownRef = useRef<HTMLDivElement>(null)

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

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false)
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // AI-powered natural language parsing
  const parseTaskTitle = useCallback(async (input: string) => {
    if (!input.trim() || input.length < 10) return

    setIsAIParsing(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1200)) // Simulate API call
      
      const result: AIParsingResult = {
        title: input
      }

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
      } else if (lowerInput.includes('monday')) {
        const monday = new Date()
        monday.setDate(monday.getDate() + (1 - monday.getDay() + 7) % 7)
        result.dueDate = monday
      }

      // Parse priority
      if (lowerInput.includes('urgent') || lowerInput.includes('asap') || lowerInput.includes('high priority') || lowerInput.includes('important')) {
        result.priority = 'high'
      } else if (lowerInput.includes('low priority') || lowerInput.includes('minor')) {
        result.priority = 'low'
      }

      // Parse assignees - look for common name patterns
      const assigneeNames = availableUsers
        .filter(user => {
          const firstName = user.name.split(' ')[0].toLowerCase()
          const fullName = user.name.toLowerCase()
          return lowerInput.includes(`assign to ${firstName}`) || 
                 lowerInput.includes(`for ${firstName}`) ||
                 lowerInput.includes(fullName)
        })
        .map(user => user.name)
      
      if (assigneeNames.length > 0) {
        result.assignees = assigneeNames
      }

      // Parse tags based on common keywords
      const possibleTags = availableTags
        .filter(tag => lowerInput.includes(tag.toLowerCase()))
      if (possibleTags.length > 0) {
        result.tags = possibleTags
      }

      // Auto-detect common task types and suggest tags
      if (lowerInput.includes('meeting') || lowerInput.includes('call')) {
        result.tags = [...(result.tags || []), 'Meeting']
      }
      if (lowerInput.includes('presentation') || lowerInput.includes('demo')) {
        result.tags = [...(result.tags || []), 'Presentation']
      }
      if (lowerInput.includes('review') || lowerInput.includes('feedback')) {
        result.tags = [...(result.tags || []), 'Review']
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
      }, 2000)
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

    if (aiSuggestions.dueDate && !dueDate) {
      setDueDate(aiSuggestions.dueDate)
    }
    if (aiSuggestions.priority && priority === 'medium') {
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

  const getPriorityConfig = (priorityValue: 'low' | 'medium' | 'high') => {
    return PRIORITY_LEVELS.find(p => p.value === priorityValue) || PRIORITY_LEVELS[1]
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        style={{ margin: 0, padding: '1rem', width: '100vw', height: '100vh' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.96, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#F8FAFC] to-white">
            <div>
              <h2 className="text-2xl font-bold text-[#0F1626]">
                {editTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <p className="text-sm text-[#4F5F73] mt-1">
                AI-powered task creation with intelligent field detection
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#4F5F73] hover:text-[#0F1626] hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              
              {/* Horizontal Core Fields Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
                
                {/* Task Title - Takes most space */}
                <div className="lg:col-span-5 relative">
                  <label className="block text-sm font-medium text-[#0F1626] mb-2">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      className={`w-full h-12 px-4 text-base font-medium border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 placeholder-[#4F5F73] ${
                        errors.title 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-[#ADB3BD]/30 focus:border-[#111C59]'
                      }`}
                    />
                    
                    {/* AI Parsing Indicator */}
                    {isAIParsing && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="flex items-center gap-2 text-[#111C59]">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs">AI parsing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Due Date */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-[#0F1626] mb-2">
                    Due Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)}
                      className="w-full h-12 px-4 pr-10 border-2 border-[#ADB3BD]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] transition-all"
                    />
                    <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4F5F73] pointer-events-none" />
                  </div>
                  
                  {dueDate && (
                    <div className="mt-2">
                      <input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#ADB3BD]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59]"
                      />
                    </div>
                  )}
                </div>

                {/* Assignee */}
                <div className="lg:col-span-2" ref={assigneeDropdownRef}>
                  <label className="block text-sm font-medium text-[#0F1626] mb-2">
                    Assignee
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                      className="w-full h-12 flex items-center gap-2 px-4 bg-white border-2 border-[#ADB3BD]/30 rounded-xl text-left hover:bg-[#F8FAFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59]"
                    >
                      {assignees.length > 0 ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-medium">
                              {assignees[0].name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1)}
                            </span>
                          </div>
                          <span className="text-[#0F1626] truncate text-sm">{assignees[0].name}</span>
                          {assignees.length > 1 && (
                            <span className="text-[#4F5F73] text-xs">+{assignees.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <>
                          <User className="w-4 h-4 text-[#4F5F73]" />
                          <span className="text-[#4F5F73] text-sm">Select...</span>
                        </>
                      )}
                      <ChevronDown className={`w-4 h-4 text-[#4F5F73] ml-auto transition-transform ${showAssigneeDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showAssigneeDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#ADB3BD]/30 rounded-xl shadow-lg z-20 max-h-48 overflow-hidden"
                        >
                          <div className="p-3 border-b border-[#ADB3BD]/30">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4F5F73]" />
                              <input
                                type="text"
                                value={assigneeSearch}
                                onChange={(e) => setAssigneeSearch(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59]"
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
                                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">
                                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1)}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 text-sm">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Priority */}
                <div className="lg:col-span-2" ref={priorityDropdownRef}>
                  <label className="block text-sm font-medium text-[#0F1626] mb-2">
                    Priority
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                      className={`w-full h-12 flex items-center justify-center gap-2 px-4 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] ${
                        getPriorityConfig(priority).bgColor
                      } ${getPriorityConfig(priority).borderColor} ${getPriorityConfig(priority).hoverColor}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${getPriorityConfig(priority).accentColor}`} />
                      <span className={`text-sm font-medium ${getPriorityConfig(priority).color}`}>
                        {getPriorityConfig(priority).label}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-[#4F5F73] transition-transform ${showPriorityDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showPriorityDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"
                        >
                          {PRIORITY_LEVELS.map((level) => (
                            <button
                              key={level.value}
                              type="button"
                              onClick={() => {
                                setPriority(level.value)
                                setShowPriorityDropdown(false)
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                priority === level.value ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full ${level.accentColor}`} />
                              <span className={`text-sm font-medium ${level.color}`}>
                                {level.label}
                              </span>
                              {priority === level.value && (
                                <Check className="w-4 h-4 text-blue-600 ml-auto" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* AI Suggestions Banner */}
              <AnimatePresence>
                {showAISuggestions && aiSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 p-4 bg-gradient-to-r from-[#111C59]/5 to-[#4F5F73]/5 border border-[#111C59]/20 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-[#111C59]" />
                      <span className="text-sm font-medium text-[#111C59]">AI Suggestions</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                      {aiSuggestions.dueDate && (
                        <div className="flex items-center gap-2 text-[#0F1626] bg-white/80 rounded-lg px-3 py-2">
                          <Calendar className="w-3 h-3" />
                          Due: {aiSuggestions.dueDate.toLocaleDateString()}
                        </div>
                      )}
                      {aiSuggestions.priority && (
                        <div className="flex items-center gap-2 text-[#0F1626] bg-white/80 rounded-lg px-3 py-2">
                          <Flag className="w-3 h-3" />
                          Priority: {aiSuggestions.priority}
                        </div>
                      )}
                      {aiSuggestions.assignees && aiSuggestions.assignees.length > 0 && (
                        <div className="flex items-center gap-2 text-[#0F1626] bg-white/80 rounded-lg px-3 py-2">
                          <Users className="w-3 h-3" />
                          Assign: {aiSuggestions.assignees.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={applyAISuggestions}
                        className="px-4 py-2 bg-[#111C59] text-white text-sm rounded-lg hover:bg-[#0F1626] transition-colors flex items-center gap-2"
                      >
                        <Zap className="w-3 h-3" />
                        Apply All
                      </button>
                      <button
                        onClick={() => setShowAISuggestions(false)}
                        className="px-4 py-2 text-[#4F5F73] text-sm hover:bg-white/50 rounded-lg transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expandable Panels */}
              <div className="space-y-4">
                
                {/* Description Panel */}
                <div className="border border-[#ADB3BD]/30 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-[#F8FAFC]/50 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#4F5F73]" />
                      <span className="text-sm font-medium text-[#0F1626]">Description</span>
                      {description.trim() && !isDescriptionExpanded && (
                        <div className="w-2 h-2 bg-[#111C59] rounded-full" />
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[#4F5F73] transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''}`} />
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
                        <div className="p-4 border-t border-[#ADB3BD]/30">
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a detailed description..."
                            rows={4}
                            className="w-full px-4 py-3 border-2 border-[#ADB3BD]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] resize-none transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Subtasks Panel */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('subtasks')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <List className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Subtasks</span>
                      {subtasks.length > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                          {subtasks.length}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.has('subtasks') ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {expandedSections.has('subtasks') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 border-t border-gray-100 space-y-3">
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
                              className="flex-1 px-3 py-2 border border-[#ADB3BD]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59]"
                            />
                            <button
                              onClick={addSubtask}
                              disabled={!newSubtask.trim()}
                              className="px-3 py-2 bg-[#111C59] text-white rounded-lg hover:bg-[#0F1626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tags Panel */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('tags')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Tags</span>
                      {tags.length > 0 && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                          {tags.length}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.has('tags') ? 'rotate-180' : ''}`} />
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
                        <div className="p-4 border-t border-gray-100">
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
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

                          <div className="space-y-3">
                            <div className="text-xs text-gray-500 font-medium">Suggested tags:</div>
                            <div className="flex flex-wrap gap-2">
                              {availableTags.filter(tag => !tags.includes(tag)).slice(0, 8).map(tag => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => setTags(prev => [...prev, tag])}
                                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Attachments Panel */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('attachments')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Attachments</span>
                      {attachments.length > 0 && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">
                          {attachments.length}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.has('attachments') ? 'rotate-180' : ''}`} />
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
                        <div className="p-4 border-t border-gray-100">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                          >
                            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-blue-600">+ Add File</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* More Options */}
              <div className="mt-6 border-t border-gray-100 pt-6">
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
                      className="mt-4 p-4 bg-gray-50/50 rounded-xl space-y-3 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <button className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                          <Repeat className="w-4 h-4 text-gray-600" />
                          <span>Set Recurring</span>
                        </button>
                        <button className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                          <Bell className="w-4 h-4 text-gray-600" />
                          <span>Add Reminder</span>
                        </button>
                        <button className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                          <GitBranch className="w-4 h-4 text-gray-600" />
                          <span>Dependencies</span>
                        </button>
                        <button className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
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
          <div className="sticky bottom-0 bg-white border-t border-[#ADB3BD]/30 px-6 py-4">
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
                  className="px-4 py-2 text-[#4F5F73] hover:text-[#0F1626] hover:bg-[#F8FAFC] rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={!title.trim() || isSubmitting}
                  className="px-4 py-2 text-[#4F5F73] hover:text-[#0F1626] hover:bg-[#F8FAFC] rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-8 py-3 bg-[#111C59] text-white rounded-xl font-semibold hover:bg-[#0F1626] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2 min-w-[140px] justify-center"
              >
                {isSubmitting && !isDraft ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  editTask ? 'Update Task' : 'Create Task'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
