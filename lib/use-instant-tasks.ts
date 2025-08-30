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

  /**
   * Initialize cache and load tasks instantly
   */
  useEffect(() => {
    if (!userId) {
      setTasks([])
      return
    }

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
      const updatedTasks = cache.getCachedTasks()
      setTasks(updatedTasks)
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
      startBackgroundSync()
    }

    // Cleanup function
    return () => {
      cache.removeListener(handleCacheUpdate)
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
          console.log('Real-time task change detected:', payload.eventType, payload.new?.id)
          
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
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false
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
      const addedTask = await cacheRef.current.addTask(newTask)
      console.log('Task added successfully:', addedTask.id)
      return addedTask
    } catch (err) {
      console.error('Error adding task:', err)
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
      const updatedTask = await cacheRef.current.updateTask(taskId, updates)
      console.log('Task updated successfully:', taskId)
      return updatedTask
    } catch (err) {
      console.error('Error updating task:', err)
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
      await cacheRef.current.deleteTask(taskId)
      console.log('Task deleted successfully:', taskId)
    } catch (err) {
      console.error('Error deleting task:', err)
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
