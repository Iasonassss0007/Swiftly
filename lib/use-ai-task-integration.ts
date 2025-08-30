/**
 * AI-Task Integration Hook
 * 
 * This hook provides seamless integration between AI chat and task management.
 * It ensures that tasks created via AI chat immediately appear in the tasks page
 * without any refresh needed.
 * 
 * Features:
 * - Real-time notifications when tasks are created via AI
 * - Automatic task list updates across all components
 * - Integration with instant loading cache system
 * - Cross-component state synchronization
 */

import { useState, useEffect, useRef } from 'react'
import { getTaskCache, Task } from './task-cache'

export interface AITaskNotification {
  id: string
  task: Task
  timestamp: Date
  shown: boolean
}

/**
 * Hook for AI-Task integration across the application
 */
export function useAITaskIntegration(userId?: string) {
  const [notifications, setNotifications] = useState<AITaskNotification[]>([])
  const cacheRef = useRef<ReturnType<typeof getTaskCache> | null>(null)
  const listenerSetupRef = useRef(false)

  // Initialize cache and set up listeners
  useEffect(() => {
    if (!userId || listenerSetupRef.current) return

    console.log('Setting up AI-Task integration for user:', userId)
    
    const cache = getTaskCache(userId)
    cacheRef.current = cache

    // Listen for cache updates (tasks created from AI)
    const handleCacheUpdate = () => {
      // This gets called whenever the cache is updated
      // We can use this to detect new tasks and show notifications
      console.log('Cache updated - checking for new AI-created tasks')
    }

    cache.addListener(handleCacheUpdate)
    listenerSetupRef.current = true

    return () => {
      if (cacheRef.current) {
        cacheRef.current.removeListener(handleCacheUpdate)
      }
      listenerSetupRef.current = false
    }
  }, [userId])

  /**
   * Add a notification for a newly created task
   */
  const addTaskNotification = (task: Task) => {
    const notification: AITaskNotification = {
      id: `notification_${task.id}_${Date.now()}`,
      task,
      timestamp: new Date(),
      shown: false
    }

    setNotifications(prev => [notification, ...prev.slice(0, 4)]) // Keep max 5 notifications
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, shown: true } : n)
      )
    }, 5000)
  }

  /**
   * Mark notification as read/dismissed
   */
  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  /**
   * Clear all notifications
   */
  const clearAllNotifications = () => {
    setNotifications([])
  }

  /**
   * Get unread notifications count
   */
  const unreadCount = notifications.filter(n => !n.shown).length

  return {
    notifications,
    unreadCount,
    addTaskNotification,
    dismissNotification,
    clearAllNotifications
  }
}

/**
 * Global event system for AI task creation
 * This allows components to communicate task creation events
 */
class AITaskEventEmitter {
  private listeners: Map<string, ((task: Task) => void)[]> = new Map()

  subscribe(userId: string, callback: (task: Task) => void) {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, [])
    }
    this.listeners.get(userId)!.push(callback)

    // Return unsubscribe function
    return () => {
      const userListeners = this.listeners.get(userId)
      if (userListeners) {
        const index = userListeners.indexOf(callback)
        if (index > -1) {
          userListeners.splice(index, 1)
        }
      }
    }
  }

  emit(userId: string, task: Task) {
    const userListeners = this.listeners.get(userId)
    if (userListeners) {
      userListeners.forEach(callback => {
        try {
          callback(task)
        } catch (error) {
          console.error('Error in AI task event listener:', error)
        }
      })
    }
  }
}

// Global instance for cross-component communication
export const aiTaskEvents = new AITaskEventEmitter()

/**
 * Hook to listen for AI task creation events
 */
export function useAITaskListener(userId?: string, onTaskCreated?: (task: Task) => void) {
  useEffect(() => {
    if (!userId || !onTaskCreated) return

    console.log('Setting up AI task listener for user:', userId)
    
    const unsubscribe = aiTaskEvents.subscribe(userId, onTaskCreated)
    
    return unsubscribe
  }, [userId, onTaskCreated])
}

/**
 * Function to emit task creation event (called from AI chat)
 */
export function emitTaskCreated(userId: string, task: Task) {
  console.log('Emitting task created event:', task.id)
  aiTaskEvents.emit(userId, task)
}
