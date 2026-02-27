import type { Restaurant } from '@/types';
import styles from '../SuperAdmin.module.css';

interface StatCardsProps {
    restaurants: Restaurant[];
}

export function StatCards({ restaurants }: StatCardsProps) {
    const total = restaurants.length;
    const active = restaurants.filter(r => r.active).length;
    const premium = restaurants.filter(r => r.plan === 'premium').length;
    const digitalMenu = restaurants.filter(r => r.features?.digitalMenu).length;

    // TODO: Calculate real monthly income based on plans
    const monthlyIncome = premium * 50 + (total - premium) * 30;

    return (
        <div className={styles.statsGrid}>
            <div className={styles.statCard} style={{ borderTop: '4px solid var(--primary-color)' }}>
                <h3 className={styles.statValue} style={{ color: 'var(--primary-color)' }}>{total}</h3>
                <p className={styles.statLabel}>Total Restaurantes</p>
            </div>

            <div className={styles.statCard} style={{ borderTop: '4px solid var(--success-color)' }}>
                <h3 className={styles.statValue} style={{ color: 'var(--success-color)' }}>{active}</h3>
                <p className={styles.statLabel}>Activos</p>
            </div>

            <div className={styles.statCard} style={{ borderTop: '4px solid #8b5cf6' }}>
                <h3 className={styles.statValue} style={{ color: '#8b5cf6' }}>{premium}</h3>
                <p className={styles.statLabel}>Cuentas Premium</p>
            </div>

            <div className={styles.statCard} style={{ borderTop: '4px solid #d4a017' }}>
                <h3 className={styles.statValue} style={{ color: '#d4a017' }}>{digitalMenu}</h3>
                <p className={styles.statLabel}>Menú Digital Activo</p>
            </div>

            <div className={styles.statCard} style={{ borderTop: '4px solid var(--secondary-hover)' }}>
                <h3 className={styles.statValue} style={{ color: 'var(--primary-color)' }}>S/ {monthlyIncome.toFixed(2)}</h3>
                <p className={styles.statLabel}>Ingresos Estimados</p>
            </div>
        </div>
    );
}
