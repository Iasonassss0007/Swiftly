'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import { LayoutProps } from '@/types'

export default function Layout({ children, user }: LayoutProps) {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Handle logout - redirect to home
  const handleLogout = () => {
    router.push('/auth')
  }

  // Handle sidebar collapse for desktop
  const handleToggleCollapsed = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Handle sidebar toggle for mobile
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (sidebarOpen && !target.closest('.sidebar') && !target.closest('.mobile-menu-button')) {
        setSidebarOpen(false)
      }
    }

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarOpen])

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [router])



  return (
    <div className="h-screen flex bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block sidebar">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={handleToggleCollapsed}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Mobile Sidebar */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed left-0 top-0 h-full w-70 bg-white/95 backdrop-blur-sm border-r border-[#ADB3BD]/30 z-50 lg:hidden sidebar shadow-2xl"
            >
              <Sidebar
                collapsed={false}
                onToggleCollapsed={() => {}}
                user={user}
                onLogout={handleLogout}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Hamburger Menu */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white/95 backdrop-blur-sm border-b border-[#ADB3BD]/30">
          <button
            onClick={handleToggleSidebar}
            className="mobile-menu-button p-2 rounded-lg text-[#4F5F73] hover:text-[#111C59] hover:bg-[#111C59]/5 transition-all duration-200"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-lg font-semibold text-[#0F1626]">Dashboard</div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  )
}
