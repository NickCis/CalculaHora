import { useTranslation } from 'react-i18next'
import { startGoogleLogin, getStoredTokens, logout } from '@/lib/google/oauth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ConnectPage() {
  const { t } = useTranslation()
  const tokens = getStoredTokens()

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('auth.title')}</CardTitle>
          <CardDescription>{t('auth.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {tokens?.email && (
            <p className="text-sm text-muted-foreground">
              {t('auth.connectedAs', { email: tokens.email })}
            </p>
          )}
          <Button onClick={() => void startGoogleLogin()}>{t('auth.connect')}</Button>
          {tokens && (
            <Button variant="outline" onClick={logout}>
              {t('common.logout')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
