import { Button } from '@/components/shared';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TermsPage() {
    const navigate = useNavigate();

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '4rem 0' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={18} /> Volver al Inicio
                </Button>

                <div style={{ background: 'white', padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Términos y Condiciones</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Última actualización: 10 de Febrero, 2026</p>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>1. Aceptación de los Términos</h2>
                        <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            Al acceder y utilizar OrdayGo, usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar nuestro servicio.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>2. Descripción del Servicio</h2>
                        <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            OrdayGo es una plataforma de software como servicio (SaaS) diseñada para la gestión de restaurantes, incluyendo pedidos, control de mesas y reportes de ventas.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>3. Cuentas de Usuario</h2>
                        <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            Usted es responsable de mantener la confidencialidad de su cuenta y contraseña, incluyendo su PIN de acceso. OrdayGo no se hace responsable por accesos no autorizados derivados del mal uso de las credenciales.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>4. Pagos y Suscripciones</h2>
                        <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            Ciertos servicios requieren el pago de una suscripción. Los pagos no son reembolsables, a menos que se indique lo contrario por escrito.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>5. Limitación de Responsabilidad</h2>
                        <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            OrdayGo se proporciona "tal cual". No garantizamos que el servicio sea ininterrumpido o libre de errores.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
