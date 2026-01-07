import { useState } from 'react';
import { X, Smartphone, Banknote, CreditCard, ShieldCheck } from 'lucide-react';
import type { Order, PaymentMethod } from '@/types';

interface PaymentModalProps {
    order: Order;
    onClose: () => void;
    onConfirmPayment: (method: PaymentMethod) => void;
}

export function PaymentModal({ order, onClose, onConfirmPayment }: PaymentModalProps) {
    const [method, setMethod] = useState<PaymentMethod | null>(null);

    const methods = [
        {
            id: 'cash' as PaymentMethod,
            title: 'Efectivo',
            description: 'Pago en efectivo',
            icon: <Banknote size={22} />,
            color: 'var(--primary-color)',
            bg: 'var(--divider-color)'
        },
        {
            id: 'yape' as PaymentMethod,
            title: 'Yape / Plin',
            description: 'Pago digital instantáneo',
            icon: <Smartphone size={22} />,
            color: '#8B5CF6', // Keep purple for Yape but softer
            bg: '#F5F3FF'
        },
        {
            id: 'card' as PaymentMethod,
            title: 'Tarjeta',
            description: 'Débito o crédito',
            icon: <CreditCard size={22} />,
            color: 'var(--info-color)',
            bg: 'var(--divider-color)'
        }
    ];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1100,
            padding: '1rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: 'var(--surface-color)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh',
                border: '1px solid var(--border-color)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '2.5rem 2rem 2rem',
                    position: 'relative',
                    textAlign: 'center',
                    borderBottom: '1px solid var(--divider-color)'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '1.25rem', right: '1.25rem',
                            background: 'var(--divider-color)', border: 'none',
                            borderRadius: '50%', width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)', cursor: 'pointer'
                        }}
                    >
                        <X size={18} />
                    </button>

                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        letterSpacing: '0.1em',
                        marginBottom: '0.75rem',
                        textTransform: 'uppercase'
                    }}>Total a Cobrar</p>
                    <div style={{
                        fontSize: '3.5rem',
                        fontWeight: '900',
                        lineHeight: 1,
                        marginBottom: '1rem',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em'
                    }}>
                        <span style={{ fontSize: '1.5rem', verticalAlign: 'super', marginRight: '4px' }}>S/</span>
                        {order.total.toFixed(2)}
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        fontWeight: '600'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'var(--background-color)',
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--border-color)'
                        }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }}></span>
                            {order.orderType === 'takeout' ? 'Para Llevar' : `Mesa ${order.tableNumber}`}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '2rem', overflowY: 'auto' }}>
                    <p style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: 'var(--text-secondary)',
                        marginBottom: '1.25rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        Seleccionar Método
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {methods.map((m) => {
                            const isSelected = method === m.id;
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => setMethod(m.id)}
                                    style={{
                                        border: `2px solid ${isSelected ? m.color : 'var(--border-color)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        padding: '1.1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1.25rem',
                                        cursor: 'pointer',
                                        backgroundColor: isSelected ? `${m.color}08` : 'var(--surface-color)',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{
                                        backgroundColor: isSelected ? m.color : 'var(--divider-color)',
                                        color: isSelected ? 'white' : 'var(--text-secondary)',
                                        width: '44px', height: '44px',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'all 0.2s'
                                    }}>
                                        {m.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1rem' }}>{m.title}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>{m.description}</div>
                                    </div>
                                    {isSelected && (
                                        <div style={{
                                            color: m.color
                                        }}>
                                            <ShieldCheck size={20} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.5rem 2rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <button
                        disabled={!method}
                        onClick={() => method && onConfirmPayment(method)}
                        style={{
                            width: '100%',
                            padding: '1.1rem',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: method ? 'var(--primary-color)' : 'var(--divider-color)',
                            color: method ? 'white' : 'var(--text-secondary)',
                            fontWeight: '800',
                            fontSize: '1rem',
                            cursor: method ? 'pointer' : 'not-allowed',
                            boxShadow: method ? '0 8px 20px rgba(142, 115, 91, 0.2)' : 'none',
                            transition: 'all 0.3s'
                        }}
                    >
                        Confirmar y Finalizar
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                        }}
                    >
                        Volver atrás
                    </button>
                </div>
            </div>
        </div>
    );
}
