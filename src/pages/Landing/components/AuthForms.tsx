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

    const handleGo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug) return;

        setLoginLoading(true);
        setLoginError(null);

        try {
            const docRef = doc(db, 'restaurants', slug);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
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
            alert('¡Restaurante creado con éxito! Redirigiendo...');
            navigate(`/${regData.slug}/login`);
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
                                label="ID del Restaurante (Slug)"
                                placeholder="ej. rest_001"
                                value={slug}
                                onChange={e => setSlug(e.target.value)}
                                required
                            />
                            <Button type="submit" size="lg" disabled={loginLoading} style={{ background: 'var(--primary-color)' }}>
                                {loginLoading ? 'Verificando...' : 'Ir al Restaurante'}
                            </Button>
                        </form>

                        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--divider-color)', paddingTop: '1.5rem' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                ¿Nuevo aquí?{' '}
                                <button
                                    onClick={() => setMode('register')}
                                    style={{ color: 'var(--primary-color)', fontWeight: '600', background: 'none', border: 'none', padding: 0, textDecoration: 'underline' }}
                                >
                                    Crea tu Restaurante GRATIS
                                </button>
                            </p>
                        </div>
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
                                label="ID URL (Slug)"
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
