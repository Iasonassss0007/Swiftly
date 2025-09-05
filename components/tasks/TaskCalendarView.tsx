'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Filter,
  Sparkles,
  Download,
  Settings,
  ArrowLeft,
  ArrowRight,
  Grid3X3,
  List,
  MoreHorizontal,
  Zap
} from 'lucide-react'
import { Task } from './TaskRow'

interface TaskCalendarViewProps {
  tasks: Task[]
  searchTerm: string
  onTaskClick: (task: Task) => void
  onNewTask: (date?: Date) => void
}

type CalendarView = 'month' | 'week' | 'day' | 'agenda'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const VIEW_OPTIONS = [
  { id: 'month', label: 'Month', icon: Grid3X3 },
  { id: 'week', label: 'Week', icon: Calendar },
  { id: 'day', label: 'Day', icon: Clock },
  { id: 'agenda', label: 'Agenda', icon: List }
] as const

export default function TaskCalendarView({
  tasks,
  searchTerm,
  onTaskClick,
  onNewTask
}: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentView, setCurrentView] = useState<CalendarView>('month')
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [conflictData, setConflictData] = useState<{
    task: Task
    date: Date
    conflicts: { hasConflict: boolean; message: string; suggestions: string[] }
  } | null>(null)

  // Filter states
  const [filters, setFilters] = useState({
    projects: [] as string[],
    tags: [] as string[],
    assignees: [] as string[],
    priorities: [] as string[]
  })

  // Filter tasks based on search term and filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply filters
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(task => filters.priorities.includes(task.priority))
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(task => 
        task.tags?.some(tag => filters.tags.includes(tag))
      )
    }

    return filtered
  }, [tasks, searchTerm, filters])

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }, [currentDate])

  // Get week days for week view
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(currentDate.getDate() - day)
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }
    return days
  }, [currentDate])

  // Get tasks for a specific date
  const getTasksForDate = (date: Date | null) => {
    if (!date) return []
    
    return filteredTasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      const days = direction === 'prev' ? -7 : 7
      newDate.setDate(prev.getDate() + days)
      return newDate
    })
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      const days = direction === 'prev' ? -1 : 1
      newDate.setDate(prev.getDate() + days)
      return newDate
    })
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
      case 'medium':
        return { bg: 'bg-[#111C59]/5', text: 'text-[#111C59]', border: 'border-[#111C59]/20', dot: 'bg-[#111C59]' }
      case 'low':
        return { bg: 'bg-gray-50', text: 'text-[#4F5F73]', border: 'border-[#ADB3BD]/30', dot: 'bg-[#ADB3BD]' }
      default:
        return { bg: 'bg-gray-50', text: 'text-[#4F5F73]', border: 'border-[#ADB3BD]/30', dot: 'bg-[#ADB3BD]' }
    }
  }

  // AI-powered conflict detection
  const detectConflicts = (date: Date, task: Task) => {
    const dayTasks = getTasksForDate(date)
    if (dayTasks.length >= 3) {
      return {
        hasConflict: true,
        message: "This day is getting busy. Consider spreading tasks across multiple days.",
        suggestions: ["Move to tomorrow", "Schedule for next week", "Break into smaller tasks"]
      }
    }
    return { hasConflict: false, message: "", suggestions: [] }
  }

  // Handle task drag and drop
  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    setHoveredDate(date)
  }

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    if (draggedTask) {
      const conflicts = detectConflicts(date, draggedTask)
      if (conflicts.hasConflict && aiEnabled) {
        setConflictData({
          task: draggedTask,
          date,
          conflicts
        })
        setShowConflictModal(true)
      } else {
        // Update task date logic would go here
        console.log('Moving task:', draggedTask.title, 'to', date.toDateString())
      }
      setDraggedTask(null)
      setHoveredDate(null)
    }
  }

  const handleConflictResolve = (action: 'proceed' | 'reschedule' | 'cancel') => {
    if (!conflictData) return

    switch (action) {
      case 'proceed':
        console.log('Proceeding with task move despite conflicts')
        break
      case 'reschedule':
        // Find next available day
        const nextDay = new Date(conflictData.date)
        nextDay.setDate(nextDay.getDate() + 1)
        console.log('Rescheduling to:', nextDay.toDateString())
        break
      case 'cancel':
        console.log('Cancelling task move')
        break
    }
    
    setShowConflictModal(false)
    setConflictData(null)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case 'ArrowLeft':
          if (currentView === 'month') navigateMonth('prev')
          else if (currentView === 'week') navigateWeek('prev')
          else if (currentView === 'day') navigateDay('prev')
          break
        case 'ArrowRight':
          if (currentView === 'month') navigateMonth('next')
          else if (currentView === 'week') navigateWeek('next')
          else if (currentView === 'day') navigateDay('next')
          break
        case 'Enter':
          if (selectedDate) onNewTask(selectedDate)
          break
        case 'Escape':
          setSelectedDate(null)
          break
        case 't':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            setCurrentDate(new Date())
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentView, selectedDate, onNewTask])

  const renderTopNavigation = () => (
    <div className="bg-white border-b border-[#ADB3BD]/20 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Month/Year Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentView === 'month') navigateMonth('prev')
                else if (currentView === 'week') navigateWeek('prev')
                else if (currentView === 'day') navigateDay('prev')
              }}
              className="p-2 text-[#4F5F73] hover:text-[#111C59] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Month/Year Selectors */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="flex items-center gap-2 px-4 py-2 text-xl font-bold text-[#0F1626] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200"
                >
                  {MONTHS[currentDate.getMonth()]}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showMonthPicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-[#ADB3BD]/30 rounded-xl shadow-xl z-50 p-2 grid grid-cols-3 gap-1 min-w-[280px]">
                    {MONTHS.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => {
                          const newDate = new Date(currentDate)
                          newDate.setMonth(index)
                          setCurrentDate(newDate)
                          setShowMonthPicker(false)
                        }}
                        className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                          index === currentDate.getMonth()
                            ? 'bg-[#111C59] text-white'
                            : 'text-[#4F5F73] hover:bg-[#F8FAFC] hover:text-[#111C59]'
                        }`}
                      >
                        {month.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowYearPicker(!showYearPicker)}
                  className="flex items-center gap-2 px-4 py-2 text-xl font-bold text-[#0F1626] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200"
                >
                  {currentDate.getFullYear()}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showYearPicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-[#ADB3BD]/30 rounded-xl shadow-xl z-50 p-2 grid grid-cols-4 gap-1 min-w-[240px]">
                    {Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i).map(year => (
                      <button
                        key={year}
                        onClick={() => {
                          const newDate = new Date(currentDate)
                          newDate.setFullYear(year)
                          setCurrentDate(newDate)
                          setShowYearPicker(false)
                        }}
                        className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                          year === currentDate.getFullYear()
                            ? 'bg-[#111C59] text-white'
                            : 'text-[#4F5F73] hover:bg-[#F8FAFC] hover:text-[#111C59]'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-medium text-[#111C59] hover:bg-[#111C59]/10 rounded-lg transition-all duration-200"
            >
              Today
            </button>

            <button
              onClick={() => {
                if (currentView === 'month') navigateMonth('next')
                else if (currentView === 'week') navigateWeek('next')
                else if (currentView === 'day') navigateDay('next')
              }}
              className="p-2 text-[#4F5F73] hover:text-[#111C59] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right: View Selector */}
        <div className="flex items-center gap-4">
          <div className="flex bg-[#F8FAFC] border border-[#ADB3BD]/30 rounded-xl p-1">
            {VIEW_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.id}
                  onClick={() => setCurrentView(option.id as CalendarView)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentView === option.id
                      ? 'bg-[#111C59] text-white shadow-sm'
                      : 'text-[#4F5F73] hover:text-[#111C59] hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              sidebarOpen 
                ? 'bg-[#111C59] text-white' 
                : 'text-[#4F5F73] hover:text-[#111C59] hover:bg-[#F8FAFC]'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )

  const renderMonthView = () => (
    <div className="p-3 lg:p-6">
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 lg:gap-2 mb-2 lg:mb-4">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="p-2 lg:p-4 text-center text-xs lg:text-sm font-semibold text-[#4F5F73] bg-[#F8FAFC]/50 rounded-lg">
            <span className="lg:hidden">{day.slice(0, 1)}</span>
            <span className="hidden lg:inline">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 lg:gap-2">
        {calendarDays.map((date, index) => {
          const dayTasks = getTasksForDate(date)
          const hasOverdueTasks = dayTasks.some(task => {
            if (!task.dueDate) return false
            const taskDate = new Date(task.dueDate)
            return taskDate < new Date() && !task.completed
          })

          return (
            <div
              key={index}
              className={`min-h-[80px] lg:min-h-[140px] p-2 lg:p-3 border-2 rounded-lg lg:rounded-xl cursor-pointer transition-all duration-200 group relative ${
                date ? 'bg-white hover:bg-[#F8FAFC] hover:shadow-md' : 'bg-gray-50/50 cursor-default'
              } ${isToday(date) ? 'ring-2 ring-[#111C59]/30 bg-[#111C59]/5 border-[#111C59]/20' : 'border-[#ADB3BD]/20'} ${
                isSelected(date) ? 'ring-2 ring-[#111C59] bg-[#111C59]/10 border-[#111C59]' : ''
              } ${hoveredDate === date ? 'ring-2 ring-blue-300 bg-blue-50' : ''}`}
              onClick={() => {
                if (date) {
                  setSelectedDate(isSelected(date) ? null : date)
                }
              }}
              onDragOver={(e) => date && handleDragOver(e, date)}
              onDrop={(e) => date && handleDrop(e, date)}
            >
              {date && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs lg:text-sm font-semibold ${
                      isToday(date) ? 'text-[#111C59]' : 'text-[#0F1626]'
                    }`}>
                      {date.getDate()}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      {dayTasks.length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            hasOverdueTasks ? 'bg-red-500' : 'bg-[#111C59]'
                          }`} />
                          <span className="text-xs text-[#4F5F73] font-medium">
                            {dayTasks.length}
                          </span>
                        </div>
                      )}
                      
                      {aiEnabled && dayTasks.length > 0 && (
                        <Sparkles className="w-3 h-3 text-[#111C59] opacity-60" />
                      )}
                    </div>
                  </div>
                  
                  {/* Task indicators */}
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map(task => {
                      const colors = getPriorityColor(task.priority)
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onClick={(e) => {
                            e.stopPropagation()
                            onTaskClick(task)
                          }}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border cursor-pointer hover:shadow-sm transition-all duration-200 truncate ${colors.bg} ${colors.text} ${colors.border} ${
                            task.completed ? 'opacity-60 line-through' : ''
                          }`}
                          title={task.title}
                        >
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                            {task.title}
                          </div>
                        </div>
                      )
                    })}
                    
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-[#4F5F73] font-medium px-2 py-1">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>

                  {/* Quick Add Button (appears on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNewTask(date)
                    }}
                    className="absolute bottom-1 lg:bottom-2 right-1 lg:right-2 w-5 h-5 lg:w-6 lg:h-6 bg-[#111C59] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderConflictModal = () => (
    showConflictModal && conflictData && (
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ margin: 0, padding: '1rem', width: '100vw', height: '100vh' }}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#0F1626]">AI Conflict Detected</h3>
          </div>
          
          <p className="text-[#4F5F73] mb-4">{conflictData.conflicts.message}</p>
          
          <div className="mb-6">
            <h4 className="text-sm font-medium text-[#0F1626] mb-2">AI Suggestions:</h4>
            <ul className="space-y-1">
              {conflictData.conflicts.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-[#4F5F73] flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#111C59] rounded-full" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => handleConflictResolve('cancel')}
              className="flex-1 px-4 py-2 text-sm text-[#4F5F73] hover:text-[#0F1626] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConflictResolve('reschedule')}
              className="flex-1 px-4 py-2 text-sm bg-[#111C59]/10 text-[#111C59] hover:bg-[#111C59]/20 rounded-lg transition-all duration-200"
            >
              Reschedule
            </button>
            <button
              onClick={() => handleConflictResolve('proceed')}
              className="flex-1 px-4 py-2 text-sm bg-[#111C59] text-white hover:bg-[#0F1626] rounded-lg transition-all duration-200"
            >
              Proceed
            </button>
          </div>
        </div>
      </div>
    )
  )

  return (
    <>
      {renderConflictModal()}
      <div className="flex h-screen bg-[#F8FAFC] relative">
        {/* Mobile overlay for sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="fixed lg:relative top-0 left-0 h-full w-80 bg-white border-r border-[#ADB3BD]/20 flex flex-col z-50 lg:z-auto transform lg:transform-none transition-transform duration-300">
          <div className="p-6 border-b border-[#ADB3BD]/20">
            <h3 className="text-lg font-semibold text-[#0F1626] mb-4">Filters</h3>
            
            {/* Priority Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-[#4F5F73] mb-2">Priority</h4>
              <div className="space-y-2">
                {['high', 'medium', 'low'].map(priority => {
                  const colors = getPriorityColor(priority as Task['priority'])
                  return (
                    <label key={priority} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.priorities.includes(priority)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              priorities: [...prev.priorities, priority]
                            }))
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              priorities: prev.priorities.filter(p => p !== priority)
                            }))
                          }
                        }}
                        className="rounded border-[#ADB3BD]/30 text-[#111C59] focus:ring-[#111C59]/20"
                      />
                      <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                      <span className="text-sm text-[#4F5F73] capitalize">{priority}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* AI Toggle */}
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="rounded border-[#ADB3BD]/30 text-[#111C59] focus:ring-[#111C59]/20"
                />
                <Sparkles className="w-4 h-4 text-[#111C59]" />
                <span className="text-sm font-medium text-[#0F1626]">AI Assistance</span>
              </label>
              <p className="text-xs text-[#4F5F73] mt-1 ml-6">
                Get smart suggestions and conflict detection
              </p>
            </div>
          </div>
          </div>
        )}

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col lg:ml-0">
        {renderTopNavigation()}
        
        <div className="flex-1 overflow-hidden">
          {currentView === 'month' && renderMonthView()}
          {currentView === 'week' && (
            <div className="p-6 flex items-center justify-center h-full">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-[#ADB3BD] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#0F1626] mb-2">Week View</h3>
                <p className="text-[#4F5F73]">Coming soon with time-block scheduling</p>
              </div>
            </div>
          )}
          {currentView === 'day' && (
            <div className="p-6 flex items-center justify-center h-full">
              <div className="text-center">
                <Clock className="w-16 h-16 text-[#ADB3BD] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#0F1626] mb-2">Day View</h3>
                <p className="text-[#4F5F73]">Coming soon with hourly scheduling</p>
              </div>
            </div>
          )}
          {currentView === 'agenda' && (
            <div className="p-6 flex items-center justify-center h-full">
              <div className="text-center">
                <List className="w-16 h-16 text-[#ADB3BD] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#0F1626] mb-2">Agenda View</h3>
                <p className="text-[#4F5F73]">Coming soon with chronological task listing</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="bg-white border-t border-[#ADB3BD]/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xs text-[#4F5F73]">
                <kbd className="px-2 py-1 bg-[#F8FAFC] border border-[#ADB3BD]/30 rounded text-xs">←→</kbd> Navigate
                <kbd className="px-2 py-1 bg-[#F8FAFC] border border-[#ADB3BD]/30 rounded text-xs ml-2">Enter</kbd> Add Task
                <kbd className="px-2 py-1 bg-[#F8FAFC] border border-[#ADB3BD]/30 rounded text-xs ml-2">Esc</kbd> Close
                <kbd className="px-2 py-1 bg-[#F8FAFC] border border-[#ADB3BD]/30 rounded text-xs ml-2">⌘T</kbd> Today
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-[#4F5F73] hover:text-[#111C59] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200">
                <Download className="w-4 h-4" />
                Export
              </button>

              <button className="flex items-center gap-2 px-4 py-2 text-sm text-[#4F5F73] hover:text-[#111C59] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200">
                <Settings className="w-4 h-4" />
                Settings
              </button>

              <button
                onClick={() => onNewTask(selectedDate || new Date())}
                className="flex items-center gap-2 px-6 py-2 bg-[#111C59] text-white rounded-lg hover:bg-[#0F1626] transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}