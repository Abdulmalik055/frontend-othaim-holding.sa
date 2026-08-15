'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  seconds: number
  onComplete?: () => void
  restartTrigger?: unknown
  className?: string
}

function format(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const sec = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function AdminCountdownTimer({ seconds, onComplete, restartTrigger, className = '' }: Props) {
  const resetKey = `${seconds}:${String(restartTrigger ?? '')}`

  return (
    <AdminCountdownTimerInner
      key={resetKey}
      seconds={seconds}
      onComplete={onComplete}
      className={className}
    />
  )
}

type AdminCountdownTimerInnerProps = Omit<Props, 'restartTrigger'>

function AdminCountdownTimerInner({ seconds, onComplete, className = '' }: AdminCountdownTimerInnerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (remaining <= 0) {
      onCompleteRef.current?.()
      return
    }
    const timer = setTimeout(() => setRemaining((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining])

  return (
    <span className={`font-bold tabular-nums ${remaining === 0 ? 'text-danger' : 'text-admin-primary'} ${className}`}>
      {format(remaining)}
    </span>
  )
}
