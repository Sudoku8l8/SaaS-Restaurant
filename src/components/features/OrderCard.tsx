import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/shared';
import { PaymentModal } from '@/components/features/PaymentModal';
import { useOrders } from '@/hooks/useOrders';
import type { Order, OrderStatus, PaymentMethod } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, CheckCircle2, ChefHat, Truck, Banknote, Pencil, Trash2 } from 'lucide-react';

interface OrderCardProps {
    order: Order;
    actions?: ReactNode; // Kept for backwards compatibility or extra actions, but mainly we build internal actions now
    onEdit?: () => void;
    onDelete?: () => void;
}

export function OrderCard({ order, onEdit, onDelete }: OrderCardProps) {
    const { updateOrderStatus, payOrder } = useOrders();
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const handleStatusChange = (newStatus: OrderStatus) => {
        updateOrderStatus(order.id, newStatus);
    };

    const handlePayment = async (method: PaymentMethod) => {
        try {
            await payOrder(order.id, method);
            setShowPaymentModal(false);
        } catch (error) {
            console.error('Payment failed', error);
            alert('Error al registrar pago');
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return '#f97316'; // Orange
            case 'in_preparation': return '#3b82f6'; // Blue
            case 'ready': return '#22c55e'; // Green
            case 'delivered': return '#64748b'; // Slate
            default: return '#6b7280';
        }
    };

    const getStatusLabel = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'in_preparation': return 'En Preparación';
            case 'ready': return 'Listo';
            case 'delivered': return 'Entregado';
            case 'paid': return 'Pagado';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    const MainActionButton = () => {
        switch (order.status) {
            case 'pending':
                return (
                    <button
                        onClick={() => handleStatusChange('in_preparation')}
                        style={{
                            flex: 1,
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            transition: 'background 0.2s'
                        }}
                    >
                        <ChefHat size={18} /> Preparar
                    </button>
                );
            case 'in_preparation':
                return (
                    <button
                        onClick={() => handleStatusChange('ready')}
                        style={{
                            flex: 1,
                            backgroundColor: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        <CheckCircle2 size={18} /> Marcar Listo
                    </button>
                );
            case 'ready':
                return (
                    <button
                        onClick={() => handleStatusChange('delivered')}
                        style={{
                            flex: 1,
                            backgroundColor: '#64748b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        <Truck size={18} /> Entregar
                    </button>
                );
            case 'delivered':
                return (
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        style={{
                            flex: 1,
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        <Banknote size={18} /> Pagar
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div style={{
                backgroundColor: '#1e1e1e', // Dark Surface
                border: `1px solid ${order.status === 'pending' ? '#f97316' : '#333'}`, // Orange border for pending
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                transition: 'all 0.2s ease-in-out'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{
                            backgroundColor: '#1e3a8a', // Dark Blue bg
                            color: '#60a5fa', // Light Blue text
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                        }}>
                            {order.tableNumber}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>Mesa {order.tableNumber}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                <Clock size={14} />
                                <span>{formatDistanceToNow(order.createdAt, { locale: es })}</span>
                            </div>
                        </div>
                    </div>

                    <span style={{
                        backgroundColor: `${getStatusColor(order.status)}20`, // 20% opacity bg
                        color: getStatusColor(order.status),
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        border: `1px solid ${getStatusColor(order.status)}40`
                    }}>
                        {getStatusLabel(order.status)}
                    </span>
                </div>

                {/* Items */}
                <div style={{
                    borderTop: '1px solid #333',
                    borderBottom: '1px solid #333',
                    padding: '1rem 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                }}>
                    {order.items.map((item, idx) => (
                        <div key={`${item.productId}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e5e7eb' }}>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <span style={{ fontWeight: '600', color: '#9ca3af' }}>{item.quantity}x</span>
                                <span>{item.productName}</span>
                            </div>
                            <span style={{ color: '#6b7280' }}>S/ {item.price.toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ color: '#9ca3af', fontWeight: '500' }}>Total:</span>
                        <span style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>S/ {order.total.toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <MainActionButton />

                        {/* Edit Button */}
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                style={{
                                    border: '1px solid #7c3aed',
                                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                                    color: '#a78bfa',
                                    borderRadius: '8px',
                                    width: '42px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <Pencil size={18} />
                            </button>
                        )}

                        {/* Delete Button */}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                style={{
                                    border: '1px solid #dc2626',
                                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                    color: '#ef4444',
                                    borderRadius: '8px',
                                    width: '42px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showPaymentModal && (
                <PaymentModal
                    order={order}
                    onClose={() => setShowPaymentModal(false)}
                    onConfirmPayment={handlePayment}
                />
            )}
        </>
    );
}
