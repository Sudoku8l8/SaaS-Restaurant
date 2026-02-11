import { useState, useEffect, type ReactNode } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import type { AuthUser, User } from '@/types';
import { AuthContext } from './AuthContext';
import { hashPin } from '@/utils/crypto';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load user from session storage on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const storedUserId = localStorage.getItem('auth_user_id');
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
                        localStorage.removeItem('auth_user_id');
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
            if (!expectedRestaurantId) {
                throw new Error('ID de restaurante requerido');
            }

            // 1. Fetch users for this specific restaurant
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('restaurantId', '==', expectedRestaurantId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('Restaurante no tiene usuarios configurados');
            }

            // 2. Hash the input PIN for comparison
            const inputHash = await hashPin(pin);

            // 3. Find the matching user
            let matchingUserDoc = null;
            let needsMigration = false;

            for (const userDoc of querySnapshot.docs) {
                const data = userDoc.data() as User;

                // Try modern hash check first
                if (data.pinHash === inputHash) {
                    matchingUserDoc = userDoc;
                    break;
                }

                // Try legacy plain-text check for migration
                if (data.pinHash === pin) {
                    matchingUserDoc = userDoc;
                    needsMigration = true;
                    break;
                }
            }

            if (matchingUserDoc) {
                const validUser = matchingUserDoc.data() as User;

                // 4. Auto-migration to Hash if needed
                if (needsMigration) {
                    console.log('Migrating user PIN to secure hash...');
                    await updateDoc(matchingUserDoc.ref, {
                        pinHash: inputHash
                    });
                }

                const authUser: AuthUser = {
                    id: matchingUserDoc.id,
                    name: validUser.name,
                    role: validUser.role,
                    restaurantId: validUser.restaurantId,
                };
                setUser(authUser);
                localStorage.setItem('auth_user_id', matchingUserDoc.id);
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
        localStorage.removeItem('auth_user_id');
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
