import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: UserRole[] }) => {
    const { user, isLoading } = useAuth();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
    const basePath = restaurantSlug ? `/${restaurantSlug}` : '';

    if (isLoading) {
        return <div className="p-4 text-center">Cargando...</div>;
    }

    if (!user) {
        return <Navigate to={basePath ? `${basePath}/login` : '/'} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect based on role if unauthorized
        if (user.role === UserRole.WAITER) return <Navigate to={`${basePath}/mozo`} replace />;
        if (user.role === UserRole.ADMIN) return <Navigate to={`${basePath}/admin`} replace />;
        return <Navigate to={`${basePath}/login`} replace />;
    }

    return <Outlet />;
};
