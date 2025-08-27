'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabaseClient'
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
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set())
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [userFullName, setUserFullName] = useState(user.name)
  const [userEmail, setUserEmail] = useState(user.email)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  // Fetch user's real profile data from profiles table on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user.id) return
      
      setIsLoadingProfile(true)
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single() as { data: Pick<Profile, 'full_name' | 'email'> | null, error: any }

        if (error) {
          console.error('Error fetching user profile in sidebar:', error)
          // Keep the fallback data from props
          return
        }

        if (profile?.full_name) {
          setUserFullName(profile.full_name)
        }
        
        if (profile?.email) {
          setUserEmail(profile.email)
        }
      } catch (error) {
        console.error('Unexpected error fetching user profile in sidebar:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    // Always fetch to ensure we have the latest data
    fetchUserProfile()
  }, [user.id])

  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      href: '/dashboard',
      icon: <Home className="w-5 h-5" />
    },
    {
      id: 'tasks',
      label: 'Tasks',
      href: '/dashboard/tasks',
      icon: <ListChecks className="w-5 h-5" />,
      subItems: [
        { id: 'my-tasks', label: 'My Tasks', href: '/dashboard/tasks/my', icon: <ListChecks className="w-4 h-4" /> },
        { id: 'team-tasks', label: 'Team Tasks', href: '/dashboard/tasks/team', icon: <ListChecks className="w-4 h-4" /> }
      ]
    },
    {
      id: 'calendar',
      label: 'Calendar',
      href: '/dashboard/calendar',
      icon: <Calendar className="w-5 h-5" />,
      subItems: [
        { id: 'events', label: 'Events', href: '/dashboard/calendar/events', icon: <Calendar className="w-4 h-4" /> },
        { id: 'meetings', label: 'Meetings', href: '/dashboard/calendar/meetings', icon: <Calendar className="w-4 h-4" /> }
      ]
    },
    {
      id: 'ai',
      label: 'AI Chat',
      href: '/dashboard/ai',
      icon: <MessageSquare className="w-5 h-5" />
    },
    {
      id: 'integrations',
      label: 'Integrations',
      href: '/dashboard/integrations',
      icon: <Plug className="w-5 h-5" />
    },
    {
      id: 'billing',
      label: 'Billing',
      href: '/dashboard/billing',
      icon: <CreditCard className="w-5 h-5" />
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
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="bg-white/95 backdrop-blur-sm border-r border-[#ADB3BD]/30 flex flex-col h-full shadow-lg"
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-[#ADB3BD]/30">
        {!collapsed && (
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-[#111C59] to-[#4F5F73] bg-clip-text text-transparent">
            Swiftly
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">S</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-6 space-y-3">
        {navigationItems.map((item) => (
          <div key={item.id}>
            {item.subItems ? (
              <div>
                <button
                  onClick={() => toggleAccordion(item.id)}
                  className={`w-full flex items-center justify-between pl-2 pr-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-[#111C59]/10 text-[#111C59] border border-[#111C59]/20'
                      : 'text-[#0F1626] hover:bg-[#111C59]/5 hover:text-[#111C59]'
                  }`}
                  aria-expanded={openAccordions.has(item.id)}
                  aria-controls={`submenu-${item.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-200 ${
                        openAccordions.has(item.id) ? 'rotate-90' : ''
                      }`}
                    />
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
                          className={`block pl-2 pr-4 py-2 rounded-md text-sm transition-colors duration-200 ${
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
                className={`flex items-center pl-2 pr-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'bg-[#111C59]/10 text-[#111C59] border border-[#111C59]/20'
                    : 'text-[#0F1626] hover:bg-[#111C59]/5 hover:text-[#111C59]'
                }`}
                aria-label={item.label}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Profile Section */}
      <div className="border-t border-[#ADB3BD]/30 p-3 mt-4">
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-full flex items-center space-x-3 pl-2 pr-4 py-3 rounded-md text-sm font-medium text-[#0F1626] hover:bg-[#111C59]/5 hover:text-[#111C59] transition-colors duration-200"
            aria-expanded={profileDropdownOpen}
            aria-haspopup="true"
          >
            <span className="flex-shrink-0">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={userFullName}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-medium text-sm">
                    {isLoadingProfile ? '...' : getUserInitials(userFullName)}
                  </span>
                </div>
              )}
            </span>
            {!collapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {isLoadingProfile ? 'Loading...' : userFullName}
                  </p>
                  <p className="text-xs text-gray-500 truncate" title={userEmail}>
                    {isLoadingProfile ? 'Loading...' : userEmail}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </>
            )}
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
                      // TODO: Navigate to settings page
                      setProfileDropdownOpen(false)
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-[#0F1626] hover:bg-[#111C59]/5 transition-colors duration-200"
                  >
                    <Settings className="w-4 h-4 mr-3 text-[#4F5F73]" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      handleLogout()
                      setProfileDropdownOpen(false)
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-[#0F1626] hover:bg-[#111C59]/5 transition-colors duration-200"
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
