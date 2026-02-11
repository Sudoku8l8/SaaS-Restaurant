import { useState } from 'react';
import { db } from '@/services/firebase/config';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useTables } from '@/hooks/useTables';
import { Button, Input, Card, Badge } from '@/components/shared';
import { X, Plus, LayoutGrid, List as ListIcon } from 'lucide-react';
import { TableMap } from './TableMap';
import type { RestaurantTable } from '@/types';

export function TablesTab() {
    const { user } = useAuth();
    const { tables } = useTables();
    const [newTableNumber, setNewTableNumber] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'plan'>('list');

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

    // Sort tables by number (numeric sort)
    const sortedTables = [...tables].sort((a, b) => {
        return a.number - b.number;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Gestión de Mesas ({tables.length})</h3>
                    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '1rem', background: 'var(--surface-color)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <Button
                            variant={viewMode === 'list' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            style={{ padding: '4px 8px' }}
                        >
                            <ListIcon size={16} />
                        </Button>
                        <Button
                            variant={viewMode === 'plan' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('plan')}
                            style={{ padding: '4px 8px' }}
                        >
                            <LayoutGrid size={16} />
                        </Button>
                    </div>
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

            {viewMode === 'plan' ? (
                <div style={{ height: '700px', background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <TableMap
                        tables={tables}
                        activeOrders={[]}
                        onTableClick={() => { }}
                        onUpdateTable={handleUpdateTablePosition}
                        isEditable={true}
                    />
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                        {sortedTables.map(table => (
                            <Card key={table.id} style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{table.number}</div>
                                <Badge
                                    variant={table.status === 'free' ? 'success' : 'warning'}
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    {table.status === 'free' ? 'Libre' : 'Ocupada'}
                                </Badge>

                                <Button
                                    variant="danger"
                                    size="sm"
                                    style={{ position: 'absolute', top: 5, right: 5, padding: '2px 6px', fontSize: '0.8rem' }}
                                    onClick={() => handleDeleteTable(table.id, table.number)}
                                >
                                    <X size={14} />
                                </Button>
                            </Card>
                        ))}
                    </div>

                    {tables.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                            No hay mesas registradas. Comienza agregando una.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
