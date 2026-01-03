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

    return (
        <Card
            onClick={() => onClick(table)}
            padding="sm"
            style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '120px',
                backgroundColor: isFree ? 'var(--color-background-paper)' : 'var(--color-background-default)',
                border: `2px solid var(--color-${statusColors[table.status]})`,
                ...style
            }}
            {...props}
        >
            <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{table.number}</h3>
            <Badge variant={statusColors[table.status]}>
                {statusLabels[table.status]}
            </Badge>
        </Card>
    );
}
