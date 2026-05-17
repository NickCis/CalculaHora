import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { SpreadsheetWorkspaceRepository } from '@/lib/sheets/repository'

export function useWorkspaceId(): string {
  const { spreadsheetId } = useParams()
  if (!spreadsheetId) throw new Error('Missing workspace id')
  return spreadsheetId
}

export function useWorkspaceRepo(): SpreadsheetWorkspaceRepository {
  const id = useWorkspaceId()
  return useMemo(() => new SpreadsheetWorkspaceRepository(id), [id])
}
