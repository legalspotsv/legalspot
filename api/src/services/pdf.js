import PdfPrinter from 'pdfmake';
import { sql } from '../db/connection.js';
import { calculateClientPeriod } from './calculations.js';

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};
const printer = new PdfPrinter(fonts);

const COLORS = {
  red: '#CC0000',
  darkRed: '#990000',
  black: '#1a1a1a',
  gray: '#666666',
  lightGray: '#f5f5f5',
};

function header(title, subtitle) {
  return [
    { text: 'L.', fontSize: 24, bold: true, color: COLORS.red, margin: [0, 0, 0, 5] },
    { text: 'LegalSpot — Consultores & Abogados S.A de C.V.', fontSize: 8, color: COLORS.gray, margin: [0, 0, 0, 2] },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: COLORS.red }], margin: [0, 5, 0, 10] },
    { text: title, fontSize: 16, bold: true, color: COLORS.black, margin: [0, 0, 0, 3] },
    { text: subtitle, fontSize: 10, color: COLORS.gray, margin: [0, 0, 0, 15] },
  ];
}

function footer() {
  return {
    columns: [
      { text: 'LegalSpot — Consultores & Abogados S.A de C.V. | La Libertad Este, El Salvador', fontSize: 7, color: COLORS.gray },
      { text: `Generado: ${new Date().toLocaleDateString('es-SV')}`, fontSize: 7, color: COLORS.gray, alignment: 'right' },
    ],
    margin: [40, 10],
  };
}

/**
 * Genera PDF de informe mensual de consumo.
 */
