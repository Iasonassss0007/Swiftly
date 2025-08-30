'use client'


import { Flag, Calendar, User, CheckCircle2, Circle, Edit2 } from 'lucide-react'
import Image from 'next/image'

export interface Task {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  dueDate: Date | null
  assignees: Array<{
    id: string
    name: string
    email: string
    avatarUrl?: string
  }>
  tags?: string[]
  completed: boolean
  subtasks?: Array<{
    id: string
    title: string
    completed: boolean
  }>
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
  comments?: Array<{
    id: string
    content: string
    author: string
    timestamp: Date
  }>
}

interface TaskRowProps {
  task: Task
  onTaskClick: (task: Task) => void
  onToggleComplete: (taskId: string) => void
  onMenuAction: (taskId: string, action: 'edit' | 'duplicate' | 'archive' | 'delete') => void
  onEdit?: (task: Task) => void
  selected?: boolean
  onSelect?: (taskId: string, selected: boolean) => void
}

export default function TaskRow({
  task,
  onTaskClick,
  onToggleComplete,
  onMenuAction,
  onEdit,
  selected = false,
  onSelect
}: TaskRowProps) {

  const getPriorityConfig = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return { color: 'text-red-600', bg: 'bg-red-100', label: 'High' }
      case 'medium':
        return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Medium' }
      case 'low':
        return { color: 'text-green-600', bg: 'bg-green-100', label: 'Low' }
    }
  }

  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'To Do' }
      case 'in_progress':
        return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'In Progress' }
      case 'done':
        return { color: 'text-green-600', bg: 'bg-green-100', label: 'Done' }
    }
  }

  const priorityConfig = getPriorityConfig(task.priority)
  const statusConfig = getStatusConfig(task.status)

  const formatDueDate = (date: Date | null) => {
    if (!date) return 'No due date'
    
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays <= 7) return `${diffDays} days`
    
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

  return (
    <div
      data-task-id={task.id}
      className={`group relative bg-white border border-[#ADB3BD]/30 rounded-lg p-4 hover:shadow-md hover:border-[#111C59]/30 transition-all duration-200 ${
        selected ? 'ring-2 ring-[#111C59]/20 bg-[#111C59]/5' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Completion Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleComplete(task.id)
          }}
          className="flex-shrink-0"
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-[#4F5F73] hover:text-[#111C59] transition-colors" />
          )}
        </button>

        {/* Selection Checkbox (appears on hover) */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(task.id, e.target.checked)}
            className="flex-shrink-0 w-4 h-4 text-[#111C59] border-[#ADB3BD] rounded focus:ring-[#111C59]/20 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Task Title */}
        <button
          onClick={() => onTaskClick(task)}
          className={`flex-1 text-left font-medium transition-colors hover:text-[#111C59] ${
            task.completed ? 'text-[#4F5F73] line-through' : 'text-[#0F1626]'
          }`}
        >
          {task.title}
        </button>

        {/* Priority Indicator */}
        <div className="flex items-center gap-2">
          <Flag className={`w-4 h-4 ${priorityConfig.color}`} />
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.bg} ${priorityConfig.color}`}>
            {priorityConfig.label}
          </span>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className={`w-4 h-4 flex-shrink-0 ${getDueDateColor(task.dueDate)}`} />
          <span 
            className={`text-sm ${getDueDateColor(task.dueDate)} truncate`}
            title={task.dueDate?.toLocaleString()}
          >
            {formatDueDate(task.dueDate)}
          </span>
        </div>

        {/* Assignees */}
        <div className="flex items-center -space-x-2">
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
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border-2 border-white"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {getUserInitials(assignee.name)}
                  </span>
                </div>
              )}
            </div>
          ))}
          {task.assignees.length > 3 && (
            <div className="w-8 h-8 bg-[#F8FAFC] border-2 border-white rounded-full flex items-center justify-center">
              <span className="text-[#4F5F73] text-xs font-medium">
                +{task.assignees.length - 3}
              </span>
            </div>
          )}
          {task.assignees.length === 0 && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(task)
              }}
              className="w-8 h-8 bg-[#111C59] border-2 border-white rounded-full flex items-center justify-center hover:bg-[#0F1626] transition-colors"
              title="Edit Task"
            >
              <Edit2 className="w-4 h-4 text-white" />
            </button>
          )}
          {task.assignees.length === 0 && !onEdit && (
            <div className="w-8 h-8 bg-[#F8FAFC] border-2 border-white rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-[#4F5F73]" />
            </div>
          )}
        </div>

        {/* Status Badge */}
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.color}`}>
          {statusConfig.label}
        </span>


      </div>


    </div>
  )
}

