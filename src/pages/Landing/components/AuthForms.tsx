import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { createRestaurant } from '@/services/onboardingService';
import { Card, Button, Input } from '@/components/shared';
import { AlertCircle } from 'lucide-react';

export function AuthForms() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'register'>('login');

    // Login State
    const [slug, setSlug] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    // Register State
    const [regData, setRegData] = useState({
        name: '',
        slug: '',
        adminName: '',
        adminPin: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Listen for external mode switches (e.g., from Pricing section)
    React.useEffect(() => {
        const handleModeSwitch = (e: any) => {
            if (e.detail === 'register' || e.detail === 'login') {
                setMode(e.detail);
            }
        };
        window.addEventListener('switch-auth-mode', handleModeSwitch);
        return () => window.removeEventListener('switch-auth-mode', handleModeSwitch);
    }, []);

    const handleGo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug) return;

        setLoginLoading(true);
        setLoginError(null);

        try {
            const docRef = doc(db, 'restaurants', slug);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const restaurant = docSnap.data() as any;

                // 1. Check if manually deactivated or pending approval
                if (!restaurant.active) {
                    setLoginError('Esta cuenta está pendiente de aprobación o ha sido desactivada por el administrador.');
                    setLoginLoading(false);
                    return;
                }

                // 2. Check 14-day trial (Only for basic plan) -> REMOVED to use centralized TenantProvider logic
                // if (restaurant.plan === 'basic' && restaurant.createdAt) { ... }

                localStorage.setItem('lastRestaurantSlug', slug);
                navigate(`/${slug}/login`);
            } else {
                setLoginError('No encontramos un restaurante con ese ID.');
            }
        } catch (err) {
            console.error(err);
            setLoginError('Error de conexión.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(regData.slug)) {
            setError('El ID solo puede contener letras minúsculas, números y guiones.');
            setIsLoading(false);
            return;
        }

        const result = await createRestaurant({
            name: regData.name,
            slug: regData.slug,
            adminName: regData.adminName,
            adminPin: regData.adminPin
        });

        if (result.success) {
            alert('¡Restaurante registrado! Tu cuenta está pendiente de aprobación. Podrás usar el sistema por 14 días una vez activada.');
            setMode('login');
        } else {
            setError(result.error || 'Error desconocido');
        }
        setIsLoading(false);
    };

    return (
        <section id="auth-section" style={{ padding: '4rem 1rem' }}>
            <div className="container" style={{ maxWidth: '450px' }}>
                {mode === 'login' ? (
                    <Card style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
                        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--primary-color)' }}>Ingresar a tu Restaurante</h2>
                        {loginError && (
                            <div style={{
                                background: '#fee2e2',
                                border: '1px solid #ef4444',
                                color: '#b91c1c',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.9rem'
                            }}>
                                <AlertCircle size={18} />
                                <span>{loginError}</span>
                            </div>
                        )}
                        <form onSubmit={handleGo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <Input
                                label="ID del Restaurante"
                                placeholder="ej. mi-pollos-hermanos"
                                value={slug}
                                onChange={e => setSlug(e.target.value)}
                                required
                            />
                            <Button type="submit" size="lg" disabled={loginLoading} style={{ background: 'var(--primary-color)' }}>
                                {loginLoading ? 'Verificando...' : 'Ir al Restaurante'}
                            </Button>
                        </form>

                        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--divider-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                ¿Nuevo aquí?{' '}
                                <button
                                    onClick={() => setMode('register')}
                                    style={{ color: 'var(--primary-color)', fontWeight: '600', background: 'none', border: 'none', padding: 0, textDecoration: 'underline' }}
                                >
                                    Crea tu Restaurante GRATIS
                                </button>
                            </p>

                            <a
                                href="https://wa.me/+51932703548?text=Hola,%20necesito%20la%20activacion%20de%20mi%20restaurante"
                                target="_blank"
                                rel="noreferrer"
                                className="whatsapp-support"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    padding: '0.8rem',
                                    background: '#25D366',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    fontWeight: '700',
                                    fontSize: '0.95rem',
                                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                                    transition: 'transform 0.2s ease'
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                ¿Necesitas la activación? Escríbenos
                            </a>
                        </div>

                        <style>{`
                            @keyframes whatsapp-animation {
                                0% { transform: scale(1); }
                                50% { transform: scale(1.05); }
                                100% { transform: scale(1); }
                            }
                            .whatsapp-support {
                                animation: whatsapp-animation 2s infinite ease-in-out;
                            }
                            .whatsapp-support:hover {
                                transform: scale(1.1) !important;
                                animation-play-state: paused;
                            }
                        `}</style>
                    </Card>
                ) : (
                    <Card style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
                        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--primary-color)' }}>Registrar Nuevo Restaurante</h2>
                        {error && (
                            <div style={{
                                background: '#fee2e2',
                                border: '1px solid #ef4444',
                                color: '#b91c1c',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: '1.5rem',
                                textAlign: 'center',
                                fontSize: '0.9rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <Input
                                label="Nombre del Restaurante"
                                value={regData.name}
                                onChange={e => setRegData({ ...regData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="ID del Restaurante"
                                placeholder="ej. mi-pollos-hermanos"
                                value={regData.slug}
                                onChange={e => setRegData({ ...regData, slug: e.target.value.toLowerCase() })}
                                required
                            />
                            <Input
                                label="Tu Nombre (Admin)"
                                value={regData.adminName}
                                onChange={e => setRegData({ ...regData, adminName: e.target.value })}
                                required
                            />
                            <Input
                                label="PIN Maestro (4 dígitos)"
                                type="password"
                                maxLength={4}
                                value={regData.adminPin}
                                onChange={e => setRegData({ ...regData, adminPin: e.target.value })}
                                required
                            />

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button type="button" variant="ghost" onClick={() => setMode('login')} disabled={isLoading}>
                                    Volver
                                </Button>
                                <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading} style={{ flex: 1, background: 'var(--primary-color)' }}>
                                    Crear Cuenta
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}
            </div>
        </section>
    );
}
