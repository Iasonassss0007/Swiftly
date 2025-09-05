'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Brain, Sparkles, Lightbulb, TrendingUp, 
  AlertTriangle, CheckCircle2, Clock, Users,
  Target, Zap, Star, Activity
} from 'lucide-react'

interface AIIntelligenceEngineProps {
  taskTitle: string
  taskDescription: string
  taskType?: string
  userContext?: {
    timeOfDay: string
    workload: number
    preferences: any
    history: any[]
  }
  onSuggestionApply: (suggestion: AISuggestion) => void
  className?: string
}

interface AISuggestion {
  id: string
  type: 'time' | 'assignee' | 'tag' | 'template' | 'conflict' | 'optimization'
  title: string
  description: string
  confidence: number
  action: () => void
  icon: React.ReactNode
  priority: 'high' | 'medium' | 'low'
  category: 'productivity' | 'scheduling' | 'collaboration' | 'organization'
}

interface TaskPattern {
  type: string
  frequency: number
  avgDuration: number
  bestTime: string
  commonTags: string[]
  typicalAssignees: string[]
}

export default function AIIntelligenceEngine({
  taskTitle,
  taskDescription,
  taskType,
  userContext,
  onSuggestionApply,
  className = ""
}: AIIntelligenceEngineProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [taskPatterns, setTaskPatterns] = useState<TaskPattern[]>([])

  // Simulate AI analysis
  const analyzeTask = useCallback(async () => {
    if (!taskTitle.trim()) {
      setSuggestions([])
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    // Simulate progressive analysis
    const analysisSteps = [
      { step: 'Analyzing task context...', progress: 20 },
      { step: 'Checking user patterns...', progress: 40 },
      { step: 'Evaluating time optimization...', progress: 60 },
      { step: 'Generating suggestions...', progress: 80 },
      { step: 'Finalizing recommendations...', progress: 100 }
    ]

    for (const { step, progress } of analysisSteps) {
      setAnalysisProgress(progress)
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    const newSuggestions: AISuggestion[] = []

    // Time-based suggestions
    const hour = new Date().getHours()
    if (hour >= 9 && hour <= 11 && taskTitle.toLowerCase().includes('creative')) {
      newSuggestions.push({
        id: 'time-creative',
        type: 'time',
        title: 'Optimal Creative Time',
        description: 'Morning hours are perfect for creative tasks based on your productivity patterns',
        confidence: 92,
        action: () => {
          // Auto-schedule for morning
          onSuggestionApply({
            id: 'time-creative',
            type: 'time',
            title: 'Optimal Creative Time',
            description: 'Morning hours are perfect for creative tasks based on your productivity patterns',
            confidence: 92,
            action: () => {},
            icon: <Clock className="w-4 h-4" />,
            priority: 'high',
            category: 'scheduling'
          })
        },
        icon: <Clock className="w-4 h-4" />,
        priority: 'high',
        category: 'scheduling'
      })
    }

    // Template suggestions
    if (taskTitle.toLowerCase().includes('meeting')) {
      newSuggestions.push({
        id: 'template-meeting',
        type: 'template',
        title: 'Meeting Template',
        description: 'Add agenda, attendees, and follow-up items based on your meeting patterns',
        confidence: 88,
        action: () => {
          onSuggestionApply({
            id: 'template-meeting',
            type: 'template',
            title: 'Meeting Template',
            description: 'Add agenda, attendees, and follow-up items based on your meeting patterns',
            confidence: 88,
            action: () => {},
            icon: <Users className="w-4 h-4" />,
            priority: 'high',
            category: 'productivity'
          })
        },
        icon: <Users className="w-4 h-4" />,
        priority: 'high',
        category: 'productivity'
      })
    }

    // Duration optimization
    if (taskTitle.toLowerCase().includes('review')) {
      newSuggestions.push({
        id: 'duration-review',
        type: 'optimization',
        title: 'Duration Optimization',
        description: 'Similar review tasks typically take 45-60 minutes based on your history',
        confidence: 85,
        action: () => {
          onSuggestionApply({
            id: 'duration-review',
            type: 'optimization',
            title: 'Duration Optimization',
            description: 'Similar review tasks typically take 45-60 minutes based on your history',
            confidence: 85,
            action: () => {},
            icon: <Target className="w-4 h-4" />,
            priority: 'medium',
            category: 'productivity'
          })
        },
        icon: <Target className="w-4 h-4" />,
        priority: 'medium',
        category: 'productivity'
      })
    }

    // Tag suggestions based on content
    const contentTags = []
    if (taskTitle.toLowerCase().includes('urgent') || taskDescription.toLowerCase().includes('asap')) {
      contentTags.push('urgent')
    }
    if (taskTitle.toLowerCase().includes('client') || taskDescription.toLowerCase().includes('customer')) {
      contentTags.push('client')
    }
    if (taskTitle.toLowerCase().includes('bug') || taskDescription.toLowerCase().includes('fix')) {
      contentTags.push('bug-fix')
    }

    contentTags.forEach(tag => {
      newSuggestions.push({
        id: `tag-${tag}`,
        type: 'tag',
        title: `Auto-tag: ${tag}`,
        description: `Content analysis suggests adding "${tag}" tag`,
        confidence: 78,
        action: () => {
          onSuggestionApply({
            id: `tag-${tag}`,
            type: 'tag',
            title: `Auto-tag: ${tag}`,
            description: `Content analysis suggests adding "${tag}" tag`,
            confidence: 78,
            action: () => {},
            icon: <Star className="w-4 h-4" />,
            priority: 'low',
            category: 'organization'
          })
        },
        icon: <Star className="w-4 h-4" />,
        priority: 'low',
        category: 'organization'
      })
    })

    // Workload balance suggestion
    if (userContext?.workload && userContext.workload > 0.8) {
      newSuggestions.push({
        id: 'workload-balance',
        type: 'optimization',
        title: 'Workload Balance',
        description: 'Your current workload is high. Consider delegating or rescheduling this task',
        confidence: 90,
        action: () => {
          onSuggestionApply({
            id: 'workload-balance',
            type: 'optimization',
            title: 'Workload Balance',
            description: 'Your current workload is high. Consider delegating or rescheduling this task',
            confidence: 90,
            action: () => {},
            icon: <AlertTriangle className="w-4 h-4" />,
            priority: 'high',
            category: 'productivity'
          })
        },
        icon: <AlertTriangle className="w-4 h-4" />,
        priority: 'high',
        category: 'productivity'
      })
    }

    // Sort by confidence and priority
    newSuggestions.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1
      if (b.priority === 'high' && a.priority !== 'high') return 1
      return b.confidence - a.confidence
    })

    setSuggestions(newSuggestions)
    setIsAnalyzing(false)
  }, [taskTitle, taskDescription, userContext, onSuggestionApply])

  // Trigger analysis when task content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeTask()
    }, 500) // Debounce analysis

    return () => clearTimeout(timer)
  }, [analyzeTask])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productivity':
        return 'bg-blue-100 text-blue-700'
      case 'scheduling':
        return 'bg-green-100 text-green-700'
      case 'collaboration':
        return 'bg-purple-100 text-purple-700'
      case 'organization':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-green-500'
      default:
        return 'border-l-gray-500'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Analysis Status */}
      {isAnalyzing && (
        <div className="p-4 bg-gradient-to-r from-[#111C59]/10 to-[#4F5F73]/10 rounded-lg border border-[#111C59]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 border-2 border-[#111C59]/20 border-t-[#111C59] rounded-full animate-spin" />
            <span className="text-sm font-medium text-[#111C59]">AI Analysis in Progress</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#111C59] to-[#4F5F73] transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {!isAnalyzing && suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#111C59]" />
            <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
            <span className="text-xs bg-[#111C59]/10 text-[#111C59] px-2 py-1 rounded-full">
              {suggestions.length} suggestions
            </span>
          </div>

          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`p-4 bg-white border-l-4 ${getPriorityColor(suggestion.priority)} border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer group`}
              onClick={suggestion.action}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#111C59]/10 rounded-lg group-hover:bg-[#111C59]/20 transition-colors">
                  {suggestion.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">{suggestion.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(suggestion.category)}`}>
                      {suggestion.category}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">
                        {suggestion.confidence}% confidence
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 capitalize">
                        {suggestion.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-4 h-4 text-[#111C59]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No suggestions state */}
      {!isAnalyzing && suggestions.length === 0 && taskTitle.trim() && (
        <div className="text-center py-6">
          <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No AI suggestions available</p>
          <p className="text-xs text-gray-400 mt-1">Continue typing to get intelligent recommendations</p>
        </div>
      )}

      {/* Task Pattern Insights */}
      {taskPatterns.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Task Pattern Insights
          </h4>
          <div className="space-y-2">
            {taskPatterns.map((pattern, index) => (
              <div key={pattern.type} className="text-sm text-gray-600">
                <span className="font-medium">{pattern.type}:</span> Typically takes {pattern.avgDuration} minutes, 
                best scheduled for {pattern.bestTime}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

