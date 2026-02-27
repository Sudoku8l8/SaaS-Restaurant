import type { Restaurant } from '@/types';
import { Smartphone, Crown } from 'lucide-react';
import { Badge, Button } from '@/components/shared';
import { getPeruNow, formatPeruDisplay, ensurePeruDate } from '@/utils/dateUtils';
import styles from '../SuperAdmin.module.css';

interface RestaurantTableProps {
    restaurants: Restaurant[];
    toggleActive: (id: string, currentStatus: boolean) => void;
    toggleDigitalMenu: (id: string, currentStatus: boolean) => void;
    changePlan: (id: string, currentPlan: 'basic' | 'premium', name: string) => void;
    renewSubscription: (id: string) => void;
    handleDelete: (id: string, name: string) => void;
}

export function RestaurantTable({
    restaurants, toggleActive, toggleDigitalMenu, changePlan, renewSubscription, handleDelete
}: RestaurantTableProps) {
    const checkIsExpired = (restaurant: Restaurant) => {
        if (!restaurant.subscriptionEndsAt) return true;
        const endDate = new Date((restaurant.subscriptionEndsAt as any).seconds ?
            (restaurant.subscriptionEndsAt as any).seconds * 1000 :
            restaurant.subscriptionEndsAt);
        return endDate < getPeruNow();
    };

    const getDaysRemaining = (restaurant: Restaurant) => {
        if (!restaurant.subscriptionEndsAt) return 0;
        const now = getPeruNow();
        const endDate = new Date((restaurant.subscriptionEndsAt as any).seconds ?
            (restaurant.subscriptionEndsAt as any).seconds * 1000 :
            restaurant.subscriptionEndsAt);
        const diffTime = endDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        return formatPeruDisplay(ensurePeruDate(date));
    };

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Restaurante</th>
                        <th>Ruta URL</th>
                        <th>Plan</th>
                        <th>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Smartphone size={14} /> Menú Digital
                            </span>
                        </th>
                        <th>Estado</th>
                        <th>Días Restantes</th>
                        <th>Registro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {restaurants.map(rest => {
                        const days = getDaysRemaining(rest);
                        const isExpired = days <= 0;

                        return (
                            <tr key={rest.id}>
                                <td style={{ fontWeight: 'bold' }}>{rest.name}</td>
                                <td>
                                    <a href={`/${rest.id}/login`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', fontWeight: '700', textDecoration: 'none', borderBottom: '1px dashed' }}>
                                        /{rest.id}
                                    </a>
                                </td>
                                <td>
                                    <Badge variant={rest.plan === 'premium' ? 'warning' : 'neutral'}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            {rest.plan === 'premium' && <Crown size={12} />}
                                            {(rest.plan || 'basic').toUpperCase()}
                                        </span>
                                    </Badge>
                                </td>
                                <td>
                                    <Badge
                                        variant={rest.features?.digitalMenu ? 'success' : 'neutral'}
                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                        onClick={() => toggleDigitalMenu(rest.id, rest.features?.digitalMenu ?? false)}
                                    >
                                        {rest.features?.digitalMenu ? '✅ ACTIVO' : '⭕ OFF'}
                                    </Badge>
                                </td>
                                <td>
                                    <Badge variant={rest.active ? 'success' : 'error'}>
                                        {rest.active ? 'ACTIVO' : 'INACTIVO'}
                                    </Badge>
                                    {checkIsExpired(rest) && (
                                        <Badge variant="error" style={{ marginLeft: '0.5rem' }}>
                                            VENCIDO
                                        </Badge>
                                    )}
                                </td>
                                <td>
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: isExpired ? 'var(--danger-color)' : (days < 5 ? 'var(--warning-color)' : 'var(--success-color)')
                                    }}>
                                        {isExpired ? '0' : days} días
                                    </span>
                                </td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {formatDate(rest.createdAt)}
                                </td>
                                <td>
                                    <div className={styles.actionButtons}>
                                        <Button
                                            variant={rest.active ? 'outline' : 'primary'}
                                            size="sm"
                                            onClick={() => toggleActive(rest.id, rest.active)}
                                            style={{ fontSize: '0.75rem', fontWeight: '800' }}
                                        >
                                            {rest.active ? 'Apagar' : 'Activar'}
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(rest.id, rest.name)} style={{ fontSize: '0.75rem', fontWeight: '800' }}>
                                            Eliminar
                                        </Button>
                                        <Button variant="primary" size="sm" onClick={() => renewSubscription(rest.id)} style={{ fontSize: '0.75rem', fontWeight: '800' }}>
                                            Renovar
                                        </Button>
                                        <Button
                                            variant={rest.plan === 'premium' ? 'outline' : 'primary'}
                                            size="sm"
                                            onClick={() => changePlan(rest.id, rest.plan || 'basic', rest.name)}
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: '800',
                                                ...(rest.plan !== 'premium' ? { background: '#d4a017', border: '1px solid #d4a017' } : { border: '1px solid #d4a017', color: '#d4a017' })
                                            }}
                                        >
                                            {rest.plan === 'premium' ? '↓ Basic' : '↑ Premium'}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {restaurants.length === 0 && (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                No se encontraron restaurantes.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
