import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/connection.js';
import { requireRole } from '../middleware/auth.js';
import { calculateClientPeriod } from '../services/calculations.js';

const router = Router();

// GET /api/billing/:clientId â historial de billing de un cliente
router.get('/:clientId', requireRole('admin'), async (req, res) => {
  try {
    const records = await sql`
      SELECT * FROM billing_records WHERE client_id = ${req.params.clientId} ORDER BY period DESC
    `;

    const currentPeriod = new Date().toISOString().substring(0, 7);
    const currentSummary = await calculateClientPeriod(req.params.clientId, currentPeriod);

    res.json({ billing_records: records, current_period: currentSummary });
  } catch (err) {
    console.error('Error obteniendo billing:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/billing/:clientId/close-period
router.post('/:clientId/close-period', requireRole('admin'), async (req, res) => {
  try {
    const { period } = req.body;
    if (!period) return res.status(400).json({ error: 'Periodo requerido (YYYY-MM)' });

    const summary = await calculateClientPeriod(req.params.clientId, period);
    if (!summary) return res.status(404).json({ error: 'Cliente no encontrado' });

    const [existing] = await sql`
      SELECT * FROM billing_records WHERE client_id = ${req.params.clientId} AND period = ${period}
    `;

    const fixed_fee = summary.has_fixed_fee ? summary.monthly_fee : 0;
    const excess_amount = summary.excedente || 0;
    const total_invoiced = summary.has_fixed_fee
      ? Math.round((fixed_fee + excess_amount) * 100) / 100
      : summary.consumo_usd;

    const [prevBilling] = await sql`
      SELECT accumulated_total FROM billing_records
      WHERE client_id = ${req.params.clientId} AND period < ${period} ORDER BY period DESC LIMIT 1
    `;

    const prevAccumulated = prevBilling?.accumulated_total || 0;
    const now = new Date().toISOString();

    if (existing) {
      const accumulated_total = Math.round((prevAccumulated + total_invoiced - existing.amount_paid) * 100) / 100;
      await sql`
        UPDATE billing_records SET fixed_fee = ${fixed_fee}, total_consumed = ${summary.consumo_usd},
        excess_amount = ${excess_amount}, total_invoiced = ${total_invoiced},
        accumulated_total = ${accumulated_total} WHERE id = ${existing.id}
      `;
    } else {
      const id = uuid();
      const accumulated_total = Math.round((prevAccumulated + total_invoiced) * 100) / 100;
      await sql`
        INSERT INTO billing_records (id, client_id, period, fixed_fee, total_consumed, excess_amount,
        total_invoiced, amount_paid, payment_status, accumulated_total, created_at)
        VALUES (${id}, ${req.params.clientId}, ${period}, ${fixed_fee}, ${summary.consumo_usd},
        ${excess_amount}, ${total_invoiced}, 0, 'pending', ${accumulated_total}, ${now})
      `;
    }

    if (summary.has_fixed_fee && summary.saldo_a_favor > 0) {
      await sql`
        UPDATE clients SET carry_forward_balance = carry_forward_balance + ${summary.saldo_a_favor},
        updated_at = ${now} WHERE id = ${req.params.clientId}
      `;
    }

    res.json({ ok: true, summary });
  } catch (err) {
    console.error('Error cerrando periodo:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/billing/:clientId/payment
router.post('/:clientId/payment', requireRole('admin'), async (req, res) => {
  try {
    const { period, amount_paid, payment_date, invoice_reference, invoice_link, notes } = req.body;
    if (!period) return res.status(400).json({ error: 'Periodo requerido' });
    if (!amount_paid || amount_paid <= 0) return res.status(400).json({ error: 'Monto de pago invÃ¡lido' });

    const [existing] = await sql`
      SELECT * FROM billing_records WHERE client_id = ${req.params.clientId} AND period = ${period}
    `;

    if (!existing) {
      return res.status(404).json({ error: 'No existe registro de facturaciÃ³n para este periodo. Cierre el periodo primero.' });
    }

    const totalPaid = Math.round((existing.amount_paid + amount_paid) * 100) / 100;
    const status = totalPaid >= existing.total_invoiced ? 'paid' : 'pending';
    const payDate = payment_date || new Date().toISOString().substring(0, 10);

    await sql`
      UPDATE billing_records SET amount_paid = ${totalPaid}, payment_date = ${payDate}, payment_status = ${status},
      invoice_reference = COALESCE(${invoice_reference || null}, invoice_reference),
      invoice_link = COALESCE(${invoice_link || null}, invoice_link),
      notes = COALESCE(${notes || null}, notes)
      WHERE id = ${existing.id}
    `;

    const newAccumulated = Math.round((existing.accumulated_total - amount_paid) * 100) / 100;
    await sql`
      UPDATE billing_records SET accumulated_total = ${Math.max(0, newAccumulated)} WHERE id = ${existing.id}
    `;

    res.json({ ok: true, payment_status: status, amount_paid: totalPaid });
  } catch (err) {
    console.error('Error registrando pago:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
