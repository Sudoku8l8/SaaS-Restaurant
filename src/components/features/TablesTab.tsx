import { useState } from 'react';
import { db } from '@/services/firebase/config';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useTables } from '@/hooks/useTables';
import { Button, Input } from '@/components/shared';
import { Plus } from 'lucide-react';
import { TableMap } from './TableMap';
import type { RestaurantTable } from '@/types';

export function TablesTab() {
    const { user } = useAuth();
    const { tables } = useTables();
    const [newTableNumber, setNewTableNumber] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleAddTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTableNumber) return;

        try {
            setIsCreating(true);
            await addDoc(collection(db, 'tables'), {
                restaurantId: user?.restaurantId,
                number: parseInt(newTableNumber, 10),
                status: 'free'
            });
            setNewTableNumber('');
        } catch (error) {
            console.error("Error adding table:", error);
            alert("Error al crear mesa");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteTable = async (id: string, number: number) => {
        if (confirm(`¿Eliminar Mesa ${number}?`)) {
            try {
                await deleteDoc(doc(db, 'tables', id));
            } catch (error) {
                console.error("Error deleting table:", error);
                alert("Error al eliminar mesa");
            }
        }
    };

    const handleUpdateTablePosition = async (id: string, updates: Partial<RestaurantTable>) => {
        try {
            const tableRef = doc(db, 'tables', id);
            await updateDoc(tableRef, updates);
        } catch (error) {
            console.error("Error updating table position:", error);
        }
    };


    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Gestión de Mesas ({tables.length})</h3>
                </div>

                <form onSubmit={handleAddTable} style={{ display: 'flex', gap: '0.5rem' }}>
                    <Input
                        placeholder="N° Mesa"
                        value={newTableNumber}
                        onChange={e => setNewTableNumber(e.target.value)}
                        style={{ width: '100px' }}
                    />
                    <Button type="submit" disabled={!newTableNumber || isCreating} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={16} /> Agregar
                    </Button>
                </form>
            </div>

            <div style={{ height: '700px', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <TableMap
                    tables={tables}
                    activeOrders={[]}
                    onTableClick={() => { }}
                    onUpdateTable={handleUpdateTablePosition}
                    onDeleteTable={handleDeleteTable}
                    isEditable={true}
                />
            </div>

            {tables.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                    No hay mesas registradas. Comienza agregando una.
                </div>
            )}
        </div>
    );
}
