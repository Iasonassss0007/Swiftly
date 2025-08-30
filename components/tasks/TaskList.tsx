'use client'

import { useState, useMemo } from 'react'
import TaskRow, { Task } from './TaskRow'
import { CheckSquare, Square, Trash2, Edit3, Archive, ChevronUp, ChevronDown } from 'lucide-react'

interface TaskListProps {
  tasks: Task[]
  searchTerm: string
  onTaskClick: (task: Task) => void
  onToggleComplete: (taskId: string) => void
  onMenuAction: (taskId: string, action: 'edit' | 'duplicate' | 'archive' | 'delete') => void
  onEdit?: (task: Task) => void
  onBulkAction?: (taskIds: string[], action: 'complete' | 'delete' | 'archive') => void
}

export default function TaskList({
  tasks,
  searchTerm,
  onTaskClick,
  onToggleComplete,
  onMenuAction,
  onEdit,
  onBulkAction
}: TaskListProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'title'>('dueDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

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

  // Sort filtered tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'dueDate':
          aValue = a.dueDate?.getTime() || Infinity
          bValue = b.dueDate?.getTime() || Infinity
          break
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        case 'status':
          const statusOrder = { todo: 1, in_progress: 2, done: 3 }
          aValue = statusOrder[a.status]
          bValue = statusOrder[b.status]
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredTasks, sortBy, sortOrder])

  const handleSelectTask = (taskId: string, selected: boolean) => {
    const newSelected = new Set(selectedTasks)
    if (selected) {
      newSelected.add(taskId)
    } else {
      newSelected.delete(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTasks.size === sortedTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(sortedTasks.map(task => task.id)))
    }
  }

  const handleBulkAction = (action: 'complete' | 'delete' | 'archive') => {
    if (selectedTasks.size > 0 && onBulkAction) {
      onBulkAction(Array.from(selectedTasks), action)
      setSelectedTasks(new Set())
    }
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const completedCount = tasks.filter(task => task.completed).length
  const totalCount = tasks.length

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#ADB3BD]/30 rounded-xl shadow-lg overflow-visible">
      {/* List Header with Sorting */}
      <div className="p-6 border-b border-[#ADB3BD]/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-[#4F5F73] hover:text-[#111C59] transition-colors"
            >
              {selectedTasks.size === sortedTasks.length && sortedTasks.length > 0 ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Select All
            </button>
            
            {selectedTasks.size > 0 && onBulkAction && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#4F5F73]">
                  {selectedTasks.size} selected
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleBulkAction('complete')}
                    className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Mark Complete"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleBulkAction('archive')}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-[#4F5F73]">
              {completedCount} of {totalCount} tasks completed
            </span>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#4F5F73]">Sort by:</span>
          {[
            { key: 'dueDate', label: 'Due Date' },
            { key: 'priority', label: 'Priority' },
            { key: 'status', label: 'Status' },
            { key: 'title', label: 'Title' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSort(key as typeof sortBy)}
              className={`px-3 py-1 rounded transition-colors ${
                sortBy === key
                  ? 'bg-[#111C59] text-white'
                  : 'text-[#4F5F73] hover:text-[#111C59] hover:bg-[#F8FAFC]'
              }`}
            >
              {label}
              {sortBy === key && (
                <span className="ml-1">
                  {sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="max-h-[600px] overflow-y-auto" style={{ overflowX: 'visible' }}>
        {sortedTasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-8 h-8 text-[#4F5F73]" />
            </div>
            <h3 className="text-lg font-medium text-[#0F1626] mb-2">
              {searchTerm ? 'No tasks found' : 'No tasks yet'}
            </h3>
            <p className="text-[#4F5F73]">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Create your first task to get started'
              }
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-3" style={{ overflow: 'visible' }}>
            {sortedTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onTaskClick={onTaskClick}
                onToggleComplete={onToggleComplete}
                onMenuAction={onMenuAction}
                onEdit={onEdit}
                selected={selectedTasks.has(task.id)}
                onSelect={handleSelectTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {totalCount > 0 && (
        <div className="p-4 border-t border-[#ADB3BD]/30 bg-[#F8FAFC]/50">
          <div className="flex items-center justify-between text-sm text-[#4F5F73]">
            <div>
              Showing {sortedTasks.length} of {totalCount} tasks
            </div>
            <div className="flex items-center gap-4">
              {(() => {
                const nextDeadline = tasks
                  .filter(task => task.dueDate && !task.completed)
                  .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))[0]
                
                if (nextDeadline?.dueDate) {
                  const daysUntil = Math.ceil(
                    (nextDeadline.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )
                  return (
                    <span>
                      Next deadline in {daysUntil > 0 ? `${daysUntil} days` : 'overdue'}
                    </span>
                  )
                }
                return null
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
