import { useState } from 'react';
import { Utensils, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@/components/shared';
import { createRestaurant } from '@/services/onboardingService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

export function LandingPage() {
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

        // Simple validation
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
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '2rem'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <Utensils size={48} /> SaaS Restaurant
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#666' }}>Plataforma de gestión multi-restaurante</p>
            </div>

            {mode === 'login' ? (
                <Card style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Ingresar a tu Restaurante</h2>
                    {loginError && (
                        <div style={{
                            background: '#fee2e2',
                            border: '1px solid #ef4444',
                            color: '#b91c1c',
                            padding: '0.75rem',
                            borderRadius: '8px',
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
                    <form onSubmit={handleGo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Input
                            label="ID del Restaurante (Slug)"
                            placeholder="ej. rest_001"
                            value={slug}
                            onChange={e => setSlug(e.target.value)}
                            required
                        />
                        <Button type="submit" size="lg" disabled={loginLoading}>
                            {loginLoading ? 'Verificando...' : 'Ir al Restaurante'}
                        </Button>
                    </form>

                    <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                        <small style={{ color: '#888' }}>
                            ¿Nuevo aquí? <br />
                            <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); }} style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                Crea tu Restaurante GRATIS
                            </a>
                        </small>
                    </div>
                </Card>
            ) : (
                <Card style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Registrar Nuevo Restaurante</h2>
                    {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                            <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading} style={{ flex: 1 }}>
                                Crear Cuenta
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

        </div>
    );
}
