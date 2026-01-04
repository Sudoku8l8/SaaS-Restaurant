import {
    useState,
    useEffect,
    type ReactNode,
} from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { AuthUser, User } from '@/types';
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
                    const userRef = doc(db, 'users', storedUserId);
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.data() as User | undefined;

                    if (userSnap.exists() && userData) {
                        setUser({
                            id: userSnap.id, // Use doc ID directly
                            name: userData.name,
                            role: userData.role,
                            restaurantId: userData.restaurantId,
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

    const login = async (pin: string, expectedRestaurantId?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // Check against Firestore
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('pinHash', '==', pin));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Find user that matches the PIN AND the restaurant
                const matchingUserDoc = querySnapshot.docs.find(doc => {
                    const data = doc.data() as User;
                    // If expectedRestaurantId is provided, we MUST match it.
                    // If not (legacy/superadmin login?), we might allow any (but risky).
                    // For SaaS, we strictly enforce it.
                    if (expectedRestaurantId) {
                        return data.restaurantId === expectedRestaurantId;
                    }
                    return true;
                });

                if (!matchingUserDoc) {
                    // PIN exists but not for this restaurant
                    throw new Error('PIN incorrecto para este restaurante');
                }

                const validUser = matchingUserDoc.data() as User;

                const authUser: AuthUser = {
                    id: matchingUserDoc.id, // Use doc ID directly
                    name: validUser.name,
                    role: validUser.role,
                    restaurantId: validUser.restaurantId,
                };
                setUser(authUser);
                sessionStorage.setItem('auth_user_id', matchingUserDoc.id);
            } else {
                throw new Error('PIN incorrecto');
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
                login: (pin: string, restaurantId?: string) => login(pin, restaurantId),
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
