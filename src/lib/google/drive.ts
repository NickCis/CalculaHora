import { STORAGE_KEYS } from '@/lib/storage/keys'
import { readJson, writeJson } from '@/lib/storage/local-storage'
import { googleJson } from './api'
import type { DriveFile } from './types'

const APP_FOLDER_NAME = 'CalculaHora'
const SPREADSHEET_MIME = 'application/vnd.google-apps.spreadsheet'

interface FilesListResponse {
  files?: Array<{ id: string; name: string }>
}

interface FileResponse {
  id: string
  name: string
}

export async function ensureAppFolder(): Promise<string> {
  const cached = readJson<string>(STORAGE_KEYS.appFolderId)
  if (cached) return cached

  const q = encodeURIComponent(
    `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  )
  const list = await googleJson<FilesListResponse>(
    `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,name)`,
  )

  if (list.files?.[0]) {
    writeJson(STORAGE_KEYS.appFolderId, list.files[0].id)
    return list.files[0].id
  }

  const created = await googleJson<FileResponse>(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: APP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    },
  )

  writeJson(STORAGE_KEYS.appFolderId, created.id)
  return created.id
}

export async function listWorkspaces(): Promise<DriveFile[]> {
  const folderId = await ensureAppFolder()
  const q = encodeURIComponent(
    `'${folderId}' in parents and mimeType='${SPREADSHEET_MIME}' and trashed=false`,
  )
  const list = await googleJson<FilesListResponse>(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&fields=files(id,name)`,
  )
  return (list.files ?? []).map((f) => ({ id: f.id, name: f.name }))
}

export async function createSpreadsheet(name: string): Promise<DriveFile> {
  const folderId = await ensureAppFolder()
  const file = await googleJson<FileResponse>(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: SPREADSHEET_MIME,
        parents: [folderId],
      }),
    },
  )
  return { id: file.id, name: file.name }
}

export async function getFileName(fileId: string): Promise<string> {
  const file = await googleJson<FileResponse>(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name`,
  )
  return file.name
}
