'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface LoadingState {
  isLoading: boolean
  message: string
  type: 'app' | 'auth' | 'tasks' | 'dashboard' | 'custom'
}

interface LoadingContextType {
  loadingState: LoadingState
  setLoading: (isLoading: boolean, message?: string, type?: LoadingState['type']) => void
  showLoading: (message?: string, type?: LoadingState['type']) => void
  hideLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

interface LoadingProviderProps {
  children: ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: 'Loading...',
    type: 'app'
  })

  const setLoading = (isLoading: boolean, message = 'Loading...', type: LoadingState['type'] = 'app') => {
    setLoadingState({
      isLoading,
      message,
      type
    })
  }

  const showLoading = (message = 'Loading...', type: LoadingState['type'] = 'app') => {
    setLoading(true, message, type)
  }

  const hideLoading = () => {
    setLoading(false)
  }

  return (
    <LoadingContext.Provider value={{
      loadingState,
      setLoading,
      showLoading,
      hideLoading
    }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}




