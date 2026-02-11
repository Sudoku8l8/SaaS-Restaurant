import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SalesMetrics } from '@/hooks/useDailySales';
import type { Order } from '@/types';

export const exportDailySalesToExcel = async (metrics: SalesMetrics, orders: Order[], customDateRange?: string) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Restaurant App';
    workbook.created = new Date();

    const dateStr = customDateRange || format(new Date(), 'dd/MM/yyyy', { locale: es });
    const filename = customDateRange ? `Reporte_Ventas_${customDateRange.replace(/\//g, '-')}.xlsx` : `Ventas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

    // ==========================================
    // SHEET 1: RESUMEN
    // ==========================================
    const wsSummary = workbook.addWorksheet('Resumen', {
        views: [{ showGridLines: false }]
    });

    // Title
    wsSummary.mergeCells('A1:B1');
    const titleCell = wsSummary.getCell('A1');
    titleCell.value = customDateRange ? `Reporte de Ventas: ${customDateRange}` : `Resumen de Ventas - ${dateStr}`;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2c3e50' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    wsSummary.getRow(1).height = 30;

    // Metrics Table
    wsSummary.getCell('A3').value = 'Métrica';
    wsSummary.getCell('B3').value = 'Valor';

    // Style Headers
    ['A3', 'B3'].forEach(cell => {
        const c = wsSummary.getCell(cell);
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495e' } };
        c.border = { bottom: { style: 'thin' } };
    });

    wsSummary.getCell('A4').value = 'Total Ventas';
    wsSummary.getCell('B4').value = metrics.totalSales;
    wsSummary.getCell('B4').numFmt = '"S/" #,##0.00';

    wsSummary.getCell('A5').value = 'Cantidad Pedidos';
    wsSummary.getCell('B5').value = metrics.orderCount;

    // Payment Methods Section
    wsSummary.getCell('A7').value = 'Desglose por Medio de Pago';
    wsSummary.getCell('A7').font = { bold: true, size: 12 };

    let currentRow = 8;
    Object.entries(metrics.salesByPaymentMethod).forEach(([method, amount]) => {
        wsSummary.getCell(`A${currentRow}`).value = method.charAt(0).toUpperCase() + method.slice(1);
        wsSummary.getCell(`B${currentRow}`).value = amount;
        wsSummary.getCell(`B${currentRow}`).numFmt = '"S/" #,##0.00';
        currentRow++;
    });

    // Column Widths
    wsSummary.getColumn('A').width = 30;
    wsSummary.getColumn('B').width = 20;


    // ==========================================
    // SHEET 2: DETALLE DE PEDIDOS
    // ==========================================
    const wsDetails = workbook.addWorksheet('Detalle Pedidos');

    // Sort orders by date
    const sortedOrders = [...orders].sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return dateA - dateB;
    });

    // Headers
    const headers = ['Fecha', 'Hora', 'Mesa', 'Mozo', 'Items', 'Método Pago', 'Total'];
    const headerRow = wsDetails.addRow(headers);

    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980b9' } };
        cell.alignment = { horizontal: 'center' };
    });

    // Data with Day Grouping
    let lastDateLabel = '';

    sortedOrders.forEach(order => {
        const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
        const currentDateLabel = format(orderDate, 'dd/MM/yyyy');

        // Add a separator row if the date changes (and it's not the first row)
        if (lastDateLabel !== '' && lastDateLabel !== currentDateLabel) {
            const separatorRow = wsDetails.addRow([]);
            separatorRow.height = 5;
            separatorRow.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
            });
        }

        const row = wsDetails.addRow([
            currentDateLabel,
            format(orderDate, 'HH:mm'),
            order.tableNumber,
            order.userName || 'N/A',
            order.items.map((i: any) => `${i.quantity}x ${i.productName}`).join(', '),
            order.paymentMethod || '-',
            order.total
        ]);

        // Currency Format for Total
        row.getCell(7).numFmt = '"S/" #,##0.00';

        // Alignment for center columns
        [1, 2, 3, 6].forEach(colIndex => {
            row.getCell(colIndex).alignment = { horizontal: 'center' };
        });

        lastDateLabel = currentDateLabel;
    });

    // Auto-filter
    wsDetails.autoFilter = {
        from: 'A1',
        to: { row: 1, column: headers.length }
    };

    // Columns Width
    wsDetails.columns = [
        { width: 12 }, // Fecha
        { width: 10 }, // Hora
        { width: 10 }, // Mesa
        { width: 20 }, // Mozo
        { width: 50 }, // Items
        { width: 15 }, // Payment
        { width: 15 }, // Total
    ];


    // ==========================================
    // SHEET 3: POR MOZO
    // ==========================================
    const wsWaiters = workbook.addWorksheet('Por Mozo');

    const wHeader = wsWaiters.addRow(['Mozo', 'Venta Total']);
    wHeader.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16a085' } };
    });

    Object.entries(metrics.salesByWaiter).forEach(([name, total]) => {
        const row = wsWaiters.addRow([name, total]);
        row.getCell(2).numFmt = '"S/" #,##0.00';
    });

    wsWaiters.getColumn(1).width = 30;
    wsWaiters.getColumn(2).width = 20;


    // ==========================================
    // GENERATE FILE
    // ==========================================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
};
