'use client'

import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Flag, User } from 'lucide-react'
import { Task } from './TaskRow'
import Image from 'next/image'

interface TaskCalendarProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onMenuAction: (taskId: string, action: 'edit' | 'duplicate' | 'archive' | 'delete') => void
}

type CalendarView = 'month' | 'week' | 'day'

interface TaskEvent {
  task: Task
  startDate: Date
  endDate: Date
  isMultiDay: boolean
}

interface TaskTooltipProps {
  task: Task
  position: { x: number; y: number }
  onClose: () => void
}

function TaskTooltip({ task, position, onClose }: TaskTooltipProps) {
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-orange-600 bg-orange-50'
      case 'low': return 'text-green-600 bg-green-50'
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done': return 'text-green-600'
      case 'in_progress': return 'text-blue-600'
      case 'todo': return 'text-gray-600'
    }
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div 
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs"
      style={{ 
        left: Math.min(position.x, window.innerWidth - 320),
        top: Math.min(position.y, window.innerHeight - 200)
      }}
    >
      <div className="space-y-3">
        <div>
          <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className={`w-3 h-3 ${getPriorityColor(task.priority).split(' ')[0]}`} />
            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
          <span className={`text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-3 h-3" />
            <span>Due: {task.dueDate.toLocaleDateString()}</span>
          </div>
        )}

        {task.assignees.length > 0 && (
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-gray-400" />
            <div className="flex -space-x-1">
              {task.assignees.slice(0, 3).map((assignee) => (
                <div
                  key={assignee.id}
                  className="relative"
                  title={assignee.name}
                >
                  {assignee.avatarUrl ? (
                    <Image
                      src={assignee.avatarUrl}
                      alt={assignee.name}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full border border-white"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-gray-500 rounded-full border border-white flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {getUserInitials(assignee.name)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div className="w-5 h-5 bg-gray-100 border border-white rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-xs">+{task.assignees.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
    </div>
  )
}

interface TaskBlockProps {
  taskEvent: TaskEvent
  onClick: (task: Task) => void
  onMouseEnter: (e: React.MouseEvent, task: Task) => void
  onMouseLeave: () => void
  isDragging?: boolean
  style?: React.CSSProperties
}

function TaskBlock({ taskEvent, onClick, onMouseEnter, onMouseLeave, isDragging = false, style }: TaskBlockProps) {
  const { task } = taskEvent

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500 border-red-600'
      case 'medium': return 'bg-orange-500 border-orange-600'
      case 'low': return 'bg-green-500 border-green-600'
    }
  }

  const getStatusOpacity = (status: Task['status']) => {
    switch (status) {
      case 'done': return 'opacity-60'
      case 'in_progress': return 'opacity-90'
      case 'todo': return 'opacity-100'
    }
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div
      className={`
        group cursor-pointer rounded px-2 py-1 text-xs font-medium text-white
        transition-all duration-200 hover:shadow-md
        ${getPriorityColor(task.priority)} ${getStatusOpacity(task.status)}
        ${isDragging ? 'scale-105 shadow-lg z-50' : ''}
        ${task.completed ? 'line-through' : ''}
      `}
      style={style}
      onClick={() => onClick(task)}
      onMouseEnter={(e) => onMouseEnter(e, task)}
      onMouseLeave={onMouseLeave}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate flex-1">{task.title}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {task.assignees.length > 0 && (
            <div className="flex -space-x-0.5">
              {task.assignees.slice(0, 2).map((assignee) => (
                <div
                  key={assignee.id}
                  className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center border border-white/30"
                  title={assignee.name}
                >
                  <span className="text-white text-xs font-medium">
                    {getUserInitials(assignee.name)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Flag className="w-3 h-3 opacity-75" />
        </div>
      </div>
    </div>
  )
}

export default function TaskCalendar({
  tasks,
  onTaskClick,
  onTaskUpdate,
  onMenuAction
}: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ task: Task; position: { x: number; y: number } } | null>(null)

  // Convert tasks to calendar events
  const taskEvents = useMemo((): TaskEvent[] => {
    return tasks
      .filter(task => task.dueDate)
      .map(task => {
        const dueDate = new Date(task.dueDate!)
        // For simplicity, assume tasks are single-day events
        // In a real implementation, you might have start and end dates
        return {
          task,
          startDate: dueDate,
          endDate: dueDate,
          isMultiDay: false
        }
      })
  }, [tasks])

  // Navigation functions
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      switch (view) {
        case 'month':
          newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
          break
        case 'week':
          newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7))
          break
        case 'day':
          newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1))
          break
      }
      return newDate
    })
  }, [view])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  // Get calendar period info
  const periodInfo = useMemo(() => {
    const today = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    switch (view) {
      case 'month':
        return {
          title: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          isToday: today.getMonth() === month && today.getFullYear() === year
        }
      case 'week':
        const startOfWeek = new Date(currentDate)
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        return {
          title: `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          isToday: today >= startOfWeek && today <= endOfWeek
        }
      case 'day':
        return {
          title: currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
          isToday: today.toDateString() === currentDate.toDateString()
        }
    }
  }, [currentDate, view])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId && taskId !== draggedTask) {
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        onTaskUpdate(taskId, { dueDate: date })
      }
    }
    setDraggedTask(null)
  }, [tasks, onTaskUpdate, draggedTask])

  // Handle task tooltip
  const handleTaskMouseEnter = useCallback((e: React.MouseEvent, task: Task) => {
    setTooltip({
      task,
      position: { x: e.clientX + 10, y: e.clientY + 10 }
    })
  }, [])

  const handleTaskMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  // Render different calendar views
  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    const today = new Date()
    const isCurrentMonth = (date: Date) => date.getMonth() === month

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map(date => {
          const dayTasks = taskEvents.filter(event => 
            event.startDate.toDateString() === date.toDateString()
          )
          const isToday = today.toDateString() === date.toDateString()
          const isCurrentMonthDay = isCurrentMonth(date)
          
          return (
            <div
              key={date.toISOString()}
              className={`bg-white min-h-[120px] p-2 ${
                isCurrentMonthDay ? '' : 'bg-gray-50 text-gray-400'
              }`}
              onDragOver={(e) => handleDragOver(e, date)}
              onDrop={(e) => handleDrop(e, date)}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''
              }`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(taskEvent => (
                  <TaskBlock
                    key={taskEvent.task.id}
                    taskEvent={taskEvent}
                    onClick={onTaskClick}
                    onMouseEnter={handleTaskMouseEnter}
                    onMouseLeave={handleTaskMouseLeave}
                    isDragging={draggedTask === taskEvent.task.id}
                  />
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDays.push(day)
    }

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const today = new Date()

    return (
      <div className="flex flex-col">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-px bg-gray-200">
          <div className="bg-gray-50 p-3"></div>
          {weekDays.map(date => {
            const isToday = today.toDateString() === date.toDateString()
            return (
              <div key={date.toISOString()} className={`bg-gray-50 p-3 text-center ${isToday ? 'bg-blue-50' : ''}`}>
                <div className="text-xs text-gray-600">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Week grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            {hours.map(hour => (
              <React.Fragment key={hour}>
                {/* Hour label */}
                <div className="bg-gray-50 p-2 text-xs text-gray-600 text-right border-r">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                
                {/* Day columns */}
                {weekDays.map(date => {
                  const dayTasks = taskEvents.filter(event =>
                    event.startDate.toDateString() === date.toDateString()
                  )
                  const isToday = today.toDateString() === date.toDateString()
                  
                  return (
                    <div
                      key={`${date.toISOString()}-${hour}`}
                      className={`bg-white min-h-[60px] p-1 border-b border-gray-100 ${
                        isToday ? 'bg-blue-50/30' : ''
                      }`}
                      onDragOver={(e) => handleDragOver(e, date)}
                      onDrop={(e) => handleDrop(e, date)}
                    >
                      {hour === 9 && dayTasks.map(taskEvent => ( // Show tasks at 9 AM slot for simplicity
                        <TaskBlock
                          key={taskEvent.task.id}
                          taskEvent={taskEvent}
                          onClick={onTaskClick}
                          onMouseEnter={handleTaskMouseEnter}
                          onMouseLeave={handleTaskMouseLeave}
                          isDragging={draggedTask === taskEvent.task.id}
                        />
                      ))}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayTasks = taskEvents.filter(event =>
      event.startDate.toDateString() === currentDate.toDateString()
    )
    const today = new Date()
    const isToday = today.toDateString() === currentDate.toDateString()

    return (
      <div className="flex flex-col">
        {/* Day header */}
        <div className={`p-4 border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <h2 className={`text-xl font-semibold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </h2>
          {dayTasks.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''} scheduled
            </p>
          )}
        </div>

        {/* Day schedule */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-px bg-gray-200">
            {hours.map(hour => (
              <React.Fragment key={hour}>
                {/* Hour label */}
                <div className="bg-gray-50 p-3 text-sm text-gray-600 text-right">
                  {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
                </div>
                
                {/* Time slot */}
                <div
                  className={`bg-white min-h-[80px] p-2 ${isToday ? 'bg-blue-50/30' : ''}`}
                  onDragOver={(e) => handleDragOver(e, currentDate)}
                  onDrop={(e) => handleDrop(e, currentDate)}
                >
                  {hour === 9 && dayTasks.map(taskEvent => ( // Show all tasks at 9 AM slot
                    <div key={taskEvent.task.id} className="mb-1">
                      <TaskBlock
                        taskEvent={taskEvent}
                        onClick={onTaskClick}
                        onMouseEnter={handleTaskMouseEnter}
                        onMouseLeave={handleTaskMouseLeave}
                        isDragging={draggedTask === taskEvent.task.id}
                      />
                    </div>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {periodInfo.title}
              </h1>
              {!periodInfo.isToday && (
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'month', label: 'Month' },
              { key: 'week', label: 'Week' },
              { key: 'day', label: 'Day' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key as CalendarView)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  view === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Task Summary */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span>{taskEvents.length} tasks scheduled</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>High Priority</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Medium Priority</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Low Priority</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="overflow-hidden">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Task Tooltip */}
      {tooltip && (
        <TaskTooltip
          task={tooltip.task}
          position={tooltip.position}
          onClose={() => setTooltip(null)}
        />
      )}
    </div>
  )
}


