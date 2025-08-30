'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Calendar, Flag, Users, Tag, Plus, ChevronDown, Check, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import Image from 'next/image'
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
    avatarUrl?: string
  }>
  availableTags: string[]
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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [status, setStatus] = useState<Task['status']>(initialStatus)
  const [dueDate, setDueDate] = useState('')
  const [assignees, setAssignees] = useState<Task['assignees']>([])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false)
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null)
  
  // Calendar state - must be at top level
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const priorityDropdownRef = useRef<HTMLDivElement>(null)
  const tagsDropdownRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const timeDropdownRef = useRef<HTMLDivElement>(null)

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
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false)
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
        setTimeDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const resetForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setStatus(initialStatus)
    setDueDate('')
    setAssignees([])
    setTags([])
    setNewTag('')
    setStatusDropdownOpen(false)
    setPriorityDropdownOpen(false)
    setTagsDropdownOpen(false)
    setCalendarOpen(false)
    setSelectedDate(null)
    setSelectedTime('')
    setTimeDropdownOpen(false)
    setSelectedHour(null)
    setSelectedMinute(null)
  }, [initialStatus])

  // Populate form when editing a task
  useEffect(() => {
    if (isOpen && editTask) {
      setTitle(editTask.title)
      setDescription(editTask.description || '')
      setPriority(editTask.priority)
      setStatus(editTask.status)
      setAssignees(editTask.assignees || [])
      setTags(editTask.tags || [])
      
      if (editTask.dueDate) {
        setSelectedDate(editTask.dueDate)
        setSelectedHour(editTask.dueDate.getHours())
        setSelectedMinute(editTask.dueDate.getMinutes())
      } else {
        setSelectedDate(null)
        setSelectedHour(null)
        setSelectedMinute(null)
      }
    } else if (isOpen && !editTask) {
      // Reset form for new task
      resetForm()
    }
  }, [isOpen, editTask, initialStatus, resetForm])

  if (!isOpen) return null

  const handleSave = () => {
    if (!title.trim()) return

    // Combine selected date and time
    let finalDueDate: Date | null = null
    if (selectedDate) {
      finalDueDate = new Date(selectedDate)
      if (selectedHour !== null && selectedMinute !== null) {
        finalDueDate.setHours(selectedHour, selectedMinute, 0, 0)
      } else if (selectedTime) {
        const [hours, minutes] = selectedTime.split(':').map(Number)
        finalDueDate.setHours(hours, minutes, 0, 0)
      }
    }

    if (editTask && onUpdate) {
      // Update existing task
      const updatedTask: Task = {
        ...editTask,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: finalDueDate,
        assignees,
        tags: tags.length > 0 ? tags : undefined,
        completed: status === 'done'
      }
      onUpdate(updatedTask)
    } else {
      // Create new task
      const newTask: Omit<Task, 'id'> = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: finalDueDate,
        assignees,
        tags: tags.length > 0 ? tags : undefined,
        completed: status === 'done',
        subtasks: [],
        attachments: [],
        comments: []
      }
      onSave(newTask)
    }
    
    resetForm()
    onClose()
  }

  const handleCancel = () => {
    resetForm()
    onClose()
  }

  const addAssignee = (userId: string) => {
    const user = availableUsers.find(u => u.id === userId)
    if (user && !assignees.find(a => a.id === userId)) {
      setAssignees([...assignees, user])
    }
  }

  const removeAssignee = (userId: string) => {
    setAssignees(assignees.filter(a => a.id !== userId))
  }

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
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

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Calendar helper functions
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

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

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setCalendarOpen(false)
  }

  const handleCalendarToggle = () => {
    setCalendarOpen(!calendarOpen)
    
    // Scroll to calendar with smooth effect when opening - only if needed
    if (!calendarOpen) {
      setTimeout(() => {
        if (calendarRef.current) {
          // Get the modal content container
          const modalContent = calendarRef.current.closest('.overflow-y-auto')
          
          if (modalContent) {
            const calendarRect = calendarRef.current.getBoundingClientRect()
            const modalRect = modalContent.getBoundingClientRect()
            
            // Calculate exact space needed for dropdown
            const dropdownHeight = 450 // Calendar dropdown height + padding
            const spaceBelow = modalRect.bottom - calendarRect.bottom
            const spaceAbove = calendarRect.top - modalRect.top
            
            // Only scroll if the dropdown would actually be cut off
            if (spaceBelow < dropdownHeight) {
              // Check if we have enough space above to scroll up
              if (spaceAbove > 100) {
                // Scroll just enough to show the dropdown, not more
                const scrollDistance = dropdownHeight - spaceBelow + 20 // 20px buffer
                modalContent.scrollBy({
                  top: scrollDistance,
                  behavior: 'smooth'
                })
              }
            }
            // If there's enough space, don't scroll at all
          }
        }
      }, 150) // Small delay to ensure dropdown is rendered
    }
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return 'Select due date...'
    
    const dateStr = selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    
    if (selectedHour !== null && selectedMinute !== null) {
      const timeStr = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`
      return `${dateStr} at ${timeStr}`
    } else if (selectedTime) {
      return `${dateStr} at ${selectedTime}`
    }
    
    return dateStr
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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#ADB3BD]/30">
          <h2 className="text-2xl font-semibold text-[#0F1626]">
            {editTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={handleCancel}
            className="p-2 text-[#4F5F73] hover:text-[#0F1626] hover:bg-[#F8FAFC] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-160px)]">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#4F5F73] mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="w-full p-3 border border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] text-[#0F1626]"
              autoFocus
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-[#0F1626] mb-3">Status</label>
              <div className="relative" ref={statusDropdownRef}>
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="w-full p-3 border-2 border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] bg-white text-[#0F1626] font-medium flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      status === 'todo' ? 'bg-gray-400' :
                      status === 'in_progress' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`} />
                    {status === 'todo' ? 'To Do' :
                     status === 'in_progress' ? 'In Progress' :
                     'Done'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {statusDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#ADB3BD]/30 rounded-lg shadow-lg z-10">
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
                        className="w-full p-3 text-left hover:bg-[#F8FAFC] flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                          {option.label}
                        </span>
                        {status === option.value && <Check className="w-4 h-4 text-[#111C59]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[#0F1626] mb-3">Priority</label>
              <div className="relative" ref={priorityDropdownRef}>
                <button
                  type="button"
                  onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                  className="w-full p-3 border-2 border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] bg-white text-[#0F1626] font-medium flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Flag className={`w-4 h-4 ${
                      priority === 'low' ? 'text-green-500' :
                      priority === 'medium' ? 'text-orange-500' :
                      'text-red-500'
                    }`} />
                    {priority === 'low' ? 'Low Priority' :
                     priority === 'medium' ? 'Medium Priority' :
                     'High Priority'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${priorityDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {priorityDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#ADB3BD]/30 rounded-lg shadow-lg z-10">
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
                        className="w-full p-3 text-left hover:bg-[#F8FAFC] flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Flag className={`w-4 h-4 ${option.color}`} />
                          {option.label}
                        </span>
                        {priority === option.value && <Check className="w-4 h-4 text-[#111C59]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#0F1626] mb-3">Due Date</label>
            <div className="space-y-3">
              {/* Date Picker */}
              <div className="relative" ref={calendarRef}>
                <button
                  type="button"
                  onClick={handleCalendarToggle}
                  className="w-full pl-11 pr-4 py-3 border-2 border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] bg-white text-[#0F1626] font-medium flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <Calendar className="absolute left-3 w-5 h-5 text-[#111C59]" />
                    {formatSelectedDate()}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${calendarOpen ? 'rotate-180' : ''}`} />
                </button>

                {calendarOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#ADB3BD]/30 rounded-lg shadow-lg z-30 p-4">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => navigateMonth('prev')}
                        className="p-1 hover:bg-[#F8FAFC] rounded transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-semibold text-[#0F1626]">
                        {monthNames[currentMonth]} {currentYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigateMonth('next')}
                        className="p-1 hover:bg-[#F8FAFC] rounded transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-[#4F5F73] p-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {/* Previous month days */}
                      {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }, (_, i) => {
                        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
                        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
                        const day = getDaysInMonth(prevMonth, prevYear) - getFirstDayOfMonth(currentMonth, currentYear) + i + 1
                        return (
                          <div key={`prev-${i}`} className="p-2 text-center text-[#4F5F73]/50 text-sm">
                            {day}
                          </div>
                        )
                      })}

                      {/* Current month days */}
                      {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }, (_, i) => {
                        const day = i + 1
                        const date = new Date(currentYear, currentMonth, day)
                        const isSelected = selectedDate && isSameDay(date, selectedDate)
                        const isTodayDate = isToday(date)

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleDateSelect(date)}
                            className={`p-2 text-sm rounded transition-colors ${
                              isSelected
                                ? 'bg-[#111C59] text-white'
                                : isTodayDate
                                ? 'bg-[#111C59]/10 text-[#111C59] font-semibold'
                                : 'hover:bg-[#F8FAFC] text-[#0F1626]'
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}

                      {/* Next month days */}
                      {Array.from({ length: 42 - getDaysInMonth(currentMonth, currentYear) - getFirstDayOfMonth(currentMonth, currentYear) }, (_, i) => {
                        const day = i + 1
                        return (
                          <div key={`next-${i}`} className="p-2 text-center text-[#4F5F73]/50 text-sm">
                            {day}
                          </div>
                        )
                      })}
                    </div>

                    {/* Quick date options */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-[#ADB3BD]/30">
                      <button
                        type="button"
                        onClick={() => handleDateSelect(today)}
                        className="px-3 py-1 text-xs bg-[#F8FAFC] text-[#111C59] rounded hover:bg-[#111C59]/10 transition-colors"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDateSelect(new Date(today.getTime() + 24 * 60 * 60 * 1000))}
                        className="px-3 py-1 text-xs bg-[#F8FAFC] text-[#111C59] rounded hover:bg-[#111C59]/10 transition-colors"
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDateSelect(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))}
                        className="px-3 py-1 text-xs bg-[#F8FAFC] text-[#111C59] rounded hover:bg-[#111C59]/10 transition-colors"
                      >
                        Next Week
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Time Picker */}
              {selectedDate && (
                <div className="relative" ref={timeDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] bg-white text-[#0F1626] font-medium flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      <Clock className="absolute left-3 w-5 h-5 text-[#111C59]" />
                      {formatTime()}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${timeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {timeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#ADB3BD]/30 rounded-lg shadow-lg z-40 p-4">
                      <div className="flex gap-4">
                        {/* Hours */}
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-[#4F5F73] mb-2">Hour</label>
                          <div className="max-h-40 overflow-y-auto border border-[#ADB3BD]/30 rounded">
                            {Array.from({ length: 24 }, (_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  const minute = selectedMinute !== null ? selectedMinute : 0
                                  handleTimeSelect(i, minute)
                                }}
                                className={`w-full p-2 text-left text-sm hover:bg-[#F8FAFC] transition-colors ${
                                  selectedHour === i ? 'bg-[#111C59] text-white' : 'text-[#0F1626]'
                                }`}
                              >
                                {i.toString().padStart(2, '0')}:00
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Minutes */}
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-[#4F5F73] mb-2">Minute</label>
                          <div className="max-h-40 overflow-y-auto border border-[#ADB3BD]/30 rounded">
                            {Array.from({ length: 12 }, (_, i) => {
                              const minute = i * 5
                              return (
                                <button
                                  key={minute}
                                  type="button"
                                  onClick={() => {
                                    const hour = selectedHour !== null ? selectedHour : 9
                                    handleTimeSelect(hour, minute)
                                  }}
                                  className={`w-full p-2 text-left text-sm hover:bg-[#F8FAFC] transition-colors ${
                                    selectedMinute === minute ? 'bg-[#111C59] text-white' : 'text-[#0F1626]'
                                  }`}
                                >
                                  :{minute.toString().padStart(2, '0')}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Quick time options */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-[#ADB3BD]/30">
                        <button
                          type="button"
                          onClick={() => handleTimeSelect(9, 0)}
                          className="px-3 py-1 text-xs bg-[#F8FAFC] text-[#111C59] rounded hover:bg-[#111C59]/10 transition-colors"
                        >
                          9:00 AM
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTimeSelect(12, 0)}
                          className="px-3 py-1 text-xs bg-[#F8FAFC] text-[#111C59] rounded hover:bg-[#111C59]/10 transition-colors"
                        >
                          12:00 PM
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTimeSelect(17, 0)}
                          className="px-3 py-1 text-xs bg-[#F8FAFC] text-[#111C59] rounded hover:bg-[#111C59]/10 transition-colors"
                        >
                          5:00 PM
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHour(null)
                            setSelectedMinute(null)
                            setTimeDropdownOpen(false)
                          }}
                          className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>



          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#0F1626] mb-3">Tags</label>
            
            {/* Selected Tags */}
            {tags.length > 0 && (
              <div className="bg-[#F8FAFC] border border-[#ADB3BD]/30 rounded-lg p-4 mb-4">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-2 bg-[#111C59]/10 text-[#111C59] rounded-full px-3 py-2 text-sm font-medium border border-[#111C59]/20"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-[#111C59] hover:text-red-600 transition-colors ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Tag Controls */}
            <div className="space-y-3">
              {/* Existing Tags Dropdown */}
              <div className="relative" ref={tagsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setTagsDropdownOpen(!tagsDropdownOpen)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] bg-white text-[#0F1626] font-medium flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <Tag className="absolute left-3 w-5 h-5 text-[#111C59]" />
                    Select existing tag...
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${tagsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {tagsDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#ADB3BD]/30 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
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
                          className="w-full p-3 text-left hover:bg-[#F8FAFC] flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-[#111C59]" />
                            {tag}
                          </span>
                        </button>
                      ))}
                    {availableTags.filter(tag => !tags.includes(tag)).length === 0 && (
                      <div className="p-3 text-[#4F5F73] text-center">
                        No available tags
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* New Tag Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNewTag()}
                  placeholder="Create new tag..."
                  className="flex-1 p-3 border-2 border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] bg-white text-[#0F1626] font-medium"
                />
                <button
                  onClick={addNewTag}
                  disabled={!newTag.trim()}
                  className="px-4 py-3 bg-[#111C59] text-white rounded-lg hover:bg-[#0F1626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#0F1626] mb-3">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a detailed description for this task..."
              rows={5}
              className="w-full p-4 border-2 border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] resize-none bg-white text-[#0F1626] font-medium"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-4 p-6 border-t border-[#ADB3BD]/30 bg-white shadow-lg">
          <button
            onClick={handleCancel}
            className="px-6 py-3 text-[#4F5F73] hover:text-[#0F1626] hover:bg-white rounded-lg transition-colors font-medium border border-[#ADB3BD]/30"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-8 py-3 bg-[#111C59] text-white rounded-lg font-semibold hover:bg-[#0F1626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {editTask ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
