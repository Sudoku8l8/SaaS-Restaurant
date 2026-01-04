import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import type { Restaurant } from '@/types';

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
                    setTenant({ id: docSnap.id, ...docSnap.data() } as Restaurant);
                    setError(null);
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
