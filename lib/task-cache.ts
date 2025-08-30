/**
 * Task Cache Management System
 * 
 * This module provides instant task loading using localStorage caching
 * with background synchronization from Supabase database.
 * 
 * Features:
 * - Instant task display on page load (no loading states)
 * - Background sync with database for real-time updates
 * - Automatic cache invalidation and refresh
 * - Multi-user support with user-specific caching
 * - Optimistic updates for immediate UI feedback
 */

import { supabase } from '@/lib/supabase'

// Task interface matching the database schema
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
  created_at?: string
  updated_at?: string
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

interface CacheData {
  tasks: Task[]
  lastUpdated: number
  userId: string
}

/**
 * Transform Supabase task to client task format
 */
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
  comments: supabaseTask.comments || [],
  created_at: supabaseTask.created_at,
  updated_at: supabaseTask.updated_at
})

/**
 * Transform client task to Supabase format
 */
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

/**
 * Task Cache Manager Class
 * Handles all caching operations for tasks
 */
export class TaskCache {
  private cacheKey: string
  private userId: string
  private listeners: Set<() => void> = new Set()

  constructor(userId: string) {
    this.userId = userId
    this.cacheKey = `swiftly_tasks_${userId}`
  }

  /**
   * Get cache key for the current user
   */
  private getCacheKey(): string {
    return this.cacheKey
  }

  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const test = 'test'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get cached tasks for instant display
   * Returns empty array if no cache exists
   */
  getCachedTasks(): Task[] {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage not available, cannot load cached tasks')
      return []
    }

