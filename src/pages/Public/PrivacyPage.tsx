import { Button } from '@/components/shared';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPage() {
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
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Política de Privacidad</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Última actualización: 10 de Febrero, 2026</p>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>1. Información que Recopilamos</h2>
                        <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            Recopilamos información necesaria para la gestión de su restaurante, como nombre del negocio, datos de contacto de los administradores y registros de transacciones.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>2. Uso de la Información</h2>
                        <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            Utilizamos sus datos para proporcionar el servicio POS, procesar pedidos y generar los reportes de ventas que su negocio requiere.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>3. Seguridad de los Datos</h2>
                        <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            Implementamos medidas de seguridad líderes en la industria (como cifrado de PINs y reglas de acceso estrictas en Firestore) para proteger su información.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>4. Sus Derechos</h2>
                        <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                            Usted tiene derecho a acceder, corregir o eliminar sus datos personales en cualquier momento a través de su panel de configuración o contactando a nuestro soporte.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
