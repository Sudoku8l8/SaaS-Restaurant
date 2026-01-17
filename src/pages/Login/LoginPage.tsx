import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, Input } from '@/components/shared';
import { UserRole } from '@/types';

export function LoginPage() {
    const [pin, setPin] = useState('');
    const { login, isLoading, error, user } = useAuth();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            const basePath = restaurantSlug ? `/${restaurantSlug}` : '';
            if (user.role === UserRole.ADMIN || user.role === UserRole.CHEF) {
                navigate(`${basePath}/cocina`);
            } else {
                navigate(`${basePath}/mozo`);
            }
        }
    }, [user, navigate, restaurantSlug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pin) return;
        try {
            // Pass restaurantSlug to enforce security
            await login(pin, restaurantSlug);
        } catch (err) {
            // Error handled by AuthProvider and displayed via error state
            console.error(err);
        }
    };

    const handleNumPadClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setPin('');
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--background-color)' }}>
            <Card title="Restaurante Login" style={{ width: '100%', maxWidth: '360px' }}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                    <Input
                        type="password"
                        placeholder="PIN de 4 dígitos"
                        value={pin}
                        readOnly
                        fullWidth
                        style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 'bold' }}
                        error={error || undefined}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <Button
                                key={num}
                                type="button"
                                variant="outline"
                                onClick={() => handleNumPadClick(num.toString())}
                                style={{ height: '60px', fontSize: '1.25rem' }}
                            >
                                {num}
                            </Button>
                        ))}
                        <Button type="button" variant="danger" onClick={handleClear} style={{ height: '60px' }}>C</Button>
                        <Button type="button" variant="outline" onClick={() => handleNumPadClick('0')} style={{ height: '60px', fontSize: '1.25rem' }}>0</Button>
                        <Button type="button" variant="secondary" onClick={handleBackspace} style={{ height: '60px' }}>⌫</Button>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        isLoading={isLoading}
                        disabled={pin.length < 4}
                    >
                        Ingresar
                    </Button>

                    <button
                        type="button"
                        onClick={() => {
                            localStorage.removeItem('lastRestaurantSlug');
                            sessionStorage.removeItem('hasRedirectedToRestaurant');
                            navigate('/');
                        }}
                        style={{
                            marginTop: '0.5rem',
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            textDecoration: 'underline',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'center'
                        }}
                    >
                        Cambiar de Restaurante
                    </button>
                </form>
            </Card>
        </div>
    );
}
