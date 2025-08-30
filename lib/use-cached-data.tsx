'use client'

import { useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase'
import { getCacheKey } from './cache-provider'

// Types
export interface Task {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  dueDate: Date | null
  completed: boolean
  assignees: any[]
  tags?: string[]
  subtasks?: any[]
  attachments?: any[]
  comments?: any[]
}

interface SupabaseTask {
  id: string
  user_id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  completed: boolean
  tags?: string[]
  assignees?: any[]
  subtasks?: any[]
  attachments?: any[]
  comments?: any[]
  created_at: string
  updated_at: string
}

interface Profile {
  id: string
  full_name?: string
  email?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

// Transform functions
const transformSupabaseTask = (supabaseTask: SupabaseTask): Task => ({
  id: supabaseTask.id,
  title: supabaseTask.title,
  description: supabaseTask.description,
  priority: supabaseTask.priority,
  status: supabaseTask.status,
  dueDate: supabaseTask.due_date ? new Date(supabaseTask.due_date) : null,
  completed: supabaseTask.completed,
  assignees: supabaseTask.assignees || [],
  tags: supabaseTask.tags,
  subtasks: supabaseTask.subtasks || [],
  attachments: supabaseTask.attachments || [],
  comments: supabaseTask.comments || []
})

const transformToSupabaseTask = (task: Omit<Task, 'id'>, userId: string): Omit<SupabaseTask, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: userId,
  title: task.title,
  description: task.description,
  priority: task.priority,
  status: task.status,
  due_date: task.dueDate?.toISOString(),
  completed: task.completed,
  tags: task.tags,
  assignees: task.assignees,
  subtasks: task.subtasks || [],
  attachments: task.attachments || [],
  comments: task.comments || []
})

// Fetcher functions
const fetchTasks = async (userId: string): Promise<Task[]> => {
  try {
    console.log('Fetching tasks for user:', userId)
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw new Error(`Failed to load tasks: ${error.message}`)
    }

    console.log('Tasks fetched successfully:', data?.length || 0, 'tasks')
    return (data || []).map(transformSupabaseTask)
  } catch (error) {
    console.error('Unexpected error fetching tasks:', error)
    throw error
  }
}

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single() as any

  if (error) {
    console.error('Error fetching profile:', error)
    throw new Error(`Failed to load profile: ${error.message}`)
  }

  return data
}

const fetchSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error fetching session:', error)
    throw new Error(`Failed to get session: ${error.message}`)
  }
  
  return session
}

// Custom hooks

/**
 * Hook for managing tasks with caching and real-time updates
 * 
 * This hook provides:
 * - Automatic task fetching on mount and when userId changes
 * - Optimistic updates for better UX
 * - Real-time synchronization using Supabase subscriptions
 * - Error handling and retry logic
 * - Cache management with SWR
 * 
 * @param userId - The ID of the user whose tasks to fetch
 * @returns Object containing tasks data, loading state, error state, and CRUD operations
 */
