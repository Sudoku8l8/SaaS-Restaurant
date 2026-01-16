import { Layout, ChefHat, BarChart3, Users, Zap, ShieldCheck } from 'lucide-react';

const features = [
    {
        icon: <Layout className="text-primary" />,
        title: "Multi-Restaurante",
        description: "Gestiona múltiples sedes desde una sola cuenta administrativa con total facilidad."
    },
    {
        icon: <ChefHat className="text-primary" />,
        title: "Control de Cocina",
        description: "Optimiza los tiempos de preparación con nuestro panel de cocina en tiempo real."
    },
    {
        icon: <BarChart3 className="text-primary" />,
        title: "Reportes Detallados",
        description: "Visualiza tus ventas y rendimiento diario con gráficos claros y precisos."
    },
    {
        icon: <Users className="text-primary" />,
        title: "Gestión de Personal",
        description: "Asigna roles de mozo o cocina y mantén el control de las acciones de tu equipo."
    },
    {
        icon: <Zap className="text-primary" />,
        title: "Pedidos Rápidos",
        description: "Interfaz diseñada para la velocidad. Crea pedidos en segundos desde cualquier dispositivo."
    },
    {
        icon: <ShieldCheck className="text-primary" />,
        title: "Seguro y Confiable",
        description: "Tus datos están protegidos y siempre disponibles gracias a nuestra infraestructura en la nube."
    }
];

export function Features() {
    return (
        <section style={{ padding: '4rem 1rem' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Todo lo que necesitas para crecer</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Diseñado por y para restauranteros. Una solución integral que se adapta a tu flujo de trabajo.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem'
                }}>
                    {features.map((f, i) => (
                        <div key={i} style={{
                            padding: '2rem',
                            background: 'white',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-md)',
                            transition: 'transform 0.3s ease',
                            cursor: 'default'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{
                                background: 'var(--secondary-color)',
                                width: '50px',
                                height: '50px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.5rem',
                                color: 'var(--primary-color)'
                            }}>
                                {f.icon}
                            </div>
                            <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{f.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{f.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
