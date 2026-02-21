import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '@/app/providers/TenantProvider';
import { ArrowLeft, MapPin, MessageCircle, Wallet, Utensils, ShoppingBag } from 'lucide-react';
import type { OrderItem } from '@/types';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import styles from './DigitalCheckoutPage.module.css';

export function DigitalCheckoutPage() {
    const { tableNumber, restaurantSlug } = useParams<{ tableNumber?: string; restaurantSlug: string }>();
    const navigate = useNavigate();
    const { tenant, isLoading } = useTenant();

    // State
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [orderType, setOrderType] = useState<'dine-in' | 'pickup' | 'delivery'>(tableNumber ? 'dine-in' : 'pickup');

    // Customer Info
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'yape' | 'plin' | 'transferencia'>('efectivo');

    // Load Cart from localStorage or somewhere else since we navigated? 
    // Actually, in DigitalMenuPage we used local state for the cart. 
    // We should probably persist the cart to localStorage or context so it survives navigation.
    // For now, let's assume it gets passed via location state or we'll need to refactor Cart to Context/LocalStorage.

    useEffect(() => {
        // Load cart from localStorage
        const savedCart = localStorage.getItem(`cart_${tenant?.id}`);
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, [tenant?.id]);

    if (isLoading) return <div>Cargando...</div>;
    if (!tenant) return <div>Restaurante no encontrado</div>;

    const config = tenant.config;

    if (!config?.enableDigitalOrders) {
        return <div>Los pedidos digitales están desactivados.</div>;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const deliveryCost = orderType === 'delivery' ? (config.deliveryCost || 0) : 0;
    const total = subtotal + deliveryCost;

    const handleSendOrder = () => {
        if (!customerName.trim() && orderType !== 'dine-in') {
            alert("Por favor ingresa tu nombre.");
            return;
        }
        if (orderType === 'delivery' && !customerAddress.trim()) {
            alert("Por favor ingresa tu dirección de entrega.");
            return;
        }

        const phone = config.restaurantWhatsApp?.replace(/\D/g, '');
        if (!phone) {
            alert("El restaurante no ha configurado un número de WhatsApp.");
            return;
        }

        let message = `*NUEVO PEDIDO* 🍔\n`;
        message += `Hola, me gustaría hacer el siguiente pedido:\n\n`;

        cart.forEach(item => {
            message += `- ${item.quantity}x ${item.productName} (${config.currency} ${item.subtotal.toFixed(2)})\n`;
        });

        message += `\n*Subtotal:* ${config.currency} ${subtotal.toFixed(2)}\n`;

        if (orderType === 'delivery') {
            message += `*Costo de Envío:* ${config.currency} ${deliveryCost.toFixed(2)}\n`;
        }

        message += `*Total:* ${config.currency} ${total.toFixed(2)}\n\n`;

        message += `*Tipo de Pedido:* ${orderType === 'dine-in' ? 'Para Consumir (Mesa ' + tableNumber + ')' :
            orderType === 'pickup' ? 'Para Recoger' : 'Delivery'
            }\n`;

        if (orderType !== 'dine-in') {
            message += `*Nombre:* ${customerName}\n`;
        }

        if (orderType === 'delivery') {
            message += `*Dirección:* ${customerAddress}\n`;
        }

        message += `*Método de Pago:* ${paymentMethod.toUpperCase()}\n`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

        // Clear cart
        localStorage.removeItem(`cart_${tenant.id}`);

        // Redirect to WhatsApp
        window.open(whatsappUrl, '_blank');
        navigate(`/${restaurantSlug}/menu${tableNumber ? `/${tableNumber}` : ''}`);
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className={styles.title}>Confirmar Pedido</h1>
            </header>

            <main className={styles.content}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Tipo de Entrega</h2>
                    <div className={styles.orderTypeGrid}>
                        {tableNumber && (
                            <button
                                className={`${styles.typeBtn} ${orderType === 'dine-in' ? styles.active : ''}`}
                                onClick={() => setOrderType('dine-in')}
                            >
                                <Utensils size={20} />
                                <span>En Mesa ({tableNumber})</span>
                            </button>
                        )}

                        {config.pickupEnabled && (
                            <button
                                className={`${styles.typeBtn} ${orderType === 'pickup' ? styles.active : ''}`}
                                onClick={() => setOrderType('pickup')}
                            >
                                <ShoppingBag size={20} />
                                <span>Recoger</span>
                            </button>
                        )}

                        {config.deliveryEnabled && (
                            <button
                                className={`${styles.typeBtn} ${orderType === 'delivery' ? styles.active : ''}`}
                                onClick={() => setOrderType('delivery')}
                            >
                                <MapPin size={20} />
                                <span>Delivery</span>
                            </button>
                        )}
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Datos del Cliente</h2>
                    {orderType !== 'dine-in' && (
                        <div className={styles.formGroup}>
                            <Input
                                label="Nombre y Apellido"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Ej. Juan Pérez"
                                required
                            />
                        </div>
                    )}
                    {orderType === 'delivery' && (
                        <div className={styles.formGroup}>
                            <Input
                                label="Dirección de Entrega"
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                placeholder="Ej. Av. Principal 123"
                                required
                            />
                        </div>
                    )}
                    {orderType === 'dine-in' && !tableNumber && (
                        <div className={styles.formGroup}>
                            <p style={{ color: '#888', fontSize: '0.9rem' }}>Estás pidiendo para consumir en el local pero no escaseaste un QR de mesa. Por favor, avísale al mozo tu número de mesa.</p>
                        </div>
                    )}
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Método de Pago</h2>
                    <div className={styles.paymentMethodsGrid}>
                        <button
                            className={`${styles.paymentBtn} ${paymentMethod === 'efectivo' ? styles.active : ''}`}
                            onClick={() => setPaymentMethod('efectivo')}
                        >
                            <Wallet size={20} />
                            <span>Efectivo</span>
                        </button>

                        {config.paymentMethodsConfig?.yape && (
                            <button
                                className={`${styles.paymentBtn} ${paymentMethod === 'yape' ? styles.active : ''}`}
                                onClick={() => setPaymentMethod('yape')}
                            >
                                <span>Yape al {config.paymentMethodsConfig.yape}</span>
                            </button>
                        )}

                        {config.paymentMethodsConfig?.plin && (
                            <button
                                className={`${styles.paymentBtn} ${paymentMethod === 'plin' ? styles.active : ''}`}
                                onClick={() => setPaymentMethod('plin')}
                            >
                                <span>Plin al {config.paymentMethodsConfig.plin}</span>
                            </button>
                        )}

                        {config.paymentMethodsConfig?.bankAccount && (
                            <button
                                className={`${styles.paymentBtn} ${paymentMethod === 'transferencia' ? styles.active : ''}`}
                                onClick={() => setPaymentMethod('transferencia')}
                            >
                                <span>Transferencia / Cuenta</span>
                            </button>
                        )}
                    </div>
                </section>

                <section className={styles.summarySection}>
                    <h2 className={styles.sectionTitle}>Resumen</h2>
                    <div className={styles.cartList}>
                        {cart.map(item => (
                            <div key={item.productId} className={styles.cartItemRow}>
                                <span className={styles.cartItemQty}>{item.quantity}x</span>
                                <span className={styles.cartItemName}>{item.productName}</span>
                                <span className={styles.cartItemPrice}>{config.currency} {item.subtotal.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.totalRow}>
                        <span>Subtotal</span>
                        <span>{config.currency} {subtotal.toFixed(2)}</span>
                    </div>
                    {orderType === 'delivery' && (
                        <div className={styles.totalRow}>
                            <span>Delivery</span>
                            <span>{config.currency} {deliveryCost.toFixed(2)}</span>
                        </div>
                    )}
                    <div className={styles.finalTotalRow}>
                        <span>Total a Pagar</span>
                        <span>{config.currency} {total.toFixed(2)}</span>
                    </div>
                </section>
            </main>

            <footer className={styles.footer}>
                <Button
                    className={styles.submitBtn}
                    onClick={handleSendOrder}
                    disabled={cart.length === 0}
                >
                    <MessageCircle size={20} />
                    Enviar Pedido por WhatsApp
                </Button>
            </footer>
        </div>
    );
}
