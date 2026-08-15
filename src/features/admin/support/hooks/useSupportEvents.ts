'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

function getSessionToken(): string | null {
  if (typeof document === 'undefined') return null
  for (const cookie of document.cookie.split(';')) {
    const [name, value] = cookie.trim().split('=')
    if (
      name === 'better-auth.session_token' ||
      name === '__Secure-better-auth.session_token'
    ) {
      return decodeURIComponent(value ?? '')
    }
  }
  return null
}

export function useSupportEvents(enabled = true) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const abortController = new AbortController()
    let retryTimeout: ReturnType<typeof setTimeout>

    async function connect() {
      const token = getSessionToken()

      try {
        const response = await fetch(
          `${window.location.origin}/api/admin/support-tickets/events`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: 'include',
            signal: abortController.signal,
          }
        )

        if (response.status === 401 || response.status === 403) return

        if (!response.ok || !response.body) {
          retryTimeout = setTimeout(connect, 5000)
          return
        }

        const reader  = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer    = ''
        let eventType = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
              if (eventType === 'new-ticket') {
                queryClient.invalidateQueries({ queryKey: ['admin', 'support'] })
              }
            } else if (line === '') {
              eventType = ''
            }
          }
        }

        // Stream ended — reconnect
        if (!abortController.signal.aborted) {
          retryTimeout = setTimeout(connect, 3000)
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        retryTimeout = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      abortController.abort()
      clearTimeout(retryTimeout)
    }
  }, [enabled, queryClient])
}
