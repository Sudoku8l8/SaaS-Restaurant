import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/routes'
import { AuthProvider } from './app/providers/AuthProvider'
import { GlobalErrorBoundary, ToastProvider } from './components/shared'
import { seedFirestore } from './services/firebase/seeders'
import './i18n'; // i18n internalization
import './index.css'

// Init DB — Only in development
if (import.meta.env.DEV) {
  seedFirestore();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);

