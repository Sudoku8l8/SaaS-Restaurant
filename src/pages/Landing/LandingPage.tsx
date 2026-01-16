import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { AuthForms } from './components/AuthForms';
import { Footer } from './components/Footer';

export function LandingPage() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#ffffff',
            overflowX: 'hidden'
        }}>
            <Navbar />
            <Hero />

            <Features />

            <AuthForms />

            <Footer />
        </div>
    );
}
