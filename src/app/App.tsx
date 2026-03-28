import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider } from './providers/AuthProvider';
import { Toaster } from 'react-hot-toast';

export function App() {
    return (
        <AuthProvider>
            <Toaster position="bottom-center" toastOptions={{ style: { background: 'var(--surface-color)', color: 'var(--text-primary)' } }} />
            <RouterProvider router={router} />
        </AuthProvider>
    );
}
