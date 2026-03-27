import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Moon, Sun, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/shared';
import { SalesDashboard } from '@/components/features/SalesDashboard';
import { usePendingClosures } from '@/hooks/usePendingClosures';
import { useLowStock } from '@/hooks/useLowStock';
import { BranchSelector } from '@/components/features/BranchSelector';
import { useTenant } from '@/app/providers/TenantProvider';
import { AppSidebar } from '@/components/shared/AppSidebar';

export function AdminPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
    const { tenant } = useTenant();
    const { pendingClosures, isLoading: loadingPending } = usePendingClosures();
    const { lowStockProducts, isLoading: loadingStock } = useLowStock();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('admin-dark-mode');
        if (saved !== null) return saved === 'true';
        return document.documentElement.classList.contains('dark');
    });

    const isMultiBranch = tenant?.config?.multiSucursal === true;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync dark mode class with state
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('admin-dark-mode', String(isDarkMode));
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(prev => !prev);



    return (
        <div className="bg-mesh admin-content" style={{ minHeight: '100vh', transition: 'margin-left 0.3s ease-in-out' }}>
            
            {restaurantSlug && (
                <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} restaurantSlug={restaurantSlug} />
            )}

            <div className="container" style={{ paddingTop: isMobile ? '1.5rem' : '2.5rem', paddingBottom: '4rem' }}>
                {/* ── Header ── */}
                <header style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '3.5rem',
                    paddingTop: isMobile ? '3rem' : '0'
                }}>
                    <div style={{ paddingRight: isMobile ? '0' : '280px', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Menú principal"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '42px', height: '42px', borderRadius: '50%',
                                border: '1.5px solid var(--glass-border)', background: 'transparent',
                                color: 'var(--text-primary)', cursor: 'pointer', flexShrink: 0,
                                transition: 'all 0.2s'
                            }}
                        >
                            <Menu size={20} />
                        </button>

                        <div>
                            <h1 style={{
                                fontSize: isMobile ? '1.75rem' : '2.5rem',
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                margin: 0,
                                color: 'var(--text-primary)'
                            }}>
                                Visión General
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <span style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                backgroundColor: 'var(--success-color)',
                                display: 'inline-block',
                                animation: 'pulse 2s infinite'
                            }} />
                            <p style={{
                                color: 'var(--accent-blue)',
                                fontWeight: 600,
                                fontSize: isMobile ? '1rem' : '1.125rem',
                                margin: 0
                            }}>
                                Bienvenido, {user?.name}
                            </p>
                        </div>
                    </div>
                    </div>

                    <div style={{
                        position: isMobile ? 'absolute' : 'absolute',
                        top: isMobile ? '0' : '0.5rem',
                        right: '0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '0.5rem' : '1rem'
                    }}>
                        {!isMobile && <BranchSelector />}

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleTheme}
                            title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                background: 'var(--glass-bg)',
                                backdropFilter: 'blur(8px)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <button
                            onClick={logout}
                            style={{
                                background: isDarkMode
                                    ? 'linear-gradient(135deg, #06b6d4, #2563eb)'
                                    : 'linear-gradient(135deg, #2563eb, #4338ca)',
                                color: 'white',
                                padding: isMobile ? '0.5rem 1rem' : '0.625rem 2rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: isMobile ? '0.85rem' : '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                            }}
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </header>

                {/* Mobile Branch Selector */}
                {isMobile && isMultiBranch && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <BranchSelector />
                    </div>
                )}

                {/* ── Pending Closures Alert ── */}
                {!loadingPending && pendingClosures.length > 0 && (
                    <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {pendingClosures.map(closure => (
                            <div key={closure.date} className="glass-card" style={{
                                padding: '1rem 1.5rem',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                flexWrap: 'wrap', gap: '1rem',
                                borderColor: 'rgba(239, 68, 68, 0.2)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        backgroundColor: 'var(--danger-color)', color: 'white',
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Cierre Pendiente: {closure.date}</h4>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {closure.orderCount} pedidos por S/ {closure.totalAmount.toFixed(2)} sin cerrar.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="primary" size="sm"
                                    onClick={() => navigate(`/${restaurantSlug}/cierre-caja?date=${closure.date}`)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--danger-color)' }}
                                >
                                    Cerrar Caja <ArrowRight size={16} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Low Stock Alerts ── */}
                {!loadingStock && lowStockProducts.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <div className="glass-card" style={{
                            padding: '1rem 1.5rem',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                            borderColor: 'rgba(245, 158, 11, 0.2)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                                <div style={{
                                    backgroundColor: 'var(--warning-color)', color: 'white',
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <AlertTriangle size={20} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Alertas de Inventario</h4>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {lowStockProducts.length} producto{lowStockProducts.length > 1 ? 's' : ''} con stock bajo o crítico.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="primary" size="sm"
                                onClick={() => navigate(`/${restaurantSlug}/inventario`)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--warning-color)', color: '#000', flexShrink: 0, whiteSpace: 'nowrap' }}
                            >
                                Ver Inventario <ArrowRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Sales Dashboard ── */}
                <SalesDashboard />



                {/* ── Footer ── */}
                <footer style={{ textAlign: 'center', marginTop: '4rem', paddingTop: '2rem' }}>
                    <div style={{
                        height: '1px', width: '96px', margin: '0 auto 2rem',
                        background: 'linear-gradient(to right, transparent, var(--border-color), transparent)'
                    }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.05em' }}>
                        © 2026 Sistema de Gestión de Restaurante <span style={{ margin: '0 0.5rem' }}>•</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Ordaygo v0.1.0</span>
                    </p>
                </footer>
            </div>

            {/* Pulse animation for the green dot */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}
