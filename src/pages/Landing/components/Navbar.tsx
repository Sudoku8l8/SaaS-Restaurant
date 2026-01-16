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
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    orday<span style={{ color: '#2563eb' }}>Go</span>
                </div>

                <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <a href="#features" style={{ textDecoration: 'none', color: '#666', fontSize: '0.95rem', fontWeight: 500 }}>Características</a>
                    <a href="#benefits" style={{ textDecoration: 'none', color: '#666', fontSize: '0.95rem', fontWeight: 500 }}>Beneficios</a>
                    <a href="#contact" style={{ textDecoration: 'none', color: '#666', fontSize: '0.95rem', fontWeight: 500 }}>Contacto</a>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <button
                        onClick={handleLoginClick}
                        style={{ background: 'none', border: 'none', color: '#444', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Inicia sesión
                    </button>
                    <Button
                        onClick={scrollToAuth}
                        style={{ background: '#2563eb', padding: '0.6rem 1.5rem', borderRadius: 'var(--radius-md)' }}
                    >
                        Comienza gratis
                    </Button>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .nav-links { display: none !important; }
                }
            `}</style>
        </nav>
    );
}
