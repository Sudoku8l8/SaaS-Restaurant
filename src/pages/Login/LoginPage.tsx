import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/shared';
import { UserRole } from '@/types';
import { Lock } from 'lucide-react';

export function LoginPage() {
    const [pin, setPin] = useState('');
    const { login, isLoading, error, user } = useAuth();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            const basePath = restaurantSlug ? `/${restaurantSlug}` : '';
            if (user.role === UserRole.ADMIN || user.role === UserRole.CHEF || user.role === UserRole.CASHIER) {
                navigate(`${basePath}/cocina`);
            } else {
                navigate(`${basePath}/mozo`);
            }
        }
    }, [user, navigate, restaurantSlug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pin) return;
        try {
            // Pass restaurantSlug to enforce security
            await login(pin, restaurantSlug);
        } catch (err) {
            // Error handled by AuthProvider and displayed via error state
            console.error(err);
        }
    };

    const handleNumPadClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setPin('');
    };

    return (
        <div className="bg-mesh" style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
            padding: '1rem'
        }}>
            <div className="glass-card" style={{
                width: '100%', maxWidth: '380px', padding: '2.5rem 2rem',
                borderRadius: 'var(--radius-2xl)', display: 'flex', flexDirection: 'column', gap: '2rem'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.25rem', boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)'
                    }}>
                        <Lock size={28} />
                    </div>
                    <h1 style={{
                        margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.75rem',
                        fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em'
                    }}>
                        Ingreso al Sistema
                    </h1>
                    <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Ingresa tu PIN de 4 dígitos
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{
                        background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--glass-border)', padding: '0.5rem'
                    }}>
                        <Input
                            type="password"
                            placeholder="••••"
                            value={pin}
                            readOnly
                            fullWidth
                            style={{
                                textAlign: 'center', letterSpacing: '12px', fontSize: '2rem',
                                fontWeight: 800, border: 'none', background: 'transparent',
                                color: 'var(--text-primary)', boxShadow: 'none'
                            }}
                            error={error || undefined}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => handleNumPadClick(num.toString())}
                                style={{
                                    height: '64px', fontSize: '1.5rem', fontWeight: 600,
                                    background: 'var(--surface-color)', border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)', borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer', transition: 'all 0.15s'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'var(--glass-bg)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'var(--surface-color)';
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={handleClear}
                            style={{
                                height: '64px', fontSize: '1.25rem', fontWeight: 700,
                                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: 'var(--danger-color)', borderRadius: 'var(--radius-md)',
                                cursor: 'pointer', transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                            C
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNumPadClick('0')}
                            style={{
                                height: '64px', fontSize: '1.5rem', fontWeight: 600,
                                background: 'var(--surface-color)', border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--glass-bg)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'var(--surface-color)';
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            0
                        </button>
                        <button
                            type="button"
                            onClick={handleBackspace}
                            style={{
                                height: '64px', fontSize: '1.25rem', fontWeight: 700,
                                background: 'var(--surface-color)', border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--glass-bg)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'var(--surface-color)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                        >
                            ⌫
                        </button>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        variant="secondary" // Usando el gradiente
                        isLoading={isLoading}
                        disabled={pin.length < 4}
                        style={{ marginTop: '0.5rem', height: '56px', fontSize: '1.1rem' }}
                    >
                        Ingresar
                    </Button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => {
                                const waLink = "https://wa.me/+51932703548?text=Hola,%20necesito%20ayuda%20para%20recuperar%20mi%20PIN%20de%20acceso";
                                window.open(waLink, '_blank');
                            }}
                            style={{
                                color: 'var(--accent-blue)', fontSize: '0.9rem', fontWeight: 600,
                                background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-color)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--accent-blue)'}
                        >
                            ¿Olvidaste tu PIN?
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem('lastRestaurantSlug');
                                sessionStorage.removeItem('hasRedirectedToRestaurant');
                                navigate('/');
                            }}
                            style={{
                                color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500,
                                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                            Cambiar de Restaurante
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
