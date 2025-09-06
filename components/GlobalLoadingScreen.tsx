'use client'

import { useLoading } from '@/lib/loading-context'
import LoadingScreen from './LoadingScreen'

export default function GlobalLoadingScreen() {
  const { loadingState } = useLoading()
  
  return (
    <LoadingScreen 
      isLoading={loadingState.isLoading}
      message={loadingState.message}
      type={loadingState.type}
    />
  )
}








