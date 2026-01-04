import type { HTMLAttributes } from 'react';
import type { OrderStatus } from '@/types';
import { Badge } from './Badge';

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'neutral' | 'error' }> = {
    pending: { label: 'Pendiente', variant: 'warning' },
    in_preparation: { label: 'En Preparación', variant: 'info' },
    ready: { label: 'Listo', variant: 'success' },
    delivered: { label: 'Entregado', variant: 'neutral' },
    paid: { label: 'Pagado', variant: 'neutral' },
    cancelled: { label: 'Cancelado', variant: 'error' }
} as Record<OrderStatus | 'cancelled', { label: string; variant: 'warning' | 'info' | 'success' | 'neutral' | 'error' }>;

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
    const config = statusConfig[status] || { label: status, variant: 'neutral' };

    return (
        <Badge variant={config.variant} {...props}>
            {config.label}
        </Badge>
    );
}
