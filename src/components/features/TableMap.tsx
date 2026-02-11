import React, { useState } from 'react';
import { TableCard } from './TableCard';
import { Button } from '@/components/shared';
import { Grid, Map as MapIcon, Plus, Maximize, Minimize } from 'lucide-react';
import styles from './TableMap.module.css';
import type { RestaurantTable, Order } from '@/types';

interface TableMapProps {
    tables: RestaurantTable[];
    activeOrders: Order[];
    onTableClick: (table: RestaurantTable) => void;
    onUpdateTable?: (id: string, updates: Partial<RestaurantTable>) => void;
    onDeleteTable?: (id: string, number: number) => void;
    onAddTable?: () => void;
    isEditable?: boolean;
}

export function TableMap({
    tables,
    activeOrders,
    onTableClick,
    onUpdateTable,
    onDeleteTable,
    onAddTable,
    isEditable = false
}: TableMapProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [zoom, setZoom] = useState(1);
    const [draggingTableId, setDraggingTableId] = useState<string | null>(null);

    const handleStartDragging = (tableId: string) => {
        if (!isEditable) return;
        setDraggingTableId(tableId);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isEditable || !draggingTableId || !onUpdateTable) return;

        // Prevent default only for touch to avoid scrolling
        if ('touches' in e) {
            // Touch items
        }

        const viewport = e.currentTarget.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        // Calculate relative position in percentage
        const x = ((clientX - viewport.left) / viewport.width) * 100;
        const y = ((clientY - viewport.top) / viewport.height) * 100;

        // Clamp values between 0 and 95 (to keep inside)
        const posX = Math.min(Math.max(0, x), 95);
        const posY = Math.min(Math.max(0, y), 95);

        onUpdateTable(draggingTableId, {
            positionX: parseFloat(posX.toFixed(2)),
            positionY: parseFloat(posY.toFixed(2))
        });
    };

    const handleStopDragging = () => {
        setDraggingTableId(null);
    };

    const getTableOrder = (tableNumber: number) => {
        return activeOrders.find(o => o.tableNumber === tableNumber);
    };

    // Separate physical tables from takeout/virtual cards
    const physicalTables = tables.filter(t => t.number > 0);
    const takeoutCards = tables.filter(t => t.number === 0);

    const hasPositionedTables = physicalTables.some(t => t.positionX !== undefined);

    return (
        <div className={styles.container}>
            <div className={styles.mapControls}>
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

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isEditable && onAddTable && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={onAddTable}
                            style={{ marginRight: '1rem', backgroundColor: 'var(--success-color)' }}
                        >
                            <Plus size={16} /> Agregar Mesa
                        </Button>
                    )}
                    <Button
                        variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                        <Grid size={16} /> Grid
                    </Button>
                    <Button
                        variant={viewMode === 'map' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('map')}
                        style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                        <MapIcon size={16} /> Mapa
                    </Button>
                </div>
            </div>

            {/* Takeout Quick Zone - Only in Map Mode */}
            {viewMode === 'map' && takeoutCards.length > 0 && (
                <div className={styles.takeoutQuickZone}>
                    {takeoutCards.map(table => {
                        const order = getTableOrder(table.number);
                        return (
                            <div key={table.id} style={{ minWidth: '150px' }}>
                                <TableCard
                                    table={table}
                                    onClick={onTableClick}
                                    orderStatus={order?.status}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            <div className={viewMode === 'grid' ? styles.gridMode : styles.mapContainer}>
                {viewMode === 'map' ? (
                    !hasPositionedTables && !isEditable ? (
                        <div className={styles.emptyState}>
                            <MapIcon size={48} strokeWidth={1} />
                            <h3>Mapa sin configurar</h3>
                            <p>Cambia al Administrador para posicionar las mesas en el plano de tu restaurante.</p>
                        </div>
                    ) : (
                        <div
                            className={styles.mapViewport}
                            style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: 'top center',
                                cursor: draggingTableId ? 'grabbing' : 'crosshair',
                                touchAction: 'none'
                            }}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleStopDragging}
                            onMouseLeave={handleStopDragging}
                            onTouchMove={handleMouseMove}
                            onTouchEnd={handleStopDragging}
                            onTouchCancel={handleStopDragging}
                        >
                            {physicalTables.map(table => {
                                const order = getTableOrder(table.number);
                                const style: React.CSSProperties = {
                                    left: `${table.positionX || 0}%`,
                                    top: `${table.positionY || 0}%`,
                                    width: table.width ? `${table.width}px` : '120px',
                                    height: table.height ? `${table.height}px` : '120px',
                                    zIndex: draggingTableId === table.id ? 1000 : 1,
                                    opacity: draggingTableId === table.id ? 0.8 : 1,
                                    border: isEditable ? '2px dashed var(--primary-color)' : 'none',
                                    padding: isEditable ? '4px' : '0',
                                    cursor: isEditable ? 'grab' : 'pointer',
                                    touchAction: 'none'
                                };

                                return (
                                    <div
                                        key={table.id}
                                        className={styles.absoluteTable}
                                        style={style}
                                        onMouseDown={() => handleStartDragging(table.id)}
                                        onTouchStart={() => handleStartDragging(table.id)}
                                    >
                                        <TableCard
                                            table={table}
                                            onClick={onTableClick}
                                            onDelete={onDeleteTable ? (id) => onDeleteTable(id, table.number) : undefined}
                                            orderStatus={order?.status}
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                        {table.label && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-25px',
                                                width: '100%',
                                                textAlign: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                {table.label}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    tables.map(table => {
                        const order = getTableOrder(table.number);
                        return (
                            <TableCard
                                key={table.id}
                                table={table}
                                onClick={onTableClick}
                                onDelete={onDeleteTable ? (id) => onDeleteTable(id, table.number) : undefined}
                                orderStatus={order?.status}
                            />
                        );
                    })
                )}
            </div>

            {viewMode === 'map' && hasPositionedTables && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', gap: '0.5rem', zIndex: 100 }}>
                    <Button variant="ghost" size="sm" onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} style={{ background: 'white', border: '1px solid var(--border-color)' }}>
                        <Minimize size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} style={{ background: 'white', border: '1px solid var(--border-color)' }}>
                        <Maximize size={16} />
                    </Button>
                </div>
            )}
        </div>
    );
}
