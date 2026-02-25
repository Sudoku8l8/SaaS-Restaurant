import { useState } from 'react';
import type { ReactNode } from 'react';
import { PaymentModal } from '@/components/features/PaymentModal';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/app/providers/TenantProvider';
import type { Order, OrderStatus, OrderPayment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, CheckCircle2, ChefHat, Truck, Banknote, Pencil, Trash2, Printer, MessageSquare } from 'lucide-react';
import { printerService } from '@/services/printer/PrinterService';

interface OrderCardProps {
    order: Order;
    actions?: ReactNode; // Kept for backwards compatibility or extra actions, but mainly we build internal actions now
    onEdit?: () => void;
    onDelete?: () => void;
}

export function OrderCard({ order, onEdit, onDelete }: OrderCardProps) {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const { updateOrderStatus, payOrder } = useOrders();
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const handleStatusChange = (newStatus: OrderStatus) => {
        updateOrderStatus(order.id, newStatus);
    };

    const handlePayment = async (payments: OrderPayment[], shouldPrintReceipt: boolean) => {
        try {
            await payOrder(order.id, payments);
            if (shouldPrintReceipt && printerService.isConnected) {
                try {
                    await printerService.printReceipt({ ...order, payments, status: 'paid' }, tenant?.name || 'Restaurante');
                } catch (printError) {
                    console.error('Error printing receipt:', printError);
                    // Don't block payment flow if printing fails
                }
            }
            setShowPaymentModal(false);
        } catch (error) {
            console.error('Payment failed', error);
            alert('Error al registrar pago');
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'var(--warning-color)';
            case 'in_preparation': return 'var(--info-color)';
            case 'ready': return 'var(--success-color)';
            case 'delivered': return 'var(--text-secondary)';
            default: return 'var(--text-secondary)';
        }
    };

    const getStatusLabel = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'in_preparation': return 'En Cocina';
            case 'ready': return 'Listo';
            case 'delivered': return 'Entregado';
            case 'paid': return 'Cobrado';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    const MainActionButton = () => {
        const usarPantallaCocina = tenant?.config?.usarPantallaCocina ?? false;

        const btnEntregar = (
            <button
                onClick={() => handleStatusChange('delivered')}
                style={{
                    flex: 1,
                    backgroundColor: 'var(--text-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem'
                }}
            >
                <Truck size={18} /> Entregar
            </button>
        );

        switch (order.status) {
            case 'pending':
                if (!usarPantallaCocina) return btnEntregar;
                return (
                    <button
                        onClick={() => handleStatusChange('in_preparation')}
                        style={{
                            flex: 1,
                            backgroundColor: 'var(--info-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 10px rgba(113, 146, 190, 0.2)'
                        }}
                    >
                        <ChefHat size={18} /> Preparar
                    </button>
                );
            case 'in_preparation':
                if (!usarPantallaCocina) return btnEntregar;
                return (
                    <button
                        onClick={() => handleStatusChange('ready')}
                        style={{
                            flex: 1,
                            backgroundColor: 'var(--success-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                            boxShadow: '0 4px 10px rgba(127, 176, 105, 0.2)'
                        }}
                    >
                        <CheckCircle2 size={18} /> Marcar Listo
                    </button>
                );
            case 'ready':
                return btnEntregar;
            case 'delivered':
                return (
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        style={{
                            flex: 1,
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                            boxShadow: '0 4px 10px rgba(142, 115, 91, 0.2)'
                        }}
                    >
                        <Banknote size={18} /> Cobrar Cuenta
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div style={{
                backgroundColor: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {/* Titulo Dinámico por Rol */}
                            {user?.role === 'chef' || user?.role === 'admin' ? (
                                <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
                                    {order.orderType === 'takeout' ? 'PARA LLEVAR' : `MESA ${order.tableNumber}`}
                                </h3>
                            ) : (
                                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                                    Pedido #{order.id.slice(0, 6).toUpperCase()}
                                </h3>
                            )}

                            {/* Información secundaria de ubicación (Solo para otros roles si existen, mozo/admin/chef no lo ven aquí) */}
                            {user?.role !== 'waiter' && user?.role !== 'chef' && user?.role !== 'admin' && (
                                <>
                                    {order.orderType !== 'takeout' ? (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                                            color: 'var(--text-secondary)', fontWeight: '700', fontSize: '0.85rem',
                                            backgroundColor: 'var(--surface-color)',
                                            border: '1px solid var(--border-color)',
                                            padding: '1px 8px', borderRadius: '6px',
                                        }}>
                                            <span>Mesa {order.tableNumber}</span>
                                        </div>
                                    ) : (
                                        <div style={{
                                            color: 'var(--success-color)', fontWeight: '700', fontSize: '0.85rem',
                                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                            padding: '1px 8px', borderRadius: '6px',
                                        }}>
                                            <span>Para Llevar</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Detalle pequeño del ID para el Chef y Admin */}
                            {(user?.role === 'chef' || user?.role === 'admin') && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                    #{order.id.slice(0, 6).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <span style={{
                            backgroundColor: `var(--background-color)`,
                            color: getStatusColor(order.status),
                            padding: '0.4rem 0.85rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            border: '1px solid var(--border-color)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            {getStatusLabel(order.status)}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600' }}>
                            <Clock size={12} />
                            <span>{formatDistanceToNow(order.createdAt, { locale: es, addSuffix: true })}</span>
                        </div>
                    </div>
                </div>

                {order.customerName && (
                    <div style={{
                        background: 'var(--divider-color)',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        🏷️ {order.customerName}
                    </div>
                )}

                {/* Items */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: '0.5rem 0'
                }}>
                    {order.items.map((item, idx) => (
                        <div key={`${item.productId}-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                                    <span style={{
                                        fontWeight: '900',
                                        color: 'white',
                                        background: 'var(--primary-color)',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        minWidth: '38px',
                                        textAlign: 'center',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>{item.quantity}x</span>
                                    <span style={{
                                        color: 'var(--text-primary)',
                                        fontWeight: '800',
                                        fontSize: '1.15rem',
                                        lineHeight: '1.2'
                                    }}>
                                        {item.productName}
                                    </span>
                                </div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '700', marginTop: '4px' }}>
                                    S/ {item.price.toFixed(2)}
                                </span>
                            </div>

                            {/* Notes with highlight */}
                            {item.notes && (
                                <div style={{
                                    marginLeft: '3.2rem',
                                    backgroundColor: 'rgba(168, 218, 220, 0.15)', // Light variant of --secondary-color
                                    borderLeft: '4px solid var(--secondary-color)',
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.9rem',
                                    fontWeight: '700',
                                    color: 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginTop: '2px'
                                }}>
                                    <MessageSquare size={14} color="var(--primary-color)" />
                                    <span style={{ fontStyle: 'italic' }}>"{item.notes}"</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--divider-color)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>TOTAL</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.02em' }}>S/ {order.total.toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <MainActionButton />

                        {onEdit && (
                            <button
                                onClick={onEdit}
                                style={{
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--surface-color)',
                                    color: 'var(--text-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    width: '48px',
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-color)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                <Pencil size={18} />
                            </button>
                        )}

                        {onDelete && (
                            <button
                                onClick={onDelete}
                                style={{
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--surface-color)',
                                    color: 'var(--text-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    width: '48px',
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger-color)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                <Trash2 size={18} />
                            </button>
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!printerService.isConnected) {
                                    alert('La impresora no está conectada. Configúrala en el panel de Administración.');
                                    return;
                                }
                                printerService.printOrder(order).catch(err => alert(err.message));
                            }}
                            style={{
                                border: '1px solid var(--primary-color)',
                                backgroundColor: 'var(--surface-color)',
                                color: 'var(--primary-color)',
                                borderRadius: 'var(--radius-md)',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                marginLeft: 'auto',
                                opacity: printerService.isConnected ? 1 : 0.5
                            }}
                            onMouseEnter={e => {
                                if (printerService.isConnected) {
                                    e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                                    e.currentTarget.style.color = 'white';
                                }
                            }}
                            onMouseLeave={e => {
                                if (printerService.isConnected) {
                                    e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                                    e.currentTarget.style.color = 'var(--primary-color)';
                                }
                            }}
                            title={printerService.isConnected ? 'Imprimir Comanda' : 'Impresora desconectada'}
                        >
                            <Printer size={18} />
                        </button>
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
