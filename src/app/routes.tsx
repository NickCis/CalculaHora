import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isAuthenticated } from '@/lib/google/oauth'
import { ConnectPage } from '@/features/auth/ConnectPage'
import { OAuthCallbackPage } from '@/features/auth/OAuthCallbackPage'
import { WorkspacesPage } from '@/features/workspaces/WorkspacesPage'
import { WorkspaceLayout } from '@/features/workspace/WorkspaceLayout'
import { TrackerPage } from '@/features/tracker/TrackerPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { WorkspaceSettingsPage } from '@/features/workspace/WorkspaceSettingsPage'
import { PrivacyPage } from '@/features/legal/PrivacyPage'
import { TermsPage } from '@/features/legal/TermsPage'
import { HomePage } from './HomePage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/connect" replace />
  return children
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/connect" element={<ConnectPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route
          path="/workspaces"
          element={
            <RequireAuth>
              <WorkspacesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/w/:spreadsheetId"
          element={
            <RequireAuth>
              <WorkspaceLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="tracker" replace />} />
          <Route path="tracker" element={<TrackerPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<WorkspaceSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
