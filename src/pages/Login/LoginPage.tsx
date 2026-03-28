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
            if (user.role === UserRole.ADMIN) {
                navigate(`${basePath}/admin`);
            } else if (user.role === UserRole.CHEF || user.role === UserRole.CASHIER) {
                navigate(`${basePath}/cocina`);
            } else {
                navigate(`${basePath}/mozo`);
            }
        }
    }, [user, navigate, restaurantSlug]);

    const doSubmit = async () => {
        if (!pin || pin.length < 4) return;
        try {
            await login(pin, restaurantSlug);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await doSubmit();
    };

    useEffect(() => {
        if (pin.length === 4 && !error && !isLoading) {
            doSubmit();
        }
    }, [pin]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isLoading) return;
            if (e.key >= '0' && e.key <= '9') {
                if (pin.length < 4) setPin(prev => prev + e.key);
            } else if (e.key === 'Backspace') {
                setPin(prev => prev.slice(0, -1));
            } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
                setPin('');
            } else if (e.key === 'Enter') {
                if (pin.length >= 4) doSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pin, isLoading, restaurantSlug, login]);

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
            display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh',
            padding: '1rem', overflowY: 'auto'
        }}>
            <div className="glass-card" style={{
                width: '100%', maxWidth: '380px', padding: '1.5rem',
                borderRadius: 'var(--radius-2xl)', display: 'flex', flexDirection: 'column', gap: '1rem',
                margin: 'auto 0'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem', boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)'
                    }}>
                        <Lock size={24} />
                    </div>
                    <h1 style={{
                        margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.5rem',
                        fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em'
                    }}>
                        Ingreso al Sistema
                    </h1>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Ingresa tu PIN
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => handleNumPadClick(num.toString())}
                                style={{
                                    height: '56px', fontSize: '1.25rem', fontWeight: 600,
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
                                height: '56px', fontSize: '1.1rem', fontWeight: 700,
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
                                height: '56px', fontSize: '1.25rem', fontWeight: 600,
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
                                height: '56px', fontSize: '1.1rem', fontWeight: 700,
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
                        size="md"
                        variant="secondary" // Usando el gradiente
                        isLoading={isLoading}
                        disabled={pin.length < 4}
                        style={{ marginTop: '0.25rem', height: '48px', fontSize: '1rem' }}
                    >
                        Ingresar
                    </Button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
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
