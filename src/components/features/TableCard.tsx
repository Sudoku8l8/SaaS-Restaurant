import { Card, Badge } from '@/components/shared';
import { Table2, ShoppingBag, X } from 'lucide-react';
import type { RestaurantTable, OrderStatus } from '@/types';
import type { HTMLAttributes } from 'react';

interface TableCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
    table: RestaurantTable;
    onClick: (table: RestaurantTable) => void;
    onDelete?: (id: string) => void;
    orderStatus?: OrderStatus;
    customerName?: string;
}

const statusColors = {
    free: 'success',
    occupied: 'warning',
    closed: 'neutral',
} as const;

const orderStatusLabels: Record<OrderStatus, string> = {
    pending: 'Pendiente',
    in_preparation: 'Preparando',
    ready: 'Listo',
    delivered: 'Entregado',
    paid: 'Pagado',
    cancelled: 'Cancelado'
};

const orderStatusVariants: Record<OrderStatus, 'warning' | 'info' | 'success' | 'error' | 'neutral'> = {
    pending: 'warning',
    in_preparation: 'info',
    ready: 'success',
    delivered: 'info',
    paid: 'success',
    cancelled: 'error'
};

const statusLabels = {
    free: 'Libre',
    occupied: 'Ocupada',
    closed: 'Cerrada',
};

export function TableCard({ table, onClick, onDelete, orderStatus, customerName, style, ...props }: TableCardProps) {
    const isNewTakeout = table.id === 'takeout-new-wildcard';
    const isActiveTakeout = table.id.startsWith('takeout-order-');
    const isTakeout = isNewTakeout || isActiveTakeout;

    const isFree = table.status === 'free';
    const isOccupied = table.status === 'occupied' || isActiveTakeout;

    // Status colors and labels specifically for takeout if needed
    const currentStatusColor = isTakeout
        ? (isNewTakeout ? 'var(--text-secondary)' : 'var(--primary-color)')
        : (isFree ? 'var(--success-color)' : 'var(--warning-color)');

    return (
        <Card
            onClick={() => onClick(table)}
            padding="md"
            style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '150px',
                backgroundColor: isTakeout
                    ? 'rgba(69, 123, 157, 0.08)' // Primary Celadon tint for takeout
                    : (isFree
                        ? 'rgba(127, 176, 105, 0.08)'  // Soft Green tint
                        : 'rgba(220, 158, 130, 0.12)'), // Soft Peach tint
                border: isTakeout
                    ? `2px ${isNewTakeout ? 'dashed var(--border-color)' : 'solid var(--primary-color)'}`
                    : (isFree
                        ? '2px solid var(--success-color)'
                        : '3px solid var(--warning-color)'),
                boxShadow: isFree && !isActiveTakeout
                    ? '0 4px 12px rgba(0,0,0,0.05)'
                    : `0 8px 20px ${isTakeout ? 'rgba(69, 123, 157, 0.2)' : 'rgba(220, 158, 130, 0.2)'}`,
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                transform: 'scale(1)',
                ...style
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = isFree && !isActiveTakeout
                    ? '0 12px 24px rgba(0,0,0,0.1)'
                    : `0 15px 30px ${isTakeout ? 'rgba(69, 123, 157, 0.3)' : 'rgba(220, 158, 130, 0.35)'}`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = isFree && !isActiveTakeout
                    ? '0 4px 12px rgba(0,0,0,0.05)'
                    : `0 8px 20px ${isTakeout ? 'rgba(69, 123, 157, 0.2)' : 'rgba(220, 158, 130, 0.2)'}`;
            }}
            {...props}
        >
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(table.id);
                    }}
                    style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        color: 'var(--danger-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                >
                    <X size={14} />
                </button>
            )}

            {isOccupied && !isTakeout && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '35px',
                    height: '35px',
                    background: 'var(--warning-color)',
                    clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                    opacity: 0.9,
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                }} />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', transform: isTakeout ? 'none' : 'translateX(-5px)' }}>
                {isTakeout ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <ShoppingBag size={isActiveTakeout ? 40 : 32} style={{ color: currentStatusColor }} />
                        {isActiveTakeout && (
                            <span style={{ 
                                fontSize: customerName ? '0.8rem' : '0.9rem', 
                                fontWeight: '800', 
                                color: 'var(--primary-color)',
                                textAlign: 'center',
                                marginTop: '4px',
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {customerName || `#${table.currentOrderId?.slice(-4).toUpperCase()}`}
                            </span>
                        )}
                    </div>
                ) : (
                    <>
                        <Table2 size={28} style={{ color: currentStatusColor, opacity: 0.9 }} />
                        <h3 style={{
                            fontSize: '3rem',
                            margin: '0',
                            fontWeight: '900',
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.02em',
                            lineHeight: 1
                        }}>
                            {table.number}
                        </h3>
                    </>
                )}
            </div>

            <Badge
                variant={isTakeout ? (isNewTakeout ? 'neutral' : (orderStatus ? orderStatusVariants[orderStatus] : 'info')) : (orderStatus ? orderStatusVariants[orderStatus] : statusColors[table.status])}
                style={{
                    marginTop: '1rem',
                    padding: '0.35rem 0.85rem',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                    fontWeight: '900',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
            >
                {isNewTakeout ? 'Nuevo Llevar' : (orderStatus ? orderStatusLabels[orderStatus] : statusLabels[table.status])}
            </Badge>
        </Card>
    );
}
