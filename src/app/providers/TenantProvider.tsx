import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import type { Restaurant } from '@/types';
import { SubscriptionExpiredPage } from '@/pages/Public/SubscriptionExpiredPage';

import { getPeruNow } from '@/utils/dateUtils';

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
        if (!restaurantSlug) {
            setIsLoading(false);
            setTenant(null);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        // For MVP SaaS, we treat the SLUG as the Firebase Document ID directly.
        const docRef = doc(db, 'restaurants', restaurantSlug);

        // Subscribe to real-time changes
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const restaurantData = { id: docSnap.id, ...data } as Restaurant;

                // 1. Check if manually deactivated
                if (data.active === false) {
                    setTenant(null);
                    setError('ESTE RESTAURANTE ESTÁ INACTIVO. El servicio ha sido suspendido por el administrador.');
                    setIsLoading(false);
                    return;
                }

                // 2. Check for expiration
                let isExpired = false;
                const now = getPeruNow();

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

                if (isExpired) {
                    setTenant(null);
                    setError('LA SUSCRIPCIÓN HA VENCIDO. Para continuar usando el servicio debe renovar su plan.');
                } else {
                    setTenant(restaurantData);
                    setError(null);
                }
            } else {
                console.warn(`Tenant not found for slug: ${restaurantSlug}`);
                setError('Restaurante no encontrado');
                setTenant(null);
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Error subscribing to tenant:", err);
            setError('Error de conexión al cargar restaurante');
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantSlug]);

    // ... (existing code)

    if (error !== null) {
        return <SubscriptionExpiredPage error={error} />;
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
