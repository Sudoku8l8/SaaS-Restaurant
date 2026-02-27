import { Crown, MessageCircle } from 'lucide-react';
import { Card, Button } from '@/components/shared';

interface PremiumUpgradeBannerProps {
    feature: string;
}

export function PremiumUpgradeBanner({ feature }: PremiumUpgradeBannerProps) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '340px',
            padding: '2rem',
        }}>
            <Card style={{
                maxWidth: '480px',
                width: '100%',
                padding: '3rem 2.5rem',
                textAlign: 'center',
                border: '1.5px solid rgba(212, 160, 23, 0.25)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 8px 32px rgba(212, 160, 23, 0.08)',
            }}>
                {/* Crown icon */}
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.12), rgba(212, 160, 23, 0.04))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                }}>
                    <Crown size={32} style={{ color: '#d4a017' }} />
                </div>

                <h3 style={{
                    fontSize: '1.35rem',
                    fontWeight: '800',
                    color: 'var(--text-primary)',
                    margin: '0 0 0.75rem',
                }}>
                    Función Premium
                </h3>

                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    margin: '0 0 2rem',
                }}>
                    <strong>{feature}</strong> es parte del plan Premium.
                    Contacta a soporte para activar esta funcionalidad en tu restaurante.
                </p>

                <Button
                    variant="primary"
                    onClick={() => window.open('https://wa.me/51999999999?text=Hola,%20me%20interesa%20activar%20el%20plan%20Premium', '_blank')}
                    style={{
                        background: 'linear-gradient(135deg, #d4a017, #b8860b)',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.85rem 2rem',
                        fontWeight: '800',
                        fontSize: '0.95rem',
                        borderRadius: 'var(--radius-lg)',
                    }}
                >
                    <MessageCircle size={18} /> Contactar Soporte
                </Button>

                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    marginTop: '1.25rem',
                    opacity: 0.7,
                }}>
                    Plan Premium · Carta Digital · Pedidos Online
                </p>
            </Card>
        </div>
    );
}
