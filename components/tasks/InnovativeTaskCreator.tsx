'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  X, Calendar, Flag, Users, Tag, Plus, Check, 
  Clock, Settings, Zap, FileText, UserPlus, Info, 
  AlertCircle, CheckCircle2, Sparkles, Brain, 
  Target, Timer, MapPin, Link, Paperclip,
  ChevronRight, ChevronDown, Star, Lightbulb,
  TrendingUp, Activity, Eye, EyeOff, GripVertical,
  Sun
} from 'lucide-react'
import { Task } from './TaskRow'
import SmartTaskInput from './SmartTaskInput'
import VisualTimeline from './VisualTimeline'
import SmartAssigneeSelector from './SmartAssigneeSelector'
import AIIntelligenceEngine from './AIIntelligenceEngine'

interface InnovativeTaskCreatorProps {
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

interface TaskCard {
  id: string
  title: string
  icon: React.ReactNode
  priority: 'essential' | 'important' | 'optional'
  expanded: boolean
  completed: boolean
  component: React.ReactNode
}

interface SmartSuggestion {
  type: 'time' | 'assignee' | 'tag' | 'template' | 'conflict'
  title: string
  description: string
  action: () => void
  confidence: number
  icon: React.ReactNode
}

export default function InnovativeTaskCreator({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editTask = null,
  initialStatus = 'todo',
  availableUsers,
  availableTags
}: InnovativeTaskCreatorProps) {
  
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
  const [dependencies, setDependencies] = useState<string[]>([])
  
  // UI state
  const [activeCard, setActiveCard] = useState('title')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(['title']))
  const [completionConfidence, setCompletionConfidence] = useState(0)
  const [showAISuggestions, setShowAISuggestions] = useState(true)
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [cardOrder, setCardOrder] = useState<string[]>([
    'title', 'scheduling', 'priority', 'assignment', 'details', 'advanced'
  ])
  
  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  // Initialize form with edit task data
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
      // Reset form for new task
      setTitle('')
      setDescription('')
      setPriority('medium')
      setStatus(initialStatus)
      setDueDate(null)
      setAssignees([])
      setTags([])
      setEstimatedDuration(null)
      setLocation('')
      setDependencies([])
    }
  }, [editTask, initialStatus])

  // Calculate completion confidence
  useEffect(() => {
    let confidence = 0
    if (title.trim()) confidence += 30
    if (priority) confidence += 20
    if (dueDate) confidence += 20
    if (description.trim()) confidence += 15
    if (assignees.length > 0) confidence += 10
    if (tags.length > 0) confidence += 5
    setCompletionConfidence(confidence)
  }, [title, priority, dueDate, description, assignees, tags])

  // Generate smart suggestions
  useEffect(() => {
    const suggestions: SmartSuggestion[] = []
    
    // Time-based suggestions
    const now = new Date()
    const hour = now.getHours()
    
    if (hour >= 9 && hour <= 11) {
      suggestions.push({
        type: 'time',
        title: 'Morning Energy',
        description: 'Perfect time for creative tasks',
        action: () => setPriority('high'),
        confidence: 85,
        icon: <Sun className="w-4 h-4" />
      })
    }
    
    if (title.toLowerCase().includes('meeting')) {
      suggestions.push({
        type: 'template',
        title: 'Meeting Template',
        description: 'Add agenda and attendees',
        action: () => {
          setDescription(prev => prev + '\n\nAgenda:\n- \n- \n- ')
          setTags(prev => [...prev, 'meeting'])
        },
        confidence: 90,
        icon: <Users className="w-4 h-4" />
      })
    }
    
    // Assignee suggestions based on task type
    if (title.toLowerCase().includes('design') && availableUsers.some(u => u.name.toLowerCase().includes('design'))) {
      const designUser = availableUsers.find(u => u.name.toLowerCase().includes('design'))
      if (designUser) {
        suggestions.push({
          type: 'assignee',
          title: 'Auto-assign Designer',
          description: `Assign to ${designUser.name}`,
          action: () => setAssignees([designUser]),
          confidence: 80,
          icon: <UserPlus className="w-4 h-4" />
        })
      }
    }
    
    setSmartSuggestions(suggestions)
  }, [title, availableUsers])

  // Auto-focus title input
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Card configuration
  const taskCards: TaskCard[] = [
    {
      id: 'title',
      title: 'Task Title',
      icon: <FileText className="w-5 h-5" />,
      priority: 'essential',
      expanded: expandedCards.has('title'),
      completed: !!title.trim(),
      component: (
        <div className="space-y-4">
          <SmartTaskInput
            value={title}
            onChange={setTitle}
            placeholder="What needs to be done?"
            onSuggestionSelect={(suggestion) => {
              setTitle(suggestion)
              // Auto-expand next card when title is set
              if (!expandedCards.has('scheduling')) {
                setExpandedCards(prev => new Set([...prev, 'scheduling']))
                setActiveCard('scheduling')
              }
            }}
            className="text-2xl font-semibold"
          />
        </div>
      )
    },
    {
      id: 'scheduling',
      title: 'When & Duration',
      icon: <Calendar className="w-5 h-5" />,
      priority: 'important',
      expanded: expandedCards.has('scheduling'),
      completed: !!dueDate,
      component: (
        <VisualTimeline
          selectedDate={dueDate}
          onDateSelect={(date) => {
            setDueDate(date)
            // Auto-expand priority card when date is set
            if (!expandedCards.has('priority')) {
              setExpandedCards(prev => new Set([...prev, 'priority']))
              setActiveCard('priority')
            }
          }}
          estimatedDuration={estimatedDuration}
          onDurationChange={setEstimatedDuration}
        />
      )
    },
    {
      id: 'priority',
      title: 'Priority & Status',
      icon: <Flag className="w-5 h-5" />,
      priority: 'essential',
      expanded: expandedCards.has('priority'),
      completed: !!priority,
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'low', label: 'Low', color: 'bg-green-500', textColor: 'text-green-700' },
              { value: 'medium', label: 'Medium', color: 'bg-orange-500', textColor: 'text-orange-700' },
              { value: 'high', label: 'High', color: 'bg-red-500', textColor: 'text-red-700' }
            ].map(({ value, label, color, textColor }) => (
              <button
                key={value}
                onClick={() => setPriority(value as Task['priority'])}
                className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  priority === value
                    ? `${color} text-white shadow-md`
                    : `bg-gray-100 ${textColor} hover:bg-gray-200`
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${priority === value ? 'bg-white' : color}`} />
                {label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              status === 'todo' ? 'bg-gray-400' :
              status === 'in_progress' ? 'bg-blue-500' :
              'bg-green-500'
            }`} />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Task['status'])}
              className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
      )
    },
    {
      id: 'assignment',
      title: 'Team & Collaboration',
      icon: <Users className="w-5 h-5" />,
      priority: 'important',
      expanded: expandedCards.has('assignment'),
      completed: assignees.length > 0,
      component: (
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
      )
    },
    {
      id: 'details',
      title: 'Description & Context',
      icon: <FileText className="w-5 h-5" />,
      priority: 'optional',
      expanded: expandedCards.has('details'),
      completed: !!description.trim(),
      component: (
        <div className="space-y-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details, context, or requirements..."
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-lg resize-none text-sm"
          />
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (optional)"
              className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
      )
    },
    {
      id: 'advanced',
      title: 'Tags & Organization',
      icon: <Tag className="w-5 h-5" />,
      priority: 'optional',
      expanded: expandedCards.has('advanced'),
      completed: tags.length > 0,
      component: (
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
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            {availableTags.slice(0, 6).map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (!tags.includes(tag)) {
                    setTags(prev => [...prev, tag])
                  }
                }}
                disabled={tags.includes(tag)}
                className="p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )
    }
  ]

  // Helper functions
  const toggleCard = (cardId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId)
    } else {
      newExpanded.add(cardId)
    }
    setExpandedCards(newExpanded)
    setActiveCard(cardId)
  }

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

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div 
        ref={containerRef}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex overflow-hidden"
      >
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#F8FAFC] to-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#0F1626]">
                  {editTask ? 'Edit Task' : 'Create Task'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {editTask ? 'Update task details' : 'Build your task with intelligent assistance'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Completion Confidence Meter */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#111C59]" />
                <span className="text-sm font-medium text-gray-700">Task Definition</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                    style={{ width: `${completionConfidence}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{completionConfidence}%</span>
              </div>
            </div>
          </div>

          {/* Dynamic Cards Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {cardOrder.map((cardId) => {
                const card = taskCards.find(c => c.id === cardId)
                if (!card) return null

                return (
                  <div
                    key={card.id}
                    className={`bg-white border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
                      card.expanded 
                        ? 'border-[#111C59] shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${card.priority === 'essential' ? 'ring-2 ring-[#111C59]/20' : ''}`}
                  >
                    {/* Card Header */}
                    <button
                      onClick={() => toggleCard(card.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          card.completed 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {card.completed ? <CheckCircle2 className="w-4 h-4" /> : card.icon}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">{card.title}</h3>
                          <p className="text-xs text-gray-500 capitalize">{card.priority} field</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {card.completed && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                        {card.expanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </button>

                    {/* Card Content */}
                    {card.expanded && (
                      <div className="p-4 border-t border-gray-100">
                        {card.component}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="w-4 h-4" />
                <span>
                  {taskCards.filter(c => c.completed).length} of {taskCards.length} sections completed
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-[#111C59] to-[#4F5F73] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggestions Sidebar */}
        {showAISuggestions && (
          <div className="w-80 border-l border-gray-200 bg-gradient-to-b from-[#F8FAFC] to-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#111C59]" />
                  <h3 className="font-semibold text-gray-900">Smart Suggestions</h3>
                </div>
                <button
                  onClick={() => setShowAISuggestions(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <AIIntelligenceEngine
                taskTitle={title}
                taskDescription={description}
                taskType={tags.join(' ')}
                userContext={{
                  timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening',
                  workload: Math.random(), // Simulated workload
                  preferences: {},
                  history: []
                }}
                onSuggestionApply={(suggestion) => {
                  // Apply suggestion based on type
                  switch (suggestion.type) {
                    case 'time':
                      // Auto-schedule for optimal time
                      break
                    case 'template':
                      // Apply template
                      if (suggestion.title.includes('Meeting')) {
                        setDescription(prev => prev + '\n\nAgenda:\n- \n- \n- ')
                        setTags(prev => [...prev, 'meeting'])
                      }
                      break
                    case 'tag':
                      // Add suggested tag
                      const tagName = suggestion.title.replace('Auto-tag: ', '')
                      if (!tags.includes(tagName)) {
                        setTags(prev => [...prev, tagName])
                      }
                      break
                    case 'optimization':
                      // Apply optimization
                      if (suggestion.title.includes('Duration')) {
                        setEstimatedDuration(45) // 45 minutes for review tasks
                      }
                      break
                  }
                }}
                className="p-4"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
