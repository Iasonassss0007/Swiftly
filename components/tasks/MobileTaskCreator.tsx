'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  X, Calendar, Flag, Users, Tag, Plus, Check, 
  Clock, Settings, Zap, FileText, UserPlus, Info, 
  AlertCircle, CheckCircle2, Sparkles, Brain, 
  Target, Timer, MapPin, ChevronRight, ChevronDown, 
  Star, Lightbulb, TrendingUp, Activity, Eye, EyeOff,
  Sun, ArrowLeft, ArrowRight
} from 'lucide-react'
import { Task } from './TaskRow'
import SmartTaskInput from './SmartTaskInput'
import VisualTimeline from './VisualTimeline'
import SmartAssigneeSelector from './SmartAssigneeSelector'

interface MobileTaskCreatorProps {
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

interface TaskStep {
  id: string
  title: string
  icon: React.ReactNode
  component: React.ReactNode
  completed: boolean
  required: boolean
}

export default function MobileTaskCreator({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editTask = null,
  initialStatus = 'todo',
  availableUsers,
  availableTags
}: MobileTaskCreatorProps) {
  
  // Core form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [status, setStatus] = useState<Task['status']>(initialStatus)
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [assignees, setAssignees] = useState<Task['assignees']>([])
  const [tags, setTags] = useState<string[]>([])
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null)
  const [location, setLocation] = useState('')
  
