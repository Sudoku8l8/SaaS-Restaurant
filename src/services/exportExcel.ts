import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SalesMetrics } from '@/hooks/useDailySales';
import type { Order } from '@/types';

export const exportDailySalesToExcel = (metrics: SalesMetrics, orders: Order[]) => {
    // 1. Prepare Data for Sheets
    const dateStr = format(new Date(), 'dd/MM/yyyy', { locale: es });
    const filename = `Ventas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

    // --- Sheet 1: Resumen ---
    const summaryData = [
        ['Resumen de Ventas - ' + dateStr],
        [''],
        ['Total Ventas', `S/ ${metrics.totalSales.toFixed(2)}`],
        ['Cantidad Pedidos', metrics.orderCount],
        [''],
        ['Desglose por Medio de Pago'],
        ...Object.entries(metrics.salesByPaymentMethod).map(([method, amount]) => [method, `S/ ${amount.toFixed(2)}`]),
    ];

    // --- Sheet 2: Detalle de Pedidos ---
    const detailsData = [
        ['ID', 'Hora', 'Mesa', 'Mozo', 'Items', 'Método Pago', 'Total'],
        ...orders.map(o => [
            o.id.slice(0, 8), // Short ID
            format(o.createdAt, 'HH:mm'),
            o.tableNumber,
            o.userName,
            o.items.map(i => `${i.quantity}x ${i.productName}`).join(', '),
            o.paymentMethod,
            o.total.toFixed(2)
        ])
    ];

    // --- Sheet 3: Ventas por Mozo ---
    const waiterData = [
        ['Mozo', 'Venta Total'],
        ...Object.entries(metrics.salesByWaiter).map(([name, total]) => [
            name,
            total.toFixed(2)
        ])
    ];

    // 2. Create Workbook and Sheets
    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
    const wsWaiters = XLSX.utils.aoa_to_sheet(waiterData);

    // 3. Append Sheets
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");
    XLSX.utils.book_append_sheet(wb, wsDetails, "Detalle Pedidos");
    XLSX.utils.book_append_sheet(wb, wsWaiters, "Por Mozo");

    // 4. Download File
    XLSX.writeFile(wb, filename);
};
