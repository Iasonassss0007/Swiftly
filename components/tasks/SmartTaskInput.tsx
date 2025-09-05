'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Sparkles, Lightbulb, Clock, Users, Tag, 
  Calendar, AlertTriangle, CheckCircle2, 
  TrendingUp, Zap, Brain
} from 'lucide-react'

interface SmartTaskInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSuggestionSelect?: (suggestion: string) => void
  className?: string
}

interface SmartSuggestion {
  text: string
  type: 'template' | 'ai' | 'pattern' | 'time'
  confidence: number
  icon: React.ReactNode
  description: string
}

export default function SmartTaskInput({
  value,
  onChange,
  placeholder = "What needs to be done?",
  onSuggestionSelect,
  className = ""
}: SmartTaskInputProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Generate smart suggestions based on input
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsAnalyzing(true)
    
    // Simulate AI analysis delay
    const timer = setTimeout(() => {
      const newSuggestions: SmartSuggestion[] = []
      
      // Template suggestions
      if (value.toLowerCase().includes('meeting')) {
        newSuggestions.push({
          text: 'Schedule team meeting for project review',
          type: 'template',
          confidence: 95,
          icon: <Users className="w-4 h-4" />,
          description: 'Complete meeting template'
        })
      }
      
      if (value.toLowerCase().includes('email')) {
        newSuggestions.push({
          text: 'Send follow-up email to client',
          type: 'template',
          confidence: 90,
          icon: <Zap className="w-4 h-4" />,
          description: 'Email template with context'
        })
      }
      
      // Time-based suggestions
      const hour = new Date().getHours()
      if (hour >= 9 && hour <= 11 && value.toLowerCase().includes('call')) {
        newSuggestions.push({
          text: 'Schedule morning call with stakeholders',
          type: 'time',
          confidence: 85,
          icon: <Clock className="w-4 h-4" />,
          description: 'Optimal morning time slot'
        })
      }
      
      // Pattern-based suggestions
      if (value.toLowerCase().includes('review')) {
        newSuggestions.push({
          text: 'Review and approve document',
          type: 'pattern',
          confidence: 80,
          icon: <CheckCircle2 className="w-4 h-4" />,
          description: 'Based on your review patterns'
        })
      }
      
      // AI-generated suggestions
      if (value.length > 5) {
        newSuggestions.push({
          text: `${value} - Add detailed requirements and timeline`,
          type: 'ai',
          confidence: 75,
          icon: <Brain className="w-4 h-4" />,
          description: 'AI-enhanced task structure'
        })
      }
      
      setSuggestions(newSuggestions)
      setShowSuggestions(newSuggestions.length > 0)
      setIsAnalyzing(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [value])

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SmartSuggestion) => {
    onChange(suggestion.text)
    onSuggestionSelect?.(suggestion.text)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          placeholder={placeholder}
          className={`w-full p-4 text-2xl font-semibold bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 ${className}`}
        />
        
        {/* Smart indicator */}
        {isAnalyzing && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#111C59]/20 border-t-[#111C59] rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Analyzing...</span>
            </div>
          </div>
        )}
        
        {!isAnalyzing && value.length > 2 && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Sparkles className="w-5 h-5 text-[#111C59]" />
          </div>
        )}
      </div>

      {/* Smart Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          <div className="p-2">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              <Lightbulb className="w-4 h-4" />
              Smart Suggestions
            </div>
            
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-[#111C59]/10 rounded group-hover:bg-[#111C59]/20 transition-colors">
                    {suggestion.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{suggestion.text}</p>
                    <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">
                          {suggestion.confidence}% confidence
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 capitalize">
                        {suggestion.type} suggestion
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

