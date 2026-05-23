import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Bug, LayoutGrid, LogOut } from 'lucide-react'
import { SpreadsheetWorkspaceRepository } from '@/lib/sheets/repository'
import { logout } from '@/lib/google/oauth'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { LanguagePicker } from '@/components/LanguagePicker'
import { RunningTimerDocument } from '@/components/RunningTimerDocument'
import { workspaceContentClass } from '@/lib/layout'

export function WorkspaceLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { spreadsheetId } = useParams()
  const id = spreadsheetId!

  const { data: meta } = useQuery({
    queryKey: ['workspace-meta', id],
    queryFn: () => new SpreadsheetWorkspaceRepository(id).getMeta(),
  })

  const link = (to: string, label: string) => (
    <NavLink
      to={`/w/${id}/${to}`}
      className={({ isActive }) =>
        cn(
          'rounded-md px-3 py-2 text-sm font-medium',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent hover:text-accent-foreground',
        )
      }
    >
      {label}
    </NavLink>
  )

  return (
    <div className="min-h-screen">
      <RunningTimerDocument />
      <header className="border-b border-border px-6 py-4">
        <div className={cn(workspaceContentClass, 'flex flex-wrap items-center justify-between gap-4')}>
          <div>
            <h1 className="text-xl font-semibold">{meta?.name ?? t('common.loading')}</h1>
            <p className="text-xs text-muted-foreground">
              {meta?.timezone ?? '\u00A0'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguagePicker />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => navigate('/workspaces')}
                  aria-label={t('workspaces.switch')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('workspaces.switch')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="size-8" asChild>
                  <a
                    href="https://github.com/NickCis/CalculaHora/issues/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('common.reportBug')}
                  >
                    <Bug className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.reportBug')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                  aria-label={t('common.logout')}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.logout')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <nav className={cn(workspaceContentClass, 'mt-4 flex flex-wrap gap-2')}>
          {link('tracker', t('nav.tracker'))}
          {link('projects', t('nav.projects'))}
          {link('reports', t('nav.reports'))}
          {link('settings', t('nav.settings'))}
        </nav>
      </header>
      <main className={cn(workspaceContentClass, 'p-6')}>
        <Outlet />
      </main>
    </div>
  )
}
