import { useState } from 'react';
import { TableCard } from '@/components/features/TableCard';
import { OrderModal } from '@/components/features/OrderModal';
import { TableDetailModal } from '@/components/features/TableDetailModal';
import { Button } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { useTables } from '@/hooks/useTables';
import { seedFirestore } from '@/services/firebase/seeders';
import type { RestaurantTable } from '@/types';

export function MozoPage() {
    const { user, logout } = useAuth();
    const { tables } = useTables(); // Real-time tables from Firestore
    const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleTableClick = (table: RestaurantTable) => {
        if (table.status === 'free') {
            setSelectedTable(table);
            setIsOrderModalOpen(true);
        } else if (table.status === 'occupied') {
            setSelectedTable(table);
            setIsDetailModalOpen(true);
        }
    };

    const handleCloseOrderModal = () => {
        setIsOrderModalOpen(false);
        setSelectedTable(null);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTable(null);
    };

    if (!tables) return <div className="p-4">Cargando mesas...</div>;

    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Mesas - Salón Principal</h1>
                    <p>Hola, {user?.name}</p>
                </div>
                <Button variant="secondary" onClick={logout}>
                    Cerrar Sesión
                </Button>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1.5rem'
            }}>
                {tables.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                        <p>No se encontraron mesas.</p>
                        <Button
                            variant="primary"
                            onClick={() => {
                                localStorage.removeItem('db_seeded'); // Reset cache
                                seedFirestore().then(() => window.location.reload());
                            }}
                        >
                            Inicializar Base de Datos (Seeder)
                        </Button>
                    </div>
                )}

                {tables.sort((a, b) => a.number - b.number).map(table => (
                    <TableCard
                        key={table.id}
                        table={table}
                        onClick={() => handleTableClick(table)}
                    />
                ))}
            </div>

            {isOrderModalOpen && selectedTable && (
                <OrderModal
                    table={selectedTable}
                    onClose={handleCloseOrderModal}
                    onOrderCreated={handleCloseOrderModal}
                />
            )}

            {isDetailModalOpen && selectedTable && (
                <TableDetailModal
                    table={selectedTable}
                    onClose={handleCloseDetailModal}
                />
            )}
        </div>
    );
}
