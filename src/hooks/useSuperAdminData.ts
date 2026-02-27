import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import type { Restaurant } from '@/types';

export function useSuperAdminData() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'premium' | 'basic'>('all');

    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, 'restaurants'));
            const data: Restaurant[] = [];
            querySnapshot.forEach((docSnap) => {
                data.push({ id: docSnap.id, ...docSnap.data() } as Restaurant);
            });
            // Sort by created date descending (newest first)
            data.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
            setRestaurants(data);
        } catch (error) {
            console.error("Error fetching restaurants:", error);
            alert("Error al cargar restaurantes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            // Optimistic Update
            setRestaurants(prev => prev.map(r => r.id === id ? { ...r, active: !currentStatus } : r));
            await updateDoc(doc(db, 'restaurants', id), { active: !currentStatus });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error al actualizar estado");
            // Revert on error
            setRestaurants(prev => prev.map(r => r.id === id ? { ...r, active: currentStatus } : r));
        }
    };

    const toggleDigitalMenu = async (id: string, currentStatus: boolean) => {
        try {
            setRestaurants(prev => prev.map(r => r.id === id ? { ...r, features: { ...r.features, digitalMenu: !currentStatus } } : r));
            await updateDoc(doc(db, 'restaurants', id), { 'features.digitalMenu': !currentStatus });
        } catch (error) {
            console.error("Error toggling digital menu:", error);
            alert("Error al cambiar menú digital");
            setRestaurants(prev => prev.map(r => r.id === id ? { ...r, features: { ...r.features, digitalMenu: currentStatus } } : r));
        }
    };

    const changePlan = async (id: string, currentPlan: 'basic' | 'premium', name: string) => {
        const newPlan = currentPlan === 'premium' ? 'basic' : 'premium';
        const action = newPlan === 'premium' ? 'SUBIR a Premium' : 'BAJAR a Basic';

        if (!window.confirm(`¿Confirmas ${action} para "${name}"?${newPlan === 'basic' ? '\n\n⚠️ El Menú Digital será desactivado automáticamente.' : ''}`)) return;

        try {
            const updates: Record<string, unknown> = { plan: newPlan };
            if (newPlan === 'basic') updates['features.digitalMenu'] = false;
            else updates['features.digitalMenu'] = true;

            // Optimistic update
            setRestaurants(prev => prev.map(r => r.id === id ? {
                ...r, plan: newPlan, features: { ...r.features, digitalMenu: newPlan === 'premium' }
            } : r));

            await updateDoc(doc(db, 'restaurants', id), updates);
            // alert(`Plan actualizado a ${newPlan.toUpperCase()} para "${name}".`);
        } catch (error) {
            console.error("Error changing plan:", error);
            alert("Error al cambiar el plan");
            fetchRestaurants(); // Revert completely
        }
    };

    const renewSubscription = async (id: string) => {
        const daysStr = window.prompt("¿Cuántos días quieres agregar a la suscripción?");
        if (!daysStr) return;
        const days = parseInt(daysStr, 10);
        if (isNaN(days) || days <= 0) {
            alert("Días inválidos.");
            return;
        }

        try {
            const currentDoc = restaurants.find(r => r.id === id);
            if (!currentDoc) return;

            let newDate = new Date(); // From today
            if (currentDoc.subscriptionEndsAt) {
                const currentEnd = new Date(currentDoc.subscriptionEndsAt.seconds ? currentDoc.subscriptionEndsAt.seconds * 1000 : currentDoc.subscriptionEndsAt);
                if (currentEnd > new Date()) {
                    newDate = currentEnd; // Add to existing time if not expired
                }
            }
            newDate.setDate(newDate.getDate() + days);

            // Optimistic
            setRestaurants(prev => prev.map(r => r.id === id ? { ...r, subscriptionEndsAt: newDate as any } : r));

            await updateDoc(doc(db, 'restaurants', id), {
                subscriptionEndsAt: newDate
            });
            alert(`Suscripción renovada por ${days} días.`);
        } catch (error) {
            console.error("Error renewing:", error);
            alert("Error al renovar suscripción");
            fetchRestaurants();
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`¿ESTÁS SEGURO de eliminar el restaurante "${name}"? Esta acción borra el documento de Firestore de forma permanente.`)) return;

        try {
            setRestaurants(prev => prev.filter(r => r.id !== id));
            await deleteDoc(doc(db, 'restaurants', id));
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Error al eliminar restaurante");
            fetchRestaurants();
        }
    };

    const filteredRestaurants = useMemo(() => {
        let result = restaurants;

        // Apply Status Filter
        if (statusFilter === 'active') result = result.filter(r => r.active);
        if (statusFilter === 'inactive') result = result.filter(r => !r.active);
        if (statusFilter === 'premium') result = result.filter(r => r.plan === 'premium');
        if (statusFilter === 'basic') result = result.filter(r => r.plan === 'basic');

        // Apply Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.name.toLowerCase().includes(query) ||
                r.id.toLowerCase().includes(query)
            );
        }

        return result;
    }, [restaurants, statusFilter, searchQuery]);


    return {
        restaurants: filteredRestaurants,
        totalRestaurants: restaurants.length,
        loading,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        toggleActive,
        toggleDigitalMenu,
        changePlan,
        renewSubscription,
        handleDelete
    };
}
