import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@/components/shared';

export function LandingPage() {
    const navigate = useNavigate();
    const [slug, setSlug] = useState('');

    const handleGo = (e: React.FormEvent) => {
        e.preventDefault();
        if (slug) {
            navigate(`/${slug}/login`);
        }
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
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#333' }}>🍽️ SaaS Restaurant</h1>
                <p style={{ fontSize: '1.2rem', color: '#666' }}>Plataforma de gestión multi-restaurante</p>
            </div>

            <Card style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Ingresar a tu Restaurante</h2>
                <form onSubmit={handleGo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="ID del Restaurante (Slug)"
                        placeholder="ej. rest_001"
                        value={slug}
                        onChange={e => setSlug(e.target.value)}
                        required
                    />
                    <Button type="submit" size="lg">Ir al Restaurante</Button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <small style={{ color: '#888' }}>
                        ¿No tienes cuenta? <br />
                        <strong>Próximamente: Registro automático</strong>
                    </small>
                </div>
            </Card>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <Button variant="outline" onClick={() => navigate('/demo-restaurant/login')}>
                    Ver Demo (demo-restaurant)
                </Button>
            </div>
        </div>
    );
}
