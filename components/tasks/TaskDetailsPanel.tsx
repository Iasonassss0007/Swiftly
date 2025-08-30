'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { 
  X, 
  Calendar, 
  Flag, 
  Users, 
  Tag, 
  Plus, 
  Trash2, 
  Paperclip, 
  Download, 
  Eye,
  MessageCircle,
  Send,
  CheckCircle2,
  Circle,
  GripVertical,
  Clock
} from 'lucide-react'
import { Task } from './TaskRow'

interface TaskDetailsPanelProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onEdit?: (task: Task) => void
  availableUsers: Array<{
    id: string
    name: string
    email: string
    avatarUrl?: string
  }>
  availableTags: string[]
}

export default function TaskDetailsPanel({
  task,
  isOpen,
  onClose,
  onUpdate,
  onEdit,
  availableUsers,
  availableTags
}: TaskDetailsPanelProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!task || !isOpen) return null

  const updateTask = (updates: Partial<Task>) => {
    onUpdate(task.id, updates)
  }

  const handleTitleSave = () => {
    if (title.trim() && title !== task.title) {
      updateTask({ title: title.trim() })
    }
    setEditingTitle(false)
  }

  const handleDescriptionSave = () => {
    if (description !== task.description) {
      updateTask({ description })
    }
  }

  const addSubtask = () => {
    if (newSubtask.trim()) {
      const subtasks = task.subtasks || []
      updateTask({
        subtasks: [
          ...subtasks,
          {
            id: Date.now().toString(),
            title: newSubtask.trim(),
            completed: false
          }
        ]
      })
      setNewSubtask('')
    }
  }

  const toggleSubtask = (subtaskId: string) => {
    const subtasks = task.subtasks?.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    ) || []
    updateTask({ subtasks })
  }

  const removeSubtask = (subtaskId: string) => {
    const subtasks = task.subtasks?.filter(st => st.id !== subtaskId) || []
    updateTask({ subtasks })
  }

  const addComment = () => {
    if (newComment.trim()) {
      const comments = task.comments || []
      updateTask({
        comments: [
          ...comments,
          {
            id: Date.now().toString(),
            content: newComment.trim(),
            author: 'Current User', // This would come from auth context
            timestamp: new Date()
          }
        ]
      })
      setNewComment('')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const attachments = task.attachments || []
      Array.from(files).forEach(file => {
        // In a real app, you'd upload to a server here
        const newAttachment = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type
        }
        attachments.push(newAttachment)
      })
      updateTask({ attachments })
    }
  }

  const removeAttachment = (attachmentId: string) => {
    const attachments = task.attachments?.filter(att => att.id !== attachmentId) || []
    updateTask({ attachments })
  }

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#ADB3BD]/30">
          <div className="flex-1">
            {editingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                className="text-2xl font-semibold text-[#0F1626] bg-transparent border-none outline-none w-full"
                autoFocus
              />
            ) : (
              <h2
                onClick={() => setEditingTitle(true)}
                className="text-2xl font-semibold text-[#0F1626] cursor-pointer hover:text-[#111C59] transition-colors"
              >
                {task.title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && task && (
              <button
                onClick={() => onEdit(task)}
                className="px-4 py-2 bg-[#111C59] text-white rounded-lg font-medium hover:bg-[#0F1626] transition-colors"
              >
                Edit Task
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-[#4F5F73] hover:text-[#0F1626] hover:bg-[#F8FAFC] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#4F5F73] mb-2">Status</label>
                <select
                  value={task.status}
                  onChange={(e) => updateTask({ status: e.target.value as Task['status'] })}
                  className="w-full p-3 border border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59]"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4F5F73] mb-2">Priority</label>
                <select
                  value={task.priority}
                  onChange={(e) => updateTask({ priority: e.target.value as Task['priority'] })}
                  className="w-full p-3 border border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#4F5F73] mb-2">Due Date</label>
              <input
                type="datetime-local"
                value={task.dueDate ? task.dueDate.toISOString().slice(0, 16) : ''}
                onChange={(e) => updateTask({ dueDate: e.target.value ? new Date(e.target.value) : null })}
                className="w-full p-3 border border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59]"
              />
            </div>

            {/* Assignees */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#4F5F73] mb-2">Assignees</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {task.assignees.map((assignee) => (
                  <div
                    key={assignee.id}
                    className="flex items-center gap-2 bg-[#F8FAFC] border border-[#ADB3BD]/30 rounded-lg px-3 py-2"
                  >
                    {assignee.avatarUrl ? (
                      <Image
                        src={assignee.avatarUrl}
                        alt={assignee.name}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {getUserInitials(assignee.name)}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-[#0F1626]">{assignee.name}</span>
                    <button
                      onClick={() => {
                        const assignees = task.assignees.filter(a => a.id !== assignee.id)
                        updateTask({ assignees })
                      }}
                      className="text-[#4F5F73] hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <select
                onChange={(e) => {
                  const userId = e.target.value
                  if (userId && !task.assignees.find(a => a.id === userId)) {
                    const user = availableUsers.find(u => u.id === userId)
                    if (user) {
                      updateTask({ assignees: [...task.assignees, user] })
                    }
                  }
                  e.target.value = ''
                }}
                className="w-full p-3 border border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59]"
              >
                <option value="">Add assignee...</option>
                {availableUsers
                  .filter(user => !task.assignees.find(a => a.id === user.id))
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </select>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#4F5F73] mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {task.tags?.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-[#111C59]/10 text-[#111C59] rounded-full px-3 py-1 text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      onClick={() => {
                        const tags = task.tags?.filter((_, i) => i !== index) || []
                        updateTask({ tags })
                      }}
                      className="text-[#111C59] hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <select
                onChange={(e) => {
                  const tag = e.target.value
                  if (tag && !task.tags?.includes(tag)) {
                    updateTask({ tags: [...(task.tags || []), tag] })
                  }
                  e.target.value = ''
                }}
                className="w-full p-3 border border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59]"
              >
                <option value="">Add tag...</option>
                {availableTags
                  .filter(tag => !task.tags?.includes(tag))
                  .map(tag => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
              </select>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#4F5F73] mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                placeholder="Add a description..."
                rows={4}
                className="w-full p-3 border border-[#ADB3BD]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] resize-none"
              />
            </div>

            {/* Subtasks */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#4F5F73]">Subtasks</label>
                {totalSubtasks > 0 && (
                  <span className="text-sm text-[#4F5F73]">
                    {completedSubtasks}/{totalSubtasks} completed
                  </span>
                )}
              </div>
              
              {totalSubtasks > 0 && (
                <div className="mb-4">
                  <div className="w-full bg-[#F8FAFC] rounded-full h-2">
                    <div
                      className="bg-[#111C59] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-3">
                {task.subtasks?.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-3 p-2 hover:bg-[#F8FAFC] rounded">
                    <GripVertical className="w-4 h-4 text-[#4F5F73] cursor-grab" />
                    <button
                      onClick={() => toggleSubtask(subtask.id)}
                      className="flex-shrink-0"
                    >
                      {subtask.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#4F5F73]" />
                      )}
                    </button>
                    <span className={`flex-1 ${subtask.completed ? 'line-through text-[#4F5F73]' : 'text-[#0F1626]'}`}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => removeSubtask(subtask.id)}
                      className="text-[#4F5F73] hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                  placeholder="Add a subtask..."
                  className="flex-1 p-2 border border-[#ADB3BD]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59]"
                />
                <button
                  onClick={addSubtask}
                  className="p-2 bg-[#111C59] text-white rounded hover:bg-[#0F1626] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Attachments */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#4F5F73]">Attachments</label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm text-[#111C59] hover:bg-[#F8FAFC] px-3 py-1 rounded transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                  Add file
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {task.attachments && task.attachments.length > 0 && (
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#ADB3BD]/30 rounded"
                    >
                      <Paperclip className="w-4 h-4 text-[#4F5F73]" />
                      <span className="flex-1 text-sm text-[#0F1626]">{attachment.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => window.open(attachment.url, '_blank')}
                          className="p-1 text-[#4F5F73] hover:text-[#111C59] transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const a = document.createElement('a')
                            a.href = attachment.url
                            a.download = attachment.name
                            a.click()
                          }}
                          className="p-1 text-[#4F5F73] hover:text-[#111C59] transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="p-1 text-[#4F5F73] hover:text-red-600 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#4F5F73] mb-3">Comments</label>
              
              {task.comments && task.comments.length > 0 && (
                <div className="space-y-3 mb-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-[#F8FAFC] rounded">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {getUserInitials(comment.author)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[#0F1626]">{comment.author}</span>
                          <span className="text-xs text-[#4F5F73]">
                            {comment.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-[#0F1626]">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="flex-1 p-2 border border-[#ADB3BD]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] resize-none"
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="p-2 bg-[#111C59] text-white rounded hover:bg-[#0F1626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Activity Log */}
            <div>
              <label className="block text-sm font-medium text-[#4F5F73] mb-3">Activity</label>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-[#4F5F73]">
                  <Clock className="w-4 h-4" />
                  <span>Task created on {new Date().toLocaleDateString()}</span>
                </div>
                {task.status === 'done' && (
                  <div className="flex items-center gap-3 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Task completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

