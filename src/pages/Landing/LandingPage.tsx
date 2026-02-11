import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Pricing } from './components/Pricing';
import { AuthForms } from './components/AuthForms';
import { Footer } from './components/Footer';

export function LandingPage() {
    const navigate = useNavigate();
    const lastSlug = localStorage.getItem('lastRestaurantSlug');
    const hasRedirected = sessionStorage.getItem('hasRedirectedToRestaurant');

    useEffect(() => {
        if (lastSlug && !hasRedirected) {
            sessionStorage.setItem('hasRedirectedToRestaurant', 'true');
            navigate(`/${lastSlug}/login`);
        }
    }, [navigate, lastSlug, hasRedirected]);

    // If we're about to redirect, show only the background to prevent flicker
    if (lastSlug && !hasRedirected) {
        return <div style={{ minHeight: '100vh', background: '#f8fafc' }} />;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#ffffff',
            overflowX: 'hidden'
        }}>
            <Navbar />
            <Hero />

            <Features />
            <Pricing />
            <AuthForms />

            <Footer />
        </div>
    );
}
