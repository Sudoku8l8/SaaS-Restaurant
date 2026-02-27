import type { Restaurant } from '@/types';
import { Crown, Trash2, Calendar, Power, Crown as CrownIcon } from 'lucide-react';
import { Badge, Button } from '@/components/shared';
import { getPeruNow } from '@/utils/dateUtils';
import styles from '../SuperAdmin.module.css';

interface RestaurantCardListProps {
    restaurants: Restaurant[];
    toggleActive: (id: string, currentStatus: boolean) => void;
    toggleDigitalMenu: (id: string, currentStatus: boolean) => void;
    changePlan: (id: string, currentPlan: 'basic' | 'premium', name: string) => void;
    renewSubscription: (id: string) => void;
    handleDelete: (id: string, name: string) => void;
}

export function RestaurantCardList({
    restaurants, toggleActive, toggleDigitalMenu, changePlan, renewSubscription, handleDelete
}: RestaurantCardListProps) {

    const getDaysRemaining = (restaurant: Restaurant) => {
        if (!restaurant.subscriptionEndsAt) return 0;
        const now = getPeruNow();
        const endDate = new Date((restaurant.subscriptionEndsAt as any).seconds ?
            (restaurant.subscriptionEndsAt as any).seconds * 1000 :
            restaurant.subscriptionEndsAt);
        const diffTime = endDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <div className={styles.mobileCardsContainer}>
            {restaurants.map(rest => {
                const days = getDaysRemaining(rest);
                const isExpired = days <= 0;

                return (
                    <div key={rest.id} className={styles.restaurantCard} style={{ borderLeft: `4px solid ${rest.active ? 'var(--success-color)' : 'var(--danger-color)'}` }}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h3 className={styles.cardTitle}>{rest.name}</h3>
                                <a href={`/${rest.id}/login`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none' }}>
                                    /{rest.id}
                                </a>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                                <Badge variant={rest.plan === 'premium' ? 'warning' : 'neutral'} style={{ fontSize: '0.7rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                        {rest.plan === 'premium' && <Crown size={10} />}
                                        {(rest.plan || 'basic').toUpperCase()}
                                    </span>
                                </Badge>
                                <Badge variant={rest.active ? 'success' : 'error'} style={{ fontSize: '0.7rem' }}>
                                    {rest.active ? 'ACTIVO' : 'INACTIVO'}
                                </Badge>
                            </div>
                        </div>

                        <div className={styles.cardGrid}>
                            <div className={styles.cardData}>
                                <span className={styles.cardDataLabel}>Días Restantes</span>
                                <span style={{
                                    fontWeight: '800',
                                    color: isExpired ? 'var(--danger-color)' : (days < 5 ? 'var(--warning-color)' : 'var(--success-color)')
                                }}>
                                    {isExpired ? 'VENCIDO' : `${days} días`}
                                </span>
                            </div>

                            <div className={styles.cardData}>
                                <span className={styles.cardDataLabel}>Menú Digital</span>
                                <Badge
                                    variant={rest.features?.digitalMenu ? 'success' : 'neutral'}
                                    style={{ cursor: 'pointer', alignSelf: 'flex-start', fontSize: '0.7rem', border: '1px solid var(--border-color)' }}
                                    onClick={() => toggleDigitalMenu(rest.id, rest.features?.digitalMenu ?? false)}
                                >
                                    {rest.features?.digitalMenu ? '✅ ACTIVO' : '⭕ OFF'}
                                </Badge>
                            </div>
                        </div>

                        <div className={styles.cardActions}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button
                                    variant={rest.active ? 'outline' : 'primary'}
                                    size="sm"
                                    onClick={() => toggleActive(rest.id, rest.active)}
                                    style={{ flex: 1, fontSize: '0.75rem', fontWeight: '700', padding: '0.5rem' }}
                                >
                                    <Power size={14} style={{ marginRight: '0.25rem' }} />
                                    {rest.active ? 'Apagar' : 'Encender'}
                                </Button>
                                <Button variant="primary" size="sm" onClick={() => renewSubscription(rest.id)} style={{ flex: 1, fontSize: '0.75rem', fontWeight: '700', padding: '0.5rem' }}>
                                    <Calendar size={14} style={{ marginRight: '0.25rem' }} />
                                    Renovar
                                </Button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button
                                    variant={rest.plan === 'premium' ? 'outline' : 'primary'}
                                    size="sm"
                                    onClick={() => changePlan(rest.id, rest.plan || 'basic', rest.name)}
                                    style={{
                                        flex: 2,
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        padding: '0.5rem',
                                        ...(rest.plan !== 'premium' ? { background: '#d4a017', border: '1px solid #d4a017' } : { border: '1px solid #d4a017', color: '#d4a017' })
                                    }}
                                >
                                    <CrownIcon size={14} style={{ marginRight: '0.25rem' }} />
                                    {rest.plan === 'premium' ? 'Bajar a Basic' : 'Subir a Premium'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDelete(rest.id, rest.name)} style={{ flex: 1, fontSize: '0.75rem', fontWeight: '700', padding: '0.5rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })}
            {restaurants.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    No se encontraron restaurantes.
                </div>
            )}
        </div>
    );
}
