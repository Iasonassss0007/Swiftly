'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { Task } from './TaskRow'

interface CalendarViewProps {
  tasks: Task[]
  searchTerm: string
  onTaskClick: (task: Task) => void
  onNewTask: (date?: Date) => void
}

export default function CalendarView({
  tasks,
  searchTerm,
  onTaskClick,
  onNewTask
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Filter tasks based on search term
  const filteredTasks = useMemo(() => {
    return tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignees.some(assignee => 
        assignee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignee.email.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      task.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [tasks, searchTerm])

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      if (task.dueDate) {
        const dateKey = task.dueDate.toDateString()
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(task)
      }
      return acc
    }, {} as Record<string, Task[]>)
  }, [filteredTasks])

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get the first day of the month and how many days in the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Get days from previous month to fill the grid
  const daysFromPrevMonth = startingDayOfWeek
  const prevMonth = new Date(currentYear, currentMonth - 1, 0)
  const daysInPrevMonth = prevMonth.getDate()

  // Get days from next month to fill the grid
  const totalCells = 42 // 6 weeks * 7 days
  const daysFromNextMonth = totalCells - daysInMonth - daysFromPrevMonth

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

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }

  const getDayTasks = (date: Date) => {
    return tasksByDate[date.toDateString()] || []
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const isPrevMonth = (dayNumber: number, isPrev: boolean) => isPrev
  const isNextMonth = (dayNumber: number, isNext: boolean) => isNext
  const isCurrentMonth = (dayNumber: number, isPrev: boolean, isNext: boolean) => !isPrev && !isNext

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-orange-500'
      case 'low': return 'bg-green-500'
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'border-gray-300'
      case 'in_progress': return 'border-blue-500'
      case 'done': return 'border-green-500'
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Generate calendar grid
  const calendarDays = []

  // Previous month days
  for (let i = daysFromPrevMonth; i > 0; i--) {
    const dayNumber = daysInPrevMonth - i + 1
    const date = new Date(currentYear, currentMonth - 1, dayNumber)
    calendarDays.push({
      date,
      dayNumber,
      isPrevMonth: true,
      isCurrentMonth: false,
      isNextMonth: false
    })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    calendarDays.push({
      date,
      dayNumber: day,
      isPrevMonth: false,
      isCurrentMonth: true,
      isNextMonth: false
    })
  }

  // Next month days
  for (let day = 1; day <= daysFromNextMonth; day++) {
    const date = new Date(currentYear, currentMonth + 1, day)
    calendarDays.push({
      date,
      dayNumber: day,
      isPrevMonth: false,
      isCurrentMonth: false,
      isNextMonth: true
    })
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#ADB3BD]/30 rounded-xl shadow-lg">
      {/* Calendar Header */}
      <div className="p-4 border-b border-[#ADB3BD]/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-[#0F1626]">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-[#111C59] text-white rounded-md hover:bg-[#0F1626] transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-[#4F5F73] hover:text-[#111C59] hover:bg-[#F8FAFC] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-[#4F5F73] hover:text-[#111C59] hover:bg-[#F8FAFC] rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm text-[#4F5F73]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Low Priority</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-[#4F5F73] py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(({ date, dayNumber, isPrevMonth, isCurrentMonth, isNextMonth }, index) => {
            const dayTasks = getDayTasks(date)
            const isCurrentDay = isToday(date)
            const isSelectedDay = isSelected(date)

            return (
              <div
                key={index}
                className={`min-h-[70px] border border-[#ADB3BD]/20 rounded-md p-1.5 cursor-pointer transition-all duration-200 ${
                  isCurrentMonth
                    ? 'bg-white hover:bg-[#F8FAFC] hover:border-[#111C59]/30'
                    : 'bg-[#F8FAFC]/50 text-[#4F5F73]'
                } ${
                  isCurrentDay ? 'ring-1 ring-[#111C59]/20 bg-[#111C59]/5' : ''
                } ${
                  isSelectedDay ? 'ring-1 ring-[#111C59] bg-[#111C59]/10' : ''
                }`}
                onClick={() => {
                  setSelectedDate(date)
                  if (dayTasks.length === 0) {
                    onNewTask(date)
                  }
                }}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={`text-xs font-medium ${
                      isCurrentMonth ? 'text-[#0F1626]' : 'text-[#4F5F73]'
                    } ${
                      isCurrentDay ? 'text-[#111C59] font-semibold' : ''
                    }`}
                  >
                    {dayNumber}
                  </span>
                  
                  {isCurrentMonth && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onNewTask(date)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[#4F5F73] hover:text-[#111C59] hover:bg-white rounded transition-all duration-200"
                      title="Add task"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                {/* Tasks */}
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 1).map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onTaskClick(task)
                      }}
                      className={`group relative p-1.5 rounded border-l-2 ${getStatusColor(task.status)} bg-white/80 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)}`} />
                        <span className="text-xs text-[#0F1626] font-medium truncate flex-1">
                          {task.title}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {dayTasks.length > 1 && (
                    <div className="text-xs text-[#4F5F73] text-center py-0.5">
                      +{dayTasks.length - 1}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="border-t border-[#ADB3BD]/30 p-6 bg-[#F8FAFC]/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#0F1626]">
              Tasks for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <button
              onClick={() => onNewTask(selectedDate)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-[#111C59] text-white rounded-md hover:bg-[#0F1626] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          <div className="space-y-2">
            {getDayTasks(selectedDate).length === 0 ? (
              <p className="text-[#4F5F73] text-center py-4">
                No tasks scheduled for this day
              </p>
            ) : (
              getDayTasks(selectedDate).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="flex items-center gap-3 p-3 bg-white border border-[#ADB3BD]/30 rounded-lg hover:shadow-sm hover:border-[#111C59]/30 transition-all duration-200 cursor-pointer"
                >
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                  <span className="font-medium text-[#0F1626] flex-1">{task.title}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    task.status === 'done' ? 'bg-green-100 text-green-700' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status === 'todo' ? 'To Do' :
                     task.status === 'in_progress' ? 'In Progress' :
                     'Done'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Calendar Footer */}
      <div className="border-t border-[#ADB3BD]/30 p-4 bg-[#F8FAFC]/50">
        <div className="flex items-center justify-between text-sm text-[#4F5F73]">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span>
              {filteredTasks.filter(t => t.dueDate).length} tasks with due dates
            </span>
          </div>
          <div>
            {filteredTasks.filter(t => t.dueDate && t.dueDate < today && !t.completed).length > 0 && (
              <span className="text-red-600">
                {filteredTasks.filter(t => t.dueDate && t.dueDate < today && !t.completed).length} overdue tasks
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
