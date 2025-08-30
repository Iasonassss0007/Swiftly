'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar } from 'lucide-react'
import { Task } from './TaskRow'

interface GanttChartProps {
  tasks: Task[]
  searchTerm: string
  onTaskClick: (task: Task) => void
}

type TimeScale = 'days' | 'weeks' | 'months'

export default function GanttChart({
  tasks,
  searchTerm,
  onTaskClick
}: GanttChartProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [timeScale, setTimeScale] = useState<TimeScale>('weeks')
  const [viewportWeeks, setViewportWeeks] = useState(8)

  // Filter tasks based on search term and those with due dates
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.dueDate) return false
      
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignees.some(assignee => 
          assignee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignee.email.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return matchesSearch
    })
  }, [tasks, searchTerm])

  // Calculate date range for the chart
  const startOfWeek = useMemo(() => {
    const date = new Date(currentDate)
    const day = date.getDay()
    date.setDate(date.getDate() - day)
    date.setHours(0, 0, 0, 0)
    return date
  }, [currentDate])

  const endDate = useMemo(() => {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + (viewportWeeks * 7))
    return date
  }, [startOfWeek, viewportWeeks])

  // Generate time periods based on scale
  const timePeriods = useMemo(() => {
    const periods = []
    const current = new Date(startOfWeek)
    
    if (timeScale === 'days') {
      while (current < endDate) {
        periods.push({
          date: new Date(current),
          label: current.getDate().toString(),
          fullLabel: current.toLocaleDateString()
        })
        current.setDate(current.getDate() + 1)
      }
    } else if (timeScale === 'weeks') {
      while (current < endDate) {
        const weekEnd = new Date(current)
        weekEnd.setDate(weekEnd.getDate() + 6)
        periods.push({
          date: new Date(current),
          label: `${current.getDate()}`,
          fullLabel: `${current.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
        })
        current.setDate(current.getDate() + 7)
      }
    } else { // months
      current.setDate(1)
      while (current < endDate) {
        periods.push({
          date: new Date(current),
          label: current.toLocaleDateString('en-US', { month: 'short' }),
          fullLabel: current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        })
        current.setMonth(current.getMonth() + 1)
      }
    }
    
    return periods
  }, [startOfWeek, endDate, timeScale])

  const navigateTime = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      const increment = timeScale === 'days' ? 7 : timeScale === 'weeks' ? 28 : 90
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - increment)
      } else {
        newDate.setDate(prev.getDate() + increment)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const changeTimeScale = (scale: TimeScale) => {
    setTimeScale(scale)
    if (scale === 'days') {
      setViewportWeeks(4)
    } else if (scale === 'weeks') {
      setViewportWeeks(8)
    } else {
      setViewportWeeks(16)
    }
  }

  const getTaskPosition = (task: Task) => {
    if (!task.dueDate) return null

    // For simplicity, assume tasks start 1 week before due date
    const startDate = new Date(task.dueDate)
    startDate.setDate(startDate.getDate() - 7)
    
    const endDate = task.dueDate

    const totalWidth = 100 // percentage
    const totalDuration = endDate.getTime() - startOfWeek.getTime()
    const viewportDuration = endDate.getTime() - startOfWeek.getTime()
    
    const startOffset = Math.max(0, (startDate.getTime() - startOfWeek.getTime()) / viewportDuration * totalWidth)
    const endOffset = Math.min(totalWidth, (endDate.getTime() - startOfWeek.getTime()) / viewportDuration * totalWidth)
    const width = Math.max(2, endOffset - startOffset)

    return {
      left: `${startOffset}%`,
      width: `${width}%`,
      startDate,
      endDate
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-orange-500'
      case 'low': return 'bg-green-500'
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done': return 'bg-green-600'
      case 'in_progress': return 'bg-blue-600'
      case 'todo': return 'bg-gray-400'
    }
  }

  const today = new Date()
  const todayPosition = ((today.getTime() - startOfWeek.getTime()) / (endDate.getTime() - startOfWeek.getTime())) * 100

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#ADB3BD]/30 rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-[#ADB3BD]/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-[#0F1626]">Gantt Chart</h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-[#111C59] text-white rounded-md hover:bg-[#0F1626] transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Time Scale Selector */}
            <div className="flex bg-[#F8FAFC] border border-[#ADB3BD]/30 rounded-lg p-1">
              {[
                { key: 'days', label: 'Days' },
                { key: 'weeks', label: 'Weeks' },
                { key: 'months', label: 'Months' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => changeTimeScale(key as TimeScale)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    timeScale === key
                      ? 'bg-[#111C59] text-white'
                      : 'text-[#4F5F73] hover:text-[#111C59]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTime('prev')}
                className="p-2 text-[#4F5F73] hover:text-[#111C59] hover:bg-[#F8FAFC] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateTime('next')}
                className="p-2 text-[#4F5F73] hover:text-[#111C59] hover:bg-[#F8FAFC] rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewportWeeks(Math.max(2, viewportWeeks - 2))}
                className="p-2 text-[#4F5F73] hover:text-[#111C59] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewportWeeks(Math.min(20, viewportWeeks + 2))}
                className="p-2 text-[#4F5F73] hover:text-[#111C59] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm text-[#4F5F73]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Time Header */}
          <div className="border-b border-[#ADB3BD]/30 bg-[#F8FAFC]/50">
            <div className="flex">
              {/* Task Names Column */}
              <div className="w-64 p-4 border-r border-[#ADB3BD]/30">
                <h3 className="font-medium text-[#0F1626]">Tasks</h3>
              </div>
              
              {/* Time Periods */}
              <div className="flex-1 relative">
                <div className="flex">
                  {timePeriods.map((period, index) => (
                    <div
                      key={index}
                      className="flex-1 p-4 text-center border-r border-[#ADB3BD]/30 last:border-r-0"
                      title={period.fullLabel}
                    >
                      <span className="text-sm font-medium text-[#0F1626]">
                        {period.label}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Today Indicator */}
                {todayPosition >= 0 && todayPosition <= 100 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: `${todayPosition}%` }}
                  >
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-medium">
                      Today
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart Body */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-16 h-16 text-[#4F5F73] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#0F1626] mb-2">
                  {searchTerm ? 'No matching tasks with due dates' : 'No tasks with due dates'}
                </h3>
                <p className="text-[#4F5F73]">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Add due dates to your tasks to see them in the Gantt chart'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTasks.map((task) => {
                  const position = getTaskPosition(task)
                  if (!position) return null

                  return (
                    <div key={task.id} className="flex hover:bg-[#F8FAFC] transition-colors">
                      {/* Task Name */}
                      <div className="w-64 p-4 border-r border-[#ADB3BD]/30 flex items-center">
                        <button
                          onClick={() => onTaskClick(task)}
                          className="text-left hover:text-[#111C59] transition-colors"
                        >
                          <div className="font-medium text-[#0F1626] truncate mb-1">
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            <span className="text-xs text-[#4F5F73] capitalize">
                              {task.priority}
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* Task Bar */}
                      <div className="flex-1 relative p-2">
                        <div className="relative h-8 bg-[#F8FAFC] rounded">
                          <div
                            className={`absolute top-1 bottom-1 rounded-sm ${getStatusColor(task.status)} cursor-pointer hover:opacity-80 transition-opacity`}
                            style={{
                              left: position.left,
                              width: position.width
                            }}
                            onClick={() => onTaskClick(task)}
                            title={`${task.title} (${position.startDate.toLocaleDateString()} - ${position.endDate.toLocaleDateString()})`}
                          >
                            <div className="h-full flex items-center px-2">
                              <span className="text-white text-xs font-medium truncate">
                                {task.title}
                              </span>
                            </div>
                          </div>

                          {/* Assignees */}
                          {task.assignees.length > 0 && (
                            <div
                              className="absolute top-0 -right-6 flex -space-x-1"
                              style={{ left: `calc(${position.left} + ${position.width})` }}
                            >
                              {task.assignees.slice(0, 2).map((assignee) => (
                                <div
                                  key={assignee.id}
                                  className="w-6 h-6 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full border-2 border-white flex items-center justify-center"
                                  title={assignee.name}
                                >
                                  <span className="text-white text-xs font-medium">
                                    {assignee.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#ADB3BD]/30 p-4 bg-[#F8FAFC]/50">
        <div className="flex items-center justify-between text-sm text-[#4F5F73]">
          <div>
            Showing {filteredTasks.length} tasks with due dates
          </div>
          <div className="flex items-center gap-4">
            <span>
              Period: {startOfWeek.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </span>
            <span>
              {filteredTasks.filter(t => t.dueDate && t.dueDate < today && !t.completed).length > 0 && (
                <span className="text-red-600">
                  {filteredTasks.filter(t => t.dueDate && t.dueDate < today && !t.completed).length} overdue
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}



