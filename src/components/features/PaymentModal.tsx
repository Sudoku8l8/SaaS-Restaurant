import { useState } from 'react';
import { Button, Card, Badge } from '@/components/shared';
import type { Order, PaymentMethod } from '@/types';

interface PaymentModalProps {
    order: Order;
    onClose: () => void;
    onConfirmPayment: (method: PaymentMethod) => void;
}

export function PaymentModal({ order, onClose, onConfirmPayment }: PaymentModalProps) {
    const [method, setMethod] = useState<PaymentMethod | null>(null);

    const methods: { id: PaymentMethod; label: string; icon: string }[] = [
        { id: 'cash', label: 'Efectivo', icon: '💵' },
        { id: 'yape', label: 'Yape', icon: '📱' },
        { id: 'card', label: 'Tarjeta', icon: '💳' },
    ];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1100
        }}>
            <Card title="Registrar Pago" style={{ width: '90%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total a pagar</p>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        S/ {order.total.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                        Mesa {order.tableNumber}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {methods.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setMethod(m.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                padding: '1rem', border: `2px solid ${method === m.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                borderRadius: '8px', background: 'var(--color-background-paper)',
                                color: 'var(--color-text-primary)', cursor: 'pointer',
                                transition: 'all 0.2s', fontSize: '1rem'
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                            <span style={{ flex: 1, textAlign: 'left', fontWeight: method === m.id ? 'bold' : 'normal' }}>{m.label}</span>
                            {method === m.id && <Badge variant="success" size="sm">Seleccionado</Badge>}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
                    <Button
                        fullWidth
                        disabled={!method}
                        onClick={() => method && onConfirmPayment(method)}
                    >
                        Confirmar Pago
                    </Button>
                </div>
            </Card>
        </div>
    );
}
