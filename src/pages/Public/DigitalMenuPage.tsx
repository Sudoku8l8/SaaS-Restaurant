import { useParams } from 'react-router-dom';
import { useTenant } from '@/app/providers/TenantProvider';
import { Button, Card } from '@/components/shared';
import { Utensils } from 'lucide-react';

export function DigitalMenuPage() {
    const { tableNumber } = useParams<{ tableNumber: string }>();
    const { tenant, isLoading, error } = useTenant();

    if (isLoading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background-color)' }}>
            <p style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Cargando Menú...</p>
        </div>
    );

    if (error || !tenant) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background-color)', padding: '2rem', textAlign: 'center' }}>
            <Card style={{ padding: '2rem' }}>
                <h2 style={{ color: 'var(--danger-color)' }}>Restaurante no encontrado</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>El enlace que has escaneado parece no ser válido.</p>
            </Card>
        </div>
    );

    const { name, logo, config } = tenant;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--background-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '3rem 1.5rem',
            textAlign: 'center'
        }}>
            {/* Header / Logo */}
            <div style={{ marginBottom: '2.5rem' }}>
                {logo ? (
                    <img
                        src={logo}
                        alt={name}
                        style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'contain',
                            borderRadius: '50%',
                            marginBottom: '1rem',
                            backgroundColor: 'white',
                            padding: '10px',
                            boxShadow: 'var(--shadow-md)'
                        }}
                    />
                ) : (
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'white',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <Utensils size={40} />
                    </div>
                )}
                <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>{name}</h1>
                {tableNumber && (
                    <div style={{
                        display: 'inline-block',
                        marginTop: '0.75rem',
                        padding: '0.4rem 1.2rem',
                        backgroundColor: 'var(--surface-color)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: 'var(--primary-color)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        Mesa {tableNumber}
                    </div>
                )}
            </div>

            <Card style={{
                padding: '2rem',
                width: '100%',
                maxWidth: '420px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                borderRadius: 'var(--radius-lg)'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Nuestra Carta Digital</h2>

                {config?.menuSpanishUrl ? (
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={() => window.open(config.menuSpanishUrl, '_blank')}
                        style={{ height: '70px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 'var(--radius-md)' }}
                    >
                        🇪🇸 Ver Carta en Español
                    </Button>
                ) : (
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(230, 57, 70, 0.05)', borderRadius: 'var(--radius-md)', color: 'var(--danger-color)', fontSize: '0.9rem', fontWeight: '600' }}>
                        Carta en español no configurada
                    </div>
                )}

                {config?.menuEnglishUrl && (
                    <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        onClick={() => window.open(config.menuEnglishUrl, '_blank')}
                        style={{
                            height: '70px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            borderRadius: 'var(--radius-md)',
                            border: '2px solid var(--primary-color)',
                            color: 'var(--primary-color)'
                        }}
                    >
                        🇺🇸 View Menu in English
                    </Button>
                )}

                {(!config?.menuSpanishUrl && !config?.menuEnglishUrl) && (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        No hay cartas configuradas actualmente. Por favor consulte con el mozo.
                    </p>
                )}
            </Card>

            <footer style={{ marginTop: 'auto', paddingTop: '4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.6 }}>
                <p>© {new Date().getFullYear()} {name}</p>
                <p style={{ marginTop: '0.25rem' }}>Powered by SaaS Restaurant</p>
            </footer>
        </div>
    );
}
