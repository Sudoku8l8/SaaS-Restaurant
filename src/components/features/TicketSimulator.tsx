import { useState, useEffect } from 'react';
import { printerService } from '@/services/printer/PrinterService';
import type { Order } from '@/types';
import { Button } from '@/components/shared';
import { RefreshCw, FileText } from 'lucide-react';

interface SimulatedSegment {
    text: string;
    bold: boolean;
    scaleWidth: number;
    scaleHeight: number;
}

interface SimulatedLine {
    segments: SimulatedSegment[];
    align: 'left' | 'center' | 'right';
}

function parseEscPos(data: Uint8Array): SimulatedLine[] {
    const lines: SimulatedLine[] = [];
    let currentLine: SimulatedLine = { segments: [], align: 'left' };
    
    let isBold = false;
    let scaleWidth = 1;
    let scaleHeight = 1;
    let align: 'left' | 'center' | 'right' = 'left';

    let currentSegmentText = '';

    const pushSegment = () => {
        if (currentSegmentText.length > 0) {
            currentLine.segments.push({
                text: currentSegmentText,
                bold: isBold,
                scaleWidth,
                scaleHeight
            });
            currentSegmentText = '';
        }
    };

    let i = 0;
    while (i < data.length) {
        const byte = data[i];

        if (byte === 0x1B) { // ESC
            if (i + 1 < data.length) {
                const next = data[i + 1];
                if (next === 0x40) { // ESC @ (Init)
                    pushSegment();
                    isBold = false;
                    scaleWidth = 1;
                    scaleHeight = 1;
                    align = 'left';
                    currentLine.align = align;
                    i += 2;
                    continue;
                } else if (next === 0x61 && i + 2 < data.length) { // ESC a n (Align)
                    pushSegment();
                    const n = data[i + 2];
                    align = n === 1 ? 'center' : n === 2 ? 'right' : 'left';
                    currentLine.align = align;
                    i += 3;
                    continue;
                } else if (next === 0x45 && i + 2 < data.length) { // ESC E n (Bold)
                    pushSegment();
                    isBold = data[i + 2] === 1;
                    i += 3;
                    continue;
                }
            }
        } else if (byte === 0x1D) { // GS
            if (i + 1 < data.length) {
                const next = data[i + 1];
                if (next === 0x21 && i + 2 < data.length) { // GS ! n (Size)
                    pushSegment();
                    const n = data[i + 2];
                    // Hex logic: high nibble = width - 1, low nibble = height - 1
                    const widthMult = ((n & 0xF0) >> 4) + 1;
                    const heightMult = (n & 0x0F) + 1;
                    scaleWidth = widthMult;
                    scaleHeight = heightMult;
                    i += 3;
                    continue;
                } else if (next === 0x56) { // GS V (Cut)
                    i += 4; // Skip GS V A 3
                    continue;
                }
            }
        } else if (byte === 0x0A) { // LF (Line Feed)
            pushSegment();
            lines.push(currentLine);
            currentLine = { segments: [], align };
            i++;
            continue;
        }

        // Printable char
        // Simple decoder (ASCII / UTF-8 basic)
        // Wait, for ticket simple chars:
        if (byte >= 0x20) {
            currentSegmentText += String.fromCharCode(byte);
        }
        i++;
    }

    pushSegment();
    if (currentLine.segments.length > 0) {
        lines.push(currentLine);
    }

    return lines;
}

export function TicketSimulator() {
    const [parsedTicket, setParsedTicket] = useState<SimulatedLine[]>([]);
    const [ticketType, setTicketType] = useState<'comanda' | 'boleta'>('comanda');

    const generateMockOrder = (): Order => ({
        id: 'SIMULATOR-123',
        dailyNumber: 42,
        userId: 'admin1',
        userName: 'Admin Demo',
        restaurantId: 'test_restaurant',
        status: 'pending',
        orderType: 'dine-in',
        tableNumber: 5,
        total: 85.50,
        subtotal: 85.50,
        items: [
            {
                productId: 'p1',
                productName: 'Lomo Saltado Tradicional XL',
                quantity: 2,
                price: 35.00,
                subtotal: 70.00,
                notes: 'Sin cebolla por favor, bien jugoso',
                selectedOptions: [
                    { modifierId: 'm1', modifierName: 'Término', optionName: '3/4', price: 0 }
                ]
            },
            {
                productId: 'p2',
                productName: 'Chicha Morada 1L',
                quantity: 1,
                price: 15.50,
                subtotal: 15.50
            }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        dateStr: new Date().toISOString().split('T')[0]
    });

    const refreshTicket = () => {
        const order = generateMockOrder();
        try {
            // we need to access the private methods of printerService somehow?
            // Actually, we can temporarily hack it in JS by casting to any
            let data: Uint8Array;
            if (ticketType === 'comanda') {
                data = (printerService as any).encodeOrder(order);
            } else {
                data = (printerService as any).encodeReceipt(order, 'RESTAURANT DEMO');
            }
            const lines = parseEscPos(data);
            setParsedTicket(lines);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        refreshTicket();
    }, [ticketType]);

    return (
        <div style={{
            backgroundColor: 'var(--surface-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                    <FileText size={20} color="var(--primary-color)" />
                    Simulador Visual ESC/POS
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant={ticketType === 'comanda' ? 'primary' : 'outline'} size="sm" onClick={() => setTicketType('comanda')}>Comanda</Button>
                    <Button variant={ticketType === 'boleta' ? 'primary' : 'outline'} size="sm" onClick={() => setTicketType('boleta')}>Nota Venta</Button>
                    <Button variant="ghost" size="sm" onClick={refreshTicket} title="Actualizar">
                        <RefreshCw size={16} />
                    </Button>
                </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Esto renderiza exactamente los bytes enviados a la impresora térmica. 
                Papel simulado de 80mm.
            </p>

            {/* Receipt Paper Container */}
            <div style={{
                flex: 1,
                backgroundColor: '#fefdfa', // Paper color
                padding: '2rem 1rem',
                border: '1px solid #ccc',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '14px',
                lineHeight: '1.2',
                color: '#000',
                overflowY: 'auto',
                width: '100%',
                maxWidth: '380px', // ~80mm simulation
                margin: '0 auto',
                whiteSpace: 'pre-wrap'
            }}>
                {parsedTicket.map((line, i) => (
                    <div key={i} style={{ textAlign: line.align, minHeight: '1.2em' }}>
                        {line.segments.map((seg, j) => (
                            <span key={j} style={{
                                fontWeight: seg.bold ? 'bold' : 'normal',
                                fontSize: `${seg.scaleHeight}em`,
                                // CSS text-scale doesn't exist out of the box for stretching width, but we can simulate using transform horizontally if we really want, 
                                // or just use letter-spacing. For a pure HTML view, fontSize mostly handles it cleanly.
                                transform: seg.scaleWidth > 1 ? `scaleX(${seg.scaleWidth})` : 'none',
                                display: seg.scaleWidth > 1 ? 'inline-block' : 'inline',
                                transformOrigin: 'left',
                                marginRight: seg.scaleWidth > 1 ? `${(seg.scaleWidth - 1) * 0.5}em` : 0
                            }}>
                                {seg.text}
                            </span>
                        ))}
                    </div>
                ))}
                <div style={{ marginTop: '2rem', textAlign: 'center', color: '#ccc' }}>--- CORTE ---</div>
            </div>
        </div>
    );
}
