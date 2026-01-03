import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: UserRole[] }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="p-4 text-center">Cargando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect based on role if unauthorized
        if (user.role === UserRole.WAITER) return <Navigate to="/mozo" replace />;
        if (user.role === UserRole.ADMIN) return <Navigate to="/cocina" replace />;
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
