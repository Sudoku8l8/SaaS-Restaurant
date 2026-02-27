import { AlertOctagon, Phone } from 'lucide-react';
import { Card, Button } from '@/components/shared';

export function SubscriptionExpiredPage({ error }: { error?: string }) {
    const isInactive = error?.includes('INACTIVO');

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--background-color)',
            padding: '1rem'
        }}>
            <Card style={{
                maxWidth: '450px',
                textAlign: 'center',
                padding: '3rem 2rem',
                borderTop: '6px solid var(--danger-color)',
                boxShadow: 'var(--shadow-xl)'
            }}>
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem'
                }}>
                    {isInactive ? <AlertOctagon size={48} color="var(--danger-color)" /> : <AlertOctagon size={48} color="var(--danger-color)" />}
                </div>

                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: '800',
                    marginBottom: '1rem',
                    color: 'var(--text-primary)'
                }}>
                    {isInactive ? 'Acceso Suspendido' : 'Plan Finalizado'}
                </h1>

                <p style={{
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    marginBottom: '2rem'
                }}>
                    {error || 'El periodo de prueba o suscripción de este restaurante ha vencido. Para continuar disfrutando del servicio y recuperar el acceso inmediato, por favor contacte a su administrador.'}
                </p>

                <div style={{
                    padding: '1rem',
                    background: 'var(--surface-color)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '2rem',
                    border: '1px dashed var(--divider-color)'
                }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        ID DE SOPORTE:
                    </p>
                    <code style={{
                        background: '#e0e0e0',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        color: '#333'
                    }}>
                        {window.location.pathname.split('/')[1]?.toUpperCase() || 'UNKNOWN'}
                    </code>
                </div>

                <Button fullWidth onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Phone size={18} /> Contactar Soporte
                </Button>
            </Card>
        </div>
    );
}
