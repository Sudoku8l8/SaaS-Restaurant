import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/routes'
import { AuthProvider } from './app/providers/AuthProvider'
import { seedFirestore } from './services/firebase/seeders'
import './index.css'

// Init DB — Only in development
if (import.meta.env.DEV) {
  seedFirestore();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
;
