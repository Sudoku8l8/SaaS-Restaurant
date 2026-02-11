import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/shared';

export function Hero() {
    const scrollToAuth = () => {
        document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section style={{
            padding: '4rem 0 6rem',
            background: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
            overflow: 'hidden'
        }}>
            <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '4rem', alignItems: 'center' }}>
                <div className="hero-content">
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        lineHeight: 1.1,
                        marginBottom: '1rem',
                        letterSpacing: '-0.02em'
                    }}>
                        Todo tu restaurant <br />
                        <span style={{ color: 'var(--primary-color)' }}>en una sola mano</span>
                    </h1>

                    <p style={{
                        fontSize: '1.25rem',
                        color: '#4b5563',
                        lineHeight: 1.5,
                        marginBottom: '2.5rem',
                        maxWidth: '520px'
                    }}>
                        Gestiona pedidos, inventario y clientes desde una única plataforma. Elegante, rápido y diseñado para crecer contigo.
                    </p>

                    <div className="hero-buttons" style={{ display: 'flex', gap: '1rem', marginBottom: '3.5rem' }}>
                        <Button
                            onClick={scrollToAuth}
                            size="lg"
                            className="primary-cta"
                            style={{ background: 'var(--primary-color)', color: 'white', padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontWeight: '800', boxShadow: '0 10px 20px rgba(230, 57, 70, 0.2)' }}
                        >
                            Prueba gratis <ChevronRight size={18} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="lg"
                            className="secondary-cta"
                            style={{ background: 'white', border: '1px solid #e5e7eb', color: '#374151', padding: '0.8rem 2rem', justifyContent: 'center' }}
                        >
                            Ver demo
                        </Button>
                    </div>

                    <div className="social-proof">
                        <p style={{ fontSize: '0.9rem', color: '#2e3138ff', marginBottom: '1rem' }}>No requiere tarjeta de crédito • 28 días de prueba gratis</p>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', }}>
                            {['Restaurantes', 'Cafeterías', 'Pollerías', 'Delivery'].map(tag => (
                                <span key={tag} style={{
                                    padding: '0.4rem 1rem',
                                    background: '#f1f5f9',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.85rem',
                                    color: '#284369ff',
                                    fontWeight: 500
                                }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="hero-visual" style={{ position: 'relative' }}>
                    {/* Mockup implementation based on image */}
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                        padding: '2rem',
                        border: '1px solid #f1f5f9',
                        transform: 'rotate(-2deg)',
                        maxHeight: '500px',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pedidos en vivo</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-color)' }}>24</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { table: 'Mesa 1', items: '3 items', total: '$45.50', time: '5m' },
                                { table: 'Mesa 2', items: '3 items', total: '$45.50', time: '5m' },
                                { table: 'Mesa 3', items: '3 items', total: '$45.50', time: '5m' }
                            ].map((order, i) => (
                                <div key={i} style={{
                                    padding: '1.25rem',
                                    background: '#f8fafc',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }}></div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#1f2937' }}>{order.table}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.items} • {order.total}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{order.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Decorative elements */}
                    <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px', background: '#2563eb', opacity: 0.05, filter: 'blur(60px)', borderRadius: '50%', zIndex: -1 }}></div>
                </div>
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    .container { grid-template-columns: 1fr !important; gap: 3rem !important; }
                    .hero-content { text-align: center; display: flex; flex-direction: column; align-items: center; }
                    .social-proof { display: flex; flex-direction: column; align-items: center; }
                    .hero-visual { transform: scale(0.9); width: 100%; max-width: 500px; margin: 0 auto; }
                }
                @media (max-width: 640px) {
                    .hero-buttons { flex-direction: column; width: 100%; }
                    .primary-cta, .secondary-cta { width: 100%; }
                    h1 { font-size: 2.25rem !important; }
                }
            `}</style>
        </section>
    );
}
