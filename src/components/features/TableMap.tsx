import { useState, useMemo } from 'react';
import { TableCard } from './TableCard';
import { Layers, UtensilsCrossed } from 'lucide-react';
import { useFloors } from '@/hooks/useFloors';
import styles from './TableMap.module.css';
import type { RestaurantTable, Order } from '@/types';

interface TableMapProps {
    tables: RestaurantTable[];
    activeOrders: Order[];
    onTableClick: (table: RestaurantTable) => void;
    // Deprecated props kept for compatibility (no-op)
    onUpdateTable?: (id: string, updates: Partial<RestaurantTable>) => void;
    onDeleteTable?: (id: string, number: number) => void;
    onAddTable?: () => void;
    isEditable?: boolean;
}

export function TableMap({
    tables,
    activeOrders,
    onTableClick,
}: TableMapProps) {
    const { floorNames } = useFloors();
    const [activeFloor, setActiveFloor] = useState('Principal');

    // Filter tables
    const physicalTables = useMemo(() => tables.filter(t => t.number > 0), [tables]);
    const takeoutCards = useMemo(() => tables.filter(t => t.number === 0), [tables]);

    // Derived active floor (safety check)
    const currentFloor = floorNames.includes(activeFloor) ? activeFloor : 'Principal';

    // Filter by floor
    const floorTables = useMemo(() => {
        return physicalTables
            .filter(t => (t.floor || 'Principal') === currentFloor)
            .sort((a, b) => a.number - b.number);
    }, [physicalTables, currentFloor]);

    const getTableOrder = (tableNumber: number) => {
        return activeOrders.find(o => o.tableNumber === tableNumber);
    };

    const getFloorCount = (floor: string) => {
        return physicalTables.filter(t => (t.floor || 'Principal') === floor).length;
    };

    return (
        <div className={styles.container}>
            {/* Legend */}
            <div className={styles.controlsBar}>
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <div className={`${styles.dot} ${styles.dotFree}`} />
                        <span>Libre</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.dot} ${styles.dotOccupied}`} />
                        <span>Ocupada</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.dot} ${styles.dotTakeout}`} />
                        <span>Para Llevar</span>
                    </div>
                </div>
            </div>

            {/* Floor Tabs */}
            <div className={styles.floorTabsWrapper}>
                <Layers size={16} style={{ color: 'var(--text-secondary)', marginLeft: '0.25rem', alignSelf: 'center' }} />
                {floorNames.map(floor => (
                    <button
                        key={floor}
                        className={`${styles.floorTab} ${currentFloor === floor ? styles.floorTabActive : ''}`}
                        onClick={() => setActiveFloor(floor)}
                    >
                        {floor}
                        <span className={styles.floorCount}>
                            {getFloorCount(floor)}
                        </span>
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* 1. Active Floor Grid */}
                <div>
                    <h4 className={styles.sectionTitle}>Mesas - {currentFloor}</h4>

                    {floorTables.length > 0 ? (
                        <div className={styles.gridContainer}>
                            {floorTables.map(table => {
                                const order = getTableOrder(table.number);
                                return (
                                    <TableCard
                                        key={table.id}
                                        table={table}
                                        onClick={onTableClick}
                                        orderStatus={order?.status}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <UtensilsCrossed size={40} style={{ opacity: 0.3 }} />
                            <h3>No hay mesas en este piso</h3>
                            <p>Configura las mesas en el Panel de Administración</p>
                        </div>
                    )}
                </div>

                {/* 2. Takeout Section (Always Visible) */}
                {takeoutCards.length > 0 && (
                    <div>
                        <h4 className={styles.sectionTitle}>Para Llevar</h4>
                        <div className={styles.gridContainer}>
                            {takeoutCards.map(table => {
                                const order = table.currentOrderId
                                    ? activeOrders.find(o => o.id === table.currentOrderId)
                                    : undefined;

                                return (
                                    <TableCard
                                        key={table.id}
                                        table={table}
                                        onClick={onTableClick}
                                        orderStatus={order?.status}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
