'use client'

import { ReactNode } from 'react'
import { SWRConfig } from 'swr'

// Global SWR configuration
const swrConfig = {
  // Cache data for 5 minutes
  dedupingInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
  
  // Revalidate data when window becomes visible again
  revalidateOnFocus: true,
  
  // Revalidate data when reconnecting to network
  revalidateOnReconnect: true,
  
  // Always revalidate on mount for fresh data
  revalidateOnMount: true,
  
  // Retry on error
  errorRetryCount: 3,
  errorRetryInterval: 1000, // 1 second
  
  // Global error handler
  onError: (error: any, key: string) => {
    console.error('SWR Error:', error, 'Key:', key)
  },
  
  // Global success handler for debugging
  onSuccess: (data: any, key: string) => {
    if (key.includes('tasks')) {
      console.log('SWR Cache Hit:', key, 'Data length:', Array.isArray(data) ? data.length : 'Not an array')
    }
  },
  
  // Refresh interval (5 minutes)
  refreshInterval: 5 * 60 * 1000,
}

interface CacheProviderProps {
  children: ReactNode
}

export function CacheProvider({ children }: CacheProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  )
}

// Cache key generators for consistent keys across the app
export const getCacheKey = {
  tasks: (userId: string) => `tasks-${userId}`,
  profile: (userId: string) => `profile-${userId}`,
  session: () => 'auth-session',
  userContext: (userId: string) => `user-context-${userId}`,
}
