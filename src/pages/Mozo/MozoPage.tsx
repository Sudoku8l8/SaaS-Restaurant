import { useState } from 'react';
import { TableCard } from '@/components/features/TableCard';
import { OrderModal } from '@/components/features/OrderModal';
import { TableDetailModal } from '@/components/features/TableDetailModal';
import { Button } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { useTables } from '@/hooks/useTables';
import { useClosureStatus } from '@/hooks/useClosureStatus';
import { seedFirestore } from '@/services/firebase/seeders';
import type { RestaurantTable } from '@/types';

export function MozoPage() {
    const { user, logout } = useAuth();
    const { tables } = useTables(); // Real-time tables from Firestore
    const { isClosed, isLoading: checkingClosure } = useClosureStatus();
    const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleTableClick = (table: RestaurantTable) => {
        // Block new orders if cash box is closed
        if (isClosed && table.status === 'free') {
            alert('⚠️ Caja Cerrada\n\nNo se pueden crear nuevos pedidos hoy.\nContacta al administrador si necesitas reabrir.');
            return;
        }

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

    if (!tables || checkingClosure) return <div className="p-4">Cargando mesas...</div>;

    return (
        <div className="container mt-md">
            {/* Closure Banner */}
            {isClosed && (
                <div style={{
                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)'
                }}>
                    <div>
                        <strong>🔒 CAJA CERRADA</strong>
                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                            Las operaciones del día han sido cerradas. Solo consulta disponible.
                        </p>
                    </div>
                </div>
            )}

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

            {isOrderModalOpen && selectedTable && !isClosed && (
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
