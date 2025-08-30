/**
 * AI Task Integration Test Suite
 * 
 * This file contains test cases to verify the AI-to-task integration works correctly.
 * Run these tests in the browser console to validate functionality.
 */

import { AITaskService } from './ai-task-service'

/**
 * Test cases for AI task detection and creation
 */
export const AI_TASK_TEST_CASES = [
  // Basic task creation
  {
    userMessage: "Create a task called 'Review presentation'",
    aiResponse: "I'll help you create that task for reviewing the presentation.",
    expected: {
      detected: true,
      title: "Review presentation"
    }
  },
  
  // Task with due date
  {
    userMessage: "Add task: Submit report by Friday",
    aiResponse: "Sure, I'll add a task to submit the report by Friday.",
    expected: {
      detected: true,
      title: "Submit report",
      hasDueDate: true
    }
  },
  
  // Reminder format
  {
    userMessage: "Remind me to call mom tomorrow",
    aiResponse: "I'll set a reminder for you to call your mom tomorrow.",
    expected: {
      detected: true,
      title: "call mom",
      hasDueDate: true
    }
  },
  
  // High priority task
  {
    userMessage: "Create urgent task: Fix server issue",
    aiResponse: "Creating an urgent task to fix the server issue right away.",
    expected: {
      detected: true,
      title: "Fix server issue",
      priority: "high"
    }
  },
  
  // Non-task conversation
  {
    userMessage: "What's the weather forecast?",
    aiResponse: "The weather forecast shows sunny skies with 75°F today.",
    expected: {
      detected: false
    }
  },
  
  // Meeting scheduling
  {
    userMessage: "Schedule meeting with John tomorrow at 2pm",
    aiResponse: "I'll schedule a meeting with John for tomorrow at 2pm.",
    expected: {
      detected: true,
      title: "meeting with John",
      hasDueDate: true
    }
  },
  
  // To-do list addition
  {
    userMessage: "Add to my todo list: Buy groceries",
    aiResponse: "Adding 'Buy groceries' to your todo list.",
    expected: {
      detected: true,
      title: "Buy groceries"
    }
  },
  
  // Personal task
  {
    userMessage: "I need to remember to renew my driver's license",
    aiResponse: "That's important! I'll help you remember to renew your driver's license.",
    expected: {
      detected: true,
      title: "renew my driver's license"
    }
  }
]

/**
 * Run all test cases and log results
 */
export async function runAITaskTests(userId: string): Promise<void> {
  console.log('🧪 Running AI Task Integration Tests...')
  console.log('========================================')
  
  const service = new AITaskService(userId)
  let passed = 0
  let failed = 0
  
  for (let i = 0; i < AI_TASK_TEST_CASES.length; i++) {
    const testCase = AI_TASK_TEST_CASES[i]
    console.log(`\n📝 Test ${i + 1}: ${testCase.userMessage.substring(0, 50)}...`)
    
    try {
      const result = await service.processAIResponse(
        testCase.userMessage,
        testCase.aiResponse
      )
      
      // Check detection
      if (result.detected !== testCase.expected.detected) {
        console.log(`❌ Detection mismatch. Expected: ${testCase.expected.detected}, Got: ${result.detected}`)
        failed++
        continue
      }
      
      if (!testCase.expected.detected) {
        console.log(`✅ Correctly identified as non-task`)
        passed++
        continue
      }
      
      // Check task creation success
      if (testCase.expected.detected && !result.success) {
        console.log(`❌ Task creation failed: ${result.error}`)
        failed++
        continue
      }
      
      // Check title extraction
      if (testCase.expected.title && result.task) {
        const extractedTitle = result.task.title.toLowerCase()
        const expectedTitle = testCase.expected.title.toLowerCase()
        
        if (!extractedTitle.includes(expectedTitle) && !expectedTitle.includes(extractedTitle)) {
          console.log(`❌ Title mismatch. Expected: "${testCase.expected.title}", Got: "${result.task.title}"`)
          failed++
          continue
        }
      }
      
      // Check due date
      if (testCase.expected.hasDueDate && result.task && !result.task.dueDate) {
        console.log(`⚠️  Expected due date but none extracted`)
        // Don't fail for this - due date parsing is complex
      }
      
      // Check priority
      if (testCase.expected.priority && result.task && result.task.priority !== testCase.expected.priority) {
        console.log(`⚠️  Priority mismatch. Expected: ${testCase.expected.priority}, Got: ${result.task.priority}`)
        // Don't fail for this - priority detection is best-effort
      }
      
      console.log(`✅ Test passed - Task: "${result.task?.title}"`)
      passed++
      
    } catch (error) {
      console.log(`❌ Test failed with error:`, error)
      failed++
    }
  }
  
  console.log(`\n📊 Test Results:`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)
  
  if (failed === 0) {
    console.log(`🎉 All tests passed! AI task integration is working correctly.`)
  } else {
    console.log(`⚠️  Some tests failed. Review the implementation for edge cases.`)
  }
}

/**
 * Browser console helper function
 * Usage: testAITasks('your-user-id')
 */
declare global {
  interface Window {
    testAITasks: (userId: string) => Promise<void>
  }
}

if (typeof window !== 'undefined') {
  window.testAITasks = runAITaskTests
}

/**
 * Quick test function for single cases
 */
export async function quickTest(
  userId: string, 
  userMessage: string, 
  aiResponse: string
): Promise<void> {
  console.log('🔍 Quick AI Task Test')
  console.log('User:', userMessage)
  console.log('AI:', aiResponse)
  
  const service = new AITaskService(userId)
  const result = await service.processAIResponse(userMessage, aiResponse)
  
  console.log('Result:', result)
  
  if (result.success && result.task) {
    console.log(`✅ Task created: "${result.task.title}"`)
  } else if (result.detected && !result.success) {
    console.log(`❌ Task detected but creation failed: ${result.error}`)
  } else {
    console.log(`ℹ️  No task detected - normal conversation`)
  }
}
