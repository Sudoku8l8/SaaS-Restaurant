import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    es: {
        translation: {
            menu: {
                title: "Nuestra Carta Digital",
                searchPlaceholder: "Buscar en la carta...",
                noResultsTitle: "Sin resultados",
                noResultsDesc: "No encontramos platos que coincidan con tu búsqueda.",
                unavailableTitle: "Carta no disponible",
                unavailableDesc: "Estamos preparando nuestra carta digital. Por favor consulte con el mozo.",
                popular: "⭐ Popular",
                soldOut: "Agotado",
                addToCart: "Agregar al Carrito",
                decreaseQty: "Disminuir cantidad",
                increaseQty: "Aumentar cantidad",
                viewOrder: "Ver Pedido",
                table: "Mesa",
                loading: "Cargando Menú...",
                notFound: "Restaurante no encontrado",
                invalidLink: "El enlace que has escaneado parece no ser válido.",
                tags: {
                    vegan: "🌿 Vegano",
                    vegetarian: "🥦 Vegetariano",
                    spicy: "🌶️ Picante",
                    glutenFree: "🌾 Sin Gluten",
                    dairyFree: "🥛 Sin Lácteos",
                    nutFree: "🥜 Sin Nueces"
                }
            },
            checkout: {
                title: "Confirmar Pedido",
                deliveryType: "Tipo de Entrega",
                dineIn: "En Mesa",
                pickup: "Recoger",
                delivery: "Delivery",
                customerData: "Datos del Cliente",
                namePlaceholder: "Ej. Juan Pérez",
                nameLabel: "Nombre y Apellido",
                nameOptional: "Nombre (Opcional)",
                nameHint: "Para que el mozo te llame",
                addressLabel: "Dirección de Entrega",
                addressPlaceholder: "Ej. Av. Principal 123",
                paymentMethod: "Método de Pago",
                cash: "Efectivo",
                transfer: "Transferencia / Cuenta",
                summary: "Resumen",
                subtotal: "Subtotal",
                deliveryCost: "Delivery",
                total: "Total a Pagar",
                confirmDineIn: "🍽️ Confirmar Pedido a la Mesa",
                confirmWhatsapp: "Enviar Pedido por WhatsApp",
                sending: "Enviando...",
                successTableTitle: "¡Pedido Enviado a la Mesa!",
                successTableDesc: "El mozo recibirá tu pedido en un momento.",
                successWhatsappTitle: "¡Pedido Enviado por WhatsApp!",
                successWhatsappDesc: "El personal ha sido notificado también."
            }
        }
    },
    en: {
        translation: {
            menu: {
                title: "Our Digital Menu",
                searchPlaceholder: "Search menu...",
                noResultsTitle: "No results",
                noResultsDesc: "We couldn't find any dishes matching your search.",
                unavailableTitle: "Menu unavailable",
                unavailableDesc: "We are preparing our digital menu. Please consult with the waiter.",
                popular: "⭐ Popular",
                soldOut: "Sold Out",
                addToCart: "Add to Cart",
                decreaseQty: "Decrease quantity",
                increaseQty: "Increase quantity",
                viewOrder: "View Order",
                table: "Table",
                loading: "Loading Menu...",
                notFound: "Restaurant not found",
                invalidLink: "The scanned link appears to be invalid.",
                tags: {
                    vegan: "🌿 Vegan",
                    vegetarian: "🥦 Vegetarian",
                    spicy: "🌶️ Spicy",
                    glutenFree: "🌾 Gluten Free",
                    dairyFree: "🥛 Dairy Free",
                    nutFree: "🥜 Nut Free"
                }
            },
            checkout: {
                title: "Confirm Order",
                deliveryType: "Delivery Type",
                dineIn: "Dine-in",
                pickup: "Pickup",
                delivery: "Delivery",
                customerData: "Customer Data",
                namePlaceholder: "E.g. John Doe",
                nameLabel: "Full Name",
                nameOptional: "Name (Optional)",
                nameHint: "So the waiter can call you",
                addressLabel: "Delivery Address",
                addressPlaceholder: "E.g. Main Street 123",
                paymentMethod: "Payment Method",
                cash: "Cash",
                transfer: "Wire Transfer / Account",
                summary: "Summary",
                subtotal: "Subtotal",
                deliveryCost: "Delivery Fee",
                total: "Total to Pay",
                confirmDineIn: "🍽️ Confirm order to table",
                confirmWhatsapp: "Send Order via WhatsApp",
                sending: "Sending...",
                successTableTitle: "Order Sent to Table!",
                successTableDesc: "The waiter will receive your order shortly.",
                successWhatsappTitle: "Order Sent via WhatsApp!",
                successWhatsappDesc: "The staff has also been notified."
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'es',
        supportedLngs: ['es', 'en'],
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
