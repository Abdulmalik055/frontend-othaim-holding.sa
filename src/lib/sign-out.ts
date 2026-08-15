export async function signOutWithApi(): Promise<void> {
  const response = await fetch('/api/auth/sign-out', {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Sign-out failed: HTTP ${response.status}`)
  }
}
