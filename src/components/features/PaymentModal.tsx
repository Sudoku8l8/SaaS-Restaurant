import { useState } from 'react';
import { X, Clock, Smartphone, Banknote, CreditCard, ShieldCheck } from 'lucide-react';
import type { Order, PaymentMethod } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
            icon: <Banknote size={24} />,
            color: '#fbbf24', // Amber
            bg: '#fffbeb'
        },
        {
            id: 'yape' as PaymentMethod,
            title: 'Yape',
            description: 'Pago digital instantáneo',
            icon: <Smartphone size={24} />,
            color: '#a855f7', // Purple
            bg: '#f3e8ff'
        },
        {
            id: 'card' as PaymentMethod,
            title: 'Tarjeta',
            description: 'Débito o crédito',
            icon: <CreditCard size={24} />,
            color: '#3b82f6', // Blue
            bg: '#eff6ff'
        }
    ];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1100,
            padding: '1rem' // Mobile padding
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px', // Restrict max width for desktop
                backgroundColor: 'white',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh' // Prevent overflow on small vertical screens
            }}>
                {/* Header */}
                <div style={{
                    backgroundColor: '#111827', // Dark background
                    color: 'white',
                    padding: '2rem 1.5rem',
                    position: 'relative'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '1rem', right: '1rem',
                            background: 'rgba(255,255,255,0.1)', border: 'none',
                            borderRadius: '50%', width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', cursor: 'pointer'
                        }}
                    >
                        <X size={18} />
                    </button>

                    <p style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.05em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total a Pagar</p>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: 1, marginBottom: '1.5rem' }}>
                        S/ {order.total.toFixed(2)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: '#9ca3af' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                            {order.orderType === 'takeout' ? 'Para Llevar' : `Mesa ${order.tableNumber}`}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={14} />
                            {format(new Date(), 'h:mm a', { locale: es })}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6b7280', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Método de Pago
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {methods.map((m) => {
                            const isSelected = method === m.id;
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => setMethod(m.id)}
                                    style={{
                                        border: `2px solid ${isSelected ? m.color : '#e5e7eb'}`,
                                        borderRadius: '16px',
                                        padding: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        cursor: 'pointer',
                                        backgroundColor: isSelected ? `${m.color}05` : 'white',
                                        transition: 'all 0.2s',
                                        boxShadow: isSelected ? `0 4px 6px -1px ${m.color}20` : 'none',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{
                                        backgroundColor: m.bg,
                                        color: m.color,
                                        width: '48px', height: '48px',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {m.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '1rem' }}>{m.title}</div>
                                        <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{m.description}</div>
                                    </div>
                                    <div style={{
                                        width: '24px', height: '24px',
                                        borderRadius: '50%',
                                        border: `2px solid ${isSelected ? m.color : '#d1d5db'}`,
                                        backgroundColor: isSelected ? m.color : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white'
                                    }}>
                                        {isSelected && <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%' }} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{
                        marginTop: '1.5rem',
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#64748b',
                        fontSize: '0.75rem'
                    }}>
                        <ShieldCheck size={16} />
                        <span>Todas las transacciones son seguras y encriptadas.</span>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.5rem',
                    borderTop: '1px solid #f3f4f6',
                    display: 'flex',
                    gap: '1rem'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            backgroundColor: 'white',
                            color: '#374151',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        disabled={!method}
                        onClick={() => method && onConfirmPayment(method)}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: method ? 'linear-gradient(135deg, #8b5cf6, #d946ef)' : '#e5e7eb',
                            color: method ? 'white' : '#9ca3af',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: method ? 'pointer' : 'not-allowed',
                            boxShadow: method ? '0 4px 6px -1px rgba(139, 92, 246, 0.3)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        Confirmar Pago
                    </button>
                </div>
            </div>
        </div>
    );
}
