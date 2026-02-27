import { Button, Card } from '@/components/shared';
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';
import { useSuperAdminData } from '@/hooks/useSuperAdminData';

import { SuperAdminLogin } from './components/SuperAdminLogin';
import { StatCards } from './components/StatCards';
import { RestaurantFilters } from './components/RestaurantFilters';
import { RestaurantTable } from './components/RestaurantTable';
import { RestaurantCardList } from './components/RestaurantCardList';
import styles from './SuperAdmin.module.css';

export function SuperAdminPage() {
    const { isAuthenticated, logout } = useSuperAdminAuth();

    const {
        restaurants,
        totalRestaurants,
        loading,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        toggleActive,
        toggleDigitalMenu,
        changePlan,
        renewSubscription,
        handleDelete
    } = useSuperAdminData();

    // Legacy handler reference (Assuming resetting PIN is less common now, but we can add it to the table later if needed)
    // For now, I'm omitting handleResetPin for clarity, but it can be re-added via context if required.

    if (!isAuthenticated) {
        return <SuperAdminLogin />;
    }

    return (
        <div className={styles.superadminContainer}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>🦸 SuperAdmin Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.25rem' }}>
                        Gestión Global de Tenants
                    </p>
                </div>
                <Button variant="outline" onClick={logout} className={styles.logoutBtn}>
                    Cerrar Sesión
                </Button>
            </header>

            <StatCards restaurants={restaurants} />

            <Card style={{ boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ padding: '1.5rem' }}>
                    <RestaurantFilters
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                    />

                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                            Cargando {totalRestaurants > 0 ? totalRestaurants : ''} restaurantes...
                        </p>
                    ) : (
                        <>
                            <RestaurantTable
                                restaurants={restaurants}
                                toggleActive={toggleActive}
                                toggleDigitalMenu={toggleDigitalMenu}
                                changePlan={changePlan}
                                renewSubscription={renewSubscription}
                                handleDelete={handleDelete}
                            />

                            <RestaurantCardList
                                restaurants={restaurants}
                                toggleActive={toggleActive}
                                toggleDigitalMenu={toggleDigitalMenu}
                                changePlan={changePlan}
                                renewSubscription={renewSubscription}
                                handleDelete={handleDelete}
                            />
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
