/**
 * AI Task API Service
 * 
 * This service provides the Gemini AI with full access to task management operations.
 * The AI can read, create, edit, delete, and query tasks with no restrictions through
 * natural language commands.
 * 
 * Features:
 * - Full CRUD operations on tasks
 * - Batch operations (multiple tasks at once)
 * - Advanced filtering and searching
 * - Task status and priority management
 * - Due date manipulation
 * - Task completion tracking
 * - Real-time synchronization with UI
 */

import { getTaskCache, Task } from './task-cache'
import { supabase } from './supabase'
import { getCurrentContext, type AIRealTimeContext } from './ai-context-provider'

/**
 * Task operation types that AI can perform
 */
export type TaskOperation = 
  | 'create'
  | 'read'
  | 'update' 
  | 'delete'
  | 'list'
  | 'search'
  | 'complete'
  | 'uncomplete'
  | 'prioritize'
  | 'reschedule'
  | 'batch_update'
  | 'bulk_delete'

/**
 * Task filter options for AI queries
 */
export interface TaskFilter {
  status?: 'todo' | 'in_progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  completed?: boolean
  dueBefore?: Date
  dueAfter?: Date
  title?: string
  description?: string
  tags?: string[]
  createdBefore?: Date
  createdAfter?: Date
  limit?: number
  offset?: number
}

/**
 * AI Task Operation Result
 */
export interface AITaskOperationResult {
  success: boolean
  operation: TaskOperation
  message: string
  task?: Task
  tasks?: Task[]
  count?: number
  error?: string
  details?: Record<string, any>
}

/**
 * Batch operation request
 */
export interface BatchTaskOperation {
  operation: TaskOperation
  taskIds?: string[]
  filter?: TaskFilter
  updates?: Partial<Task>
  newTasks?: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]
}

/**
 * AI Task API Service Class
 * Provides comprehensive task management for AI
 */
export class AITaskAPIService {
  private userId: string
  private taskCache: ReturnType<typeof getTaskCache>
  private realTimeContext: AIRealTimeContext

  constructor(userId: string) {
    this.userId = userId
    this.taskCache = getTaskCache(userId)
    this.realTimeContext = getCurrentContext()
  }

