'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  User, 
  Calendar, 
  AlertTriangle, 
  Tag, 
  FolderOpen, 
  RotateCcw, 
  Paperclip, 
  CheckSquare, 
  GitBranch, 
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Save,
  Trash2,
  Copy,
  Archive,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Edit3,
  FileText,
  Users,
  Target,
  Timer,
  Link,
  Flag,
  Circle
} from 'lucide-react'

import { Task as BaseTask } from './TaskRow'

// Extended Task interface for editing with additional optional fields
interface Task extends BaseTask {
  recurrence?: string
  project?: string
  dependencies?: string[]
  user_id?: string
}

interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: BaseTask) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  task: BaseTask | null
  users: User[]
  existingTasks: BaseTask[]
}

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-50 text-green-700 border-green-200', icon: Circle },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: AlertTriangle },
  { value: 'high', label: 'High', color: 'bg-red-50 text-red-700 border-red-200', icon: Flag }
]

const statusOptions = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Circle },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Timer },
  { value: 'done', label: 'Done', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckSquare }
]

const recurrenceOptions = [
  { value: '', label: 'No Recurrence' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
]

export default function EditTaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
  users,
  existingTasks
}: EditTaskModalProps) {
  const [formData, setFormData] = useState<Task | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    details: true,
    assignees: true,
    dates: true,
    tags: true,
    subtasks: false,
    dependencies: false,
    attachments: false,
    comments: false
  })
  const [newTag, setNewTag] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      // Convert BaseTask to extended Task with optional fields
      const extendedTask: Task = {
        ...task,
        recurrence: undefined,
        project: undefined,
        dependencies: [],
        user_id: undefined
      }
      setFormData(extendedTask)
    } else {
      setFormData(null)
    }
  }, [task])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleInputChange = (field: keyof Task, value: any) => {
    if (!formData) return
    setFormData(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleAddTag = () => {
    if (!newTag.trim() || !formData) return
    const tags = formData.tags || []
    if (!tags.includes(newTag.trim())) {
      handleInputChange('tags', [...tags, newTag.trim()])
    }
    setNewTag('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    if (!formData) return
    const tags = formData.tags || []
    handleInputChange('tags', tags.filter(tag => tag !== tagToRemove))
  }

  const handleAddSubtask = () => {
    if (!newSubtask.trim() || !formData) return
    const subtasks = formData.subtasks || []
    const newSubtaskObj = {
      id: Date.now().toString(),
      title: newSubtask.trim(),
      completed: false,
      created_at: new Date().toISOString()
    }
    handleInputChange('subtasks', [...subtasks, newSubtaskObj])
    setNewSubtask('')
  }

  const handleToggleSubtask = (subtaskId: string) => {
    if (!formData) return
    const subtasks = formData.subtasks || []
    const updatedSubtasks = subtasks.map((subtask: any) =>
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
    )
    handleInputChange('subtasks', updatedSubtasks)
  }

  const handleRemoveSubtask = (subtaskId: string) => {
    if (!formData) return
    const subtasks = formData.subtasks || []
    handleInputChange('subtasks', subtasks.filter((subtask: any) => subtask.id !== subtaskId))
  }

  const handleAddComment = () => {
    if (!newComment.trim() || !formData) return
    const comments = formData.comments || []
    const newCommentObj = {
      id: Date.now().toString(),
      text: newComment.trim(),
      author: 'Current User', // Replace with actual user
      created_at: new Date().toISOString()
    }
    handleInputChange('comments', [...comments, newCommentObj])
    setNewComment('')
  }

  const handleSave = async () => {
    if (!formData) return
    
    setIsLoading(true)
    try {
      // Convert extended Task back to BaseTask by removing optional fields
      const { recurrence, project, dependencies, user_id, ...baseTask } = formData
      await onSave(baseTask)
      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!formData || !onDelete) return
    
    setIsLoading(true)
    try {
      await onDelete(formData.id)
      onClose()
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const formatTime = (date: Date | null) => {
    if (!date) return ''
    return date.toTimeString().slice(0, 5)
  }

  const SectionHeader = ({ 
    title, 
    icon, 
    section, 
    count 
  }: { 
    title: string
    icon: React.ReactNode
    section: keyof typeof expandedSections
    count?: number 
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-50/50 hover:from-gray-100 hover:to-gray-100/50 rounded-xl border border-gray-200/50 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center group-hover:border-gray-300 transition-colors">
          {icon}
        </div>
        <span className="font-semibold text-gray-800">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-[#111C59]/10 text-[#111C59] px-2.5 py-1 rounded-full font-medium">
            {count}
          </span>
        )}
      </div>
      <div className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center group-hover:border-gray-300 transition-colors">
        {expandedSections[section] ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
      </div>
    </button>
  )

  if (!isOpen || !formData) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-lg flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-[#111C59] to-[#4F5F73] bg-clip-text text-transparent">Edit Task</h2>
            </div>
            <div className="flex items-center gap-2">
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              
              {/* Basic Information */}
              <div className="space-y-4">
                <SectionHeader
                  title="Basic Information"
                  icon={<FileText className="w-4 h-4 text-[#111C59]" />}
                  section="basic"
                />
                
                {expandedSections.basic && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pl-2"
                  >
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#111C59] focus:border-[#111C59] transition-all duration-200"
                        placeholder="Enter task title..."
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#111C59] focus:border-[#111C59] transition-all duration-200 resize-none"
                        placeholder="Add a description..."
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Status & Priority */}
              <div className="space-y-4">
                <SectionHeader
                  title="Status & Priority"
                  icon={<Target className="w-4 h-4 text-[#4F5F73]" />}
                  section="details"
                />
                
                {expandedSections.details && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-2 gap-4 pl-2"
                  >
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <div className="relative">
                        <select
                          value={formData.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#111C59] focus:border-transparent appearance-none bg-white"
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <div className="relative">
                        <select
                          value={formData.priority}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#111C59] focus:border-transparent appearance-none bg-white"
                        >
                          {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Assignees */}
              <div className="space-y-4">
                <SectionHeader
                  title="Assignees"
                  icon={<Users className="w-4 h-4 text-[#111C59]" />}
                  section="assignees"
                  count={formData.assignees?.length || 0}
                />
                
                {expandedSections.assignees && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pl-2"
                  >
                    <div className="flex flex-wrap gap-2">
                      {users.map(user => (
                        <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.assignees?.some(assignee => 
                              typeof assignee === 'string' ? assignee === user.id : assignee.id === user.id
                            ) || false}
                            onChange={(e) => {
                              const currentAssignees = formData.assignees || []
                              if (e.target.checked) {
                                const userObj = { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
                                handleInputChange('assignees', [...currentAssignees, userObj])
                              } else {
                                handleInputChange('assignees', currentAssignees.filter(assignee =>
                                  typeof assignee === 'string' ? assignee !== user.id : assignee.id !== user.id
                                ))
                              }
                            }}
                            className="rounded"
                          />
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                            <User className="w-4 h-4" />
                            <span className="text-sm">{user.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Dates & Time */}
              <div className="space-y-4">
                <SectionHeader
                  title="Dates & Time"
                  icon={<Calendar className="w-4 h-4 text-[#4F5F73]" />}
                  section="dates"
                />
                
                {expandedSections.dates && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pl-2"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {/* Due Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={formatDate(formData.dueDate)}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : null
                            handleInputChange('dueDate', date)
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Due Time */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Due Time
                        </label>
                        <input
                          type="time"
                          value={formatTime(formData.dueDate)}
                          onChange={(e) => {
                            if (formData.dueDate && e.target.value) {
                              const [hours, minutes] = e.target.value.split(':')
                              const newDate = new Date(formData.dueDate)
                              newDate.setHours(parseInt(hours), parseInt(minutes))
                              handleInputChange('dueDate', newDate)
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Recurrence */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recurrence
                      </label>
                      <select
                        value={formData.recurrence || ''}
                        onChange={(e) => handleInputChange('recurrence', e.target.value || undefined)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {recurrenceOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <SectionHeader
                  title="Tags"
                  icon={<Tag className="w-4 h-4 text-[#111C59]" />}
                  section="tags"
                  count={formData.tags?.length || 0}
                />
                
                {expandedSections.tags && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pl-2"
                  >
                    {/* Add Tag */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Add a tag..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-gradient-to-r from-[#111C59] to-[#4F5F73] text-white rounded-lg hover:from-[#0F1A4F] hover:to-[#45536A] transition-all duration-200 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tags List */}
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#111C59]/10 text-[#111C59] rounded-full text-sm font-medium"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 text-[#111C59] hover:text-[#0F1A4F] transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Subtasks */}
              <div className="space-y-4">
                <SectionHeader
                  title="Subtasks"
                  icon={<CheckSquare className="w-4 h-4 text-[#4F5F73]" />}
                  section="subtasks"
                  count={formData.subtasks?.length || 0}
                />
                
                {expandedSections.subtasks && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pl-2"
                  >
                    {/* Add Subtask */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                        placeholder="Add a subtask..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddSubtask}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Subtasks List */}
                    {formData.subtasks && formData.subtasks.length > 0 && (
                      <div className="space-y-2">
                        {formData.subtasks.map((subtask: any) => (
                          <div
                            key={subtask.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => handleToggleSubtask(subtask.id)}
                              className="rounded"
                            />
                            <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                              {subtask.title}
                            </span>
                            <button
                              onClick={() => handleRemoveSubtask(subtask.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Dependencies */}
              <div className="space-y-4">
                <SectionHeader
                  title="Dependencies"
                  icon={<GitBranch className="w-4 h-4 text-[#111C59]" />}
                  section="dependencies"
                  count={formData.dependencies?.length || 0}
                />
                
                {expandedSections.dependencies && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pl-2"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Depends on these tasks:
                      </label>
                      <select
                        multiple
                        value={formData.dependencies || []}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions, option => option.value)
                          handleInputChange('dependencies', values)
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        size={5}
                      >
                        {existingTasks
                          .filter(t => t.id !== formData.id)
                          .map(task => (
                            <option key={task.id} value={task.id}>
                              {task.title}
                            </option>
                          ))
                        }
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Hold Ctrl/Cmd to select multiple tasks
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Comments */}
              <div className="space-y-4">
                <SectionHeader
                  title="Comments"
                  icon={<MessageCircle className="w-4 h-4 text-[#4F5F73]" />}
                  section="comments"
                  count={formData.comments?.length || 0}
                />
                
                {expandedSections.comments && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pl-2"
                  >
                    {/* Add Comment */}
                    <div className="space-y-2">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <button
                        onClick={handleAddComment}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Comment
                      </button>
                    </div>

                    {/* Comments List */}
                    {formData.comments && formData.comments.length > 0 && (
                      <div className="space-y-3">
                        {formData.comments.map((comment: any) => (
                          <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm text-gray-900">
                                {comment.author}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isLoading || !formData.title.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#111C59] to-[#4F5F73] text-white rounded-lg hover:from-[#0F1A4F] hover:to-[#45536A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-md mx-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to delete &quot;{formData.title}&quot;? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-200 font-medium shadow-sm"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  )
}
