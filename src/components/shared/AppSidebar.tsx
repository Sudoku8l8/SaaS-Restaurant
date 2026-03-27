import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    X,
    LogOut,
    UtensilsCrossed,
    LayoutDashboard,
    Users,
    Store,
    ChefHat,
    Sun,
    Moon,
    Tags,
    Boxes,
    Archive,
    PieChart,
    Sliders,
    Wallet
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import styles from './AppSidebar.module.css';

interface SidebarItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    path?: string;           // navigate to this path
    action?: () => void;     // or execute this action
    roles: UserRole[];       // which roles see this item
    section?: string;        // optional section label above item
    isDanger?: boolean;
}

interface AppSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    restaurantSlug: string;
}

const ROLE_LABEL: Record<string, string> = {
    admin: 'Administrador',
    caja: 'Cajero/a',
    chef: 'Cocina',
    waiter: 'Mozo/a',
    shift_manager: 'Encargado',
};

const ROLE_CLASS: Record<string, string> = {
    admin: styles.roleAdmin,
    caja: styles.roleCaja,
    chef: styles.roleCocina,
    waiter: styles.roleMozo,
    shift_manager: styles.roleAdmin,
};

export function AppSidebar({ isOpen, onClose, restaurantSlug }: AppSidebarProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Lock body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen && window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const handleNavigate = (path: string) => {
        navigate(path);
        onClose();
    };

    const handleLogout = () => {
        onClose();
        logout();
    };

    // ── Dark Mode Logic ──
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('admin-dark-mode');
        if (saved !== null) return saved === 'true';
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('admin-dark-mode', String(isDarkMode));
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(p => !p);

    // ── Navigation items definition ──────────────────────────────
    const navItems: SidebarItem[] = [
        // --- GESTIÓN ---
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            path: `/${restaurantSlug}/admin`,
            roles: [UserRole.ADMIN],
            section: 'Gestión',
        },
        {
            id: 'productos',
            label: 'Productos',
            icon: Tags,
            path: `/${restaurantSlug}/productos`,
            roles: [UserRole.ADMIN],
        },
        {
            id: 'inventario',
            label: 'Inventario',
            icon: Boxes,
            path: `/${restaurantSlug}/inventario`,
            roles: [UserRole.ADMIN, UserRole.CASHIER],
        },
        {
            id: 'usuarios',
            label: 'Usuarios y Roles',
            icon: Users,
            path: `/${restaurantSlug}/usuarios`,
            roles: [UserRole.ADMIN],
        },
        // --- OPERACIONES ---
        {
            id: 'ventas',
            label: 'Ventas (POS)',
            icon: Store,
            path: `/${restaurantSlug}/mozo`,
            roles: [UserRole.ADMIN, UserRole.CASHIER, UserRole.WAITER, UserRole.SHIFT_MANAGER],
            section: 'Operaciones',
        },
        {
            id: 'cocina',
            label: 'Cocina',
            icon: ChefHat,
            path: `/${restaurantSlug}/cocina`,
            roles: [UserRole.ADMIN, UserRole.CASHIER, UserRole.CHEF, UserRole.SHIFT_MANAGER],
        },
        {
            id: 'cierre',
            label: 'Cierre de Caja',
            icon: Archive,
            path: `/${restaurantSlug}/cierre-caja`,
            roles: [UserRole.ADMIN, UserRole.CASHIER],
        },
        {
            id: 'cajachica',
            label: 'Caja Chica',
            icon: Wallet,
            path: `/${restaurantSlug}/caja-chica`,
            roles: [UserRole.ADMIN, UserRole.CASHIER, UserRole.CHEF, UserRole.WAITER, UserRole.SHIFT_MANAGER],
        },
        // --- REPORTES ---
        {
            id: 'reportes',
            label: 'Reportes',
            icon: PieChart,
            path: `/${restaurantSlug}/reportes`,
            roles: [UserRole.ADMIN],
            section: 'Reportes',
        },
        // --- SISTEMA ---
        {
            id: 'config',
            label: 'Configuración general',
            icon: Sliders,
            path: `/${restaurantSlug}/config`,
            roles: [UserRole.ADMIN, UserRole.CASHIER],
            section: 'Sistema',
        },
    ];

    // Filter items by user role
    const visibleItems = navItems.filter(
        (item) => user?.role && item.roles.includes(user.role as UserRole)
    );

    // Group items by section
    const sections: { label: string | null; items: SidebarItem[] }[] = [];
    let currentSection: string | null = null;
    let currentGroup: SidebarItem[] = [];

    visibleItems.forEach((item) => {
        if (item.section && item.section !== currentSection) {
            if (currentGroup.length > 0) {
                sections.push({ label: currentSection, items: currentGroup });
            }
            currentSection = item.section;
            currentGroup = [item];
        } else {
            currentGroup.push(item);
        }
    });
    if (currentGroup.length > 0) {
        sections.push({ label: currentSection, items: currentGroup });
    }

    const userInitials = user?.name
        ?.split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase() || '?';

    const isActive = (path?: string) =>
        path ? location.pathname === path : false;

    return (
        <>
            {/* ── Overlay ── */}
            <div
                className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* ── Sidebar Drawer ── */}
            <aside
                className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
                aria-label="Navegación principal"
                role="navigation"
            >
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <div className={styles.brandRow}>
                            <div className={styles.brandIcon}>
                                <UtensilsCrossed size={18} />
                            </div>
                            <span className={styles.brandName}>
                                Menú Principal
                            </span>
                        </div>
                        <button
                            className={styles.closeBtn}
                            onClick={onClose}
                            aria-label="Cerrar menú"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* User chip */}
                    <div className={styles.userChip}>
                        <div className={styles.userAvatar}>{userInitials}</div>
                        <div className={styles.userName}>
                            <span className={styles.userNameText}>{user?.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                    className={`${styles.userRoleBadge} ${ROLE_CLASS[user?.role || ''] || styles.roleAdmin}`}
                                >
                                    {ROLE_LABEL[user?.role || ''] || user?.role}
                                </span>
                                <button
                                    onClick={toggleTheme}
                                    title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'transparent', cursor: 'pointer',
                                        color: 'var(--text-secondary)', padding: '0',
                                        width: '24px', height: '24px',
                                        borderRadius: '6px', border: '1px solid var(--border-color)',
                                        transition: 'all 0.2s', flexShrink: 0
                                    }}
                                >
                                    {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {sections.map((section, sIdx) => (
                        <div key={sIdx}>
                            {section.label && (
                                <div className={styles.sectionLabel}>{section.label}</div>
                            )}
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.path);
                                return (
                                    <button
                                        key={item.id}
                                        className={`${styles.navItem} ${active ? styles.navItemActive : ''} ${item.isDanger ? styles.navItemDanger : ''}`}
                                        onClick={() => {
                                            if (item.action) {
                                                item.action();
                                            } else if (item.path) {
                                                handleNavigate(item.path);
                                            }
                                        }}
                                        aria-current={active ? 'page' : undefined}
                                        id={`sidebar-item-${item.id}`}
                                    >
                                        <span className={styles.navIcon}>
                                            <Icon size={17} />
                                        </span>
                                        {item.label}
                                    </button>
                                );
                            })}
                            {sIdx < sections.length - 1 && (
                                <div className={styles.divider} />
                            )}
                        </div>
                    ))}
                </nav>

                {/* Footer: Logout */}
                <div className={styles.footer}>
                    <div className={styles.divider} style={{ marginBottom: '0.75rem' }} />
                    <button
                        className={`${styles.navItem} ${styles.navItemDanger}`}
                        onClick={handleLogout}
                        id="sidebar-item-logout"
                        style={{ opacity: 1, transform: 'none' }}
                    >
                        <span className={`${styles.navIcon} ${styles.iconLogout}`}>
                            <LogOut size={17} />
                        </span>
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
        </>
    );
}
