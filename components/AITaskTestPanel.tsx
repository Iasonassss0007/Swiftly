/**
 * AI Task Test Panel - Development Component
 * 
 * This component provides a testing interface for the AI-to-task integration.
 * It's only shown in development mode and helps developers test the system.
 */

'use client'

import { useState } from 'react'
import { processAIForTasks, TaskCreationResult } from '@/lib/ai-task-service'

interface AITaskTestPanelProps {
  userId?: string
  className?: string
}

const QUICK_TEST_CASES = [
  {
    name: "Basic Task",
    userMessage: "Create a task called 'Review presentation'",
    aiResponse: "I'll help you create that task for reviewing the presentation."
  },
  {
    name: "Task with Due Date",
    userMessage: "Add task: Submit report by Friday",
    aiResponse: "Sure, I'll add a task to submit the report by Friday."
  },
  {
    name: "Reminder Format",
    userMessage: "Remind me to call mom tomorrow",
    aiResponse: "I'll set a reminder for you to call your mom tomorrow."
  },
  {
    name: "Non-Task",
    userMessage: "What's the weather forecast?",
    aiResponse: "The weather forecast shows sunny skies with 75°F today."
  }
]

export default function AITaskTestPanel({ userId, className = '' }: AITaskTestPanelProps) {
  const [userMessage, setUserMessage] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [testResult, setTestResult] = useState<TaskCreationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const runTest = async () => {
    if (!userId || !userMessage.trim() || !aiResponse.trim()) {
      alert('Please provide user ID, user message, and AI response')
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      const result = await processAIForTasks(userId, userMessage, aiResponse)
      setTestResult(result)
    } catch (error) {
      console.error('Test error:', error)
      setTestResult({
        success: false,
        detected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadQuickTest = (testCase: typeof QUICK_TEST_CASES[0]) => {
    setUserMessage(testCase.userMessage)
    setAiResponse(testCase.aiResponse)
  }

  const clearTest = () => {
    setUserMessage('')
    setAiResponse('')
    setTestResult(null)
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 className="text-sm font-medium text-gray-900">AI Task Test Panel</h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">DEV</span>
          </div>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Panel Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Quick Test Cases */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Quick Test Cases:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_TEST_CASES.map((testCase, index) => (
                <button
                  key={index}
                  onClick={() => loadQuickTest(testCase)}
                  className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-left"
                >
                  {testCase.name}
                </button>
              ))}
            </div>
          </div>

          {/* User Message Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              User Message:
            </label>
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="e.g., Create a task called 'Review presentation'"
            />
          </div>

          {/* AI Response Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              AI Response:
            </label>
            <textarea
              value={aiResponse}
              onChange={(e) => setAiResponse(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="e.g., I'll help you create that task for reviewing the presentation."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={runTest}
              disabled={isLoading || !userId}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testing...' : 'Run Test'}
            </button>
            <button
              onClick={clearTest}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
            >
              Clear
            </button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="mt-4 p-3 rounded-lg border bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Test Results:</h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Detected:</span>
                  <span className={testResult.detected ? 'text-green-600' : 'text-red-600'}>
                    {testResult.detected ? '✅ Yes' : '❌ No'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-medium">Success:</span>
                  <span className={testResult.success ? 'text-green-600' : 'text-red-600'}>
                    {testResult.success ? '✅ Yes' : '❌ No'}
                  </span>
                </div>

                {testResult.error && (
                  <div>
                    <span className="font-medium text-red-600">Error:</span>
                    <div className="text-red-600 mt-1">{testResult.error}</div>
                  </div>
                )}

                {testResult.task && (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <div className="font-medium text-green-600 mb-1">✅ Task Created:</div>
                    <div><strong>Title:</strong> {testResult.task.title}</div>
                    {testResult.task.description && (
                      <div><strong>Description:</strong> {testResult.task.description}</div>
                    )}
                    <div><strong>Priority:</strong> {testResult.task.priority}</div>
                    {testResult.task.dueDate && (
                      <div><strong>Due Date:</strong> {testResult.task.dueDate.toLocaleDateString()}</div>
                    )}
                    {testResult.task.tags && testResult.task.tags.length > 0 && (
                      <div><strong>Tags:</strong> {testResult.task.tags.join(', ')}</div>
                    )}
                  </div>
                )}

                {testResult.rawExtraction && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      Raw Extraction Data
                    </summary>
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(testResult.rawExtraction, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p><strong>Instructions:</strong></p>
            <p>1. Enter a user message and AI response</p>
            <p>2. Click &quot;Run Test&quot; to check if a task would be created</p>
            <p>3. Use quick test cases for common scenarios</p>
            <p>4. Check console for detailed debugging information</p>
          </div>
        </div>
      )}
    </div>
  )
}
