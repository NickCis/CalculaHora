import { Providers } from '@/app/providers'
import { AppRoutes } from '@/app/routes'
import '@/i18n'

export default function App() {
  return (
    <Providers>
      <AppRoutes />
    </Providers>
  )
}
