'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

import type { Profile } from '@/lib/supabaseAdmin'
import {
  Home,
  ListChecks,
  Calendar,
  MessageSquare,
  Plug,
  CreditCard,
  User,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Settings,
  LogOut
} from './icons'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string
    memberSince?: string
  }
  onLogout: () => void
}

export default function Sidebar({ collapsed, onToggleCollapsed, user, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set())
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  // Use immediate user data for instant loading
  const userFullName = user.name || 'User'
  const userEmail = user.email || ''

  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      href: '/dashboard',
      icon: <Home className="w-4 h-4" />
    },
    {
      id: 'tasks',
      label: 'Tasks',
      href: '/dashboard/tasks',
      icon: <ListChecks className="w-4 h-4" />
    },
    {
      id: 'calendar',
      label: 'Calendar',
      href: '/dashboard/calendar',
      icon: <Calendar className="w-4 h-4" />,
      subItems: [
        { id: 'events', label: 'Events', href: '/dashboard/calendar/events', icon: <Calendar className="w-3 h-3" /> },
        { id: 'meetings', label: 'Meetings', href: '/dashboard/calendar/meetings', icon: <Calendar className="w-3 h-3" /> }
      ]
    },
    {
      id: 'ai',
      label: 'Swiftly AI',
      href: '/dashboard/ai',
      icon: <MessageSquare className="w-4 h-4" />
    },
    {
      id: 'integrations',
      label: 'Integrations',
      href: '/dashboard/integrations',
      icon: <Plug className="w-4 h-4" />
    },
    {
      id: 'billing',
      label: 'Billing',
      href: '/dashboard/billing',
      icon: <CreditCard className="w-4 h-4" />
    }
  ]

  const toggleAccordion = (itemId: string) => {
    const newOpenAccordions = new Set(openAccordions)
    if (newOpenAccordions.has(itemId)) {
      newOpenAccordions.delete(itemId)
    } else {
      newOpenAccordions.add(itemId)
    }
    setOpenAccordions(newOpenAccordions)
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = () => {
    // Use the real logout function passed from parent
    onLogout()
  }

  // Handle clicks outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

  return (
    <motion.aside
      initial={{ width: collapsed ? 56 : 220 }}
      animate={{ width: collapsed ? 56 : 220 }}
      transition={{ 
        type: "spring",
        damping: 30,
        stiffness: 300,
        mass: 0.8,
        duration: 0.6
      }}
      className="bg-white/95 backdrop-blur-sm border-r border-[#ADB3BD]/30 flex flex-col h-full shadow-lg"
    >
      {/* Logo Area */}
      <div className={`h-16 flex items-center border-b border-[#ADB3BD]/30 relative ${collapsed ? 'group justify-center' : 'justify-between'}`}>
        {/* Logo - Normal state when expanded, disappears on hover when collapsed */}
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ 
                opacity: 0,
                transition: { duration: 0, delay: 0 }
              }}
              transition={{ 
                duration: 0.3,
                ease: "easeOut",
                delay: 0.2
              }}
              className="flex items-center justify-between w-full px-4"
            >
              <Link 
                href="/dashboard" 
                className="text-xl font-bold bg-gradient-to-r from-[#111C59] to-[#4F5F73] bg-clip-text text-transparent"
              >
                Swiftly
              </Link>
              {/* Toggle Button for Expanded State - Always visible in corner */}
              <button
                onClick={onToggleCollapsed}
                className="p-1.5 rounded-md text-[#4F5F73] hover:text-[#111C59] hover:bg-[#111C59]/5 transition-all duration-200 flex-shrink-0"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4 transition-transform duration-200" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <>
            {/* Logo S - Disappears on Hover in Collapsed State */}
            <div className="w-8 h-8 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-lg flex items-center justify-center shadow-lg transition-opacity duration-200 group-hover:opacity-0">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            
            {/* Toggle Button for Collapsed State - Appears on Hover */}
            <button
              onClick={onToggleCollapsed}
              className="absolute inset-0 flex items-center justify-center p-1.5 rounded-md text-[#4F5F73] hover:text-[#111C59] hover:bg-[#111C59]/5 transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label="Expand sidebar"
            >
              <ChevronLeft className="w-4 h-4 transition-transform duration-200 rotate-180" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navigationItems.map((item, index) => (
          <div key={item.id}>
            {item.subItems ? (
              <div>
                <button
                  onClick={() => toggleAccordion(item.id)}
                  className={`w-full flex items-center ${collapsed ? 'justify-center px-1 py-2' : 'justify-between pl-2 pr-3 py-2'} rounded-md text-sm font-medium transition-all duration-300 ease-in-out ${
                    isActive(item.href)
                      ? 'bg-[#111C59]/10 text-[#111C59] border border-[#111C59]/20'
                      : 'text-[#0F1626] hover:bg-[#111C59]/5 hover:text-[#111C59]'
                  }`}
                  aria-expanded={openAccordions.has(item.id)}
                  aria-controls={`submenu-${item.id}`}
                  title={collapsed ? item.label : undefined}
                >
                  {collapsed ? (
                    <span className="flex-shrink-0">{item.icon}</span>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <span className="flex-shrink-0">{item.icon}</span>
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{
                                opacity: 0,
                                transition: { duration: 0, delay: 0 }
                              }}
                              transition={{ 
                                duration: 0.3,
                                ease: "easeOut",
                                delay: 0.2
                              }}
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${
                          openAccordions.has(item.id) ? 'rotate-90' : ''
                        }`}
                      />
                    </>
                  )}
                </button>
                
                <AnimatePresence>
                  {openAccordions.has(item.id) && !collapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      id={`submenu-${item.id}`}
                      className="ml-6 mt-2 space-y-2"
                    >
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.id}
                          href={subItem.href}
                          className={`block pl-2 pr-4 py-2 rounded-md text-sm ${
                            isActive(subItem.href)
                              ? 'bg-[#111C59]/10 text-[#111C59] border border-[#111C59]/20'
                              : 'text-[#4F5F73] hover:bg-[#111C59]/5 hover:text-[#111C59]'
                          }`}
                          aria-label={`${subItem.label} submenu item`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="flex-shrink-0">{item.icon}</span>
                            <span>{subItem.label}</span>
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href={item.href}
                className={`flex items-center ${collapsed ? 'justify-center px-1 py-2' : 'pl-2 pr-3 py-2'} rounded-md text-sm font-medium transition-all duration-300 ease-in-out ${
                  isActive(item.href)
                    ? 'bg-[#111C59]/10 text-[#111C59] border border-[#111C59]/20'
                    : 'text-[#0F1626] hover:bg-[#111C59]/5 hover:text-[#111C59]'
                }`}
                aria-label={item.label}
                aria-current={isActive(item.href) ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ 
                        opacity: 0,
                        transition: { duration: 0, delay: 0 }
                      }}
                      transition={{ 
                        duration: 0.3,
                        ease: "easeOut",
                        delay: 0.2
                      }}
                      className="ml-2"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Profile Section */}
      <div className="border-t border-[#ADB3BD]/30 p-2 mt-3">
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-1 py-2' : 'pl-2 pr-2 py-2'} rounded-md text-xs font-medium text-[#0F1626] hover:bg-[#111C59]/5 hover:text-[#111C59] transition-colors duration-200`}
            aria-expanded={profileDropdownOpen}
            aria-haspopup="true"
            title={collapsed ? userFullName : undefined}
          >
            <span className="flex-shrink-0">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={userFullName}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <div className="w-7 h-7 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-medium text-xs">
                    {getUserInitials(userFullName)}
                  </span>
                </div>
              )}
            </span>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ 
                    opacity: 0,
                    transition: { duration: 0, delay: 0 }
                  }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeOut",
                    delay: 0.2
                  }}
                  className="flex-1 text-left flex items-center justify-between ml-2"
                >
                  <div className="flex-1 pr-1">
                    <p className="text-xs font-semibold text-[#0F1626] leading-tight break-words">
                      {userFullName}
                    </p>
                    <p className="text-xs text-[#4F5F73] leading-tight mt-0.5 break-all opacity-75">
                      {userEmail}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#4F5F73] flex-shrink-0" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 backdrop-blur-sm border border-[#ADB3BD]/30 rounded-md shadow-xl z-50"
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      router.push('/dashboard/settings')
                      setProfileDropdownOpen(false)
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-[#0F1626] hover:bg-[#111C59]/5"
                  >
                    <Settings className="w-4 h-4 mr-3 text-[#4F5F73]" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      handleLogout()
                      setProfileDropdownOpen(false)
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-[#0F1626] hover:bg-[#111C59]/5"
                  >
                    <LogOut className="w-4 h-4 mr-3 text-gray-400" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}