export function useCachedTasks(userId?: string) {
  const { data, error, isLoading, mutate: mutateTasks } = useSWR(
    userId ? getCacheKey.tasks(userId) : null,
    userId ? () => fetchTasks(userId) : null,
    {
      revalidateOnFocus: false, // Don't revalidate tasks on window focus to avoid interrupting user work
      revalidateOnMount: true, // Always fetch tasks when component mounts
      dedupingInterval: 2 * 60 * 1000, // 2 minutes for tasks (more frequent updates)
      errorRetryCount: 3, // Retry failed requests up to 3 times
      errorRetryInterval: 1000, // Wait 1 second between retries
      onError: (error) => {
        console.error('SWR Tasks Error:', error)
      },
      onSuccess: (data) => {
        console.log('SWR Tasks Success:', data?.length || 0, 'tasks loaded')
      }
    }
  )

  // Set up real-time subscription for task changes
  useEffect(() => {
    if (!userId) return

    console.log('Setting up real-time subscription for user:', userId)
    
    const channel = supabase
      .channel(`tasks_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'api',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time task change detected:', payload)
          
          // Refresh the cache when tasks change
          mutateTasks()
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status)
      })

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription')
      supabase.removeChannel(channel)
    }
  }, [userId, mutateTasks])

  // CRUD Operations with optimistic updates
  // These functions update the UI immediately and then sync with the database
  
  /**
   * Add a new task with optimistic UI updates
   * The UI shows the new task immediately, then syncs with database
   */
  const addTask = async (newTask: Omit<Task, 'id'>) => {
    if (!userId) throw new Error('User ID required')
    
    // Optimistically update cache
    const optimisticTask: Task = {
      ...newTask,
      id: `temp-${Date.now()}`, // Temporary ID
    }
    
    await mutateTasks(
      async (currentTasks = []) => {
        // Make API call
        const supabaseTask = transformToSupabaseTask(newTask, userId)
        const { data, error } = await supabase
          .from('tasks')
          .insert([supabaseTask])
          .select()
          .single()

        if (error) throw error

        const transformedTask = transformSupabaseTask(data)
        return [transformedTask, ...currentTasks]
      },
      {
        optimisticData: [optimisticTask, ...(data || [])],
        rollbackOnError: true,
      }
    )
  }

  /**
   * Update an existing task with optimistic UI updates
   * The UI shows changes immediately, then syncs with database
   */
  const updateTask = async (taskId: string, updatedTask: Partial<Task>) => {
    if (!userId) throw new Error('User ID required')
    
    await mutateTasks(
      async (currentTasks = []) => {
        // Make API call
        const supabaseTask = transformToSupabaseTask(updatedTask as Omit<Task, 'id'>, userId)
        const { data, error } = await supabase
          .from('tasks')
          .update(supabaseTask)
          .eq('id', taskId)
          .select()
          .single()

        if (error) throw error

        const transformedTask = transformSupabaseTask(data)
        return currentTasks.map(task => task.id === taskId ? transformedTask : task)
      },
      {
        optimisticData: data?.map(task => 
          task.id === taskId ? { ...task, ...updatedTask } : task
        ),
        rollbackOnError: true,
      }
    )
  }

  /**
   * Delete a task with optimistic UI updates
   * The task disappears from UI immediately, then syncs with database
   */
  const deleteTask = async (taskId: string) => {
    await mutateTasks(
      async (currentTasks = []) => {
        // Make API call
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId)

        if (error) throw error

        return currentTasks.filter(task => task.id !== taskId)
      },
      {
        optimisticData: data?.filter(task => task.id !== taskId),
        rollbackOnError: true,
      }
    )
  }

  /**
   * Manually refresh tasks from database
   * Useful for troubleshooting or forcing a refresh
   */
  const refreshTasks = () => mutateTasks()

  return {
    tasks: data || [],
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    refreshTasks,
  }
}

export function useCachedProfile(userId?: string) {
  const { data, error, isLoading, mutate: mutateProfile } = useSWR(
    userId ? getCacheKey.profile(userId) : null,
    userId ? () => fetchProfile(userId) : null,
    {
      dedupingInterval: 10 * 60 * 1000, // 10 minutes (profile changes less frequently)
    }
  )

  const refreshProfile = () => mutateProfile()

  return {
    profile: data,
    isLoading,
    error,
    refreshProfile,
  }
}

export function useCachedSession() {
  const { data, error, isLoading, mutate: mutateSession } = useSWR(
    getCacheKey.session(),
    fetchSession,
    {
      dedupingInterval: 1 * 60 * 1000, // 1 minute (check session more frequently)
      revalidateOnFocus: true, // Check session when window gains focus
    }
  )

  const refreshSession = () => mutateSession()

  return {
    session: data,
    isLoading,
    error,
    refreshSession,
  }

}

// Global cache refresh function
export function refreshAllCaches(userId?: string) {
  if (userId) {
    mutate(getCacheKey.tasks(userId))
    mutate(getCacheKey.profile(userId))
  }
  mutate(getCacheKey.session())
}

// Cache invalidation helpers
export function invalidateTasksCache(userId: string) {
  mutate(getCacheKey.tasks(userId))
}

export function invalidateProfileCache(userId: string) {
  mutate(getCacheKey.profile(userId))
}

export function invalidateSessionCache() {
  mutate(getCacheKey.session())
}

