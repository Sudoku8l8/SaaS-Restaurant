import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/local-db';
import { useAuth } from '@/hooks/useAuth';
import { TableCard } from '@/components/features/TableCard';
import { OrderModal } from '@/components/features/OrderModal';
import { Button } from '@/components/shared';
import type { RestaurantTable } from '@/types';

export function MozoPage() {
    const { user, logout } = useAuth();
    const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

    // Fetch tables reactively
    const tables = useLiveQuery(
        () => db.restaurantTables
            .where('restaurantId')
            .equals(user?.restaurantId || '')
            .sortBy('number')
    );

    const handleTableClick = (table: RestaurantTable) => {
        if (table.status === 'free') {
            setSelectedTable(table);
        } else {
            // TODO: Handle viewing existing orders/payments (Next Sprint)
            alert(`Mesa ${table.number} ocupada. Ver detalle en próximo sprint.`);
        }
    };

    if (!tables) return <div className="p-4">Cargando mesas...</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Salón Principal</h1>
                    <p>Hola, {user?.name}</p>
                </div>
                <Button variant="secondary" onClick={logout} size="sm">
                    Cerrar Sesión
                </Button>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '1.5rem'
            }}>
                {tables.map(table => (
                    <TableCard
                        key={table.id}
                        table={table}
                        onClick={handleTableClick}
                    />
                ))}
            </div>

            {selectedTable && (
                <OrderModal
                    table={selectedTable}
                    onClose={() => setSelectedTable(null)}
                    onOrderCreated={() => setSelectedTable(null)}
                />
            )}
        </div>
    );
}
