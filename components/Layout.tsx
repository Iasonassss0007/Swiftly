'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import { LayoutProps } from '@/types'
import { useAuth } from '@/lib/auth-context'

export default function Layout({ children, user }: LayoutProps) {
  const router = useRouter()
  const { signOut } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize with saved state immediately to prevent layout shift
    if (typeof window !== 'undefined') {
      try {
        const savedCollapsedState = localStorage.getItem('swiftly-sidebar-collapsed')
        return savedCollapsedState !== null ? JSON.parse(savedCollapsedState) : false
      } catch (error) {
        console.warn('Failed to load sidebar state from localStorage:', error)
        return false
      }
    }
    return false
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-collapse on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setSidebarCollapsed(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle logout - use the auth context signOut function with auth redirect
  const handleLogout = async () => {
    await signOut('/auth')
  }

  // Handle sidebar collapse for desktop
  const handleToggleCollapsed = () => {
    const newCollapsedState = !sidebarCollapsed
    setSidebarCollapsed(newCollapsedState)
    // Save to localStorage to persist across page navigation
    try {
      localStorage.setItem('swiftly-sidebar-collapsed', JSON.stringify(newCollapsedState))
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error)
    }
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
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen bg-[#F8FAFC] font-libre-franklin">
        {/* Desktop Sidebar - Fixed Position */}
        <div className="fixed left-0 top-0 h-full z-30 sidebar">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapsed={handleToggleCollapsed}
            user={user}
            onLogout={handleLogout}
          />
        </div>

        {/* Main Content - Perfectly aligned with sidebar */}
        <main 
          className={`flex-1 overflow-auto bg-[#F8FAFC] transition-all duration-300 ease-out ${
            sidebarCollapsed 
              ? 'ml-[56px]' 
              : 'ml-[220px]'
          }`}
        >
          {children}
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-screen bg-[#F8FAFC] font-libre-franklin">
        {/* Mobile Header with Hamburger Menu */}
        <div className="flex items-center justify-between p-4 bg-white/95 backdrop-blur-sm border-t border-[#ADB3BD]/30 order-last">
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

        {/* Mobile Main Content */}
        <main className="flex-1 overflow-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <>
            {/* Enhanced Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.25, 
                ease: [0.4, 0.0, 0.2, 1] // Custom cubic-bezier for smooth fade
              }}
              className="fixed inset-0 bg-black/30 backdrop-blur-md z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Enhanced Mobile Sidebar */}
            <motion.div
              initial={{
                x: sidebarCollapsed ? -56 : -220,
                opacity: 0,
                scale: 0.95
              }}
              animate={{
                x: 0,
                opacity: 1,
                scale: 1
              }}
              exit={{
                x: sidebarCollapsed ? -56 : -220,
                opacity: 0,
                scale: 0.95
              }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
                mass: 0.8,
                duration: 0.4
              }}
              className="fixed left-0 top-0 h-full bg-white/98 backdrop-blur-xl border-r border-[#ADB3BD]/20 z-50 lg:hidden sidebar shadow-2xl"
              style={{ width: sidebarCollapsed ? 56 : 220 }}
            >
              <Sidebar
                collapsed={sidebarCollapsed}
                onToggleCollapsed={handleToggleCollapsed}
                user={user}
                onLogout={handleLogout}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
