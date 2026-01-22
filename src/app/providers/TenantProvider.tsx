import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import type { Restaurant } from '@/types';
import { SubscriptionExpiredPage } from '@/pages/Public/SubscriptionExpiredPage';

interface TenantContextType {
    tenant: Restaurant | null;
    isLoading: boolean;
    error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
    // Note: This relies on the Route structure /:restaurantSlug/*
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();

    const [tenant, setTenant] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTenant = async () => {
            // Reset state on slug change
            setTenant(null);
            setError(null);

            if (!restaurantSlug) {
                // If no slug in URL (e.g. Landing Page), do nothing or set loading false
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                // For MVP SaaS, we treat the SLUG as the Firebase Document ID directly.
                // In future, we could query where('slug', '==', restaurantSlug)
                const docRef = doc(db, 'restaurants', restaurantSlug);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const restaurantData = { id: docSnap.id, ...data } as Restaurant;

                    // Check logic for expiration
                    // 1. If subscriptionEndsAt is set, check if it's past
                    // 2. If not, check if createdAt + 28 days is past (Trial)
                    let isExpired = false;
                    const now = new Date();

                    if (data.subscriptionEndsAt) {
                        const endDate = data.subscriptionEndsAt.seconds ? new Date(data.subscriptionEndsAt.seconds * 1000) : new Date(data.subscriptionEndsAt);
                        if (now > endDate) isExpired = true;
                    } else {
                        // Trial Logic (28 days)
                        const createdAt = data.createdAt.seconds ? new Date(data.createdAt.seconds * 1000) : new Date(data.createdAt);
                        const diffTime = now.getTime() - createdAt.getTime();
                        const diffDays = diffTime / (1000 * 3600 * 24);
                        if (diffDays > 28) isExpired = true;
                    }

                    // Strict Block if expired
                    if (isExpired) {
                        setTenant(null); // Or keep it null to block access
                        setError('EL PERIODO DE PRUEBA HA TERMINADO. Contacte a soporte.');
                    } else {
                        setTenant(restaurantData);
                        setError(null);
                    }

                } else {
                    console.warn(`Tenant not found for slug: ${restaurantSlug}`);
                    setError('Restaurante no encontrado');
                    setTenant(null);
                }
            } catch (err) {
                console.error("Error loading tenant:", err);
                setError('Error de conexión al cargar restaurante');
            } finally {
                setIsLoading(false);
            }
        };

        loadTenant();
    }, [restaurantSlug]);

    // ... (existing code)

    if (error === 'EL PERIODO DE PRUEBA HA TERMINADO. Contacte a soporte.') {
        return <SubscriptionExpiredPage />;
    }

    return (
        <TenantContext.Provider value={{ tenant, isLoading, error }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
