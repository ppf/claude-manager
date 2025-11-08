import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

interface LoadingStateProps {
  isLoading: boolean
  children: React.ReactNode
  spinner?: React.ReactNode
  delay?: number
}

export function LoadingState({
  isLoading,
  children,
  spinner = <LoadingSpinner />,
  delay = 200,
}: LoadingStateProps) {
  const [showLoading, setShowLoading] = React.useState(false)

  React.useEffect(() => {
    if (!isLoading) {
      setShowLoading(false)
      return
    }

    // Delay showing loading indicator
    const timer = setTimeout(() => {
      setShowLoading(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [isLoading, delay])

  if (showLoading) {
    return <div className="flex items-center justify-center p-4">{spinner}</div>
  }

  return <>{children}</>
}

