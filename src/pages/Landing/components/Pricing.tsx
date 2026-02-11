import { Check } from 'lucide-react';
import { Button, Card } from '@/components/shared';

export function Pricing() {
    const plans = [
        {
            name: 'Emprendedor',
            price: 'S/ 0',
            description: 'Ideal para pequeños restaurantes que están comenzando su digitalización.',
            features: [
                'Hasta 5 mesas',
                'Gestión de pedidos básica',
                'Panel de mozo',
                'Soporte por email'
            ],
            buttonText: 'Empezar Gratis',
            highlight: false
        },
        {
            name: 'Premium',
            price: 'S/ 29',
            period: '/mes',
            description: 'Todo lo que necesitas para escalar tu restaurante y optimizar ventas.',
            features: [
                'Meses ilimitadas',
                'Reportes avanzados de ventas',
                'Multi-usuario (Mozos y Cocina)',
                'Personalización de marca',
                'Soporte prioritario 24/7'
            ],
            buttonText: 'Prueba Gratis 14 días',
            highlight: true
        }
    ];

    const handleAction = () => {
        const authSection = document.getElementById('auth-section');
        if (authSection) {
            authSection.scrollIntoView({ behavior: 'smooth' });
            // Custom event to tell AuthForms to switch to register mode
            window.dispatchEvent(new CustomEvent('switch-auth-mode', { detail: 'register' }));
        }
    };

    return (
        <section id="pricing" style={{ padding: '5rem 1rem', background: '#f8fafc' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                        Planes que crecen contigo
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Simple, transparente y sin contratos forzosos. Elige el plan que mejor se adapte a tu restaurante.
                    </p>
                </div>

                <div className="pricing-grid" style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '2.5rem',
                    maxWidth: '1000px',
                    margin: '0 auto',
                    alignItems: 'stretch',
                    paddingTop: '2rem' // Add space for badges
                }}>
                    {plans.map((plan) => (
                        <Card key={plan.name} className={`pricing-card ${plan.highlight ? 'highlight' : ''}`} style={{
                            padding: '3rem 2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            border: plan.highlight ? '2px solid var(--primary-color)' : '1px solid var(--divider-color)',
                            boxShadow: plan.highlight ? 'var(--shadow-lg)' : 'var(--shadow-md)',
                            flex: '1 1 350px',
                            maxWidth: '450px',
                            minHeight: '100%',
                            transition: 'all 0.3s ease',
                            overflow: 'visible' // Ensure badge doesn't get clipped
                        }}>
                            {plan.highlight && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    padding: '4px 16px',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.8rem',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Recomendado
                                </div>
                            )}

                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{plan.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>{plan.price}</span>
                                    {plan.period && <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{plan.period}</span>}
                                </div>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{plan.description}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem', flex: 1 }}>
                                {plan.features.map((feature) => (
                                    <div key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                        <div style={{
                                            background: plan.highlight ? 'rgba(230, 57, 70, 0.1)' : 'rgba(0,0,0,0.05)',
                                            borderRadius: '50%',
                                            padding: '4px',
                                            marginTop: '2px',
                                            flexShrink: 0
                                        }}>
                                            <Check size={14} color={plan.highlight ? 'var(--primary-color)' : '#64748b'} strokeWidth={3} />
                                        </div>
                                        <span style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant={plan.highlight ? 'primary' : 'outline'}
                                fullWidth
                                onClick={handleAction}
                                style={{
                                    fontWeight: '800',
                                    height: '3.5rem',
                                    fontSize: '1rem',
                                    background: plan.highlight ? 'var(--primary-color)' : 'transparent',
                                    border: plan.highlight ? 'none' : '2px solid var(--primary-color)',
                                    color: plan.highlight ? 'white' : 'var(--primary-color)',
                                    borderRadius: 'var(--radius-md)'
                                }}
                            >
                                {plan.buttonText}
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .pricing-grid {
                        flex-direction: column;
                        align-items: center;
                    }
                    .pricing-card {
                        width: 100%;
                        max-width: 400px !important;
                        flex: none !important;
                    }
                }
                .pricing-card:hover {
                    transform: translateY(-5px);
                    box-shadow: var(--shadow-xl) !important;
                }
                .pricing-card.highlight {
                    transform: translateY(-5px);
                }
                @media (min-width: 769px) {
                    .pricing-card.highlight {
                        transform: scale(1.05);
                    }
                    .pricing-card.highlight:hover {
                        transform: scale(1.05) translateY(-5px);
                    }
                }
            `}</style>
        </section>
    );
}

