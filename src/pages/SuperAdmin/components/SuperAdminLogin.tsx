import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Button, Input } from '@/components/shared';
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';
import styles from '../SuperAdmin.module.css';

export function SuperAdminLogin() {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const { login } = useSuperAdminAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await login(pin);
        if (!success) {
            setError(true);
            setPin('');
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: '#1e293b', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 2rem'
                }}>
                    <Shield size={40} color="#38bdf8" />
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>SuperAdmin</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Centro de Control General</p>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        type="password"
                        placeholder="PIN Maestro"
                        value={pin}
                        onChange={(e) => {
                            setPin(e.target.value);
                            setError(false);
                        }}
                        style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.2em' }}
                        autoFocus
                    />
                    {error && (
                        <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', fontWeight: 700 }}>
                            PIN Incorrecto
                        </p>
                    )}
                    <Button type="submit" variant="primary" size="lg" style={{ marginTop: '1rem' }}>
                        Acceder
                    </Button>
                </form>
            </div>
        </div>
    );
}
