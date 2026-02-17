import { useState, useMemo } from 'react';
import { X, UtensilsCrossed, Layers } from 'lucide-react';
import { TableCard } from '@/components/features/TableCard';
import { useFloors } from '@/hooks/useFloors';
import type { RestaurantTable, Order } from '@/types';

interface TableSelectorModalProps {
    tables: RestaurantTable[];
    activeOrders: Order[] | undefined;
    onTableClick: (table: RestaurantTable) => void;
    onClose: () => void;
}

/**
 * Modal overlay showing a responsive grid of tables filtered by FLOOR.
 * Used by CocinaPage via OrderFAB.
 */
export function TableSelectorModal({
    tables,
    activeOrders,
    onTableClick,
    onClose,
}: TableSelectorModalProps) {
    const { floorNames } = useFloors();
    const [activeFloor, setActiveFloor] = useState('Principal');

    const physicalTables = tables.filter(t => t.number > 0);
    const takeoutCards = tables.filter(t => t.number === 0);

    // Derived active floor
    const currentFloor = floorNames.includes(activeFloor) ? activeFloor : 'Principal';

    // Filter tables by current floor
    const floorTables = useMemo(() => {
        return physicalTables
            .filter(t => (t.floor || 'Principal') === currentFloor)
            .sort((a, b) => a.number - b.number);
    }, [physicalTables, currentFloor]);

    const getTableOrder = (table: RestaurantTable) => {
        if (table.currentOrderId) {
            return activeOrders?.find(o => o.id === table.currentOrderId);
        }
        return activeOrders?.find(o => o.tableNumber === table.number && table.number > 0);
    };

    const countByFloor = (floor: string) => {
        return physicalTables.filter(t => (t.floor || 'Principal') === floor).length;
    };

    // Calculate status counts for header
    const freeCount = physicalTables.filter(t => t.status === 'free').length;
    const occupiedCount = physicalTables.filter(t => t.status !== 'free').length;

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 950,
                backdropFilter: 'blur(8px)',
                padding: '1rem',
                animation: 'fadeIn 0.2s ease-out',
            }}
        >
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <div style={{
                width: '100%',
                maxWidth: '720px',
                maxHeight: '85vh',
                backgroundColor: 'var(--surface-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'slideUp 0.3s ease-out',
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <UtensilsCrossed size={22} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Seleccionar Mesa</h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.85, fontWeight: '500' }}>
                                {freeCount} libre{freeCount !== 1 ? 's' : ''} · {occupiedCount} ocupada{occupiedCount !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white',
                        cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Floor Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    background: 'var(--surface-color)',
                    borderBottom: '1px solid var(--border-color)',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                }}>
                    <Layers size={16} style={{ color: 'var(--text-secondary)', alignSelf: 'center' }} />
                    {floorNames.map(floor => (
                        <button
                            key={floor}
                            onClick={() => setActiveFloor(floor)}
                            style={{
                                padding: '0.4rem 0.9rem',
                                border: 'none',
                                background: currentFloor === floor ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                                color: currentFloor === floor ? 'var(--primary-color)' : 'var(--text-secondary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s',
                                borderBottom: currentFloor === floor ? '2px solid var(--primary-color)' : '2px solid transparent'
                            }}
                        >
                            {floor} ({countByFloor(floor)})
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>

                    {/* Active Floor Grid */}
                    {floorTables.length > 0 ? (
                        <>
                            <h4 style={{
                                margin: '0 0 0.75rem 0',
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                color: 'var(--text-secondary)',
                                letterSpacing: '0.05em'
                            }}>
                                {currentFloor}
                            </h4>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                gap: '1rem',
                                marginBottom: '2rem',
                            }}>
                                {floorTables.map(table => {
                                    const order = getTableOrder(table);
                                    return (
                                        <TableCard
                                            key={table.id}
                                            table={table}
                                            onClick={onTableClick}
                                            orderStatus={order?.status}
                                            style={{ height: '120px' }} // Compact height for modal
                                        />
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                            <p style={{ fontWeight: '600' }}>No hay mesas en {currentFloor}</p>
                        </div>
                    )}

                    {/* Takeout Section */}
                    {takeoutCards.length > 0 && (
                        <>
                            <h4 style={{
                                margin: '0 0 0.75rem 0',
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                color: 'var(--primary-color)',
                                letterSpacing: '0.05em',
                                borderTop: '1px solid var(--divider-color)',
                                paddingTop: '1rem'
                            }}>
                                Para Llevar
                            </h4>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                gap: '1rem',
                            }}>
                                {takeoutCards.map(table => {
                                    const order = getTableOrder(table);
                                    return (
                                        <TableCard
                                            key={table.id}
                                            table={table}
                                            onClick={onTableClick}
                                            orderStatus={order?.status}
                                            style={{ height: '120px' }}
                                        />
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
