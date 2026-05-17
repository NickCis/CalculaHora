import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '@/lib/google/oauth'
import { readJson } from '@/lib/storage/local-storage'
import { STORAGE_KEYS } from '@/lib/storage/keys'

export function HomePage() {
  if (!isAuthenticated()) return <Navigate to="/connect" replace />
  const last = readJson<string>(STORAGE_KEYS.lastWorkspaceId)
  if (last) return <Navigate to={`/w/${last}/tracker`} replace />
  return <Navigate to="/workspaces" replace />
}
