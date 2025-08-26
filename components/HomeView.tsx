'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ListChecks, MessageSquare, FileText, ChevronRight } from './icons'
import { QuickAction } from '@/types'
import { supabase } from '@/lib/supabase'

interface HomeViewProps {
  user: {
    id: string
    name: string
    email: string
    memberSince?: string
  }
}

export default function HomeView({ user }: HomeViewProps) {
  const [askInput, setAskInput] = useState('')
  const [userFullName, setUserFullName] = useState(user.name)
  const [isLoadingName, setIsLoadingName] = useState(false)

  // Fetch user's full name from profiles table on component mount and when user changes
  useEffect(() => {
    const fetchUserFullName = async () => {
      if (!user.id) return
      
      setIsLoadingName(true)
      try {
        console.log('Fetching full name for user:', user.id)
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user profile:', error)
          // Keep the fallback name from props
          return
        }

        if (profile?.full_name) {
          setUserFullName(profile.full_name)
          console.log('User full name loaded from profiles table:', profile.full_name)
        } else {
          console.log('No full_name found in profile, using fallback')
        }
      } catch (error) {
        console.error('Unexpected error fetching user profile:', error)
      } finally {
        setIsLoadingName(false)
      }
    }

    // Always fetch to ensure we have the latest data
    fetchUserFullName()
  }, [user.id])

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
      icon: <ListChecks className="w-6 h-6 text-[#4F5F73]" />,
      onClick: () => console.log('Reminders clicked - Coming soon')
    },
    {
      id: 'inbox',
      label: 'Inbox',
      description: 'Manage your messages and notifications',
      icon: <MessageSquare className="w-6 h-6 text-[#ADB3BD]" />,
      onClick: () => console.log('Inbox clicked - Coming soon')
    },
    {
      id: 'notes',
      label: 'Notes',
      description: 'Create and organize your notes',
      icon: <FileText className="w-6 h-6 text-[#0F1626]" />,
      onClick: () => console.log('Notes clicked - Coming soon')
    }
  ]

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (askInput.trim()) {
      console.log('Ask Swiftly:', askInput.trim())
      setAskInput('')
      // TODO: Implement AI chat functionality
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Greeting Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
         className="text-center lg:text-left pt-0 pb-6 -mt-6"
      >
        {/* 
          Typography Fix: Added proper line-height and padding to prevent text clipping
          - leading-tight ensures descenders (g, y, p, q) are fully visible
          - py-text-4xl adds vertical padding to prevent container clipping
        */}
        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#111C59] to-[#4F5F73] bg-clip-text text-transparent mb-6 leading-tight py-text-4xl">
          {getGreeting()}, {isLoadingName ? (
            <span className="inline-block w-8 h-8 border-2 border-[#111C59]/20 border-t-[#111C59] rounded-full animate-spin"></span>
          ) : (
            userFullName
          )}
        </h1>
        <p className="text-xl text-[#4F5F73] max-w-2xl mx-auto lg:mx-0 leading-body py-text-xl">
          Here's what Swiftly can help you with today.
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
                         className="bg-white/95 backdrop-blur-sm rounded-xl border border-[#ADB3BD]/30 p-6 hover:shadow-xl hover:border-[#111C59]/30 transition-all duration-200 cursor-pointer group"
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
               <div className="p-2 bg-[#111C59]/5 rounded-lg">
                 {action.icon}
               </div>
               <ChevronRight className="w-5 h-5 text-[#4F5F73] group-hover:text-[#111C59] transition-colors duration-200" />
             </div>
             <h3 className="text-lg font-semibold text-[#0F1626] mb-2 leading-tight py-text-lg">
               {action.label}
             </h3>
             <p className="text-[#4F5F73] text-sm leading-body py-text-sm">
               {action.description}
             </p>
           </motion.div>
        ))}
      </motion.div>

      {/* Ask Swiftly Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="max-w-2xl mx-auto"
      >
                 <form onSubmit={handleAskSubmit} className="relative">
           <label htmlFor="ask-swiftly" className="sr-only">
             Ask Swiftly anything
           </label>
           <input
             id="ask-swiftly"
             type="text"
             value={askInput}
             onChange={(e) => setAskInput(e.target.value)}
             placeholder="Ask Swiftly to schedule, remind, or fetch notes..."
             className="w-full px-6 py-4 pr-32 text-lg border border-[#ADB3BD]/30 rounded-xl focus:ring-2 focus:ring-[#111C59] focus:border-[#111C59] transition-all duration-200 placeholder-[#4F5F73]/60 bg-white/95 backdrop-blur-sm"
             aria-describedby="ask-description"
           />
           <button
             type="submit"
             disabled={!askInput.trim()}
             className="absolute right-2 top-2 px-6 py-2 bg-gradient-to-r from-[#111C59] to-[#4F5F73] text-white font-semibold rounded-lg hover:from-[#0F1626] hover:to-[#111C59] focus:ring-2 focus:ring-[#111C59] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
           >
             Ask
           </button>
         </form>
         <p id="ask-description" className="text-sm text-[#4F5F73] text-center mt-2 leading-body py-text-sm">
           Press Enter to submit or click the Ask button
         </p>
      </motion.div>

             {/* Activity Feed Placeholder */}
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5, delay: 0.4 }}
         className="bg-white/95 backdrop-blur-sm rounded-xl border border-[#ADB3BD]/30 p-8 text-center shadow-lg"
       >
         <div className="max-w-md mx-auto">
           <div className="w-16 h-16 bg-[#111C59]/5 rounded-full flex items-center justify-center mx-auto mb-4">
             <MessageSquare className="w-8 h-8 text-[#4F5F73]" />
           </div>
           <h3 className="text-xl font-semibold text-[#0F1626] mb-2 leading-tight py-text-xl">
             Activity Feed Coming Soon
           </h3>
           <p className="text-[#4F5F73] leading-body py-text-base">
             Your recent activities, notifications, and insights will appear here.
           </p>
         </div>
       </motion.div>
    </div>
  )
}
