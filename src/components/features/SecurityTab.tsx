import { useState } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card } from '@/components/shared';
import { ShieldCheck } from 'lucide-react';
import { hashPin } from '@/utils/crypto';

export function SecurityTab() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [form, setForm] = useState({
        currentPin: '',
        newPin: '',
        confirmPin: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!user?.id || !user?.restaurantId) return;

        // Basic Validations
        if (form.newPin.length !== 4 || !/^\d+$/.test(form.newPin)) {
            setMessage({ type: 'error', text: 'El nuevo PIN debe ser de 4 dígitos numéricos.' });
            return;
        }

        if (form.newPin !== form.confirmPin) {
            setMessage({ type: 'error', text: 'Los PINs no coinciden.' });
            return;
        }

        setIsLoading(true);

        try {
            // Check for collisions in the same restaurant
            const newHash = await hashPin(form.newPin);
            const usersRef = collection(db, 'users');
            const q = query(usersRef,
                where('restaurantId', '==', user.restaurantId)
            );
            const querySnapshot = await getDocs(q);

            const collision = querySnapshot.docs.some(doc => {
                if (doc.id === user.id) return false;
                const data = doc.data();
                // Check both legacy plain text and modern hash
                return data.pinHash === newHash || data.pinHash === form.newPin;
            });

            if (collision) {
                setMessage({ type: 'error', text: 'Este PIN ya está en uso por otro miembro del equipo. Elige uno diferente.' });
                setIsLoading(false);
                return;
            }

            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
                pinHash: newHash
            });

            setMessage({ type: 'success', text: 'PIN actualizado correctamente.' });
            setForm({ currentPin: '', newPin: '', confirmPin: '' });
        } catch (error) {
            console.error('Error updating PIN:', error);
            setMessage({ type: 'error', text: 'Error al actualizar el PIN. Inténtalo de nuevo.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <Card style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
                    <ShieldCheck size={28} />
                    <h2 style={{ margin: 0 }}>Seguridad de la Cuenta</h2>
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
                    Utiliza este formulario para actualizar tu PIN maestro de acceso. El PIN debe ser numérico y de 4 dígitos.
                </p>

                {message && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem',
                        backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                        color: message.type === 'success' ? '#065F46' : '#991B1B',
                        border: `1px solid ${message.type === 'success' ? '#10B981' : '#EF4444'}`,
                        fontSize: '0.9rem'
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Input
                        label="Nuevo PIN (4 dígitos)"
                        type="password"
                        placeholder="••••"
                        maxLength={4}
                        value={form.newPin}
                        onChange={e => setForm({ ...form, newPin: e.target.value })}
                        required
                        fullWidth
                    />
                    <Input
                        label="Confirmar Nuevo PIN"
                        type="password"
                        placeholder="••••"
                        maxLength={4}
                        value={form.confirmPin}
                        onChange={e => setForm({ ...form, confirmPin: e.target.value })}
                        required
                        fullWidth
                    />

                    <div style={{ marginTop: '1rem' }}>
                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            disabled={isLoading}
                            isLoading={isLoading}
                        >
                            {isLoading ? 'Actualizando...' : 'Guardar Nuevo PIN'}
                        </Button>
                    </div>
                </form>
            </Card>

            <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed #ccc' }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Consejo de Seguridad</h4>
                <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>
                    Evita usar PINs obvios como "1234" o tu año de nacimiento. Cambia tu PIN periódicamente para mantener la seguridad de tu restaurante.
                </p>
            </div>
        </div>
    );
}
