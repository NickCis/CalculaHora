import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  Clock,
  Download,
  ExternalLink,
  FolderKanban,
  Shield,
  Sheet,
  Sparkles,
} from 'lucide-react'
import { startGoogleLogin, getStoredTokens, logout } from '@/lib/google/oauth'
import { LanguagePicker } from '@/components/LanguagePicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const FEATURES = [
  { key: 'timer', icon: Clock },
  { key: 'projects', icon: FolderKanban },
  { key: 'reports', icon: BarChart3 },
  { key: 'sheets', icon: Sheet },
  { key: 'export', icon: Download },
  { key: 'privacy', icon: Shield },
] as const

const STEPS = ['connect', 'workspace', 'track'] as const

const REPO_URL = 'https://github.com/NickCis/CalculaHora'

export function ConnectPage() {
  const { t } = useTranslation()
  const tokens = getStoredTokens()
  const isConnected = Boolean(tokens)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Clock className="size-5" aria-hidden />
            </div>
            <span className="text-lg font-semibold tracking-tight">{t('app.name')}</span>
          </div>
          <LanguagePicker />
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--color-muted),transparent)]"
          />
          <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground">
                <Sparkles className="size-3.5" aria-hidden />
                {t('landing.badge')}
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {t('landing.heroTitle')}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
                {t('landing.heroSubtitle')}
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                {isConnected ? (
                  <Button size="lg" asChild>
                    <Link to="/workspaces">{t('landing.continue')}</Link>
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => void startGoogleLogin()}>
                    {t('auth.connect')}
                  </Button>
                )}
                {isConnected && tokens?.email && (
                  <p className="text-sm text-muted-foreground">
                    {t('auth.connectedAs', { email: tokens.email })}
                  </p>
                )}
              </div>
              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <li>{t('landing.trust.free')}</li>
                <li className="hidden sm:inline">{t('landing.trust.noCard')}</li>
                <li>{t('landing.trust.openSource')}</li>
                <li>{t('landing.trust.ownership')}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('landing.featuresTitle')}
            </h2>
            <p className="mt-3 text-muted-foreground">{t('landing.featuresSubtitle')}</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, icon: Icon }) => (
              <Card key={key} className="border bg-card/50">
                <CardContent className="pt-6">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-foreground" aria-hidden />
                  </div>
                  <h3 className="font-medium">{t(`landing.features.${key}.title`)}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t(`landing.features.${key}.description`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('landing.howTitle')}
              </h2>
              <p className="mt-3 text-muted-foreground">{t('landing.howSubtitle')}</p>
            </div>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step} className="text-center">
                  <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-medium">{t(`landing.steps.${step}.title`)}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t(`landing.steps.${step}.description`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <Card className="overflow-hidden border-0 bg-primary text-primary-foreground">
            <CardContent className="px-6 py-10 text-center sm:px-10 sm:py-12">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('landing.ctaTitle')}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
                {t('landing.ctaSubtitle')}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {isConnected ? (
                  <Button size="lg" variant="secondary" asChild>
                    <Link to="/workspaces">{t('landing.continue')}</Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => void startGoogleLogin()}
                  >
                    {t('auth.connect')}
                  </Button>
                )}
                {isConnected && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    onClick={logout}
                  >
                    {t('common.logout')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-muted-foreground">
          <p>{t('app.tagline')}</p>
          <p className="mt-1">{t('landing.footerNote')}</p>
          <p className="mt-3 inline-flex items-center justify-center gap-1.5">
            <ExternalLink className="size-4" aria-hidden />
            <span>{t('landing.openSource')}</span>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