  /**
   * Execute any task operation based on AI command
   */
  async executeOperation(
    operation: TaskOperation,
    parameters: Record<string, any> = {}
  ): Promise<AITaskOperationResult> {
    try {
      console.log(`AI executing task operation: ${operation}`, parameters)

      switch (operation) {
        case 'create':
          return await this.createTask(parameters)
        case 'read':
          return await this.readTask(parameters.taskId || parameters.id)
        case 'update':
          return await this.updateTask(parameters.taskId || parameters.id, parameters.updates)
        case 'delete':
          return await this.deleteTask(parameters.taskId || parameters.id)
        case 'list':
          return await this.listTasks(parameters.filter)
        case 'search':
          return await this.searchTasks(parameters.query, parameters.filter)
        case 'complete':
          return await this.completeTask(parameters.taskId || parameters.id)
        case 'uncomplete':
          return await this.uncompleteTask(parameters.taskId || parameters.id)
        case 'prioritize':
          return await this.setPriority(parameters.taskId || parameters.id, parameters.priority)
        case 'reschedule':
          return await this.rescheduleTask(parameters.taskId || parameters.id, parameters.dueDate)
        case 'batch_update':
          return await this.batchUpdate(parameters.operations)
        case 'bulk_delete':
          return await this.bulkDelete(parameters.filter || parameters.taskIds)
        default:
          return {
            success: false,
            operation,
            message: `Unknown operation: ${operation}`,
            error: 'INVALID_OPERATION'
          }
      }
    } catch (error) {
      console.error(`AI task operation failed: ${operation}`, error)
      return {
        success: false,
        operation,
        message: `Failed to execute ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a new task
   */
  private async createTask(params: any): Promise<AITaskOperationResult> {
    const taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      title: params.title || params.name || 'Untitled Task',
      description: params.description || null,
      status: params.status || 'todo',
      priority: params.priority || 'medium',
      dueDate: params.dueDate || params.due_date || null,
      completed: params.completed || false,
      tags: params.tags || null,
      assignees: params.assignees || null,
      subtasks: params.subtasks || null,
      attachments: params.attachments || null,
      comments: params.comments || null
    }

    const task = await this.taskCache.addTask(taskData)

    return {
      success: true,
      operation: 'create',
      message: `Successfully created task: "${task.title}"`,
      task,
      details: { taskId: task.id }
    }
  }

  /**
   * Read a specific task
   */
  private async readTask(taskId: string): Promise<AITaskOperationResult> {
    if (!taskId) {
      return {
        success: false,
        operation: 'read',
        message: 'Task ID is required for read operation',
        error: 'MISSING_TASK_ID'
      }
    }

    const tasks = this.taskCache.getCachedTasks()
    const task = tasks.find(t => t.id === taskId)

    if (!task) {
      return {
        success: false,
        operation: 'read',
        message: `Task not found: ${taskId}`,
        error: 'TASK_NOT_FOUND'
      }
    }

    return {
      success: true,
      operation: 'read',
      message: `Retrieved task: "${task.title}"`,
      task,
      details: { taskId: task.id }
    }
  }

  /**
   * Update an existing task
   */
  private async updateTask(taskId: string, updates: Partial<Task>): Promise<AITaskOperationResult> {
    if (!taskId) {
      return {
        success: false,
        operation: 'update',
        message: 'Task ID is required for update operation',
        error: 'MISSING_TASK_ID'
      }
    }

    await this.taskCache.updateTask(taskId, updates)

    return {
      success: true,
      operation: 'update',
      message: `Successfully updated task: ${taskId}`,
      details: { taskId, updates }
    }
  }

  /**
   * Delete a task
   */
  private async deleteTask(taskId: string): Promise<AITaskOperationResult> {
    if (!taskId) {
      return {
        success: false,
        operation: 'delete',
        message: 'Task ID is required for delete operation',
        error: 'MISSING_TASK_ID'
      }
    }

    await this.taskCache.deleteTask(taskId)

    return {
      success: true,
      operation: 'delete',
      message: `Successfully deleted task: ${taskId}`,
      details: { taskId }
    }
  }

  /**
   * List tasks with optional filtering
   */
  private async listTasks(filter?: TaskFilter): Promise<AITaskOperationResult> {
    let tasks = this.taskCache.getCachedTasks()

    // Apply filters
    if (filter) {
      tasks = this.applyFilter(tasks, filter)
    }

    return {
      success: true,
      operation: 'list',
      message: `Retrieved ${tasks.length} tasks`,
      tasks,
      count: tasks.length,
      details: { filter }
    }
  }

  /**
   * Search tasks by text query
   */
  private async searchTasks(query: string, filter?: TaskFilter): Promise<AITaskOperationResult> {
    if (!query) {
      return await this.listTasks(filter)
    }

    let tasks = this.taskCache.getCachedTasks()

    // Text search in title and description
    const searchQuery = query.toLowerCase()
    tasks = tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery) ||
      (task.description && task.description.toLowerCase().includes(searchQuery)) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchQuery)))
    )

    // Apply additional filters
    if (filter) {
      tasks = this.applyFilter(tasks, filter)
    }

    return {
      success: true,
      operation: 'search',
      message: `Found ${tasks.length} tasks matching "${query}"`,
      tasks,
      count: tasks.length,
      details: { query, filter }
    }
  }

  /**
   * Mark a task as completed
   */
  private async completeTask(taskId: string): Promise<AITaskOperationResult> {
    const result = await this.updateTask(taskId, { 
      completed: true, 
      status: 'done' 
    })
    
    if (result.success) {
      result.message = `Task marked as completed: ${taskId}`
    }
    
    return result
  }

  /**
   * Mark a task as incomplete
   */
  private async uncompleteTask(taskId: string): Promise<AITaskOperationResult> {
    const result = await this.updateTask(taskId, { 
      completed: false, 
      status: 'todo' 
    })
    
    if (result.success) {
      result.message = `Task marked as incomplete: ${taskId}`
    }
    
    return result
  }

  /**
   * Set task priority
   */
  private async setPriority(taskId: string, priority: 'low' | 'medium' | 'high'): Promise<AITaskOperationResult> {
    const result = await this.updateTask(taskId, { priority })
    
    if (result.success) {
      result.message = `Task priority set to ${priority}: ${taskId}`
    }
    
    return result
  }

  /**
   * Reschedule a task
   */
  private async rescheduleTask(taskId: string, dueDate: string | Date | null): Promise<AITaskOperationResult> {
    let processedDueDate: Date | null = null
    
    if (dueDate) {
      if (typeof dueDate === 'string') {
        processedDueDate = new Date(dueDate)
      } else {
        processedDueDate = dueDate
      }
    }

    const result = await this.updateTask(taskId, { dueDate: processedDueDate })
    
    if (result.success) {
      result.message = processedDueDate 
        ? `Task rescheduled to ${processedDueDate.toLocaleDateString()}: ${taskId}`
        : `Task due date removed: ${taskId}`
    }
    
    return result
  }

  /**
   * Perform batch operations on multiple tasks
   */
  private async batchUpdate(operations: BatchTaskOperation[]): Promise<AITaskOperationResult> {
    const results: any[] = []
    let successCount = 0
    let errorCount = 0

    for (const op of operations) {
      try {
        const result = await this.executeOperation(op.operation, {
          taskIds: op.taskIds,
          filter: op.filter,
          updates: op.updates,
          newTasks: op.newTasks
        })
        
        results.push(result)
        if (result.success) successCount++
        else errorCount++
      } catch (error) {
        results.push({
          success: false,
          operation: op.operation,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        errorCount++
      }
    }

    return {
      success: errorCount === 0,
      operation: 'batch_update',
      message: `Batch operation completed: ${successCount} successful, ${errorCount} failed`,
      count: operations.length,
      details: { results, successCount, errorCount }
    }
  }

  /**
   * Bulk delete tasks
   */
  private async bulkDelete(criteria: TaskFilter | string[]): Promise<AITaskOperationResult> {
    let taskIds: string[] = []

    if (Array.isArray(criteria)) {
      taskIds = criteria
    } else {
      // Filter tasks and get IDs
      const tasks = this.applyFilter(this.taskCache.getCachedTasks(), criteria)
      taskIds = tasks.map(t => t.id)
    }

    let successCount = 0
    let errorCount = 0

    for (const taskId of taskIds) {
      try {
        await this.taskCache.deleteTask(taskId)
        successCount++
      } catch (error) {
        console.error(`Failed to delete task ${taskId}:`, error)
        errorCount++
      }
    }

    return {
      success: errorCount === 0,
      operation: 'bulk_delete',
      message: `Bulk delete completed: ${successCount} deleted, ${errorCount} failed`,
      count: taskIds.length,
      details: { successCount, errorCount, taskIds }
    }
  }

  /**
   * Apply filter to task array
   */
  private applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
    let filtered = [...tasks]

    if (filter.status) {
      filtered = filtered.filter(task => task.status === filter.status)
    }

    if (filter.priority) {
      filtered = filtered.filter(task => task.priority === filter.priority)
    }

    if (filter.completed !== undefined) {
      filtered = filtered.filter(task => task.completed === filter.completed)
    }

    if (filter.dueBefore) {
      filtered = filtered.filter(task => 
        task.dueDate && task.dueDate <= filter.dueBefore!
      )
    }

    if (filter.dueAfter) {
      filtered = filtered.filter(task => 
        task.dueDate && task.dueDate >= filter.dueAfter!
      )
    }

    if (filter.title) {
      const titleQuery = filter.title.toLowerCase()
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(titleQuery)
      )
    }

    if (filter.description) {
      const descQuery = filter.description.toLowerCase()
      filtered = filtered.filter(task => 
        task.description && task.description.toLowerCase().includes(descQuery)
      )
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(task => 
        task.tags && filter.tags!.some(tag => task.tags!.includes(tag))
      )
    }

    if (filter.createdBefore) {
      filtered = filtered.filter(task => 
        new Date(task.created_at) <= filter.createdBefore!
      )
    }

    if (filter.createdAfter) {
      filtered = filtered.filter(task => 
        new Date(task.created_at) >= filter.createdAfter!
      )
    }

    // Apply pagination
    if (filter.offset) {
      filtered = filtered.slice(filter.offset)
    }

    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit)
    }

    return filtered
  }

  /**
   * Get comprehensive task statistics
   */
  async getTaskStats(): Promise<AITaskOperationResult> {
    const tasks = this.taskCache.getCachedTasks()
    
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      highPriority: tasks.filter(t => t.priority === 'high').length,
      mediumPriority: tasks.filter(t => t.priority === 'medium').length,
      lowPriority: tasks.filter(t => t.priority === 'low').length,
      overdue: tasks.filter(t => t.dueDate && t.dueDate < new Date()).length,
      dueToday: tasks.filter(t => {
        if (!t.dueDate) return false
        const today = new Date().toDateString()
        return t.dueDate.toDateString() === today
      }).length
    }

    return {
      success: true,
      operation: 'list',
      message: `Task statistics retrieved`,
      details: { stats }
    }
  }
}

/**
 * Factory function to create AI Task API service
 */
export function createAITaskAPI(userId: string): AITaskAPIService {
  return new AITaskAPIService(userId)
}

/**
 * Main function for AI to execute task operations
 */
export async function executeAITaskOperation(
  userId: string,
  operation: TaskOperation,
  parameters: Record<string, any> = {}
): Promise<AITaskOperationResult> {
  const api = createAITaskAPI(userId)
  return await api.executeOperation(operation, parameters)
}

/**
 * Parse natural language commands into task operations
 */
export function parseTaskCommand(command: string): { operation: TaskOperation; parameters: Record<string, any> } | null {
  const lowerCommand = command.toLowerCase().trim()
  
  // Create operations
  if (lowerCommand.includes('create') || lowerCommand.includes('add') || lowerCommand.includes('new task')) {
    return {
      operation: 'create',
      parameters: extractTaskDataFromCommand(command)
    }
  }
  
  // Read operations
  if (lowerCommand.includes('show') || lowerCommand.includes('get') || lowerCommand.includes('find task')) {
    return {
      operation: 'read',
      parameters: extractTaskIdFromCommand(command)
    }
  }
  
  // Update operations
  if (lowerCommand.includes('update') || lowerCommand.includes('edit') || lowerCommand.includes('modify')) {
    return {
      operation: 'update',
      parameters: {
        ...extractTaskIdFromCommand(command),
        updates: extractTaskDataFromCommand(command)
      }
    }
  }
  
  // Delete operations
  if (lowerCommand.includes('delete') || lowerCommand.includes('remove')) {
    return {
      operation: 'delete',
      parameters: extractTaskIdFromCommand(command)
    }
  }
  
  // List operations
  if (lowerCommand.includes('list') || lowerCommand.includes('show all') || lowerCommand.includes('get all')) {
    return {
      operation: 'list',
      parameters: { filter: extractFilterFromCommand(command) }
    }
  }
  
  // Complete operations
  if (lowerCommand.includes('complete') || lowerCommand.includes('done') || lowerCommand.includes('finish')) {
    return {
      operation: 'complete',
      parameters: extractTaskIdFromCommand(command)
    }
  }
  
  return null
}

/**
 * Helper functions for command parsing
 */
function extractTaskDataFromCommand(command: string): Record<string, any> {
  const data: Record<string, any> = {}
  
  // Extract title (basic implementation)
  const titleMatch = command.match(/(?:create|add|new)\s+(?:task\s+)?(?:called\s+|named\s+)?["']([^"']+)["']|(?:create|add|new)\s+(?:task\s+)?([^,.\n]+)/i)
  if (titleMatch) {
    data.title = titleMatch[1] || titleMatch[2]
  }
  
  // Extract priority
  if (command.toLowerCase().includes('high priority')) data.priority = 'high'
  else if (command.toLowerCase().includes('low priority')) data.priority = 'low'
  else data.priority = 'medium'
  
  return data
}

function extractTaskIdFromCommand(command: string): Record<string, any> {
  // This is a simplified implementation
  // In practice, you'd need more sophisticated ID extraction
  const idMatch = command.match(/task\s+(?:id\s+)?(\w+)/i)
  return idMatch ? { taskId: idMatch[1] } : {}
}

function extractFilterFromCommand(command: string): TaskFilter {
  const filter: TaskFilter = {}
  
  if (command.toLowerCase().includes('completed')) filter.completed = true
  if (command.toLowerCase().includes('pending')) filter.completed = false
  if (command.toLowerCase().includes('high priority')) filter.priority = 'high'
  if (command.toLowerCase().includes('low priority')) filter.priority = 'low'
  
  return filter
}
