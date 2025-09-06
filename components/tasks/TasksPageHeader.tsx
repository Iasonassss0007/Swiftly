'use client'

import { useState } from 'react'
import { Search, Plus, List, Grid3X3, BarChart3, Calendar } from 'lucide-react'

export type TaskView = 'list' | 'kanban' | 'gantt' | 'calendar'

interface TasksPageHeaderProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  onNewTask: () => void
  currentView: TaskView
  onViewChange: (view: TaskView) => void
}

export default function TasksPageHeader({
  searchTerm,
  onSearchChange,
  onNewTask,
  currentView,
  onViewChange
}: TasksPageHeaderProps) {
  const viewOptions = [
    { id: 'list', label: 'List', icon: List },
    { id: 'kanban', label: 'Kanban', icon: Grid3X3 },
    { id: 'gantt', label: 'Gantt', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: Calendar }
  ] as const

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#ADB3BD]/30 rounded-xl p-6 mb-6 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4F5F73]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#ADB3BD]/30 rounded-lg text-[#0F1626] placeholder-[#4F5F73] focus:outline-none focus:ring-2 focus:ring-[#111C59]/20 focus:border-[#111C59] transition-all duration-200"
            />
          </div>
        </div>

        {/* View Toggle and New Task Button */}
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-[#F8FAFC] border border-[#ADB3BD]/30 rounded-lg p-1">
            {viewOptions.map((option) => {
              const IconComponent = option.icon
              return (
                <button
                  key={option.id}
                  onClick={() => onViewChange(option.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    currentView === option.id
                      ? 'bg-white text-[#111C59] shadow-sm border border-[#ADB3BD]/20'
                      : 'text-[#4F5F73] hover:text-[#111C59] hover:bg-white/50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              )
            })}
          </div>

          {/* New Task Button */}
          <button
            onClick={onNewTask}
            className="flex items-center gap-2 bg-[#111C59] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#0F1626] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </div>
    </div>
  )
}

