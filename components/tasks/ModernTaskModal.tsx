'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  X, Calendar, Flag, Users, Tag, Plus, ChevronDown, Check, 
  FileText, UserPlus, Paperclip, Upload, Trash2, Eye, EyeOff,
  Clock, MapPin, Link, AlertCircle, CheckCircle2, Zap,
  ChevronRight, Search, Hash
} from 'lucide-react'
import { Task } from './TaskRow'

interface ModernTaskModalProps {
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

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low Priority', color: 'text-gray-600', bgColor: 'bg-gray-100', accentColor: 'bg-gray-500' },
  { value: 'medium', label: 'Medium Priority', color: 'text-blue-600', bgColor: 'bg-blue-100', accentColor: 'bg-blue-500' },
  { value: 'high', label: 'High Priority', color: 'text-red-600', bgColor: 'bg-red-100', accentColor: 'bg-red-500' }
] as const

const QUICK_DATE_OPTIONS = [
  { label: 'Today', getValue: () => new Date() },
  { label: 'Tomorrow', getValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  { label: 'This Weekend', getValue: () => {
    const now = new Date()
    const saturday = new Date(now)
    saturday.setDate(now.getDate() + (6 - now.getDay()))
    return saturday
  }},
  { label: 'Next Week', getValue: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  { label: 'Next Month', getValue: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
]

export default function ModernTaskModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editTask = null,
  initialStatus = 'todo',
  availableUsers,
  availableTags,
  availableProjects = []
}: ModernTaskModalProps) {
  // Core form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [status, setStatus] = useState<Task['status']>(initialStatus)
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [dueTime, setDueTime] = useState('')
  const [assignees, setAssignees] = useState<Task['assignees']>([])
  const [tags, setTags] = useState<string[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [attachments, setAttachments] = useState<FileAttachment[]>([])

  // Natural language due date input
  const [dueDateInput, setDueDateInput] = useState('')
  const [parsedDatePreview, setParsedDatePreview] = useState<string>('')

  // UI state
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Dropdown states
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [showTagsDropdown, setShowTagsDropdown] = useState(false)
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Search states
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [newTag, setNewTag] = useState('')

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Initialize form with edit task data
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title)
      setDescription(editTask.description || '')
      setPriority(editTask.priority as any)
      setStatus(editTask.status)
      setDueDate(editTask.dueDate)
      setAssignees(editTask.assignees || [])
      setTags(editTask.tags || [])
      setAttachments(editTask.attachments?.map(att => ({
        id: att.id,
        name: att.name,
        size: 0,
        type: att.type
      })) || [])
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
      setSelectedProject('')
      setAttachments([])
      setDueDateInput('')
      setParsedDatePreview('')
      setShowMoreOptions(false)
    }
    setErrors({})
  }, [editTask, initialStatus, isOpen])

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100)
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

  // Natural language date parsing (simplified)
  const parseNaturalDate = useCallback((input: string) => {
    const lowercaseInput = input.toLowerCase().trim()
    
    if (lowercaseInput.includes('today')) {
      return new Date()
    }
    if (lowercaseInput.includes('tomorrow')) {
      return new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
    if (lowercaseInput.includes('next week')) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
    if (lowercaseInput.includes('next month')) {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
    
    // Try parsing as regular date
    const parsed = new Date(input)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
    
    return null
  }, [])

  // Update parsed date preview
  useEffect(() => {
    if (dueDateInput) {
      const parsed = parseNaturalDate(dueDateInput)
      if (parsed) {
        setParsedDatePreview(parsed.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: parsed.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        }))
      } else {
        setParsedDatePreview('')
      }
    } else {
      setParsedDatePreview('')
    }
  }, [dueDateInput, parseNaturalDate])

  // Handle file upload
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

      // Create preview for images
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

    // Reset input
    event.target.value = ''
  }

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Task title is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Parse due date from natural language input if provided
      let finalDueDate = dueDate
      if (dueDateInput && !dueDate) {
        finalDueDate = parseNaturalDate(dueDateInput)
      }

      // Add time to due date if provided
      if (finalDueDate && dueTime) {
        const [hours, minutes] = dueTime.split(':').map(Number)
        finalDueDate.setHours(hours, minutes)
      }

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        priority: priority as Task['priority'],
        status,
        dueDate: finalDueDate,
        assignees,
        tags,
        completed: status === 'done',
        attachments: attachments.map(att => ({
          id: att.id,
          name: att.name,
          url: '', // Would be populated after actual file upload
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
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Filter functions
  const filteredUsers = availableUsers.filter(user => 
    !assignees.some(assignee => assignee.id === user.id) &&
    (user.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
     user.email.toLowerCase().includes(assigneeSearch.toLowerCase()))
  )

  const filteredTags = availableTags.filter(tag => 
    !tags.includes(tag) &&
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  )

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
        className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        style={{ margin: 0, padding: '1rem', width: '100vw', height: '100vh' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editTask ? 'Edit Task' : 'Create Task'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {editTask ? 'Update task details' : 'What needs to be done?'}
              </p>
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
            <div className="p-6 space-y-6">
              
              {/* Task Title */}
              <div>
                <label htmlFor="task-title" className="block text-sm font-semibold text-gray-900 mb-2">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className={`w-full px-4 py-3 text-lg border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.title 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  aria-describedby={errors.title ? "title-error" : undefined}
                />
                {errors.title && (
                  <p id="title-error" className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Smart Due Date Picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Due Date
                </label>
                
                {/* Natural Language Input */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={dueDateInput}
                    onChange={(e) => setDueDateInput(e.target.value)}
                    placeholder="Type 'tomorrow', 'next week', or pick a date..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  {parsedDatePreview && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {parsedDatePreview}
                    </div>
                  )}
                </div>

                {/* Quick Date Options */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {QUICK_DATE_OPTIONS.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => {
                        const date = option.getValue()
                        setDueDate(date)
                        setDueDateInput('')
                      }}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        dueDate && option.getValue().toDateString() === dueDate.toDateString()
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Selected Date Display */}
                {dueDate && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Due: {dueDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric',
                        year: dueDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </span>
                    <button
                      onClick={() => setDueDate(null)}
                      className="ml-auto text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Time Picker */}
                {dueDate && (
                  <div className="mt-3">
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Priority Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRIORITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setPriority(level.value)}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all ${
                        priority === level.value
                          ? `${level.bgColor} ${level.color} border-current shadow-sm`
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${level.accentColor}`} />
                      <span className="text-sm font-medium truncate">{level.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Assignees
                </label>
                
                {/* Selected Assignees */}
                {assignees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {assignees.map((assignee) => (
                      <div
                        key={assignee.id}
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3 py-2 text-sm border border-blue-200"
                      >
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        {assignee.name}
                        <button
                          onClick={() => setAssignees(prev => prev.filter(a => a.id !== assignee.id))}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assignee Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-left hover:bg-gray-50 transition-colors"
                  >
                    <UserPlus className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">Add team members...</span>
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
                        {/* Search */}
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

                        {/* User List */}
                        <div className="max-h-32 overflow-y-auto">
                          {filteredUsers.map(user => (
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
                          {filteredUsers.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              No team members found
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* More Options Toggle */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${showMoreOptions ? 'rotate-90' : ''}`} />
                  More Options
                  {(tags.length > 0 || description.trim() || attachments.length > 0) && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-1" />
                  )}
                </button>
              </div>

              {/* Progressive Disclosure - More Options */}
              <AnimatePresence>
                {showMoreOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 overflow-hidden"
                  >
                    {/* Project/Workspace Selector */}
                    {availableProjects.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Project
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-left hover:bg-gray-50 transition-colors"
                          >
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700">
                              {selectedProject ? availableProjects.find(p => p.id === selectedProject)?.name : 'Select project...'}
                            </span>
                            <ChevronDown className={`w-5 h-5 text-gray-400 ml-auto transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {showProjectDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20"
                              >
                                {availableProjects.map(project => (
                                  <button
                                    key={project.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedProject(project.id)
                                      setShowProjectDropdown(false)
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                                  >
                                    <div className={`w-3 h-3 rounded-full ${project.color}`} />
                                    {project.name}
                                    {selectedProject === project.id && (
                                      <Check className="w-4 h-4 text-blue-600 ml-auto" />
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* Tags Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Tags
                      </label>
                      
                      {/* Selected Tags */}
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

                      {/* Tag Input */}
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newTag.trim()) {
                                e.preventDefault()
                                if (!tags.includes(newTag.trim())) {
                                  setTags(prev => [...prev, newTag.trim()])
                                }
                                setNewTag('')
                              }
                            }}
                            placeholder="Add tags..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                          <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (newTag.trim() && !tags.includes(newTag.trim())) {
                              setTags(prev => [...prev, newTag.trim()])
                              setNewTag('')
                            }
                          }}
                          disabled={!newTag.trim()}
                          className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Available Tags */}
                      {availableTags.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-500 mb-2">Suggested:</div>
                          <div className="flex flex-wrap gap-1">
                            {availableTags.filter(tag => !tags.includes(tag)).slice(0, 6).map(tag => (
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
                      )}
                    </div>

                    {/* Description Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a detailed description..."
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                      />
                    </div>

                    {/* File Attachments */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Attachments
                      </label>
                      
                      {/* Drag & Drop Zone */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      {/* Attached Files */}
                      {attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {attachments.map((file) => (
                            <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              {file.preview ? (
                                <Image src={file.preview} alt="" width={40} height={40} className="w-10 h-10 rounded object-cover" />
                              ) : (
                                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                  <Paperclip className="w-5 h-5 text-blue-600" />
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

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.submit}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {title.trim() && (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Ready to create
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!title.trim() || isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 min-w-[120px] justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {editTask ? 'Update Task' : 'Create Task'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
