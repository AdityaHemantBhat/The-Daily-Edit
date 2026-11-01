import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { Router } from './app/router'
import { AuthProvider } from './application/state/authContext'
import { RealtimeProvider } from './app/providers/RealtimeProvider'
import { usePublicSettings } from './application/hooks/usePublicData'
import { getAdminPath } from './app/config/adminPath'

// The Router mounts after settings hydrate (instantly from localStorage) so a
// customized admin URL matches on first navigation.
function AppShell() {
  const { data } = usePublicSettings();
  const adminPath = data?.site?.adminPath ?? getAdminPath();
  return (
    <BrowserRouter>
      <AuthProvider>
        <Router adminPath={adminPath} />
      </AuthProvider>
    </BrowserRouter>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider>
        <AppShell />
      </RealtimeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
