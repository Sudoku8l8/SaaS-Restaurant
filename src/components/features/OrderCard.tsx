import { useState } from 'react';
import { Button, Card } from '@/components/shared';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PaymentModal } from '@/components/features/PaymentModal';
import { useOrders } from '@/hooks/useOrders';
import type { Order, OrderStatus, PaymentMethod } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderCardProps {
    order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
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

    const nextAction = () => {
        switch (order.status) {
            case 'pending':
                return <Button onClick={() => handleStatusChange('in_preparation')}>Preparar</Button>;
            case 'in_preparation':
                return <Button variant="primary" onClick={() => handleStatusChange('ready')}>Marcar Listo</Button>;
            case 'ready':
                return <Button onClick={() => handleStatusChange('delivered')}>Entregar</Button>;
            case 'delivered':
                return <Button variant="secondary" onClick={() => setShowPaymentModal(true)}>Pagar</Button>;
            default:
                return null;
        }
    };

    return (
        <>
            <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Mesa {order.tableNumber}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: es })}
                        </span>
                    </div>
                    <StatusBadge status={order.status} />
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '0.5rem 0' }}>
                    {order.items.map((item, idx) => (
                        <div key={`${item.productId}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.quantity}x {item.productName}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div style={{ fontWeight: 'bold' }}>Total: S/ {order.total.toFixed(2)}</div>
                    {nextAction()}
                </div>
            </Card>

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