export async function generateMonthlyReport(clientId, period) {
  const summary = await calculateClientPeriod(clientId, period);
  if (!summary) return null;

  const tasks = await sql`
    SELECT t.date, u.name as lawyer_name, t.task_type, t.description, t.time_tenths, t.amount
    FROM tasks t JOIN users u ON u.id = t.lawyer_id
    WHERE t.client_id = ${clientId} AND t.month_period = ${period}
    ORDER BY t.date ASC
  `;

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const [year, month] = period.split('-');
  const periodLabel = `${monthNames[parseInt(month) - 1]} ${year}`;

  const summaryTable = summary.has_fixed_fee ? [
    ['Fee Mensual', `$${summary.monthly_fee.toFixed(2)}`],
    ['Horas Incluidas', `${summary.horas_incluidas}`],
    ['Horas Consumidas', `${summary.consumo_horas}`],
    ['Monto Consumido', `$${summary.consumo_usd.toFixed(2)}`],
    ['Disponible Restante', `$${summary.disponible_usd.toFixed(2)}`],
    ['Excedente', `$${summary.excedente.toFixed(2)}`],
  ] : [
    ['Tarifa por Hora', `$${summary.hourly_rate.toFixed(2)}`],
    ['Horas Consumidas', `${summary.consumo_horas}`],
    ['Total a Cobrar', `$${summary.consumo_usd.toFixed(2)}`],
  ];

  const taskTableBody = [
    [
      { text: 'Fecha', bold: true, fillColor: COLORS.lightGray },
      { text: 'Abogado', bold: true, fillColor: COLORS.lightGray },
      { text: 'Tipo', bold: true, fillColor: COLORS.lightGray },
      { text: 'Descripción', bold: true, fillColor: COLORS.lightGray },
      { text: 'Horas', bold: true, fillColor: COLORS.lightGray, alignment: 'right' },
      { text: 'Monto', bold: true, fillColor: COLORS.lightGray, alignment: 'right' },
    ],
    ...tasks.map(t => [
      t.date,
      t.lawyer_name,
      t.task_type,
      { text: t.description, fontSize: 7 },
      { text: t.time_tenths.toString(), alignment: 'right' },
      { text: `$${Number(t.amount).toFixed(2)}`, alignment: 'right' },
    ]),
  ];

  const docDefinition = {
    defaultStyle: { font: 'Helvetica', fontSize: 9 },
    pageMargins: [40, 40, 40, 60],
    footer,
    content: [
      ...header(`Informe de Consumo Mensual`, `${summary.client_name} — ${periodLabel}`),

      { text: 'Resumen', fontSize: 12, bold: true, margin: [0, 0, 0, 8] },
      {
        table: {
          widths: ['*', 'auto'],
          body: summaryTable.map(([label, val]) => [
            { text: label, color: COLORS.gray },
            { text: val, bold: true, alignment: 'right' },
          ]),
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },

      { text: `Detalle de Tareas (${tasks.length})`, fontSize: 12, bold: true, margin: [0, 0, 0, 8] },
      {
        table: {
          headerRows: 1,
          widths: [55, 60, 65, '*', 35, 50],
          body: taskTableBody,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#e0e0e0',
        },
      },
    ],
  };

  return printer.createPdfKitDocument(docDefinition);
}

/**
 * Genera PDF de estado de cuenta.
 */
export async function generateAccountStatement(clientId) {
  const [client] = await sql`SELECT * FROM clients WHERE id = ${clientId}`;
  if (!client) return null;

  const records = await sql`
    SELECT * FROM billing_records WHERE client_id = ${clientId} ORDER BY period ASC
  `;

  const tableBody = [
    [
      { text: 'Periodo', bold: true, fillColor: COLORS.lightGray },
      { text: 'Tarifa Fija', bold: true, fillColor: COLORS.lightGray, alignment: 'right' },
      { text: 'Excedentes', bold: true, fillColor: COLORS.lightGray, alignment: 'right' },
      { text: 'Facturado', bold: true, fillColor: COLORS.lightGray, alignment: 'right' },
      { text: 'Pagado', bold: true, fillColor: COLORS.lightGray, alignment: 'right' },
      { text: 'Pendiente', bold: true, fillColor: COLORS.lightGray, alignment: 'right' },
      { text: 'Estado', bold: true, fillColor: COLORS.lightGray, alignment: 'center' },
      { text: 'Ref.', bold: true, fillColor: COLORS.lightGray },
    ],
    ...records.map(r => {
      const pendiente = Math.max(0, Number(r.total_invoiced) - Number(r.amount_paid));
      return [
        r.period,
        { text: `$${Number(r.fixed_fee).toFixed(2)}`, alignment: 'right' },
        { text: `$${Number(r.excess_amount).toFixed(2)}`, alignment: 'right' },
        { text: `$${Number(r.total_invoiced).toFixed(2)}`, alignment: 'right', bold: true },
        { text: `$${Number(r.amount_paid).toFixed(2)}`, alignment: 'right' },
        { text: `$${pendiente.toFixed(2)}`, alignment: 'right', color: pendiente > 0 ? COLORS.red : '#059669' },
        { text: r.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE', alignment: 'center', color: r.payment_status === 'paid' ? '#059669' : COLORS.red, bold: true },
        { text: r.invoice_reference || '—', fontSize: 7 },
      ];
    }),
  ];

  const totalInvoiced = records.reduce((s, r) => s + Number(r.total_invoiced), 0);
  const totalPaid = records.reduce((s, r) => s + Number(r.amount_paid), 0);
  const totalPending = totalInvoiced - totalPaid;

  const docDefinition = {
    defaultStyle: { font: 'Helvetica', fontSize: 8 },
    pageMargins: [30, 40, 30, 60],
    pageOrientation: 'landscape',
    footer,
    content: [
      ...header('Estado de Cuenta', client.name),

      {
        table: {
          headerRows: 1,
          widths: [55, 55, 55, 55, 55, 55, 50, '*'],
          body: tableBody,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#e0e0e0',
        },
        margin: [0, 0, 0, 15],
      },

      {
        columns: [
          { text: '' },
          {
            table: {
              widths: ['*', 'auto'],
              body: [
                [{ text: 'Total Facturado', bold: true }, { text: `$${totalInvoiced.toFixed(2)}`, alignment: 'right', bold: true }],
                [{ text: 'Total Pagado' }, { text: `$${totalPaid.toFixed(2)}`, alignment: 'right' }],
                [{ text: 'TOTAL PENDIENTE', bold: true, color: COLORS.red }, { text: `$${totalPending.toFixed(2)}`, alignment: 'right', bold: true, color: COLORS.red }],
              ],
            },
            layout: 'lightHorizontalLines',
            width: 200,
          },
        ],
      },
    ],
  };

  return printer.createPdfKitDocument(docDefinition);
}
