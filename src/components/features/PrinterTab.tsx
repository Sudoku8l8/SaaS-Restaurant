import { useState } from 'react';
import { Bluetooth, Usb, Printer, Unlink, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, Smartphone } from 'lucide-react';
import { Button } from '@/components/shared';
import { printerService } from '@/services/printer/PrinterService';

export function PrinterTab() {
    const [isConnected, setIsConnected] = useState(printerService.isConnected);
    const [deviceName, setDeviceName] = useState(printerService.connectedDeviceName);
    const [autoPrint, setAutoPrint] = useState(printerService.autoPrint);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnectBluetooth = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await printerService.connectBluetooth();
            setIsConnected(true);
            setDeviceName(printerService.connectedDeviceName);
        } catch (err: any) {
            setError('Error al conectar Bluetooth: ' + (err.message || 'Desconocido'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectUSB = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await printerService.connectUSB();
            setIsConnected(true);
            setDeviceName(printerService.connectedDeviceName);
        } catch (err: any) {
            setError('Error al conectar USB: ' + (err.message || 'Desconocido'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectExternal = async () => {
        setIsLoading(true);
        try {
            await printerService.connectExternal();
            setIsConnected(true);
            setDeviceName(printerService.connectedDeviceName);
        } catch (err: any) {
            setError('Error al conectar app externa');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setIsLoading(true);
        try {
            await printerService.disconnect();
            setIsConnected(false);
            setDeviceName('Ninguno');
        } catch (err: any) {
            setError('Error al desconectar');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestPrint = async () => {
        try {
            await printerService.testPrint();
        } catch (err: any) {
            setError('Error de impresión: ' + err.message);
        }
    };

    const toggleAutoPrint = () => {
        const newValue = !autoPrint;
        printerService.setAutoPrint(newValue);
        setAutoPrint(newValue);
    };

    return (
        <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
                backgroundColor: 'var(--surface-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isConnected ? '#22c55e' : 'var(--text-secondary)'
                    }}>
                        <Printer size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Configuración de Impresora</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {isConnected ? `Conectado a: ${deviceName}` : 'No hay ninguna impresora conectada'}
                        </p>
                    </div>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!isConnected ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Button
                                onClick={handleConnectBluetooth}
                                disabled={isLoading}
                                style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
                            >
                                <Bluetooth size={18} /> Bluetooth (BLE)
                            </Button>
                            <Button
                                onClick={handleConnectUSB}
                                disabled={isLoading}
                                style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
                            >
                                <Usb size={18} /> Cable USB
                            </Button>
                            <Button
                                onClick={handleConnectExternal}
                                disabled={isLoading}
                                style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', gridColumn: 'span 2', backgroundColor: 'var(--secondary-color)', color: 'white' }}
                                variant="primary"
                            >
                                <Smartphone size={18} /> App RawBT (Bluetooth Clásico)
                            </Button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                backgroundColor: 'var(--background-color)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontWeight: '600' }}>
                                    <CheckCircle2 size={18} /> Conectado
                                </div>
                                <Button variant="ghost" onClick={handleDisconnect} disabled={isLoading} style={{ color: '#ef4444' }}>
                                    <Unlink size={18} /> Desconectar
                                </Button>
                            </div>

                            <Button variant="outline" onClick={handleTestPrint} fullWidth>
                                <Printer size={18} style={{ marginRight: '0.5rem' }} /> Prueba de Impresión
                            </Button>
                        </div>
                    )}

                    <div style={{
                        marginTop: '1rem',
                        padding: '1.5rem',
                        backgroundColor: 'var(--background-color)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Impresión Automática</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Imprimir comanda al confirmar pedido</div>
                        </div>
                        <div onClick={toggleAutoPrint} style={{ cursor: 'pointer', color: autoPrint ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
                            {autoPrint ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    <p>Compatible con impresoras térmicas ESC/POS de 58mm y 80mm.</p>
                </div>
            </div>
        </div>
    );
}
