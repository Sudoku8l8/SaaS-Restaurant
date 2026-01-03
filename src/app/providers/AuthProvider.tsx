import {
    useState,
    useEffect,
    type ReactNode,
} from 'react';
import { db } from '@/local-db';
import type { AuthUser } from '@/types';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load user from session storage on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const storedUserId = sessionStorage.getItem('auth_user_id');
                if (storedUserId) {
                    const dbUser = await db.users.get(storedUserId);
                    if (dbUser && dbUser.active) {
                        setUser({
                            id: dbUser.id,
                            name: dbUser.name,
                            role: dbUser.role,
                            restaurantId: dbUser.restaurantId,
                        });
                    } else {
                        sessionStorage.removeItem('auth_user_id');
                    }
                }
            } catch (err) {
                console.error('Session restoration failed:', err);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    const hashPin = async (pin: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const login = async (pin: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const pinHash = await hashPin(pin);

            // Find user with matching PIN hash
            // Note: In a real multi-tenant app, we would verify against restaurantId too
            // For MVP Sprint 1, we check all users since we seed specific ones
            const users = await db.users.where('pinHash').equals(pinHash).toArray();
            const validUser = users.find(u => u.active);

            if (validUser) {
                const authUser: AuthUser = {
                    id: validUser.id,
                    name: validUser.name,
                    role: validUser.role,
                    restaurantId: validUser.restaurantId,
                };
                setUser(authUser);
                sessionStorage.setItem('auth_user_id', validUser.id);
            } else {
                throw new Error('PIN incorrecto o usuario inactivo');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('auth_user_id');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user,
                isLoading,
                error,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
