'use client'

import { useState } from 'react'
import LoadingScreen, { AppLoadingScreen, AuthLoadingScreen, TasksLoadingScreen, DashboardLoadingScreen } from '@/components/LoadingScreen'

export default function LoadingDemo() {
  const [currentDemo, setCurrentDemo] = useState<string | null>(null)

  const demos = [
    { key: 'app', label: 'App Loading', component: <AppLoadingScreen /> },
    { key: 'auth', label: 'Auth Loading', component: <AuthLoadingScreen /> },
    { key: 'tasks', label: 'Tasks Loading', component: <TasksLoadingScreen /> },
    { key: 'dashboard', label: 'Dashboard Loading', component: <DashboardLoadingScreen /> },
    { 
      key: 'custom', 
      label: 'Custom Loading', 
      component: <LoadingScreen message="Processing your request..." type="custom" /> 
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Swiftly Loading Screen Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {demos.map((demo) => (
            <button
              key={demo.key}
              onClick={() => setCurrentDemo(demo.key)}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-[#111C59] hover:shadow-md transition-all duration-200 text-center"
            >
              <div className="font-medium text-gray-900">{demo.label}</div>
            </button>
          ))}
          
          <button
            onClick={() => setCurrentDemo(null)}
            className="p-4 bg-red-50 rounded-lg border border-red-200 hover:border-red-400 hover:shadow-md transition-all duration-200 text-center"
          >
            <div className="font-medium text-red-700">Stop Demo</div>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• <strong>Modern & Minimal:</strong> Clean design that matches Swiftly&apos;s professional aesthetic</li>
            <li>• <strong>Context-Aware:</strong> Different icons and messages for different loading contexts</li>
            <li>• <strong>Smooth Animations:</strong> Framer Motion powered transitions and micro-interactions</li>
            <li>• <strong>Progressive Messages:</strong> Dynamic message cycling to keep users engaged</li>
            <li>• <strong>Brand Consistent:</strong> Uses Swiftly&apos;s color scheme and design language</li>
            <li>• <strong>Floating Elements:</strong> Subtle animated background elements for visual interest</li>
            <li>• <strong>Responsive:</strong> Works perfectly on all screen sizes</li>
            <li>• <strong>Performance Optimized:</strong> Lightweight and fast loading</li>
          </ul>
        </div>

        <div className="mt-8 bg-gradient-to-r from-[#111C59] to-[#4F5F73] rounded-xl p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
          <div className="space-y-2 text-sm opacity-90">
            <div><code className="bg-black/20 px-2 py-1 rounded">{'<AppLoadingScreen />'}</code> - App initialization</div>
            <div><code className="bg-black/20 px-2 py-1 rounded">{'<AuthLoadingScreen />'}</code> - Authentication flow</div>
            <div><code className="bg-black/20 px-2 py-1 rounded">{'<TasksLoadingScreen />'}</code> - Task data loading</div>
            <div><code className="bg-black/20 px-2 py-1 rounded">{'<DashboardLoadingScreen />'}</code> - Dashboard preparation</div>
          </div>
        </div>
      </div>

      {/* Render current demo */}
      {currentDemo && (
        <div className="fixed inset-0 z-50">
          {demos.find(demo => demo.key === currentDemo)?.component}
        </div>
      )}
    </div>
  )
}








