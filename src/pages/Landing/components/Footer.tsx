import { Link } from 'react-router-dom';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={{
            padding: '4rem 1rem 2rem',
            background: 'var(--text-primary)',
            color: 'white',
            marginTop: '4rem'
        }}>
            <div className="container">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '3rem',
                    marginBottom: '3rem'
                }}>
                    <div>
                        <h4 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>OrdayGo</h4>
                        <p style={{ opacity: 0.7, lineHeight: 1.6, fontSize: '0.9rem' }}>
                            La solución definitiva para la gestión moderna de restaurantes en Perú. Eficiencia, estilo y control en un solo lugar.
                        </p>
                    </div>
                    <div>
                        <h5 style={{ marginBottom: '1.25rem', opacity: 0.9 }}>Plataforma</h5>
                        <ul style={{ listStyle: 'none', padding: 0, opacity: 0.7, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li><a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Funcionalidades</a></li>
                            <li><a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Precios</a></li>
                            <li><a href="mailto:soporte@alojateya.site" style={{ color: 'inherit', textDecoration: 'none' }}>Soporte</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 style={{ marginBottom: '1.25rem', opacity: 0.9 }}>Legal</h5>
                        <ul style={{ listStyle: 'none', padding: 0, opacity: 0.7, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li><Link to="/terminos" style={{ color: 'inherit', textDecoration: 'none' }}>Términos de Servicio</Link></li>
                            <li><Link to="/privacidad" style={{ color: 'inherit', textDecoration: 'none' }}>Política de Privacidad</Link></li>
                        </ul>
                    </div>
                </div>

                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    paddingTop: '2rem',
                    textAlign: 'center',
                    opacity: 0.6,
                    fontSize: '0.85rem'
                }}>
                    <p>© {currentYear} OrdayGo. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}
