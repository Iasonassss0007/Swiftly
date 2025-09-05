/**
 * useInstantTasks Hook
 * 
 * Provides instant task loading with background synchronization.
 * Tasks appear immediately from cache, then sync with database in background.
 * 
 * Features:
 * - Zero loading states for users
 * - Instant task display on page load
 * - Background database synchronization
 * - Real-time updates via Supabase subscriptions
 * - Optimistic updates for immediate feedback
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getTaskCache, Task, TaskCache } from './task-cache'
import { supabase } from './supabase'

interface UseInstantTasksReturn {
  tasks: Task[]
  isBackgroundSyncing: boolean
  error: Error | null
  addTask: (task: Omit<Task, 'id'>) => Promise<Task>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task>
  deleteTask: (taskId: string) => Promise<void>
  refreshTasks: () => Promise<void>
  clearCache: () => void
  cleanupTempTasks: () => void
}

/**
 * Custom hook for instant task management with caching
 */
export function useInstantTasks(userId?: string): UseInstantTasksReturn {
  // State management
  const [tasks, setTasks] = useState<Task[]>([])
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Refs for cleanup and preventing race conditions
  const cacheRef = useRef<TaskCache | null>(null)
  const subscriptionRef = useRef<any>(null)
  const mountedRef = useRef(true)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  /**
   * Initialize cache and load tasks instantly
   */
  useEffect(() => {
    if (!userId) {
      setTasks([])
      return
    }

    try {
      console.log('Initializing instant tasks for user:', userId)
      
      // Get cache instance
      const cache = getTaskCache(userId)
      cacheRef.current = cache

      // Load cached tasks immediately (no loading state!)
      const cachedTasks = cache.getCachedTasks()
      setTasks(cachedTasks)
      console.log(`Instantly loaded ${cachedTasks.length} cached tasks`)

      // Set up cache listener for updates
      const handleCacheUpdate = () => {
        if (!mountedRef.current) return
        try {
          const updatedTasks = cache.getCachedTasks()
          console.log('🔄 [HOOK] Cache updated, refreshing tasks. New count:', updatedTasks.length)
          console.log('🔄 [HOOK] Updated task IDs:', updatedTasks.map(t => t.id))
          setTasks(updatedTasks)
          console.log('🔄 [HOOK] ✅ React state updated with new tasks')
        } catch (error) {
          console.error('Error in cache update handler:', error)
        }
      }

      cache.addListener(handleCacheUpdate)

      // Start background sync if cache is old or empty
      const startBackgroundSync = async () => {
        if (!mountedRef.current) return
        
        try {
          setIsBackgroundSyncing(true)
          setError(null)
          
          // Only show syncing indicator if we have cached tasks
          // This prevents loading states when cache is empty
          const shouldShowSyncing = cachedTasks.length > 0
          if (!shouldShowSyncing) setIsBackgroundSyncing(false)
          
          await cache.backgroundSync()
          
          if (mountedRef.current) {
            setIsBackgroundSyncing(false)
          }
        } catch (err) {
          console.error('Background sync failed:', err)
          if (mountedRef.current) {
            setError(err instanceof Error ? err : new Error('Background sync failed'))
            setIsBackgroundSyncing(false)
          }
        }
      }

      // Start background sync immediately if cache is stale or empty
      if (cache.needsRefresh() || cachedTasks.length === 0) {
        // Use force sync for empty cache to ensure instant loading
        if (cachedTasks.length === 0) {
          console.log('🚀 [INSTANT LOAD] Cache is empty, force syncing for instant loading...')
          cache.forceSync().catch(console.error)
        } else {
          startBackgroundSync()
        }
      }

      // Cleanup function
      return () => {
        cache.removeListener(handleCacheUpdate)
      }
    } catch (error) {
      console.error('Error initializing instant tasks:', error)
      setError(error instanceof Error ? error : new Error('Failed to initialize tasks'))
    }
  }, [userId])

  /**
   * Set up real-time subscription for live updates
   */
  useEffect(() => {
    if (!userId || !cacheRef.current) return

    console.log('Setting up real-time subscription for user:', userId)
    
    const channel = supabase
      .channel(`instant_tasks_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'api',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time task change detected:', payload.eventType, (payload.new as any)?.id)
          
          // Trigger background sync to update cache
          if (cacheRef.current && mountedRef.current) {
            cacheRef.current.backgroundSync().catch(console.error)
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status)
      })

    subscriptionRef.current = channel

    // Cleanup subscription
    return () => {
      if (subscriptionRef.current) {
        console.log('Cleaning up real-time subscription')
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [userId])

  /**
   * Set up automatic background sync on various triggers
   */
  useEffect(() => {
    if (!userId || !cacheRef.current) return

    console.log('Setting up automatic background sync for user:', userId)

    // Background sync function
    const performBackgroundSync = async () => {
      if (!mountedRef.current || !cacheRef.current) return
      
      try {
        console.log('🔄 [AUTO SYNC] Starting automatic background sync')
        await cacheRef.current.backgroundSync()
        console.log('✅ [AUTO SYNC] Background sync completed successfully')
      } catch (error) {
        console.error('❌ [AUTO SYNC] Background sync failed:', error)
      }
    }

    // 1. Periodic sync every 30 seconds when page is active
    const startPeriodicSync = () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
      
      syncIntervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible' && mountedRef.current) {
          performBackgroundSync()
        }
      }, 30000) // 30 seconds
    }

    // 2. Sync on page visibility change (tab focus/blur) - use force sync for immediate updates
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        console.log('👁️ [AUTO SYNC] Page became visible, force syncing...')
        if (cacheRef.current) {
          cacheRef.current.forceSync().catch(console.error)
        }
      }
    }

    // 3. Sync on window focus/blur - use force sync for immediate updates
    const handleWindowFocus = () => {
      if (mountedRef.current) {
        console.log('🎯 [AUTO SYNC] Window focused, force syncing...')
        if (cacheRef.current) {
          cacheRef.current.forceSync().catch(console.error)
        }
      }
    }

    // 4. Sync on network reconnection - use force sync for immediate updates
    const handleOnline = () => {
      if (mountedRef.current) {
        console.log('🌐 [AUTO SYNC] Network reconnected, force syncing...')
        if (cacheRef.current) {
          cacheRef.current.forceSync().catch(console.error)
        }
      }
    }

    // 5. Sync on user activity (scroll, click, keypress)
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now()
      
      // Debounced sync on user activity (sync after 5 seconds of inactivity)
      setTimeout(() => {
        if (Date.now() - lastActivityRef.current >= 5000 && mountedRef.current) {
          console.log('👆 [AUTO SYNC] User activity detected, syncing...')
          performBackgroundSync()
        }
      }, 5000)
    }

    // Start periodic sync
    startPeriodicSync()

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)
    window.addEventListener('online', handleOnline)
    document.addEventListener('scroll', handleUserActivity, { passive: true })
    document.addEventListener('click', handleUserActivity, { passive: true })
    document.addEventListener('keypress', handleUserActivity, { passive: true })

    // Cleanup function
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = null
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('scroll', handleUserActivity)
      document.removeEventListener('click', handleUserActivity)
      document.removeEventListener('keypress', handleUserActivity)
    }
  }, [userId])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = null
      }
    }
  }, [])

  /**
   * Add new task with optimistic update
   */
  const addTask = useCallback(async (newTask: Omit<Task, 'id'>): Promise<Task> => {
    if (!cacheRef.current) {
      throw new Error('Cache not initialized')
    }

    try {
      setError(null)
      
      // Create optimistic task immediately for instant UI feedback
      const optimisticTask: Task = {
        ...newTask,
        id: `temp_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Update React state immediately with optimistic task
      setTasks(prevTasks => [optimisticTask, ...prevTasks])
      console.log('🔄 [HOOK] Added optimistic task immediately:', optimisticTask.id)
      
      // Now save to cache/database
      const addedTask = await cacheRef.current.addTask(newTask)
      console.log('✅ [HOOK] Task saved to database successfully:', addedTask.id)
      
      // Replace optimistic task with real task
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === optimisticTask.id ? addedTask : task
        )
      )
      console.log('🔄 [HOOK] Replaced optimistic task with real task:', addedTask.id)
      
      return addedTask
    } catch (err) {
      console.error('❌ [HOOK] Error adding task:', err)
      
      // Remove optimistic task on error
      setTasks(prevTasks => 
        prevTasks.filter(task => !task.id.startsWith('temp_'))
      )
      
      const error = err instanceof Error ? err : new Error('Failed to add task')
      setError(error)
      throw error
    }
  }, [])

  /**
   * Update existing task with optimistic update
   */
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    if (!cacheRef.current) {
      throw new Error('Cache not initialized')
    }

    try {
      setError(null)
      
      // Optimistically update UI immediately
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, ...updates, updated_at: new Date().toISOString() }
            : task
        )
      )
      console.log('🔄 [HOOK] Updated task optimistically in UI:', taskId)
      
      // Now save to cache/database
      const updatedTask = await cacheRef.current.updateTask(taskId, updates)
      console.log('✅ [HOOK] Task updated in database successfully:', taskId)
      
      // Update with final result from database
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? updatedTask : task
        )
      )
      
      return updatedTask
    } catch (err) {
      console.error('❌ [HOOK] Error updating task:', err)
      
      // Revert optimistic update on error
      if (cacheRef.current) {
        const currentTasks = cacheRef.current.getCachedTasks()
        setTasks(currentTasks)
      }
      
      const error = err instanceof Error ? err : new Error('Failed to update task')
      setError(error)
      throw error
    }
  }, [])

  /**
   * Delete task with optimistic update
   */
  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    if (!cacheRef.current) {
      throw new Error('Cache not initialized')
    }

    try {
      setError(null)
      console.log('🗑️ [HOOK] Starting task deletion for:', taskId)
      
      // Optimistically remove from UI immediately
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
      console.log('🔄 [HOOK] Removed task optimistically from UI:', taskId)
      
      // Now delete from cache/database
      await cacheRef.current.deleteTask(taskId)
      console.log('✅ [HOOK] Task deleted from database successfully:', taskId)
      
    } catch (err) {
      console.error('❌ [HOOK] Error deleting task:', err)
      
      // Revert optimistic deletion on error
      if (cacheRef.current) {
        const currentTasks = cacheRef.current.getCachedTasks()
        setTasks(currentTasks)
      }
      
      const error = err instanceof Error ? err : new Error('Failed to delete task')
      setError(error)
      throw error
    }
  }, [])

  /**
   * Manually refresh tasks from database
   */
  const refreshTasks = useCallback(async (): Promise<void> => {
    if (!cacheRef.current) return

    try {
      setError(null)
      setIsBackgroundSyncing(true)
      await cacheRef.current.backgroundSync()
      setIsBackgroundSyncing(false)
      console.log('Tasks refreshed successfully')
    } catch (err) {
      console.error('Error refreshing tasks:', err)
      const error = err instanceof Error ? err : new Error('Failed to refresh tasks')
      setError(error)
      setIsBackgroundSyncing(false)
      throw error
    }
  }, [])

  /**
   * Clear local cache
   */
  const clearCache = useCallback((): void => {
    if (cacheRef.current) {
      cacheRef.current.clearCache()
      setTasks([])
      console.log('Cache cleared')
    }
  }, [])
  
  /**
   * Clean up any stale temporary tasks (tasks with temp_ IDs)
   * This can happen if there was an error during task creation
   */
  const cleanupTempTasks = useCallback((): void => {
    if (cacheRef.current) {
      const currentTasks = cacheRef.current.getCachedTasks()
      const tempTasks = currentTasks.filter(task => task.id.startsWith('temp_'))
      
      if (tempTasks.length > 0) {
        console.log('Found stale temporary tasks, cleaning up:', tempTasks.length)
        const cleanTasks = currentTasks.filter(task => !task.id.startsWith('temp_'))
        cacheRef.current.setCachedTasks(cleanTasks)
      }
    }
  }, [])

  return {
    tasks,
    isBackgroundSyncing,
    error,
    addTask,
    updateTask,
    deleteTask,
    refreshTasks,
    clearCache,
    cleanupTempTasks
  }
}
