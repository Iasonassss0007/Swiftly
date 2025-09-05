'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, Clock, Timer, AlertCircle, 
  CheckCircle2, Zap, Target, TrendingUp
} from 'lucide-react'

interface VisualTimelineProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  estimatedDuration?: number | null
  onDurationChange: (duration: number | null) => void
  className?: string
}

interface TimeSlot {
  hour: number
  label: string
  type: 'morning' | 'afternoon' | 'evening'
  intensity: 'low' | 'medium' | 'high'
  suggestion?: string
}

export default function VisualTimeline({
  selectedDate,
  onDateSelect,
  estimatedDuration,
  onDurationChange,
  className = ""
}: VisualTimelineProps) {
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  // Generate time slots based on current time and patterns
  useEffect(() => {
    const now = new Date()
    const currentHour = now.getHours()
    
    const slots: TimeSlot[] = []
    
    // Morning slots (6 AM - 12 PM)
    for (let hour = 6; hour < 12; hour++) {
      slots.push({
        hour,
        label: hour === 6 ? '6 AM' : hour === 12 ? '12 PM' : `${hour} AM`,
        type: 'morning',
        intensity: hour >= 9 && hour <= 11 ? 'high' : 'medium',
        suggestion: hour >= 9 && hour <= 11 ? 'Peak productivity time' : undefined
      })
    }
    
    // Afternoon slots (12 PM - 6 PM)
    for (let hour = 12; hour < 18; hour++) {
      const displayHour = hour > 12 ? hour - 12 : hour
      slots.push({
        hour,
        label: hour === 12 ? '12 PM' : `${displayHour} PM`,
        type: 'afternoon',
        intensity: hour >= 14 && hour <= 16 ? 'high' : 'medium',
        suggestion: hour >= 14 && hour <= 16 ? 'Good for meetings' : undefined
      })
    }
    
    // Evening slots (6 PM - 10 PM)
    for (let hour = 18; hour < 22; hour++) {
      const displayHour = hour - 12
      slots.push({
        hour,
        label: `${displayHour} PM`,
        type: 'evening',
        intensity: 'low',
        suggestion: 'Wind down time'
      })
    }
    
    setTimeSlots(slots)
  }, [])

  const getIntensityColor = (intensity: string, isSelected: boolean) => {
    if (isSelected) return 'bg-[#111C59] text-white'
    
    switch (intensity) {
      case 'high':
        return 'bg-green-100 text-green-700 hover:bg-green-200'
      case 'medium':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-200'
      case 'low':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'morning':
        return <Zap className="w-3 h-3" />
      case 'afternoon':
        return <Target className="w-3 h-3" />
      case 'evening':
        return <Clock className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const quickDateOptions = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { label: 'Next Week', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  ]

  const durationOptions = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' },
    { value: 480, label: 'Full day' }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Date Selection */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Schedule</h4>
        <div className="grid grid-cols-3 gap-2">
          {quickDateOptions.map(({ label, date }) => (
            <button
              key={label}
              onClick={() => onDateSelect(date)}
              className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                selectedDate && selectedDate.toDateString() === date.toDateString()
                  ? 'bg-[#111C59] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Timeline */}
      {selectedDate && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Time Slots</h4>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot.hour}
                onClick={() => {
                  const newDate = new Date(selectedDate)
                  newDate.setHours(slot.hour, 0, 0, 0)
                  onDateSelect(newDate)
                }}
                onMouseEnter={() => setHoveredSlot(slot.hour)}
                onMouseLeave={() => setHoveredSlot(null)}
                className={`p-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                  getIntensityColor(slot.intensity, selectedDate.getHours() === slot.hour)
                }`}
              >
                {getTypeIcon(slot.type)}
                <span>{slot.label}</span>
                {slot.suggestion && hoveredSlot === slot.hour && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                    {slot.suggestion}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Duration Estimation */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Estimated Duration</h4>
        <div className="grid grid-cols-3 gap-2">
          {durationOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onDurationChange(value)}
              className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                estimatedDuration === value
                  ? 'bg-[#111C59] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Timer className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Date Summary */}
      {selectedDate && (
        <div className="p-4 bg-gradient-to-r from-[#111C59]/10 to-[#4F5F73]/10 rounded-xl border border-[#111C59]/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#111C59]" />
            <span className="text-sm font-semibold text-[#111C59]">Scheduled</span>
          </div>
          <p className="text-sm text-gray-700">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
          {estimatedDuration && (
            <p className="text-xs text-gray-600 mt-1">
              Duration: {estimatedDuration} minutes
            </p>
          )}
        </div>
      )}
    </div>
  )
}

