'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ArrowLeft, ArrowRight, Check, Calendar, Clock, 
  Flag, Users, FileText, Zap, Target, Star,
  ChevronRight, ChevronDown, Plus, Minus
} from 'lucide-react'
import { Task } from './TaskRow'

interface StepByStepTaskCreatorProps {
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
  }>
  availableTags: string[]
}

interface TaskData {
  title: string
  type: string
  dueDate: Date | null
  time: string
  duration: number | null
  priority: Task['priority']
  assignees: Task['assignees']
  notes: string
  tags: string[]
}

const TASK_TYPES = [
  { id: 'personal', label: 'Personal', icon: '👤', color: 'bg-blue-100 text-blue-700' },
  { id: 'work', label: 'Work', icon: '💼', color: 'bg-green-100 text-green-700' },
  { id: 'meeting', label: 'Meeting', icon: '🤝', color: 'bg-purple-100 text-purple-700' },
  { id: 'deadline', label: 'Deadline', icon: '⏰', color: 'bg-red-100 text-red-700' },
  { id: 'project', label: 'Project', icon: '📋', color: 'bg-orange-100 text-orange-700' },
  { id: 'other', label: 'Other', icon: '📝', color: 'bg-gray-100 text-gray-700' }
]

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low Priority', color: 'bg-green-500', description: 'Can be done when convenient' },
  { value: 'medium', label: 'Medium Priority', color: 'bg-orange-500', description: 'Should be done soon' },
  { value: 'high', label: 'High Priority', color: 'bg-red-500', description: 'Needs immediate attention' }
]

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: 'Full day' }
]

