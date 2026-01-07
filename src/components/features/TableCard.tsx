import { Card, Badge } from '@/components/shared';
import type { RestaurantTable } from '@/types';
import type { HTMLAttributes } from 'react';

interface TableCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
    table: RestaurantTable;
    onClick: (table: RestaurantTable) => void;
}

const statusColors = {
    free: 'success',
    occupied: 'warning',
    closed: 'neutral',
} as const;

const statusLabels = {
    free: 'Libre',
    occupied: 'Ocupada',
    closed: 'Cerrada',
};

export function TableCard({ table, onClick, style, ...props }: TableCardProps) {
    const isFree = table.status === 'free';
    const isOccupied = table.status === 'occupied';

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
                height: '140px',
                backgroundColor: isFree ? 'var(--surface-color)' : 'var(--background-color)',
                border: isFree ? '1px solid var(--border-color)' : `2px solid var(--${statusColors[table.status]}-color)`,
                boxShadow: isFree ? 'var(--shadow-sm)' : 'none',
                borderRadius: 'var(--radius-lg)',
                transition: 'all var(--transition-speed)',
                position: 'relative',
                overflow: 'hidden',
                ...style
            }}
            {...props}
        >
            {isOccupied && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '30px',
                    height: '30px',
                    background: 'var(--warning-color)',
                    clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                    opacity: 0.8
                }} />
            )}

            <h3 style={{
                fontSize: '2.5rem',
                margin: '0',
                fontWeight: '800',
                color: isFree ? 'var(--text-primary)' : 'var(--text-secondary)',
                opacity: isFree ? 1 : 0.6
            }}>
                {table.number}
            </h3>

            <Badge
                variant={statusColors[table.status]}
                style={{
                    marginTop: '0.5rem',
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.05em',
                    fontWeight: '700'
                }}
            >
                {statusLabels[table.status]}
            </Badge>
        </Card>
    );
}
