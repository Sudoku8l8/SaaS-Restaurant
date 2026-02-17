import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './useAuth';

export interface Floor {
    id: string;
    restaurantId: string;
    name: string;
    order: number;
}

export function useFloors() {
    const { user } = useAuth();
    const [floors, setFloors] = useState<Floor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.restaurantId) {
            setFloors([]);
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, 'floors'),
            where('restaurantId', '==', user.restaurantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as Floor[];

            data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            setFloors(data);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user?.restaurantId]);

    const addFloor = async (name: string) => {
        if (!user?.restaurantId) return;
        const trimmed = name.trim();
        if (!trimmed) return;
        if (floors.some(f => f.name.toLowerCase() === trimmed.toLowerCase())) return;

        await addDoc(collection(db, 'floors'), {
            restaurantId: user.restaurantId,
            name: trimmed,
            order: floors.length,
        });
    };

    const deleteFloor = async (floorId: string) => {
        await deleteDoc(doc(db, 'floors', floorId));
    };

    const renameFloor = async (floorId: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        await updateDoc(doc(db, 'floors', floorId), { name: trimmed });
    };

    // Derive floor names (always include "Principal" as fallback)
    const floorNames = ['Principal', ...floors.filter(f => f.name !== 'Principal').map(f => f.name)];

    return {
        floors,
        floorNames,
        isLoading,
        addFloor,
        deleteFloor,
        renameFloor,
    };
}