export default function StepByStepTaskCreator({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editTask = null,
  initialStatus = 'todo',
  availableUsers,
  availableTags
}: StepByStepTaskCreatorProps) {
  
  // Step management
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  
  // Task data
  const [taskData, setTaskData] = useState<TaskData>({
    title: '',
    type: '',
    dueDate: null,
    time: '',
    duration: null,
    priority: 'medium',
    assignees: [],
    notes: '',
    tags: []
  })
  
  // UI state
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const totalSteps = 4
  
  // Initialize form data
  useEffect(() => {
    if (editTask) {
      setTaskData({
        title: editTask.title,
        type: editTask.tags?.[0] || '',
        dueDate: editTask.dueDate ? new Date(editTask.dueDate) : null,
        time: '',
        duration: null,
        priority: editTask.priority,
        assignees: editTask.assignees || [],
        notes: editTask.description || '',
        tags: editTask.tags || []
      })
    } else {
      setTaskData({
        title: '',
        type: '',
        dueDate: null,
        time: '',
        duration: null,
        priority: 'medium',
        assignees: [],
        notes: '',
        tags: []
      })
    }
  }, [editTask])
  
  // Auto-focus input on step 1
  useEffect(() => {
    if (isOpen && currentStep === 0 && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, currentStep])
  
  // Update completed steps
  useEffect(() => {
    const newCompletedSteps = new Set<number>()
    
    if (taskData.title.trim()) newCompletedSteps.add(0)
    if (taskData.dueDate) newCompletedSteps.add(1)
    if (taskData.priority) newCompletedSteps.add(2)
    
    setCompletedSteps(newCompletedSteps)
  }, [taskData])
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleSave = () => {
    if (!taskData.title.trim()) return
    
    const taskPayload = {
      title: taskData.title.trim(),
      description: taskData.notes.trim(),
      priority: taskData.priority,
      status: initialStatus,
      dueDate: taskData.dueDate,
      assignees: taskData.assignees,
      tags: taskData.tags,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (editTask) {
      onUpdate?.({ ...editTask, ...taskPayload })
    } else {
      onSave(taskPayload)
    }
    onClose()
  }
  
  const canProceed = () => {
    switch (currentStep) {
      case 0: return taskData.title.trim().length > 0
      case 1: return true // Scheduling is optional
      case 2: return true // Details are optional
      case 3: return true // Confirmation
      default: return false
    }
  }
  
  const updateTaskData = (updates: Partial<TaskData>) => {
    setTaskData(prev => ({ ...prev, ...updates }))
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 flex items-center justify-center z-[9999] p-4" style={{ margin: 0, padding: '1rem', width: '100vw', height: '100vh' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#F8FAFC] to-white">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0F1626]">
                {editTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <p className="text-sm text-gray-600">
                Step {currentStep + 1} of {totalSteps}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  index === currentStep
                    ? 'bg-[#111C59] text-white'
                    : completedSteps.has(index)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {completedSteps.has(index) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < totalSteps - 1 && (
                  <div className={`w-12 h-1 mx-2 rounded-full transition-all ${
                    completedSteps.has(index) ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              {currentStep === 0 && (
                <Step1Basics 
                  taskData={taskData}
                  updateTaskData={updateTaskData}
                  inputRef={inputRef}
                />
              )}
              {currentStep === 1 && (
                <Step2Scheduling 
                  taskData={taskData}
                  updateTaskData={updateTaskData}
                />
              )}
              {currentStep === 2 && (
                <Step3Details 
                  taskData={taskData}
                  updateTaskData={updateTaskData}
                  availableUsers={availableUsers}
                  availableTags={availableTags}
                />
              )}
              {currentStep === 3 && (
                <Step4Confirmation 
                  taskData={taskData}
                  updateTaskData={updateTaskData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-white">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {completedSteps.has(0) && (
              <div className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {taskData.title}
              </div>
            )}
          </div>
          
          {currentStep === totalSteps - 1 ? (
            <button
              onClick={handleSave}
              disabled={!canProceed()}
              className="px-6 py-2 bg-gradient-to-r from-[#111C59] to-[#4F5F73] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editTask ? 'Update Task' : 'Create Task'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-4 py-2 bg-[#111C59] text-white rounded-lg font-medium hover:bg-[#0F1626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// Step 1: Task Basics
function Step1Basics({ 
  taskData, 
  updateTaskData, 
  inputRef 
}: { 
  taskData: TaskData
  updateTaskData: (updates: Partial<TaskData>) => void
  inputRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">What needs to be done?</h3>
        <p className="text-gray-600">Start by giving your task a clear, descriptive title</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Task Title *
          </label>
          <input
            ref={inputRef}
            type="text"
            value={taskData.title}
            onChange={(e) => updateTaskData({ title: e.target.value })}
            placeholder="Enter your task title..."
            className="w-full p-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#111C59] focus:border-[#111C59] transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Task Type (Optional)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TASK_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => updateTaskData({ type: type.id })}
                className={`p-4 rounded-xl text-left transition-all ${
                  taskData.type === type.id
                    ? `${type.color} border-2 border-current`
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 2: Scheduling
function Step2Scheduling({ 
  taskData, 
  updateTaskData 
}: { 
  taskData: TaskData
  updateTaskData: (updates: Partial<TaskData>) => void
}) {
  const quickDateOptions = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { label: 'Next Week', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  ]
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">When should this be done?</h3>
        <p className="text-gray-600">Set a due date and optional time details</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Due Date
          </label>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {quickDateOptions.map(({ label, date }) => (
              <button
                key={label}
                onClick={() => updateTaskData({ dueDate: date })}
                className={`p-3 rounded-lg text-sm font-medium transition-all ${
                  taskData.dueDate && taskData.dueDate.toDateString() === date.toDateString()
                    ? 'bg-[#111C59] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={taskData.dueDate ? taskData.dueDate.toISOString().split('T')[0] : ''}
            onChange={(e) => updateTaskData({ dueDate: e.target.value ? new Date(e.target.value) : null })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59] focus:border-[#111C59]"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Time (Optional)
            </label>
            <input
              type="time"
              value={taskData.time}
              onChange={(e) => updateTaskData({ time: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59] focus:border-[#111C59]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Duration (Optional)
            </label>
            <select
              value={taskData.duration || ''}
              onChange={(e) => updateTaskData({ duration: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111C59] focus:border-[#111C59]"
            >
              <option value="">Select duration</option>
              {DURATION_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 3: Details
function Step3Details({ 
  taskData, 
  updateTaskData, 
  availableUsers, 
  availableTags 
}: { 
  taskData: TaskData
  updateTaskData: (updates: Partial<TaskData>) => void
  availableUsers: Array<{ id: string; name: string; email: string }>
  availableTags: string[]
}) {
  const [showNotes, setShowNotes] = useState(false)
  
  const addAssignee = (user: { id: string; name: string; email: string }) => {
    if (!taskData.assignees.some(a => a.id === user.id)) {
      updateTaskData({ assignees: [...taskData.assignees, user] })
    }
  }
  
  const removeAssignee = (userId: string) => {
    updateTaskData({ assignees: taskData.assignees.filter(a => a.id !== userId) })
  }
  
  const addTag = (tag: string) => {
    if (!taskData.tags.includes(tag)) {
      updateTaskData({ tags: [...taskData.tags, tag] })
    }
  }
  
  const removeTag = (tag: string) => {
    updateTaskData({ tags: taskData.tags.filter(t => t !== tag) })
  }
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center mx-auto mb-4">
          <Flag className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Set the details</h3>
        <p className="text-gray-600">Choose priority, assignees, and add any notes</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Priority Level
          </label>
          <div className="grid grid-cols-1 gap-3">
            {PRIORITY_LEVELS.map(({ value, label, color, description }) => (
              <button
                key={value}
                onClick={() => updateTaskData({ priority: value as Task['priority'] })}
                className={`p-4 rounded-xl text-left transition-all ${
                  taskData.priority === value
                    ? `${color} text-white shadow-lg`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${taskData.priority === value ? 'bg-white' : color}`} />
                  <div>
                    <h4 className="font-semibold">{label}</h4>
                    <p className="text-sm opacity-80">{description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {availableUsers.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Assignees (Optional)
            </label>
            <div className="space-y-3">
              {taskData.assignees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {taskData.assignees.map((assignee) => (
                    <div
                      key={assignee.id}
                      className="flex items-center gap-2 bg-[#111C59]/10 text-[#111C59] rounded-full px-3 py-2 text-sm font-medium"
                    >
                      <span>{assignee.name}</span>
                      <button
                        onClick={() => removeAssignee(assignee.id)}
                        className="text-[#111C59] hover:text-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                {availableUsers.slice(0, 5).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => addAssignee(user)}
                    disabled={taskData.assignees.some(a => a.id === user.id)}
                    className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-xs">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 text-sm">{user.name}</h5>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-[#111C59] transition-colors"
          >
            <FileText className="w-4 h-4" />
            Quick Notes (Optional)
            {showNotes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {showNotes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <textarea
                value={taskData.notes}
                onChange={(e) => updateTaskData({ notes: e.target.value })}
                placeholder="Add any additional notes or context..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-[#111C59] focus:border-[#111C59]"
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

// Step 4: Confirmation
function Step4Confirmation({ 
  taskData, 
  updateTaskData 
}: { 
  taskData: TaskData
  updateTaskData: (updates: Partial<TaskData>) => void
}) {
  const taskType = TASK_TYPES.find(t => t.id === taskData.type)
  const priority = PRIORITY_LEVELS.find(p => p.value === taskData.priority)
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Review your task</h3>
        <p className="text-gray-600">Everything looks good? Create your task!</p>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{taskData.title}</h4>
            {taskType && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{taskType.icon}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${taskType.color}`}>
                  {taskType.label}
                </span>
              </div>
            )}
            {taskData.notes && (
              <p className="text-sm text-gray-600 mt-2">{taskData.notes}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-1">Due Date</h5>
            <p className="text-sm text-gray-600">
              {taskData.dueDate 
                ? taskData.dueDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : 'No due date set'
              }
            </p>
          </div>
          
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-1">Priority</h5>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${priority?.color}`} />
              <span className="text-sm text-gray-600">{priority?.label}</span>
            </div>
          </div>
        </div>
        
        {taskData.assignees.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Assigned to</h5>
            <div className="flex flex-wrap gap-2">
              {taskData.assignees.map((assignee) => (
                <div
                  key={assignee.id}
                  className="flex items-center gap-2 bg-white rounded-full px-3 py-1 text-sm"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <span>{assignee.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}





