'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ListChecks, MessageSquare, FileText, ChevronRight } from './icons'
import { QuickAction } from '@/types'
import { useProfile } from '@/lib/useProfile'


interface HomeViewProps {
  user: {
    id: string
    name: string
    email: string
    memberSince?: string
  }
}

export default function HomeView({ user }: HomeViewProps) {
  const { userFullName } = useProfile()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const quickActions: QuickAction[] = [
    {
      id: 'schedule',
      label: 'Schedule',
      description: 'Create and manage your calendar events',
      icon: <Calendar className="w-6 h-6 text-[#111C59]" />,
      onClick: () => console.log('Schedule clicked - Coming soon')
    },
    {
      id: 'reminders',
      label: 'Reminders',
      description: 'Set and track important reminders',
      icon: <ListChecks className="w-6 h-6 text-[#111C59]" />,
      onClick: () => console.log('Reminders clicked - Coming soon')
    },
    {
      id: 'inbox',
      label: 'Inbox',
      description: 'Manage your messages and notifications',
      icon: <MessageSquare className="w-6 h-6 text-[#111C59]" />,
      onClick: () => console.log('Inbox clicked - Coming soon')
    },
    {
      id: 'notes',
      label: 'Notes',
      description: 'Create and organize your notes',
      icon: <FileText className="w-6 h-6 text-[#111C59]" />,
      onClick: () => console.log('Notes clicked - Coming soon')
    }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-10 px-4 sm:px-6 lg:px-8">
      {/* Greeting Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center lg:text-left pt-6 pb-2"
      >
        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#111C59] to-[#4F5F73] bg-clip-text text-transparent mb-6 leading-tight">
          {getGreeting()}, {userFullName || user.name}
        </h1>
        <p className="text-xl text-[#4F5F73] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
          Here&apos;s what Swiftly can help you with today.
        </p>
      </motion.div>

      {/* Quick Action Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {quickActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            className="bg-white/95 backdrop-blur-sm rounded-xl border border-[#ADB3BD]/30 p-6 hover:shadow-xl hover:border-[#111C59]/30 transition-all duration-200 cursor-pointer group h-full flex flex-col"
            onClick={action.onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                action.onClick?.()
              }
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#111C59]/5 rounded-lg">
                {action.icon}
              </div>
              <ChevronRight className="w-5 h-5 text-[#4F5F73] group-hover:text-[#111C59] transition-colors duration-200" />
            </div>
            <h3 className="text-lg font-semibold text-[#0F1626] mb-3 leading-tight">
              {action.label}
            </h3>
            <p className="text-[#4F5F73] text-sm leading-relaxed flex-grow">
              {action.description}
            </p>
          </motion.div>
        ))}
      </motion.div>



      {/* Activity Feed Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white/95 backdrop-blur-sm rounded-xl border border-[#ADB3BD]/30 p-8 text-center shadow-sm"
      >
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-[#111C59]/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-[#4F5F73]" />
          </div>
          <h3 className="text-xl font-semibold text-[#0F1626] mb-3 leading-tight">
            Activity Feed Coming Soon
          </h3>
          <p className="text-[#4F5F73] leading-relaxed">
            Your recent activities, notifications, and insights will appear here.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
