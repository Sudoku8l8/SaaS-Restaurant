import type { Order } from '@/types';

// ESC/POS Commands
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

class PrinterService {
    private device: any = null;
    private characteristic: any = null; // For Bluetooth
    private endpointOut: any = null; // For USB
    private connectionType: 'bluetooth' | 'usb' | 'external' | null = null;
    private isAutoPrintEnabled: boolean = localStorage.getItem('printer_auto_print') === 'true';

    constructor() {
        // Restore external (RawBT) connection type from localStorage on app reload
        const savedType = localStorage.getItem('printer_type');
        if (savedType === 'external') {
            this.connectionType = 'external';
        }
        // For bluetooth/usb, we DON'T restore because the real device connection is lost on reload
    }

    // Bluetooth Connection
    async connectBluetooth() {
        if (!(navigator as any).bluetooth) {
            throw new Error('Web Bluetooth API no está habilitada o soportada en este navegador. Asegúrate de usar Chrome/Edge y HTTPS/localhost.');
        }
        try {
            const device = await (navigator as any).bluetooth.requestDevice({
                filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            });

            // Listen for disconnection
            device.addEventListener('gattserverdisconnected', () => {
                console.warn('Bluetooth device disconnected');
                this.device = null;
                this.characteristic = null;
                if (this.connectionType === 'bluetooth') {
                    this.connectionType = null;
                    localStorage.removeItem('printer_type');
                    localStorage.removeItem('printer_name');
                }
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

            this.device = device;
            this.characteristic = characteristic;
            this.connectionType = 'bluetooth';

            this.saveDevicePreference('bluetooth', device.name || 'Impresora BLE');
            return true;
        } catch (error) {
            console.error('Bluetooth connection error:', error);
            throw error;
        }
    }

    // USB Connection
    async connectUSB() {
        try {
            const device = await (navigator as any).usb.requestDevice({ filters: [] });
            await device.open();
            await device.selectConfiguration(1);

            const iface = device.configuration.interfaces[0];
            await device.claimInterface(iface.interfaceNumber);

            const endpoint = iface.alternate.endpoints.find((e: any) => e.direction === 'out' && e.type === 'bulk');

            if (!endpoint) throw new Error('No bulk out endpoint found');

            this.device = device;
            this.endpointOut = endpoint;
            this.connectionType = 'usb';

            this.saveDevicePreference('usb', device.productName || 'Impresora USB');
            return true;
        } catch (error) {
            console.error('USB connection error:', error);
            throw error;
        }
    }

    // External Bridge (RawBT)
    async connectExternal() {
        this.connectionType = 'external';
        this.saveDevicePreference('external', 'App RawBT (Android)');
        return true;
    }

    private saveDevicePreference(type: 'bluetooth' | 'usb' | 'external', name: string) {
        localStorage.setItem('printer_type', type);
        localStorage.setItem('printer_name', name);
    }

    get isConnected(): boolean {
        if (this.connectionType === 'external') {
            return true; // RawBT is fire-and-forget, always "connected"
        }
        if (this.connectionType === 'bluetooth') {
            return !!(this.device?.gatt?.connected && this.characteristic);
        }
        if (this.connectionType === 'usb') {
            return !!(this.device?.opened);
        }
        // Check localStorage only for external/RawBT
        const savedType = localStorage.getItem('printer_type');
        if (savedType === 'external') {
            this.connectionType = 'external';
            return true;
        }
        return false;
    }

    get connectedDeviceName() {
        if (!this.isConnected) return 'Ninguno';
        return localStorage.getItem('printer_name') || 'Ninguno';
    }

    get activeConnectionType(): 'bluetooth' | 'usb' | 'external' | null {
        if (this.connectionType) return this.connectionType;
        // Only restore external from localStorage
        const savedType = localStorage.getItem('printer_type');
        if (savedType === 'external') {
            this.connectionType = 'external';
            return 'external';
        }
        return null;
    }

    setAutoPrint(enabled: boolean) {
        this.isAutoPrintEnabled = enabled;
        localStorage.setItem('printer_auto_print', String(enabled));
    }

    get autoPrint() {
        return this.isAutoPrintEnabled;
    }

    async disconnect() {
        try {
            if (this.connectionType === 'bluetooth' && this.device?.gatt?.connected) {
                await this.device.gatt.disconnect();
            } else if (this.connectionType === 'usb' && this.device?.opened) {
                await this.device.close();
            }
        } catch (e) {
            console.warn('Error during disconnect:', e);
        }
        this.device = null;
        this.characteristic = null;
        this.endpointOut = null;
        this.connectionType = null;
        localStorage.removeItem('printer_type');
        localStorage.removeItem('printer_name');
    }

    // Print logic
    async printOrder(order: Order) {
        this.ensureConnected();
        const data = this.encodeOrder(order);
        await this.sendData(data);
    }

    // POS Receipt print
    async printReceipt(order: Order, restaurantName: string) {
        this.ensureConnected();
        const data = this.encodeReceipt(order, restaurantName);
        await this.sendData(data);
    }

    async testPrint() {
        this.ensureConnected();
        const encoder = new TextEncoder();
        let data = new Uint8Array([
            ESC, 0x40, // Initialize
            ESC, 0x61, 0x01, // Center
            ...encoder.encode("PRUEBA DE IMPRESION\n"),
            ...encoder.encode("--------------------------------\n"),
            ...encoder.encode("Si ves esto, la conexion\nes correcta.\n"),
            ...encoder.encode("¡Listo para trabajar!\n"),
            ...encoder.encode("--------------------------------\n"),
            LF, LF, LF, LF,
            GS, 0x56, 0x41, 0x03 // Cut
        ]);
        await this.sendData(data);
    }

    private ensureConnected() {
        const type = this.activeConnectionType;
        if (!type) {
            throw new Error('La impresora no está conectada. Ve a Configuración > Impresora para conectarla.');
        }
        if (type === 'bluetooth' && (!this.device?.gatt?.connected || !this.characteristic)) {
            // Clean up stale localStorage
            this.connectionType = null;
            localStorage.removeItem('printer_type');
            localStorage.removeItem('printer_name');
            throw new Error('La conexión Bluetooth se perdió. Reconecta la impresora desde Configuración.');
        }
        if (type === 'usb' && !this.device?.opened) {
            this.connectionType = null;
            localStorage.removeItem('printer_type');
            localStorage.removeItem('printer_name');
            throw new Error('La conexión USB se perdió. Reconecta la impresora desde Configuración.');
        }
    }

    private encodeOrder(order: Order): Uint8Array {
        const encoder = new TextEncoder();
        const chunks: Uint8Array[] = [];

        const add = (bytes: number[] | Uint8Array) => chunks.push(new Uint8Array(bytes));
        const addText = (text: string) => add(encoder.encode(text));

        // Initialize
        add([ESC, 0x40]);

        // Header
        add([ESC, 0x61, 0x01]); // Center
        add([GS, 0x21, 0x11]); // Double Size
        addText(`COMANDA ${order.dailyNumber || ''}\n`);
        add([GS, 0x21, 0x00]); // Normal Size

        add([ESC, 0x61, 0x00]); // Left
        addText(`Mesa: ${order.tableNumber === 0 ? 'Para Llevar' : order.tableNumber}\n`);
        addText(`Cliente: ${order.customerName || 'N/A'}\n`);
        addText(`Mozo: ${order.userName}\n`);
        addText(`Fecha: ${order.createdAt.toLocaleString()}\n`);
        addText("--------------------------------\n");

        // Items
        add([ESC, 0x45, 0x01]); // Bold on (ESC E 1)
        order.items.forEach(item => {
            const qtyText = `${item.quantity}x `.padEnd(4);
            const nameText = item.productName.substring(0, 28) + "\n";
            addText(qtyText + nameText);
            if (item.notes) {
                addText(`  Obs: ${item.notes}\n`);
            }
        });
        add([ESC, 0x45, 0x00]); // Bold off

        addText("--------------------------------\n");
        add([ESC, 0x61, 0x02]); // Right
        addText(`TOTAL: S/ ${order.total.toFixed(2)}\n`);

        // Footer
        add([ESC, 0x61, 0x01]); // Center
        addText("\nOrdayGo\n");
        add([LF, LF, LF, LF]);
        add([GS, 0x56, 0x41, 0x03]); // Cut

        return this.combineChunks(chunks);
    }

    private encodeReceipt(order: Order, restaurantName: string): Uint8Array {
        const encoder = new TextEncoder();
        const chunks: Uint8Array[] = [];

        const add = (bytes: number[] | Uint8Array) => chunks.push(new Uint8Array(bytes));
        const addText = (text: string) => add(encoder.encode(text));
        const LINE = "================================\n";

        const paymentLabels: Record<string, string> = {
            cash: 'EFECTIVO',
            yape: 'YAPE / PLIN',
            card: 'TARJETA'
        };

        const now = new Date();
        const dateStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

        // Initialize printer
        add([ESC, 0x40]);

        // ── Restaurant Header ──
        add([ESC, 0x61, 0x01]); // Center
        add([GS, 0x21, 0x11]); // Double size
        addText(`${restaurantName.toUpperCase()}\n`);
        add([GS, 0x21, 0x00]); // Normal size
        addText("\n");
        addText(LINE);

        // ── Receipt Title ──
        add([ESC, 0x45, 0x01]); // Bold
        addText("BOLETA DE VENTA\n");
        add([ESC, 0x45, 0x00]); // Bold off
        addText(LINE);

        // ── Order Info ──
        add([ESC, 0x61, 0x00]); // Left align
        addText(`Fecha: ${dateStr}  Hora: ${timeStr}\n`);
        addText(`${order.orderType === 'takeout' ? 'PARA LLEVAR' : `Mesa: ${order.tableNumber}`}\n`);
        if (order.customerName) {
            addText(`Cliente: ${order.customerName}\n`);
        }
        addText(`Atendido: ${order.userName}\n`);
        addText(LINE);

        // ── Items Header ──
        add([ESC, 0x45, 0x01]); // Bold
        addText("CANT  DESCRIPCION       IMPORTE\n");
        add([ESC, 0x45, 0x00]); // Bold off
        addText("--------------------------------\n");

        // ── Items ──
        order.items.forEach(item => {
            const qty = `${item.quantity}`.padStart(2);
            const name = item.productName.substring(0, 18).padEnd(18);
            const subtotal = `${item.subtotal.toFixed(2)}`.padStart(8);
            addText(`${qty}   ${name} ${subtotal}\n`);

            // Unit price when quantity > 1
            if (item.quantity > 1) {
                const unitLine = `      c/u S/${item.price.toFixed(2)}`;
                addText(`${unitLine}\n`);
            }
        });

        addText(LINE);

        // ── Total ──
        add([ESC, 0x61, 0x02]); // Right align
        add([GS, 0x21, 0x11]); // Double size
        addText(`TOTAL: S/ ${order.total.toFixed(2)}\n`);
        add([GS, 0x21, 0x00]); // Normal size
        addText("\n");

        // ── Payment Method ──
        add([ESC, 0x61, 0x01]); // Center
        add([ESC, 0x45, 0x01]); // Bold
        if (order.payments && order.payments.length > 0) {
            order.payments.forEach(p => {
                addText(`PAGO ${paymentLabels[p.method] || p.method.toUpperCase()}: S/ ${p.amount.toFixed(2)}\n`);
            });
        } else if (order.paymentMethod) {
            addText(`Pagado con: ${paymentLabels[order.paymentMethod] || order.paymentMethod.toUpperCase()}\n`);
        }
        add([ESC, 0x45, 0x00]); // Bold off
        addText(LINE);

        // ── Footer ──
        addText("\n");
        addText("¡Gracias por su preferencia!\n");
        addText("Vuelva pronto\n");
        addText("\n");
        addText("Powered by OrdayGo\n");

        // Feed + Cut
        add([LF, LF, LF, LF]);
        add([GS, 0x56, 0x41, 0x03]);

        return this.combineChunks(chunks);
    }

    private combineChunks(chunks: Uint8Array[]): Uint8Array {
        let totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
        let result = new Uint8Array(totalLength);
        let offset = 0;
        for (let chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        return result;
    }

    private async sendData(data: Uint8Array) {
        const type = this.activeConnectionType;

        if (type === 'bluetooth') {
            if (!this.characteristic) {
                throw new Error('La conexión Bluetooth se perdió. Reconecta la impresora.');
            }
            const CHUNK_SIZE = 20;
            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                const chunk = data.slice(i, i + CHUNK_SIZE);
                await this.characteristic.writeValue(chunk);
            }
        } else if (type === 'usb') {
            if (!this.device) await this.connectUSB();
            await this.device.transferOut(this.endpointOut.endpointNumber, data);
        } else if (type === 'external') {
            this.sendToRawBT(data);
        } else {
            throw new Error('No hay método de impresión configurado.');
        }
    }

    private sendToRawBT(data: Uint8Array) {
        try {
            // Convert binary data to base64
            let binary = '';
            for (let i = 0; i < data.length; i++) {
                binary += String.fromCharCode(data[i]);
            }
            const base64 = btoa(binary);

            // Build the RawBT intent URL
            const url = `intent:base64,${base64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;

            // Use a temporary link element instead of window.location.href
            // This prevents navigating away from the app and losing state
            const link = document.createElement('a');
            link.href = url;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            // Clean up the link after a short delay
            setTimeout(() => {
                if (link.parentNode) {
                    document.body.removeChild(link);
                }
            }, 100);
        } catch (err: any) {
            console.error('Error en RawBT:', err);
            throw new Error('Error al enviar a RawBT: ' + (err.message || 'Desconocido'));
        }
    }
}

export const printerService = new PrinterService();

