import { useState, useEffect } from 'react';
import { X, Smartphone, Banknote, CreditCard, Printer, Trash2, Plus } from 'lucide-react';
import type { Order, PaymentMethod, OrderPayment } from '@/types';
import { printerService } from '@/services/printer/PrinterService';

interface PaymentModalProps {
    order: Order;
    onClose: () => void;
    onConfirmPayment: (payments: OrderPayment[], printReceipt: boolean) => void;
}

export function PaymentModal({ order, onClose, onConfirmPayment }: PaymentModalProps) {
    const [payments, setPayments] = useState<OrderPayment[]>([]);
    const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(null);
    const [inputAmount, setInputAmount] = useState<string>('');

    const printerConnected = printerService.isConnected;
    const [printReceipt, setPrintReceipt] = useState(printerConnected);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, order.total - totalPaid);
    const isFullyPaid = remaining <= 0.01; // Avoid float precision issues

    // Sync input amount with remaining when remaining changes, if not fully paid
    useEffect(() => {
        if (!isFullyPaid) {
            setInputAmount(remaining.toFixed(2));
        } else {
            setInputAmount('');
            setCurrentMethod(null);
        }
    }, [remaining, isFullyPaid]);

    const handleAddPayment = () => {
        if (!currentMethod) return;
        const amount = parseFloat(inputAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Ingrese un monto válido');
            return;
        }
        if (amount > remaining + 0.01) {
            alert('El monto no puede ser mayor al saldo restante');
            return;
        }

        setPayments(prev => [...prev, { method: currentMethod, amount }]);
        setCurrentMethod(null);
    };

    const handleRemovePayment = (index: number) => {
        setPayments(prev => prev.filter((_, i) => i !== index));
    };

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
            color: '#6366f1',
            bg: '#F5F5FF'
        },
        {
            id: 'card' as PaymentMethod,
            title: 'Tarjeta',
            description: 'Débito o crédito',
            icon: <CreditCard size={22} />,
            color: 'var(--text-secondary)',
            bg: 'var(--divider-color)'
        }
    ];

    const getMethodTitle = (id: PaymentMethod) => methods.find(m => m.id === id)?.title || id;

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
                maxWidth: '450px',
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
                    padding: '2.5rem 2rem 1.5rem',
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
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase'
                    }}>Total de la Cuenta</p>
                    <div style={{
                        fontSize: '2.5rem',
                        fontWeight: '900',
                        lineHeight: 1,
                        marginBottom: '0.5rem',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em'
                    }}>
                        <span style={{ fontSize: '1.25rem', verticalAlign: 'super', marginRight: '4px' }}>S/</span>
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
                <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Resumen de pago */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        backgroundColor: isFullyPaid ? 'rgba(76, 175, 80, 0.1)' : 'var(--background-color)',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${isFullyPaid ? 'var(--success-color)' : 'var(--border-color)'}`
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Pagado</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--success-color)' }}>S/ {totalPaid.toFixed(2)}</span>
                        </div>
                        <div style={{ width: '1px', backgroundColor: 'var(--divider-color)', alignSelf: 'stretch' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Saldo Restante</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: isFullyPaid ? 'var(--text-secondary)' : 'var(--danger-color)' }}>
                                S/ {remaining.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Lista de pagos agregados */}
                    {payments.length > 0 && (
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Pagos Recibidos
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {payments.map((p, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: 'var(--surface-color)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{getMethodTitle(p.method)}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>S/ {p.amount.toFixed(2)}</span>
                                            <button
                                                onClick={() => handleRemovePayment(idx)}
                                                style={{
                                                    background: 'transparent', border: 'none', color: 'var(--danger-color)',
                                                    cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Agregar nuevo pago (solo si hay saldo) */}
                    {!isFullyPaid && (
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Agregar Pago
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                                {methods.map((m) => {
                                    const isSelected = currentMethod === m.id;
                                    return (
                                        <div
                                            key={m.id}
                                            onClick={() => setCurrentMethod(m.id)}
                                            style={{
                                                border: `2px solid ${isSelected ? m.color : 'var(--border-color)'}`,
                                                borderRadius: 'var(--radius-md)',
                                                padding: '0.75rem 0.5rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                cursor: 'pointer',
                                                backgroundColor: isSelected ? `${m.color}08` : 'var(--surface-color)',
                                                transition: 'all 0.2s',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <div style={{ color: isSelected ? m.color : 'var(--text-secondary)' }}>
                                                {m.icon}
                                            </div>
                                            <div style={{ fontWeight: '700', fontSize: '0.8rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                {m.title}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {currentMethod && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 'bold' }}>S/</span>
                                        <input
                                            type="number"
                                            value={inputAmount}
                                            onChange={(e) => setInputAmount(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.85rem 1rem 0.85rem 2.5rem',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)',
                                                backgroundColor: 'var(--background-color)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem',
                                                fontWeight: '700'
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddPayment}
                                        style={{
                                            padding: '0 1rem',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 'var(--radius-md)',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Plus size={18} /> Agregar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.5rem',
                    borderTop: '1px solid var(--divider-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    backgroundColor: 'var(--surface-color)',
                    marginTop: 'auto'
                }}>
                    {/* Print Receipt Checkbox */}
                    <label
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)',
                            border: `1px solid ${printerConnected ? 'var(--border-color)' : 'var(--divider-color)'}`,
                            backgroundColor: printReceipt ? 'rgba(69, 123, 157, 0.06)' : 'var(--background-color)',
                            cursor: printerConnected ? 'pointer' : 'default',
                            opacity: printerConnected ? 1 : 0.5,
                            transition: 'all 0.2s', userSelect: 'none'
                        }}
                    >
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '4px',
                            border: `2px solid ${printReceipt ? 'var(--primary-color)' : 'var(--text-secondary)'}`,
                            backgroundColor: printReceipt ? 'var(--primary-color)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s', flexShrink: 0
                        }}>
                            {printReceipt && (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                        <input
                            type="checkbox"
                            checked={printReceipt}
                            disabled={!printerConnected}
                            onChange={(e) => setPrintReceipt(e.target.checked)}
                            style={{ display: 'none' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Printer size={16} color="var(--primary-color)" />
                                Imprimir boleta
                            </div>
                            {!printerConnected && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '2px' }}>
                                    Impresora no conectada
                                </div>
                            )}
                        </div>
                    </label>

                    <button
                        disabled={!isFullyPaid}
                        onClick={() => isFullyPaid && onConfirmPayment(payments, printReceipt)}
                        style={{
                            width: '100%',
                            padding: '1.25rem',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: isFullyPaid ? 'var(--primary-color)' : 'var(--divider-color)',
                            color: isFullyPaid ? 'white' : 'var(--text-secondary)',
                            fontWeight: '800',
                            fontSize: '1rem',
                            cursor: isFullyPaid ? 'pointer' : 'not-allowed',
                            boxShadow: isFullyPaid ? '0 8px 25px rgba(69, 123, 157, 0.3)' : 'none',
                            transition: 'all 0.3s'
                        }}
                    >
                        Confirmar y Finalizar
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
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
