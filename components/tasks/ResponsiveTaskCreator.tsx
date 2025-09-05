'use client'

import { useState, useEffect } from 'react'
import { Task } from './TaskRow'
import InnovativeTaskCreator from './InnovativeTaskCreator'
import MobileTaskCreator from './MobileTaskCreator'

interface ResponsiveTaskCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: Omit<Task, 'id'>) => void
  onUpdate?: (task: Task) => void
  editTask?: Task | null
  initialStatus?: Task['status']
  availableUsers: Array<{
    id: string
    name: string
    email: string
  }>
  availableTags: string[]
}

export default function ResponsiveTaskCreator(props: ResponsiveTaskCreatorProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Use mobile version for small screens
  if (isMobile) {
    return <MobileTaskCreator {...props} />
  }

  // Use desktop version for larger screens
  return <InnovativeTaskCreator {...props} />
}

