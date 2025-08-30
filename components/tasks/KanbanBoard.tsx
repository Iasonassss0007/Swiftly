'use client'

import { useState, useMemo } from 'react'
import { Task } from './TaskRow'
import { Calendar, Flag, User, Plus, MoreHorizontal, Paperclip, MessageCircle } from 'lucide-react'
import Image from 'next/image'

interface KanbanBoardProps {
  tasks: Task[]
  searchTerm: string
  onTaskClick: (task: Task) => void
  onTaskMove: (taskId: string, newStatus: Task['status']) => void
  onMenuAction: (taskId: string, action: 'edit' | 'duplicate' | 'archive' | 'delete') => void
  onNewTask: (status: Task['status']) => void
}

interface TaskCardProps {
  task: Task
  onTaskClick: (task: Task) => void
  onMenuAction: (taskId: string, action: 'edit' | 'duplicate' | 'archive' | 'delete') => void
  isDragging?: boolean
}

function TaskCard({ task, onTaskClick, onMenuAction, isDragging = false }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getPriorityConfig = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return { color: 'border-l-red-500', bg: 'bg-red-50' }
      case 'medium':
        return { color: 'border-l-orange-500', bg: 'bg-orange-50' }
      case 'low':
        return { color: 'border-l-green-500', bg: 'bg-green-50' }
    }
  }

  const formatDueDate = (date: Date | null) => {
    if (!date) return null
    
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
    if (diffDays <= 7) return `${diffDays}d`
    
    return date.toLocaleDateString()
  }

  const getDueDateColor = (date: Date | null) => {
    if (!date) return 'text-[#4F5F73]'
    
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'text-red-600'
    if (diffDays <= 1) return 'text-orange-600'
    return 'text-[#4F5F73]'
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const priorityConfig = getPriorityConfig(task.priority)

  return (
    <div
      className={`group bg-white border-l-4 ${priorityConfig.color} rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
        isDragging ? 'rotate-2 scale-105 shadow-lg' : ''
      }`}
      onClick={() => onTaskClick(task)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      <div className="p-4">
        {/* Header with menu */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-medium text-[#0F1626] leading-tight flex-1 pr-2">
            {task.title}
          </h3>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1 rounded hover:bg-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <MoreHorizontal className="w-4 h-4 text-[#4F5F73]" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#ADB3BD]/30 rounded-md shadow-lg z-10 min-w-[120px]">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMenuAction(task.id, 'edit')
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[#0F1626] hover:bg-[#F8FAFC] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMenuAction(task.id, 'duplicate')
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[#0F1626] hover:bg-[#F8FAFC] transition-colors"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMenuAction(task.id, 'archive')
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[#0F1626] hover:bg-[#F8FAFC] transition-colors"
                  >
                    Archive
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMenuAction(task.id, 'delete')
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-[#111C59]/10 text-[#111C59] text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="px-2 py-1 bg-[#F8FAFC] text-[#4F5F73] text-xs rounded-full">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Priority and Due Date */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Flag className={`w-3 h-3 ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-orange-500' : 'text-green-500'}`} />
            <span className="text-xs text-[#4F5F73] capitalize">{task.priority}</span>
          </div>
          
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className={`w-3 h-3 ${getDueDateColor(task.dueDate)}`} />
              <span className={`text-xs ${getDueDateColor(task.dueDate)}`}>
                {formatDueDate(task.dueDate)}
              </span>
            </div>
          )}
        </div>

        {/* Subtasks Progress */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#4F5F73]">
                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
              </span>
            </div>
            <div className="w-full bg-[#F8FAFC] rounded-full h-1.5">
              <div
                className="bg-[#111C59] h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Assignees */}
        <div className="flex items-center justify-between">
          <div className="flex items-center -space-x-1">
            {task.assignees.slice(0, 3).map((assignee) => (
              <div
                key={assignee.id}
                className="relative"
                title={`${assignee.name} (${assignee.email})`}
              >
                {assignee.avatarUrl ? (
                  <Image
                    src={assignee.avatarUrl}
                    alt={assignee.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full border-2 border-white"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {getUserInitials(assignee.name)}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="w-6 h-6 bg-[#F8FAFC] border-2 border-white rounded-full flex items-center justify-center">
                <span className="text-[#4F5F73] text-xs font-medium">
                  +{task.assignees.length - 3}
                </span>
              </div>
            )}
            {task.assignees.length === 0 && (
              <div className="w-6 h-6 bg-[#F8FAFC] border-2 border-white rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-[#4F5F73]" />
              </div>
            )}
          </div>

          {/* Attachments and Comments indicator */}
          <div className="flex items-center gap-2 text-xs text-[#4F5F73]">
            {task.attachments && task.attachments.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                <span>{task.attachments.length}</span>
              </div>
            )}
            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>{task.comments.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click overlay to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(false)
          }}
        />
      )}
    </div>
  )
}

export default function KanbanBoard({
  tasks,
  searchTerm,
  onTaskClick,
  onTaskMove,
  onMenuAction,
  onNewTask
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState<Task['status'] | null>(null)

  const columns: Array<{ id: Task['status']; title: string; color: string }> = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-50 border-gray-200' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 border-blue-200' },
    { id: 'done', title: 'Done', color: 'bg-green-50 border-green-200' }
  ]

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

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = []
      }
      acc[task.status].push(task)
      return acc
    }, {} as Record<Task['status'], Task[]>)
  }, [filteredTasks])

  const handleDragOver = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault()
    setDraggedOverColumn(status)
  }

  const handleDragLeave = () => {
    setDraggedOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId && taskId !== draggedTask) {
      onTaskMove(taskId, status)
    }
    setDraggedTask(null)
    setDraggedOverColumn(null)
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#ADB3BD]/30 rounded-xl shadow-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnTasks = tasksByStatus[column.id] || []
          const isDropTarget = draggedOverColumn === column.id

          return (
            <div
              key={column.id}
              className={`${column.color} border-2 rounded-lg transition-all duration-200 ${
                isDropTarget ? 'border-[#111C59] shadow-lg' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-current/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#0F1626]">{column.title}</h3>
                    <span className="bg-white/80 text-[#4F5F73] text-sm px-2 py-1 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => onNewTask(column.id)}
                    className="p-1 text-[#4F5F73] hover:text-[#111C59] hover:bg-white/50 rounded transition-colors"
                    title={`Add task to ${column.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Column Content */}
              <div className="p-4 space-y-3 min-h-[400px]">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-6 h-6 text-[#4F5F73]" />
                    </div>
                    <p className="text-[#4F5F73] text-sm">
                      {searchTerm ? 'No matching tasks' : 'No tasks yet'}
                    </p>
                    <button
                      onClick={() => onNewTask(column.id)}
                      className="text-[#111C59] hover:underline text-sm mt-1"
                    >
                      Add a task
                    </button>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onTaskClick={onTaskClick}
                      onMenuAction={onMenuAction}
                      isDragging={draggedTask === task.id}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-[#ADB3BD]/30">
        <div className="flex items-center justify-between text-sm text-[#4F5F73]">
          <div>
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
          <div className="flex items-center gap-4">
            <span>
              {tasks.filter(t => t.completed).length} completed
            </span>
            <span>
              {tasks.filter(t => t.status === 'in_progress').length} in progress
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
