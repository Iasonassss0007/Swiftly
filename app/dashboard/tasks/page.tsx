'use client'

/**
 * Tasks Page - Instant Loading Task Management System
 * 
 * ZERO LOADING TIME ARCHITECTURE:
 * ===============================
 * 
 * This component provides instant task display with no visible loading states by using
 * a sophisticated caching and background synchronization system.
 * 
 * 🚀 INSTANT LOADING FEATURES:
 * 
 * 1. IMMEDIATE TASK DISPLAY:
 *    - Tasks appear instantly from localStorage cache (0ms load time)
 *    - No loading spinners or "skeleton" states for users
 *    - Perfect user experience across all page refreshes
 *    - Cache persists across browser sessions
 * 
 * 2. BACKGROUND SYNCHRONIZATION:
 *    - Database sync happens silently in the background
 *    - Users see cached data immediately, then fresh data syncs
 *    - Intelligent cache invalidation based on data age
 *    - Automatic retry logic for failed sync attempts
 * 
 * 3. REAL-TIME UPDATES:
 *    - Supabase real-time subscriptions for live data sync
 *    - Changes propagate instantly across browser tabs
 *    - Real-time collaboration support
 *    - Automatic conflict resolution
 * 
 * 4. OPTIMISTIC UPDATES:
 *    - All CRUD operations update UI immediately
 *    - Database operations happen in background
 *    - Automatic rollback on operation failure
 *    - Perfect responsiveness for user interactions
 * 
 * 5. CACHE MANAGEMENT:
 *    - User-specific cache isolation (multi-user support)
 *    - Automatic cache expiration and refresh
 *    - Manual cache clearing for troubleshooting
 *    - Memory-efficient storage using localStorage
 * 
 * 6. ERROR RESILIENCE:
 *    - Graceful degradation when database is unavailable
 *    - Cached data remains accessible during outages
 *    - Subtle error notifications don't disrupt workflow
 *    - Automatic retry mechanisms for failed operations
 * 
 * 🔧 TECHNICAL IMPLEMENTATION:
 * 
 * - `useInstantTasks` hook manages cache and database sync
 * - `TaskCache` class handles localStorage operations
 * - Background sync runs automatically when cache is stale
 * - Real-time subscriptions keep data synchronized
 * - Optimistic updates provide immediate user feedback
 * 
 * This system ensures users never see loading states while maintaining
 * data consistency and real-time collaboration capabilities.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useAuth, createUserData } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import TasksPageHeader from '@/components/tasks/TasksPageHeader'
import TaskList from '@/components/tasks/TaskList'
import KanbanBoard from '@/components/tasks/KanbanBoard'
import GanttChart from '@/components/tasks/GanttChart'
import TaskDetailsPanel from '@/components/tasks/TaskDetailsPanel'
import NewTaskModal from '@/components/tasks/NewTaskModal'
import { Task } from '@/components/tasks/TaskRow'
import { useInstantTasks } from '@/lib/use-instant-tasks'
import { clearAllCaches } from '@/lib/task-cache'
import { useAITaskListener } from '@/lib/use-ai-task-integration'

export default function TasksPage() {
  const { user, profile, loading } = useAuth()
  const [sessionLoading, setSessionLoading] = useState(true)
  const router = useRouter()

  /**
   * Instant Task Loading System
   * 
   * This system provides zero-loading-time task display by:
   * 1. Loading cached tasks instantly from localStorage (no loading state!)
   * 2. Background syncing with Supabase database for latest data
   * 3. Real-time subscriptions for live updates across tabs/devices
   * 4. Optimistic updates for immediate UI feedback on all operations
   * 5. Automatic cache management with user-specific data isolation
   * 
   * User Experience:
   * - Tasks appear instantly on page load (cached data)
   * - Background sync ensures data is always up-to-date
   * - No visible loading spinners or delays
   * - Immediate feedback on create/edit/delete operations
   * - Seamless experience across browser sessions
   */
  const { 
    tasks, 
    isBackgroundSyncing,
    error, 
    addTask, 
    updateTask, 
    deleteTask, 
    refreshTasks,
    clearCache,
    cleanupTempTasks
  } = useInstantTasks(user?.id)

  // Debug: Log task state changes
  useEffect(() => {
    console.log('🏠 [TASKS PAGE] Task state updated. Current tasks:', tasks.length)
    console.log('🏠 [TASKS PAGE] Task IDs:', tasks.map(t => ({ id: t.id, title: t.title, isTemp: t.id.startsWith('temp_') })))
  }, [tasks])

  // State for AI task notifications
  const [aiTaskNotification, setAiTaskNotification] = useState<{ task: Task; show: boolean } | null>(null)

  // Listen for AI-created tasks and show notifications
  useAITaskListener(user?.id, (task) => {
    console.log('AI task created, showing notification:', task.title)
    setAiTaskNotification({ task, show: true })
    
    // Auto-hide notification after 4 seconds
    setTimeout(() => {
      setAiTaskNotification(prev => prev ? { ...prev, show: false } : null)
      // Remove notification after fade out
      setTimeout(() => setAiTaskNotification(null), 300)
    }, 4000)
  })
  
  // Clean up any stale temporary tasks on mount and periodically
  useEffect(() => {
    if (user?.id) {
      // Clean up immediately
      cleanupTempTasks()
      
      // Set up periodic cleanup every 30 seconds
      const cleanupInterval = setInterval(() => {
        cleanupTempTasks()
      }, 30000)
      
      return () => clearInterval(cleanupInterval)
    }
  }, [user?.id, cleanupTempTasks])

  // Debug logging for troubleshooting instant loading
  useEffect(() => {
    console.log('Tasks Page - User ID changed:', user?.id)
    console.log('Tasks Page - Current tasks count:', tasks.length)
    console.log('Tasks Page - Background syncing:', isBackgroundSyncing)
    console.log('Tasks Page - Error:', error)
  }, [user?.id, tasks.length, isBackgroundSyncing, error])

  // Task management state
  const [searchTerm, setSearchTerm] = useState('')
  const [currentView, setCurrentView] = useState<'list' | 'kanban' | 'gantt'>('list')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [newTaskStatus, setNewTaskStatus] = useState<Task['status']>('todo')
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Sample data for demonstration
  const availableUsers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatarUrl: undefined
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatarUrl: undefined
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      avatarUrl: undefined
    }
  ]

  const availableTags = [
    'Frontend',
    'Backend',
    'Design',
    'Marketing',
    'Research',
    'Bug Fix',
    'Feature',
    'High Priority',
    'Low Priority'
  ]

  /**
   * Manual refresh function for troubleshooting
   * Forces a fresh sync with the database
   */
  const handleRefreshData = () => {
    refreshTasks().catch(console.error)
  }

  /**
   * Clear cache function for troubleshooting
   * Useful when cache gets corrupted or for testing
   */
  const handleClearCache = () => {
    clearCache()
  }

  // Session guard - check for valid session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth')
          return
        }
        setSessionLoading(false)
      } catch (error) {
        console.error('Error checking session:', error)
        router.push('/auth')
      }
    }

    checkSession()
  }, [router])

  // Auth context loading check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Cache will automatically fetch tasks when user.id changes

  /**
   * UI Event Handlers
   * 
   * These functions handle user interactions and coordinate between
   * the UI state and the database operations. They use the optimistic
   * update functions from useCachedTasks for immediate feedback.
   */
  
  const handleNewTask = (status?: Task['status']) => {
    setEditingTask(null) // Clear any editing task
    setNewTaskStatus(status || 'todo')
    setShowNewTaskModal(true)
  }

  const handleCloseModal = () => {
    setShowNewTaskModal(false)
    setEditingTask(null)
  }

  /**
   * Save new task to database with optimistic UI update
   * The task appears in the UI immediately, then syncs to database
   */
  const handleSaveTask = async (newTask: Omit<Task, 'id'>) => {
    if (!user) return

    try {
      await addTask(newTask)
      setShowNewTaskModal(false)
      setEditingTask(null)
    } catch (err) {
      console.error('Error creating task:', err)
      // TODO: Show user-friendly error message
    }
  }

  /**
   * Update existing task with optimistic UI update
   * Changes appear immediately, then sync to database
   */
  const handleUpdateTask = async (updatedTask: Task) => {
    if (!user) return

    try {
      await updateTask(updatedTask.id, updatedTask)
      setShowNewTaskModal(false)
      setEditingTask(null)
    } catch (err) {
      console.error('Error updating task:', err)
      // TODO: Show user-friendly error message
    }
  }

  const handleToggleComplete = async (taskId: string) => {
    if (!user) return

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const updatedTask: Task = {
      ...task,
      completed: !task.completed,
      status: !task.completed ? 'done' : 'todo'
    }

    try {
      await updateTask(taskId, updatedTask)
    } catch (err) {
      console.error('Error toggling task completion:', err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return

    try {
      console.log('🏠 [TASKS PAGE] Starting task deletion from UI for:', taskId)
      console.log('🏠 [TASKS PAGE] Current tasks before deletion:', tasks.length)
      await deleteTask(taskId)
      console.log('🏠 [TASKS PAGE] ✅ Task deletion completed from UI side')
    } catch (err) {
      console.error('🏠 [TASKS PAGE] ❌ Error deleting task:', err)
    }
  }

  const handleMenuAction = (taskId: string, action: 'edit' | 'duplicate' | 'archive' | 'delete') => {
    switch (action) {
      case 'edit':
        const task = tasks.find(t => t.id === taskId)
        if (task) {
          setEditingTask(task)
          setShowNewTaskModal(true)
        }
        break
      case 'duplicate':
        const taskToDuplicate = tasks.find(t => t.id === taskId)
        if (taskToDuplicate) {
          const duplicated: Omit<Task, 'id'> = {
            ...taskToDuplicate,
            title: `${taskToDuplicate.title} (Copy)`,
            completed: false,
            status: 'todo'
          }
          handleSaveTask(duplicated)
        }
        break
      case 'delete':
        handleDeleteTask(taskId)
        break
      case 'archive':
        // For now, treat archive as delete. In future, could add archived field
        handleDeleteTask(taskId)
        break
    }
  }

  const handleTaskMove = (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      const updatedTask: Task = { ...task, status: newStatus }
      handleUpdateTask(updatedTask)
    }
  }

  const handleBulkAction = async (taskIds: string[], action: 'complete' | 'delete' | 'archive') => {
    if (!user) return

    try {
      switch (action) {
        case 'complete':
          // Update each task individually using cached operations
          for (const taskId of taskIds) {
            const task = tasks.find(t => t.id === taskId)
            if (task) {
              await updateTask(taskId, { ...task, completed: true, status: 'done' })
            }
          }
          break

        case 'delete':
        case 'archive':
          // Delete each task individually using cached operations
          for (const taskId of taskIds) {
            await deleteTask(taskId)
          }
          break
      }
    } catch (err) {
      console.error(`Error performing bulk ${action}:`, err)
    }
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'list':
        return (
          <TaskList
            tasks={tasks}
            searchTerm={searchTerm}
            onTaskClick={setSelectedTask}
            onToggleComplete={handleToggleComplete}
            onMenuAction={handleMenuAction}
            onEdit={(task) => {
              setEditingTask(task)
              setShowNewTaskModal(true)
            }}
            onBulkAction={handleBulkAction}
          />
        )
      case 'kanban':
        return (
          <KanbanBoard
            tasks={tasks}
            searchTerm={searchTerm}
            onTaskClick={setSelectedTask}
            onTaskMove={handleTaskMove}
            onMenuAction={handleMenuAction}
            onNewTask={handleNewTask}
          />
        )
      case 'gantt':
        return (
          <GanttChart
            tasks={tasks}
            searchTerm={searchTerm}
            onTaskClick={setSelectedTask}
          />
        )
      default:
        return null
    }
  }

  // Only show loading for authentication, not for tasks
  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#111C59]/20 border-t-[#111C59] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4F5F73]">Authenticating...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting
  if (!user) {
    return null
  }

  // Use real user data from auth context with proper fallbacks
  const userData = createUserData(user, profile)

  return (
    <Layout user={userData}>
      <div className="max-w-7xl mx-auto space-y-6">


        {/* Subtle Error Display - Less prominent since we have cached data */}
        {error && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2 flex-1">
                <p className="text-sm text-orange-700">Sync issue: {error.message}</p>
                <p className="text-xs text-orange-600 mt-1">Showing cached data. Will retry automatically.</p>
              </div>
              <button
                onClick={() => refreshTasks()}
                className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <TasksPageHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentView={currentView}
          onViewChange={setCurrentView}
          onNewTask={() => handleNewTask()}
          onRefresh={handleRefreshData}
          // Show cache controls in development
          {...(process.env.NODE_ENV === 'development' && {
            onClearCache: handleClearCache,
            isBackgroundSyncing
          })}
        />

        {/* Subtle Background Sync Indicator - Only shows when syncing with cached data */}
        {isBackgroundSyncing && tasks.length > 0 && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Syncing...</span>
            </div>
          </div>
        )}

        {/* AI Task Creation Notification */}
        {aiTaskNotification && (
          <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
            aiTaskNotification.show 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-2 opacity-0 scale-95'
          }`}>
            <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Task Created from AI Chat</p>
                <p className="text-xs opacity-90 truncate">{aiTaskNotification.task.title}</p>
              </div>
              <button
                onClick={() => setAiTaskNotification(prev => prev ? { ...prev, show: false } : null)}
                className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {renderCurrentView()}

        {/* Task Details Panel */}
        <TaskDetailsPanel
          task={selectedTask}
          isOpen={selectedTask !== null}
          onClose={() => setSelectedTask(null)}
          onUpdate={(taskId, updates) => {
            const task = tasks.find(t => t.id === taskId)
            if (task) {
              const updatedTask = { ...task, ...updates }
              handleUpdateTask(updatedTask)
            }
          }}
          onEdit={(task) => {
            setEditingTask(task)
            setShowNewTaskModal(true)
            setSelectedTask(null) // Close details panel
          }}
          availableUsers={availableUsers}
          availableTags={availableTags}
        />

        {/* New Task Modal */}
        <NewTaskModal
          isOpen={showNewTaskModal}
          onClose={handleCloseModal}
          onSave={handleSaveTask}
          onUpdate={handleUpdateTask}
          editTask={editingTask}
          initialStatus={newTaskStatus}
          availableUsers={availableUsers}
          availableTags={availableTags}
        />
      </div>
    </Layout>
  )
}