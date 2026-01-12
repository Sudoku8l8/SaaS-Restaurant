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

    // Bluetooth Connection
    async connectBluetooth() {
        if (!(navigator as any).bluetooth) {
            throw new Error('Web Bluetooth API no está habilitada o soportada en este navegador. Asegúrate de usar Chrome/Edge y HTTPS/localhost.');
        }
        try {
            const device = await (navigator as any).bluetooth.requestDevice({
                filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }], // Generic printer service UUID
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            });

            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

            this.device = device;
            this.characteristic = characteristic;
            this.connectionType = 'bluetooth';

            this.saveDevicePreference('bluetooth', device.name);
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

            // Find bulk out endpoint
            const iface = device.configuration.interfaces[0];
            await device.claimInterface(iface.interfaceNumber);

            const endpoint = iface.alternate.endpoints.find((e: any) => e.direction === 'out' && e.type === 'bulk');

            if (!endpoint) throw new Error('No bulk out endpoint found');

            this.device = device;
            this.endpointOut = endpoint;
            this.connectionType = 'usb';

            this.saveDevicePreference('usb', device.productName);
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

    get isConnected() {
        return this.connectionType !== null || localStorage.getItem('printer_type') !== null;
    }

    get connectedDeviceName() {
        return localStorage.getItem('printer_name') || 'Ninguno';
    }

    get activeConnectionType() {
        return this.connectionType || localStorage.getItem('printer_type') as any;
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
        if (!this.isConnected) {
            throw new Error('La impresora no está conectada');
        }

        const data = this.encodeOrder(order);
        await this.sendData(data);
    }

    async testPrint() {
        if (!this.isConnected) throw new Error('No conectado');
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
        addText("COMANDA\n");
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
        addText("\nSaaS Restaurant\n");
        add([LF, LF, LF, LF]);
        add([GS, 0x56, 0x41, 0x03]); // Cut

        // Combine all chunks
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
        }
    }

    private sendToRawBT(data: Uint8Array) {
        // Convert to base64
        let binary = '';
        const bytes = new Uint8Array(data);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binary);

        // Standard RawBT intent for base64 commands
        // This explicitly tells RawBT that the data is base64 and should be processed as print commands
        const url = `intent:#Intent;action=ru.a402d.rawbtprinter.intent.action.PRINT;S.base64=${base64};end;`;
        window.location.href = url;
    }
}

export const printerService = new PrinterService();

