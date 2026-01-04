import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/Login/LoginPage';
import { MozoPage } from '@/pages/Mozo/MozoPage';
import { CocinaPage } from '@/pages/Cocina/CocinaPage';
import { CierreCajaPage } from '@/pages/CierreCaja/CierreCajaPage';
import { ConfigPage } from '@/pages/Configuracion/ConfigPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { UserRole } from '@/types';

/**
 * Application routes configuration
 * Will be implemented in Sprint 1
 */

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/',
        element: <ProtectedRoute />,
        children: [
            {
                path: '/',
                element: <Navigate to="/mozo" replace />, // Default redirect
            },
            {
                path: 'mozo',
                element: <ProtectedRoute allowedRoles={[UserRole.WAITER, UserRole.ADMIN]} />,
                children: [{ index: true, element: <MozoPage /> }],
            },
            {
                path: 'cocina',
                element: <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />,
                children: [{ index: true, element: <CocinaPage /> }],
            },
            {
                path: 'cierre-caja',
                element: <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />,
                children: [{ index: true, element: <CierreCajaPage /> }],
            },
            {
                path: 'config',
                element: <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />,
                children: [{ index: true, element: <ConfigPage /> }],
            },
        ],
    },
    {
        path: '*',
        element: <NotFoundPage />,
    },
]);