  // Mobile-specific state
  const [currentStep, setCurrentStep] = useState(0)
  const [completionProgress, setCompletionProgress] = useState(0)
  const [showKeyboard, setShowKeyboard] = useState(false)
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize form
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title)
      setDescription(editTask.description || '')
      setPriority(editTask.priority)
      setStatus(editTask.status)
      setDueDate(editTask.dueDate ? new Date(editTask.dueDate) : null)
      setAssignees(editTask.assignees || [])
      setTags(editTask.tags || [])
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setStatus(initialStatus)
      setDueDate(null)
      setAssignees([])
      setTags([])
      setEstimatedDuration(null)
      setLocation('')
    }
  }, [editTask, initialStatus])

  // Calculate completion progress
  useEffect(() => {
    let progress = 0
    if (title.trim()) progress += 30
    if (priority) progress += 20
    if (dueDate) progress += 20
    if (description.trim()) progress += 15
    if (assignees.length > 0) progress += 10
    if (tags.length > 0) progress += 5
    setCompletionProgress(progress)
  }, [title, priority, dueDate, description, assignees, tags])

  // Auto-focus input on step change
  useEffect(() => {
    if (isOpen && inputRef.current && currentStep === 0) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, currentStep])

  // Define steps
  const steps: TaskStep[] = [
    {
      id: 'title',
      title: 'What needs to be done?',
      icon: <FileText className="w-6 h-6" />,
      completed: !!title.trim(),
      required: true,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Task Title</h2>
            <p className="text-gray-600">Start by describing what you need to accomplish</p>
          </div>
          
          <SmartTaskInput
            value={title}
            onChange={setTitle}
            placeholder="What needs to be done?"
            onSuggestionSelect={(suggestion) => {
              setTitle(suggestion)
              setTimeout(() => setCurrentStep(1), 500)
            }}
            className="text-xl font-semibold text-center"
          />
          
          {/* Quick templates */}
          {!title.trim() && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 text-center">Or choose a template:</p>
              <div className="grid grid-cols-1 gap-2">
                {['Meeting with team', 'Review document', 'Send email', 'Call client'].map((template) => (
                  <button
                    key={template}
                    onClick={() => {
                      setTitle(template)
                      setTimeout(() => setCurrentStep(1), 500)
                    }}
                    className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-600"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'scheduling',
      title: 'When should this be done?',
      icon: <Calendar className="w-6 h-6" />,
      completed: !!dueDate,
      required: true,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Schedule Task</h2>
            <p className="text-gray-600">Set a due date and estimated duration</p>
          </div>
          
          <VisualTimeline
            selectedDate={dueDate}
            onDateSelect={(date) => {
              setDueDate(date)
              setTimeout(() => setCurrentStep(2), 500)
            }}
            estimatedDuration={estimatedDuration}
            onDurationChange={setEstimatedDuration}
          />
        </div>
      )
    },
    {
      id: 'priority',
      title: 'How important is this?',
      icon: <Flag className="w-6 h-6" />,
      completed: !!priority,
      required: true,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center mx-auto mb-4">
              <Flag className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Priority Level</h2>
            <p className="text-gray-600">Set the importance and current status</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Priority</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'low', label: 'Low Priority', color: 'bg-green-500', description: 'Can be done when convenient' },
                  { value: 'medium', label: 'Medium Priority', color: 'bg-orange-500', description: 'Should be done soon' },
                  { value: 'high', label: 'High Priority', color: 'bg-red-500', description: 'Needs immediate attention' }
                ].map(({ value, label, color, description }) => (
                  <button
                    key={value}
                    onClick={() => setPriority(value as Task['priority'])}
                    className={`p-4 rounded-xl text-left transition-all ${
                      priority === value
                        ? `${color} text-white shadow-lg`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${priority === value ? 'bg-white' : color}`} />
                      <div>
                        <h4 className="font-semibold">{label}</h4>
                        <p className="text-sm opacity-80">{description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'assignment',
      title: 'Who should work on this?',
      icon: <Users className="w-6 h-6" />,
      completed: assignees.length > 0,
      required: false,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Team Assignment</h2>
            <p className="text-gray-600">Assign team members to this task</p>
          </div>
          
          <SmartAssigneeSelector
            availableUsers={availableUsers.map(user => ({
              ...user,
              availability: Math.random() > 0.5 ? 'available' : 'busy',
              workload: Math.random(),
              skills: ['design', 'development', 'marketing', 'sales'].slice(0, Math.floor(Math.random() * 3) + 1)
            }))}
            selectedAssignees={assignees}
            onAssigneesChange={setAssignees}
            taskTitle={title}
            taskType={tags.join(' ')}
          />
        </div>
      )
    },
    {
      id: 'details',
      title: 'Add more details',
      icon: <FileText className="w-6 h-6" />,
      completed: !!description.trim(),
      required: false,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Task Details</h2>
            <p className="text-gray-600">Add description and context</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details, context, or requirements..."
                rows={4}
                className="w-full p-3 border border-gray-200 rounded-lg resize-none text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Location (optional)
              </label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where will this be done?"
                  className="flex-1 p-3 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tags',
      title: 'Organize with tags',
      icon: <Tag className="w-6 h-6" />,
      completed: tags.length > 0,
      required: false,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Tags & Organization</h2>
            <p className="text-gray-600">Add tags to organize your task</p>
          </div>
          
          <div className="space-y-4">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-2 bg-[#111C59]/10 text-[#111C59] rounded-full px-3 py-2 text-sm font-medium"
                  >
                    <Tag className="w-4 h-4" />
                    {tag}
                    <button
                      onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                      className="text-[#111C59] hover:text-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              {availableTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (!tags.includes(tag)) {
                      setTags(prev => [...prev, tag])
                    }
                  }}
                  disabled={tags.includes(tag)}
                  className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ]

  const handleSave = () => {
    if (!title.trim()) return

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      dueDate,
      assignees,
      tags,
      completed: status === 'done',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (editTask) {
      onUpdate?.({ ...editTask, ...taskData })
    } else {
      onSave(taskData)
    }
    onClose()
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSave()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    const currentStepData = steps[currentStep]
    return !currentStepData.required || currentStepData.completed
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div 
        ref={containerRef}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#F8FAFC] to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F1626]">
                {editTask ? 'Edit Task' : 'Create Task'}
              </h2>
              <p className="text-xs text-gray-600">
                Step {currentStep + 1} of {steps.length}
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

        {/* Progress Bar */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Progress</span>
            <span className="text-xs font-medium text-gray-700">{completionProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#111C59] to-[#4F5F73] transition-all duration-500"
              style={{ width: `${completionProgress}%` }}
            />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="px-4 py-2 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-[#111C59]' 
                      : index < currentStep 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#111C59] hover:text-[#0F1626] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === steps.length - 1 ? 'Save' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {steps[currentStep]?.component}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-6 py-2 bg-gradient-to-r from-[#111C59] to-[#4F5F73] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {editTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

