export interface GoogleTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
  email?: string
}

export interface DriveFile {
  id: string
  name: string
}
