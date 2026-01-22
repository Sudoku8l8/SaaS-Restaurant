import { Button } from '@/components/shared';

export function Navbar() {
    const scrollToAuth = () => {
        document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleLoginClick = (e: React.MouseEvent) => {
        e.preventDefault();
        scrollToAuth();
    };

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            padding: '1rem 0'
        }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a1a', flexShrink: 0 }}>
                    Orday<span style={{ color: '#2563eb' }}>Go</span>
                </div>

                <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <a href="#features" style={{ textDecoration: 'none', color: '#666', fontSize: '0.95rem', fontWeight: 500 }}>Características</a>
                    <a href="#benefits" style={{ textDecoration: 'none', color: '#666', fontSize: '0.95rem', fontWeight: 500 }}>Beneficios</a>
                    <a href="#contact" style={{ textDecoration: 'none', color: '#666', fontSize: '0.95rem', fontWeight: 500 }}>Contacto</a>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                    <button
                        onClick={handleLoginClick}
                        className="login-btn"
                        style={{ background: '#2563eb', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: '#fff', fontSize: '0.9rem', cursor: 'pointer', borderColor: '#2563eb' }}
                    >
                        Ingresar
                    </button>
                    <Button
                        onClick={scrollToAuth}
                        className='register-btn'
                        style={{ background: '#2563eb', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}
                    >
                        Regístrate
                    </Button>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .nav-links { display: none !important; }
                    .register-btn { display: none !important; }
                }
                @media (max-width: 480px) {
                    nav .container { padding: 0 0.5rem; }
                }
            `}</style>
        </nav>
    );
}
