import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { LanguagePicker } from '@/components/LanguagePicker'

type LegalPageLayoutProps = {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Clock className="size-5" aria-hidden />
            </div>
            <span className="text-lg font-semibold tracking-tight">{t('app.name')}</span>
          </Link>
          <LanguagePicker />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground hover:underline">
            {t('legal.backToHome')}
          </Link>
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{lastUpdated}</p>
        <article className="mt-10 space-y-8 text-foreground">{children}</article>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 py-6 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground hover:underline">
            {t('legal.privacyLink')}
          </Link>
          <span aria-hidden>·</span>
          <Link to="/terms" className="hover:text-foreground hover:underline">
            {t('legal.termsLink')}
          </Link>
          <span aria-hidden>·</span>
          <Link to="/" className="hover:text-foreground hover:underline">
            {t('legal.backToHome')}
          </Link>
        </div>
      </footer>
    </div>
  )
}
