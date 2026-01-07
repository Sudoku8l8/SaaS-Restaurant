import { Card, Badge } from '@/components/shared';
import { Table2 } from 'lucide-react';
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
                height: '150px',
                backgroundColor: isFree
                    ? 'rgba(127, 176, 105, 0.08)'  // Soft Green tint
                    : 'rgba(220, 158, 130, 0.12)', // Soft Peach tint
                border: isFree
                    ? '2px solid var(--success-color)'
                    : '3px solid var(--warning-color)',
                boxShadow: isFree
                    ? '0 4px 12px rgba(127, 176, 105, 0.15)'
                    : '0 8px 20px rgba(220, 158, 130, 0.2)',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                transform: 'scale(1)',
                ...style
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = isFree
                    ? '0 12px 24px rgba(127, 176, 105, 0.25)'
                    : '0 15px 30px rgba(220, 158, 130, 0.35)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = isFree
                    ? '0 4px 12px rgba(127, 176, 105, 0.15)'
                    : '0 8px 20px rgba(220, 158, 130, 0.2)';
            }}
            {...props}
        >
            {isOccupied && (
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', transform: 'translateX(-5px)' }}>
                <Table2 size={28} style={{ color: isFree ? 'var(--success-color)' : 'var(--warning-color)', opacity: 0.9 }} />
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
            </div>

            <Badge
                variant={statusColors[table.status]}
                style={{
                    marginTop: '0.75rem',
                    padding: '0.35rem 0.85rem',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                    fontWeight: '900',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
            >
                {statusLabels[table.status]}
            </Badge>
        </Card>
    );
}
