'use client'

import { useState, useEffect } from 'react'
import { 
  Users, UserPlus, Search, Clock, 
  TrendingUp, Star, Zap, CheckCircle2,
  AlertCircle, Brain, Target
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
  availability?: 'available' | 'busy' | 'away'
  workload?: number
  skills?: string[]
}

interface SmartAssigneeSelectorProps {
  availableUsers: User[]
  selectedAssignees: User[]
  onAssigneesChange: (assignees: User[]) => void
  taskTitle?: string
  taskType?: string
  className?: string
}

interface SmartSuggestion {
  user: User
  reason: string
  confidence: number
  type: 'skill_match' | 'availability' | 'workload' | 'pattern'
  icon: React.ReactNode
}

export default function SmartAssigneeSelector({
  availableUsers,
  selectedAssignees,
  onAssigneesChange,
  taskTitle = '',
  taskType = '',
  className = ""
}: SmartAssigneeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)

  // Generate smart suggestions based on task context
  useEffect(() => {
    if (!taskTitle && !taskType) {
      setSmartSuggestions([])
      return
    }

    const suggestions: SmartSuggestion[] = []
    
    // Skill-based matching
    availableUsers.forEach(user => {
      if (user.skills) {
        const matchingSkills = user.skills.filter(skill => 
          taskTitle.toLowerCase().includes(skill.toLowerCase()) ||
          taskType.toLowerCase().includes(skill.toLowerCase())
        )
        
        if (matchingSkills.length > 0) {
          suggestions.push({
            user,
            reason: `Expert in ${matchingSkills.join(', ')}`,
            confidence: Math.min(90, 60 + (matchingSkills.length * 10)),
            type: 'skill_match',
            icon: <Star className="w-4 h-4" />
          })
        }
      }
    })

    // Availability-based suggestions
    availableUsers.forEach(user => {
      if (user.availability === 'available') {
        suggestions.push({
          user,
          reason: 'Currently available',
          confidence: 75,
          type: 'availability',
          icon: <CheckCircle2 className="w-4 h-4" />
        })
      }
    })

    // Workload-based suggestions
    availableUsers.forEach(user => {
      if (user.workload && user.workload < 0.7) {
        suggestions.push({
          user,
          reason: 'Light workload',
          confidence: 70,
          type: 'workload',
          icon: <TrendingUp className="w-4 h-4" />
        })
      }
    })

    // Pattern-based suggestions (simulated)
    if (taskTitle.toLowerCase().includes('design')) {
      const designUser = availableUsers.find(u => 
        u.name.toLowerCase().includes('design') || 
        u.role?.toLowerCase().includes('design')
      )
      if (designUser) {
        suggestions.push({
          user: designUser,
          reason: 'Design specialist',
          confidence: 85,
          type: 'pattern',
          icon: <Target className="w-4 h-4" />
        })
      }
    }

    // Sort by confidence and remove duplicates
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.user.id === suggestion.user.id)
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 4)

    setSmartSuggestions(uniqueSuggestions)
  }, [taskTitle, taskType, availableUsers])

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addAssignee = (user: User) => {
    if (!selectedAssignees.some(a => a.id === user.id)) {
      onAssigneesChange([...selectedAssignees, user])
    }
  }

  const removeAssignee = (userId: string) => {
    onAssigneesChange(selectedAssignees.filter(a => a.id !== userId))
  }

  const getAvailabilityColor = (availability?: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-500'
      case 'busy':
        return 'bg-red-500'
      case 'away':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getWorkloadColor = (workload?: number) => {
    if (!workload) return 'bg-gray-200'
    if (workload < 0.3) return 'bg-green-500'
    if (workload < 0.7) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected Assignees */}
      {selectedAssignees.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Assigned Team Members</h4>
          <div className="flex flex-wrap gap-2">
            {selectedAssignees.map((assignee) => (
              <div
                key={assignee.id}
                className="flex items-center gap-2 bg-[#111C59]/10 text-[#111C59] rounded-full px-3 py-2 text-sm font-medium"
              >
                <div className="relative">
                  <div className="w-6 h-6 bg-[#111C59] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getAvailabilityColor(assignee.availability)}`} />
                </div>
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
        </div>
      )}

      {/* Smart Suggestions */}
      {showSuggestions && smartSuggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-[#111C59]" />
            <h4 className="text-sm font-semibold text-gray-900">Smart Suggestions</h4>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {smartSuggestions.map((suggestion) => (
              <button
                key={suggestion.user.id}
                onClick={() => addAssignee(suggestion.user)}
                disabled={selectedAssignees.some(a => a.id === suggestion.user.id)}
                className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {suggestion.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getAvailabilityColor(suggestion.user.availability)}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-gray-900">{suggestion.user.name}</h5>
                      <div className="flex items-center gap-1">
                        {suggestion.icon}
                        <span className="text-xs text-green-600 font-medium">
                          {suggestion.confidence}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{suggestion.reason}</p>
                    {suggestion.user.role && (
                      <p className="text-xs text-gray-500">{suggestion.user.role}</p>
                    )}
                  </div>
                  
                  {suggestion.user.workload && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getWorkloadColor(suggestion.user.workload)}`}
                          style={{ width: `${suggestion.user.workload * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(suggestion.user.workload * 100)}% busy
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search and Manual Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-gray-500" />
          <h4 className="text-sm font-semibold text-gray-900">All Team Members</h4>
        </div>
        
        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team members..."
            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59]"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => addAssignee(user)}
              disabled={selectedAssignees.some(a => a.id === user.id)}
              className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-xs">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getAvailabilityColor(user.availability)}`} />
                </div>
                
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 text-sm">{user.name}</h5>
                  <p className="text-xs text-gray-600">{user.email}</p>
                  {user.role && (
                    <p className="text-xs text-gray-500">{user.role}</p>
                  )}
                </div>
                
                {user.workload && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getWorkloadColor(user.workload)}`}
                        style={{ width: `${user.workload * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(user.workload * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

