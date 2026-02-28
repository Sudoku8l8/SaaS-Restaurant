import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/Login/LoginPage';
import { MozoPage } from '@/pages/Mozo/MozoPage';
import { CocinaPage } from '@/pages/Cocina/CocinaPage';
import { CierreCajaPage } from '@/pages/CierreCaja/CierreCajaPage';
import { CajaChicaPage } from '@/pages/CajaChica/CajaChicaPage';
import { ConfigPage } from '@/pages/Configuracion/ConfigPage';
import { AdminPage } from '@/pages/Admin/AdminPage';
import { InventoryPage } from '@/pages/Admin/InventoryPage';
import { ReportesPage } from '@/pages/Reportes/ReportesPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DigitalMenuPage } from '@/pages/Public/DigitalMenuPage';
import { DigitalCheckoutPage } from '@/pages/Public/DigitalCheckoutPage';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { UserRole } from '@/types';

/**
 * Application routes configuration
 * Will be implemented in Sprint 1
 */

import { LandingPage } from '@/pages/Landing/LandingPage';
import { TenantProvider } from '@/app/providers/TenantProvider';
import { Outlet } from 'react-router-dom';

import { SuperAdminPage } from '@/pages/SuperAdmin/SuperAdminPage';
import { SuperAdminAuthProvider } from '@/hooks/useSuperAdminAuth';
import { TermsPage } from '@/pages/Public/TermsPage';
import { PrivacyPage } from '@/pages/Public/PrivacyPage';

export const router = createBrowserRouter([
    {
        path: '/superadmin',
        element: (
            <SuperAdminAuthProvider>
                <SuperAdminPage />
            </SuperAdminAuthProvider>
        ),
    },
    {
        path: '/terminos',
        element: <TermsPage />,
    },
    {
        path: '/privacidad',
        element: <PrivacyPage />,
    },
    {
        path: '/',
        element: <LandingPage />,
    },
    {
        path: '/:restaurantSlug',
        element: (
            <TenantProvider>
                <Outlet />
            </TenantProvider>
        ),
        children: [
            {
                path: 'login',
                element: <LoginPage />,
            },
            {
                path: 'menu/:tableNumber?',
                element: <DigitalMenuPage />,
            },
            {
                path: 'menu/checkout',
                element: <DigitalCheckoutPage />,
            },
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        index: true,
                        element: <Navigate to="mozo" replace />,
                    },
                    {
                        path: 'mozo',
                        element: <ProtectedRoute allowedRoles={[UserRole.WAITER, UserRole.ADMIN, UserRole.SHIFT_MANAGER]} />,
                        children: [{ index: true, element: <MozoPage /> }],
                    },
                    {
                        path: 'cocina',
                        element: <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CHEF]} />,
                        children: [{ index: true, element: <CocinaPage /> }],
                    },
                    {
                        path: 'admin',
                        element: <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />,
                        children: [{ index: true, element: <AdminPage /> }],
                    },
                    {
                        path: 'reportes',
                        element: <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />,
                        children: [{ index: true, element: <ReportesPage /> }],
                    },
                    {
                        path: 'cierre-caja',
                        element: <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />,
                        children: [{ index: true, element: <CierreCajaPage /> }],
                    },
                    {
                        path: 'caja-chica',
                        element: <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.WAITER, UserRole.CHEF, UserRole.SHIFT_MANAGER]} />,
                        children: [{ index: true, element: <CajaChicaPage /> }],
                    },
                    {
                        path: 'inventario',
                        element: <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />,
                        children: [{ index: true, element: <InventoryPage /> }],
                    },
                    {
                        path: 'config',
                        element: <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />,
                        children: [{ index: true, element: <ConfigPage /> }],
                    },
                ],
            },
        ],
    },
    {
        path: '*',
        element: <NotFoundPage />,
    },
]);
