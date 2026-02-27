import { Search } from 'lucide-react';
import styles from '../SuperAdmin.module.css';

type FilterType = 'all' | 'active' | 'inactive' | 'premium' | 'basic';

interface RestaurantFiltersProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    statusFilter: FilterType;
    setStatusFilter: (val: FilterType) => void;
}

export function RestaurantFilters({
    searchQuery, setSearchQuery, statusFilter, setStatusFilter
}: RestaurantFiltersProps) {

    const badges: { label: string, value: FilterType }[] = [
        { label: 'Todos', value: 'all' },
        { label: 'Activos', value: 'active' },
        { label: 'Inactivos', value: 'inactive' },
        { label: 'Premium', value: 'premium' },
        { label: 'Basic', value: 'basic' }
    ];

    return (
        <div className={styles.filtersSection}>
            <div className={styles.searchBar} style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                    type="text"
                    placeholder="Buscar restaurante o ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.8rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        outline: 'none',
                        fontSize: '0.95rem'
                    }}
                />
            </div>

            <div className={styles.badgesGroup}>
                {badges.map(b => (
                    <button
                        key={b.value}
                        className={`${styles.filterBadge} ${statusFilter === b.value ? styles.active : ''}`}
                        onClick={() => setStatusFilter(b.value)}
                    >
                        {b.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