    try {
      const cached = localStorage.getItem(this.getCacheKey())
      if (!cached) {
        console.log('No cached tasks found for user:', this.userId)
        return []
      }

      const cacheData: CacheData = JSON.parse(cached)
      
      // Verify cache is for the correct user
      if (cacheData.userId !== this.userId) {
        console.log('Cache user mismatch, clearing cache')
        this.clearCache()
        return []
      }

      // Convert date strings back to Date objects
      const tasks = cacheData.tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : null
      }))

      console.log(`Loaded ${tasks.length} cached tasks for user:`, this.userId)
      return tasks
    } catch (error) {
      console.error('Error loading cached tasks:', error)
      this.clearCache()
      return []
    }
  }

  /**
   * Save tasks to cache
   */
  setCachedTasks(tasks: Task[]): void {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage not available, cannot cache tasks')
      return
    }

    try {
      const cacheData: CacheData = {
        tasks,
        lastUpdated: Date.now(),
        userId: this.userId
      }

      localStorage.setItem(this.getCacheKey(), JSON.stringify(cacheData))
      console.log(`💾 [CACHE UPDATE] Cached ${tasks.length} tasks for user:`, this.userId)
      console.log(`💾 [CACHE UPDATE] Task IDs in cache:`, tasks.map(t => t.id))
      
      // Notify listeners of cache update
      console.log(`💾 [CACHE UPDATE] Notifying ${this.listeners.size} listeners of cache change`)
      this.notifyListeners()
      console.log(`💾 [CACHE UPDATE] ✅ Cache update and listener notification completed`)
    } catch (error) {
      console.error('Error caching tasks:', error)
    }
  }

  /**
   * Clear cache for the current user
   */
  clearCache(): void {
    if (!this.isLocalStorageAvailable()) return

    try {
      localStorage.removeItem(this.getCacheKey())
      console.log('Cache cleared for user:', this.userId)
      this.notifyListeners()
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  /**
   * Get cache age in milliseconds
   */
  getCacheAge(): number {
    if (!this.isLocalStorageAvailable()) return Infinity

    try {
      const cached = localStorage.getItem(this.getCacheKey())
      if (!cached) return Infinity

      const cacheData: CacheData = JSON.parse(cached)
      return Date.now() - cacheData.lastUpdated
    } catch {
      return Infinity
    }
  }

  /**
   * Check if cache needs refresh (older than 5 minutes)
   */
  needsRefresh(): boolean {
    const maxAge = 5 * 60 * 1000 // 5 minutes
    return this.getCacheAge() > maxAge
  }

  /**
   * Fetch tasks from Supabase database
   */
  async fetchTasksFromDatabase(): Promise<Task[]> {
    try {
      console.log('Fetching tasks from database for user:', this.userId)
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tasks from database:', error)
        throw new Error(`Failed to fetch tasks: ${error.message}`)
      }

      const tasks = (data || []).map(transformSupabaseTask)
      console.log(`Fetched ${tasks.length} tasks from database`)
      
      // Update cache with fresh data
      this.setCachedTasks(tasks)
      
      return tasks
    } catch (error) {
      console.error('Database fetch error:', error)
      throw error
    }
  }

  /**
   * Background sync - fetch from database and update cache
   * This runs silently in the background
   */
  async backgroundSync(): Promise<Task[]> {
    try {
      const tasks = await this.fetchTasksFromDatabase()
      return tasks
    } catch (error) {
      console.error('Background sync failed:', error)
      // Return cached tasks if sync fails
      return this.getCachedTasks()
    }
  }

  /**
   * Add a new task (optimistic update + database save)
   */
  async addTask(newTask: Omit<Task, 'id'>): Promise<Task> {
    // Create optimistic task with temporary ID
    const optimisticTask: Task = {
      ...newTask,
      id: `temp_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Get current cache and add optimistic task
    const currentTasks = this.getCachedTasks()
    const updatedTasks = [optimisticTask, ...currentTasks]
    this.setCachedTasks(updatedTasks)

    try {
      // Save to database
      const supabaseTask = transformToSupabaseTask(newTask, this.userId)
      const { data, error } = await supabase
        .from('tasks')
        .insert([supabaseTask])
        .select()
        .single()

      if (error) throw error

      const savedTask = transformSupabaseTask(data)
      
      // Replace optimistic task with real task
      console.log('Replacing optimistic task:', optimisticTask.id, 'with real task:', savedTask.id)
      const finalTasks = updatedTasks.map(task => 
        task.id === optimisticTask.id ? savedTask : task
      )
      this.setCachedTasks(finalTasks)
      
      console.log('Task successfully created and cached:', savedTask.id, savedTask.title)
      return savedTask
    } catch (error) {
      // Rollback optimistic update on error
      this.setCachedTasks(currentTasks)
      throw error
    }
  }

  /**
   * Update an existing task (optimistic update + database save)
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const currentTasks = this.getCachedTasks()
    const taskIndex = currentTasks.findIndex(task => task.id === taskId)
    
    if (taskIndex === -1) {
      throw new Error('Task not found in cache')
    }

    const currentTask = currentTasks[taskIndex]
    const updatedTask = { ...currentTask, ...updates, updated_at: new Date().toISOString() }
    
    // Optimistic update
    const optimisticTasks = [...currentTasks]
    optimisticTasks[taskIndex] = updatedTask
    this.setCachedTasks(optimisticTasks)

    try {
      // Save to database
      const supabaseTask = transformToSupabaseTask(updatedTask, this.userId)
      const { data, error } = await supabase
        .from('tasks')
        .update(supabaseTask)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      const savedTask = transformSupabaseTask(data)
      
      // Update cache with server response
      const finalTasks = optimisticTasks.map(task => 
        task.id === taskId ? savedTask : task
      )
      this.setCachedTasks(finalTasks)

      return savedTask
    } catch (error) {
      // Rollback optimistic update on error
      this.setCachedTasks(currentTasks)
      throw error
    }
  }

  /**
   * Delete a task (optimistic update + database delete)
   */
  async deleteTask(taskId: string): Promise<void> {
    const currentTasks = this.getCachedTasks()
    
    console.log('🗑️ [DELETE TASK] Starting deletion process for:', taskId)
    console.log('🗑️ [DELETE TASK] Current tasks in cache:', currentTasks.map(t => ({ id: t.id, title: t.title, isTemp: t.id.startsWith('temp_') })))
    
    // Check if task exists in cache
    const taskToDelete = currentTasks.find(task => task.id === taskId)
    if (!taskToDelete) {
      console.error('🗑️ [DELETE TASK] ❌ Task not found in cache for deletion:', taskId)
      throw new Error(`Task with ID ${taskId} not found in cache`)
    }
    
    console.log('🗑️ [DELETE TASK] Found task to delete:', { id: taskToDelete.id, title: taskToDelete.title })
    
    // Skip database deletion if this is a temporary task (AI-created task that hasn't been saved yet)
    const isTempTask = taskId.startsWith('temp_')
    if (isTempTask) {
      console.log('🗑️ [DELETE TASK] 🔄 Deleting temporary task (not saved to database):', taskId)
      // Just remove from cache for temporary tasks
      const optimisticTasks = currentTasks.filter(task => task.id !== taskId)
      console.log('🗑️ [DELETE TASK] 💾 Updated cache after temp task deletion, remaining tasks:', optimisticTasks.length)
      this.setCachedTasks(optimisticTasks)
      console.log('🗑️ [DELETE TASK] ✅ Temporary task deletion completed')
      return
    }
    
    // Optimistic update - remove task from cache IMMEDIATELY
    console.log('🗑️ [DELETE TASK] 🚀 Performing optimistic cache update (removing from UI)...')
    const optimisticTasks = currentTasks.filter(task => task.id !== taskId)
    console.log('🗑️ [DELETE TASK] 💾 Tasks after optimistic removal:', optimisticTasks.length, 'remaining')
    this.setCachedTasks(optimisticTasks)
    console.log('🗑️ [DELETE TASK] ✅ Optimistic UI update completed - task should disappear from UI now')

    try {
      // Delete from database
      console.log('🗑️ [DELETE TASK] 💾 Starting database deletion for:', taskId)
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        console.error('🗑️ [DELETE TASK] ❌ Database deletion error:', error)
        // Rollback optimistic update
        console.log('🗑️ [DELETE TASK] 🔄 Rolling back optimistic update due to database error')
        this.setCachedTasks(currentTasks)
        throw error
      }

      console.log('🗑️ [DELETE TASK] ✅ Task deleted successfully from database:', taskId)
      console.log('🗑️ [DELETE TASK] 🎉 Task deletion completed successfully! Task should be gone from UI and database.')
    } catch (error) {
      console.error('🗑️ [DELETE TASK] ❌ Failed to delete task from database, rolling back cache:', taskId, error)
      // Rollback the optimistic update
      console.log('🗑️ [DELETE TASK] 🔄 Rolling back cache to restore task in UI')
      this.setCachedTasks(currentTasks)
      throw error
    }
  }

  /**
   * Add listener for cache updates
   */
  addListener(listener: () => void): void {
    this.listeners.add(listener)
  }

  /**
   * Remove listener
   */
  removeListener(listener: () => void): void {
    this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of cache changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener()
      } catch (error) {
        console.error('Error in cache listener:', error)
      }
    })
  }
}

/**
 * Global cache instances per user
 */
const cacheInstances = new Map<string, TaskCache>()

/**
 * Get or create cache instance for a user
 */
export function getTaskCache(userId: string): TaskCache {
  if (!cacheInstances.has(userId)) {
    cacheInstances.set(userId, new TaskCache(userId))
  }
  return cacheInstances.get(userId)!
}

/**
 * Clear all caches (useful for logout)
 */
export function clearAllCaches(): void {
  cacheInstances.forEach(cache => cache.clearCache())
  cacheInstances.clear()
}
