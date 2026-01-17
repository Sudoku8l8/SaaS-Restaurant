import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { AuthForms } from './components/AuthForms';
import { Footer } from './components/Footer';

export function LandingPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const lastSlug = localStorage.getItem('lastRestaurantSlug');
        if (lastSlug) {
            navigate(`/${lastSlug}/login`);
        }
    }, [navigate]);

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
