'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  X, Calendar, Flag, Users, Tag, Plus, ChevronDown, Check, 
  ChevronLeft, ChevronRight, Clock, Settings, Zap, FileText, 
  UserPlus, Info, AlertCircle, ChevronUp, CheckCircle2 
} from 'lucide-react'
import { Task } from './TaskRow'

interface NewTaskModalProps {
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
  }>
  availableTags: string[]
}

interface FormSection {
  id: string
  title: string
  icon: React.ReactNode
  completed: boolean
  required: boolean
}

export default function NewTaskModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editTask = null,
  initialStatus = 'todo',
  availableUsers,
  availableTags
}: NewTaskModalProps) {
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [status, setStatus] = useState<Task['status']>(initialStatus)
  const [dueDate, setDueDate] = useState('')
  const [assignees, setAssignees] = useState<Task['assignees']>([])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  
  // UI state
  const [activeSection, setActiveSection] = useState('basic')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']))
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Dropdown states
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false)
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false)
  const [assigneesDropdownOpen, setAssigneesDropdownOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  
  // Date/time states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null)
  
  // Calendar state
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  
  // Refs
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const priorityDropdownRef = useRef<HTMLDivElement>(null)
  const tagsDropdownRef = useRef<HTMLDivElement>(null)
  const assigneesDropdownRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const timeDropdownRef = useRef<HTMLDivElement>(null)
  const scrollableContainerRef = useRef<HTMLDivElement>(null)

  // Form sections configuration
  const formSections: FormSection[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      icon: <FileText className="w-5 h-5" />,
      completed: !!title.trim(),
      required: true
    },
    {
      id: 'details',
      title: 'Details & Priority',
      icon: <Settings className="w-5 h-5" />,
      completed: !!title.trim() && !!priority,
      required: true
    },
    {
      id: 'assignment',
      title: 'Assignment',
      icon: <Users className="w-5 h-5" />,
      completed: assignees.length > 0,
      required: false
    },
    {
      id: 'advanced',
      title: 'Advanced Settings',
      icon: <Zap className="w-5 h-5" />,
      completed: tags.length > 0 || !!description.trim(),
      required: false
    }
  ]

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      const scrollX = window.scrollX
      
      const originalBodyStyle = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        width: document.body.style.width,
        height: document.body.style.height,
        overflow: document.body.style.overflow,
        overflowX: document.body.style.overflowX,
        overflowY: document.body.style.overflowY,
        paddingRight: document.body.style.paddingRight
      }
      
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      
      document.body.classList.add('modal-open')
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = `-${scrollX}px`
      document.body.style.width = '100%'
      document.body.style.height = '100%'
      document.body.style.overflow = 'hidden'
      document.body.style.overflowX = 'hidden'
      document.body.style.overflowY = 'hidden'
      
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
      
      const preventTouchMove = (e: TouchEvent) => {
        e.preventDefault()
      }
      
      document.addEventListener('touchmove', preventTouchMove, { passive: false })
      
      return () => {
        document.body.classList.remove('modal-open')
        document.body.style.position = originalBodyStyle.position
        document.body.style.top = originalBodyStyle.top
        document.body.style.left = originalBodyStyle.left
        document.body.style.width = originalBodyStyle.width
        document.body.style.height = originalBodyStyle.height
        document.body.style.overflow = originalBodyStyle.overflow
        document.body.style.overflowX = originalBodyStyle.overflowX
        document.body.style.overflowY = originalBodyStyle.overflowY
        document.body.style.paddingRight = originalBodyStyle.paddingRight
        
        window.scrollTo(scrollX, scrollY)
        document.removeEventListener('touchmove', preventTouchMove)
      }
    }
  }, [isOpen])

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false)
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setPriorityDropdownOpen(false)
      }
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target as Node)) {
        setTagsDropdownOpen(false)
      }
      if (assigneesDropdownRef.current && !assigneesDropdownRef.current.contains(event.target as Node)) {
        setAssigneesDropdownOpen(false)
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false)
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
        setTimeDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initialize form with edit task data
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title)
      setDescription(editTask.description || '')
      setPriority(editTask.priority)
      setStatus(editTask.status)
      setDueDate(editTask.dueDate ? editTask.dueDate.toISOString().split('T')[0] : '')
      setAssignees(editTask.assignees || [])
      setTags(editTask.tags || [])
      } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setStatus(initialStatus)
      setDueDate('')
      setAssignees([])
      setTags([])
      setNewTag('')
    }
  }, [editTask, initialStatus])

  // Helper functions
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
    setActiveSection(sectionId)
  }

  const isSectionExpanded = (sectionId: string) => expandedSections.has(sectionId)

  const addAssignee = (user: { id: string; name: string; email: string }) => {
      setAssignees([...assignees, user])
  }

  const removeAssignee = (userId: string) => {
    setAssignees(assignees.filter(a => a.id !== userId))
  }

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  const addNewTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = () => {
    if (!title.trim()) return

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignees,
      tags,
      completed: status === 'done',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (editTask) {
      onUpdate?.({ ...editTask, ...taskData })
    } else {
      onSave(taskData)
    }
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  // Calendar helper functions
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear()
  }

  const isToday = (date: Date) => {
    return isSameDay(date, today)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setDueDate(date.toISOString().split('T')[0])
  }

  const formatSelectedDate = () => {
    if (selectedDate) {
      return selectedDate.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
        day: 'numeric' 
      })
    }
    return 'Select date...'
  }

  const formatTime = () => {
    if (selectedHour !== null && selectedMinute !== null) {
      return `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`
    }
    return 'Set time...'
  }

  const handleTimeSelect = (hour: number, minute: number) => {
    setSelectedHour(hour)
    setSelectedMinute(minute)
    setTimeDropdownOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 flex items-center justify-center z-[9999] p-4 overflow-hidden" style={{ margin: 0, padding: '1rem', width: '100vw', height: '100vh' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#F8FAFC] to-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#111C59]/10 rounded-xl">
              <FileText className="w-6 h-6 text-[#111C59]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0F1626]">
            {editTask ? 'Edit Task' : 'Create New Task'}
          </h2>
              <p className="text-sm text-gray-600 mt-1">
                {editTask ? 'Update task details' : 'Set up your task with all necessary information'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 overflow-x-auto">
            {formSections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isSectionExpanded(section.id)
                    ? 'bg-[#111C59] text-white shadow-md'
                    : section.completed
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {section.completed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  section.icon
                )}
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div 
          ref={scrollableContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          <div className="p-6 space-y-6">
            
            {/* Basic Information Section */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('basic')}
                className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#111C59]" />
                  <span className="font-semibold text-gray-900">Basic Information</span>
                  {formSections[0].completed && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
                {isSectionExpanded('basic') ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {isSectionExpanded('basic') && (
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] text-gray-900 text-lg font-medium transition-all"
              autoFocus
            />

          </div>

            <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a detailed description for this task..."
                      rows={4}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] resize-none text-gray-900 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Details & Priority Section */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <button
                onClick={() => toggleSection('details')}
                className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-[#111C59]" />
                  <span className="font-semibold text-gray-900">Details & Priority</span>
                  {formSections[1].completed && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </div>
                {isSectionExpanded('details') ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {isSectionExpanded('details') && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Priority Level
                      </label>
              <div className="relative" ref={priorityDropdownRef}>
                <button
                  type="button"
                  onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] bg-white text-gray-900 font-medium flex items-center justify-between transition-all"
                >
                          <span className="flex items-center gap-3">
                            <Flag className={`w-5 h-5 ${
                      priority === 'low' ? 'text-green-500' :
                      priority === 'medium' ? 'text-orange-500' :
                      'text-red-500'
                    }`} />
                    {priority === 'low' ? 'Low Priority' :
                     priority === 'medium' ? 'Medium Priority' :
                     'High Priority'}
                  </span>
                          <ChevronDown className={`w-5 h-5 transition-transform ${priorityDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {priorityDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-20">
                    {[
                      { value: 'low', label: 'Low Priority', color: 'text-green-500' },
                      { value: 'medium', label: 'Medium Priority', color: 'text-orange-500' },
                      { value: 'high', label: 'High Priority', color: 'text-red-500' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setPriority(option.value as Task['priority'])
                          setPriorityDropdownOpen(false)
                        }}
                                className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                      >
                                <span className="flex items-center gap-3">
                                  <Flag className={`w-5 h-5 ${option.color}`} />
                          {option.label}
                        </span>
                                {priority === option.value && <Check className="w-5 h-5 text-[#111C59]" />}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Status
                      </label>
                      <div className="relative" ref={statusDropdownRef}>
                <button
                  type="button"
                          onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] bg-white text-gray-900 font-medium flex items-center justify-between transition-all"
                        >
                          <span className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              status === 'todo' ? 'bg-gray-400' :
                              status === 'in_progress' ? 'bg-blue-500' :
                              'bg-green-500'
                            }`} />
                            {status === 'todo' ? 'To Do' :
                             status === 'in_progress' ? 'In Progress' :
                             'Done'}
                  </span>
                          <ChevronDown className={`w-5 h-5 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                        {statusDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-20">
                            {[
                              { value: 'todo', label: 'To Do', color: 'bg-gray-400' },
                              { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
                              { value: 'done', label: 'Done', color: 'bg-green-500' }
                            ].map((option) => (
                      <button
                                key={option.value}
                        type="button"
                                onClick={() => {
                                  setStatus(option.value as Task['status'])
                                  setStatusDropdownOpen(false)
                                }}
                                className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                              >
                                <span className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${option.color}`} />
                                  {option.label}
                      </span>
                                {status === option.value && <Check className="w-5 h-5 text-[#111C59]" />}
                      </button>
                            ))}
                    </div>
                        )}
                        </div>
                    </div>
                          </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Due Date
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <button
                        onClick={() => setSelectedDate(today)}
                        className={`px-4 py-3 text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
                          selectedDate && isSameDay(selectedDate, today)
                            ? 'bg-[#111C59] text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Today
                      </button>
                      <button
                        onClick={() => setSelectedDate(new Date(today.getTime() + 24 * 60 * 60 * 1000))}
                        className={`px-4 py-3 text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
                          selectedDate && isSameDay(selectedDate, new Date(today.getTime() + 24 * 60 * 60 * 1000))
                            ? 'bg-[#111C59] text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Tomorrow
                      </button>
                      <button
                        onClick={() => setSelectedDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))}
                        className={`px-4 py-3 text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
                          selectedDate && isSameDay(selectedDate, new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))
                            ? 'bg-[#111C59] text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Next Week
                      </button>
                    </div>
                    {selectedDate && (
                      <div className="mt-4 p-3 bg-[#111C59]/10 rounded-lg border border-[#111C59]/20">
                        <p className="text-sm text-[#111C59] font-medium">
                          Due: {selectedDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    )}
                    </div>
                  </div>
                )}
              </div>

            {/* Assignment Section */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                onClick={() => toggleSection('assignment')}
                className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#111C59]" />
                  <span className="font-semibold text-gray-900">Assignment</span>
                  {formSections[2].completed && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
                {isSectionExpanded('assignment') ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
                  </button>

              {isSectionExpanded('assignment') && (
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Assignees
                    </label>
                    
                    {assignees.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {assignees.map((assignee) => (
                          <div
                            key={assignee.id}
                            className="flex items-center gap-2 bg-[#111C59]/10 text-[#111C59] rounded-full px-3 py-2 text-sm font-medium border border-[#111C59]/20"
                          >
                            <Users className="w-4 h-4" />
                            {assignee.name}
                              <button
                              onClick={() => removeAssignee(assignee.id)}
                              className="text-[#111C59] hover:text-red-600 transition-colors ml-1"
                            >
                              <X className="w-4 h-4" />
                              </button>
                          </div>
                            ))}
                          </div>
                    )}

                    <div className="relative" ref={assigneesDropdownRef}>
                                <button
                                  type="button"
                        onClick={() => setAssigneesDropdownOpen(!assigneesDropdownOpen)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] bg-white text-gray-900 font-medium flex items-center justify-between transition-all"
                      >
                        <span className="flex items-center gap-3">
                          <UserPlus className="w-5 h-5 text-[#111C59]" />
                          Select team members...
                        </span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${assigneesDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                      
                      {assigneesDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                          {availableUsers
                            .filter(user => !assignees.some(a => a.id === user.id))
                            .map(user => (
                        <button
                                key={user.id}
                          type="button"
                          onClick={() => {
                                  addAssignee(user)
                                  setAssigneesDropdownOpen(false)
                                }}
                                className="w-full p-4 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                              >
                                <div className="w-10 h-10 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                        </button>
                            ))}
                          {availableUsers.filter(user => !assignees.some(a => a.id === user.id)).length === 0 && (
                            <div className="p-4 text-gray-500 text-center">
                              All team members are already assigned
                      </div>
                          )}
                    </div>
                  )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Settings Section */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('advanced')}
                className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-[#111C59]" />
                  <span className="font-semibold text-gray-900">Advanced Settings</span>
                  {formSections[3].completed && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
          </div>
                {isSectionExpanded('advanced') ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {isSectionExpanded('advanced') && (
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Tags
                    </label>
                    
            {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-2 bg-[#111C59]/10 text-[#111C59] rounded-full px-3 py-2 text-sm font-medium border border-[#111C59]/20"
                    >
                            <Tag className="w-4 h-4" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-[#111C59] hover:text-red-600 transition-colors ml-1"
                      >
                              <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}

                    <div className="space-y-4">
              <div className="relative" ref={tagsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setTagsDropdownOpen(!tagsDropdownOpen)}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] bg-white text-gray-900 font-medium flex items-center justify-between transition-all"
                        >
                          <span className="flex items-center gap-3">
                            <Tag className="w-5 h-5 text-[#111C59]" />
                            Select existing tags...
                  </span>
                          <ChevronDown className={`w-5 h-5 transition-transform ${tagsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {tagsDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                    {availableTags
                      .filter(tag => !tags.includes(tag))
                      .map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            addTag(tag)
                            setTagsDropdownOpen(false)
                          }}
                                  className="w-full p-4 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                            <Tag className="w-4 h-4 text-[#111C59]" />
                            {tag}
                        </button>
                      ))}
                    {availableTags.filter(tag => !tags.includes(tag)).length === 0 && (
                              <div className="p-4 text-gray-500 text-center">
                        No available tags
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNewTag()}
                  placeholder="Create new tag..."
                          className="flex-1 p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] bg-white text-gray-900 font-medium transition-all"
                />
                <button
                  onClick={addNewTag}
                  disabled={!newTag.trim()}
                          className="px-6 py-4 bg-[#111C59] text-white rounded-xl hover:bg-[#0F1626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                          Add
                </button>
              </div>
            </div>
          </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg">
          {/* Task Summary */}
          {title.trim() && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#111C59]" />
                <span className="text-sm font-semibold text-gray-700">Task Summary</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#111C59]"></div>
                  <span className="text-gray-900 font-medium">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className={`w-4 h-4 ${
                    priority === 'low' ? 'text-green-500' :
                    priority === 'medium' ? 'text-orange-500' :
                    'text-red-500'
                  }`} />
                  <span className="text-gray-600">{priority} priority</span>
                </div>
                {selectedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#111C59]" />
                    <span className="text-gray-600">Due {selectedDate.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>
                {formSections.filter(s => s.completed).length} of {formSections.length} sections completed
              </span>
            </div>
            
            <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium border border-gray-200"
          >
            Cancel
          </button>
              
          <button
            onClick={handleSave}
            disabled={!title.trim()}
                className="px-8 py-3 bg-[#111C59] text-white rounded-xl font-semibold hover:bg-[#0F1626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {editTask ? 'Update Task' : 'Create Task'}
          </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}