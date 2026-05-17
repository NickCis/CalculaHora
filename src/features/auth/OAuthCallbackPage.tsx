import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { handleOAuthCallback } from '@/lib/google/oauth'
import { ensureAppFolder } from '@/lib/google/drive'

export function OAuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = params.get('code')
    const err = params.get('error')
    if (err) {
      setError(err)
      return
    }
    if (!code) {
      setError('missing_code')
      return
    }

    void (async () => {
      try {
        await handleOAuthCallback(code)
        await ensureAppFolder()
        navigate('/workspaces', { replace: true })
      } catch (e) {
        setError(e instanceof Error ? e.message : t('common.error'))
      }
    })()
  }, [params, navigate, t])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      {error ? (
        <p className="text-destructive">{error}</p>
      ) : (
        <p>{t('common.loading')}</p>
      )}
    </div>
  )
}
