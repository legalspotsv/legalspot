import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sqlite } from '../db/connection.js';
import { requireRole } from '../middleware/auth.js';
import { calculateClientPeriod } from '../services/calculations.js';

const router = Router();

// GET /api/billing/:clientId — historial de billing de un cliente
router.get('/:clientId', requireRole('admin'), async (req, res) => {
  try {
    const records = sqlite.prepare(
      'SELECT * FROM billing_records WHERE client_id = ? ORDER BY period DESC'
    ).all(req.params.clientId);

    // Agregar resumen del periodo actual
    const currentPeriod = new Date().toISOString().substring(0, 7);
    const currentSummary = calculateClientPeriod(req.params.clientId, currentPeriod);

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

    const summary = calculateClientPeriod(req.params.clientId, period);
    if (!summary) return res.status(404).json({ error: 'Cliente no encontrado' });

    // Generar billing record
    const existing = sqlite.prepare(
      'SELECT * FROM billing_records WHERE client_id = ? AND period = ?'
    ).get(req.params.clientId, period);

    const fixed_fee = summary.has_fixed_fee ? summary.monthly_fee : 0;
    const excess_amount = summary.excedente || 0;
    const total_invoiced = summary.has_fixed_fee
      ? Math.round((fixed_fee + excess_amount) * 100) / 100
      : summary.consumo_usd;

    const prevBilling = sqlite.prepare(`
      SELECT accumulated_total FROM billing_records
      WHERE client_id = ? AND period < ? ORDER BY period DESC LIMIT 1
    `).get(req.params.clientId, period);

    const prevAccumulated = prevBilling?.accumulated_total || 0;
    const now = new Date().toISOString();

    if (existing) {
      const accumulated_total = Math.round((prevAccumulated + total_invoiced - existing.amount_paid) * 100) / 100;
      sqlite.prepare(`
        UPDATE billing_records SET fixed_fee = ?, total_consumed = ?, excess_amount = ?,
        total_invoiced = ?, accumulated_total = ? WHERE id = ?
      `).run(fixed_fee, summary.consumo_usd, excess_amount, total_invoiced, accumulated_total, existing.id);
    } else {
      const id = uuid();
      const accumulated_total = Math.round((prevAccumulated + total_invoiced) * 100) / 100;
      sqlite.prepare(`
        INSERT INTO billing_records (id, client_id, period, fixed_fee, total_consumed, excess_amount,
        total_invoiced, amount_paid, payment_status, accumulated_total, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?)
      `).run(id, req.params.clientId, period, fixed_fee, summary.consumo_usd, excess_amount, total_invoiced, accumulated_total, now);
    }

    // Actualizar carry_forward_balance
    if (summary.has_fixed_fee && summary.saldo_a_favor > 0) {
      sqlite.prepare('UPDATE clients SET carry_forward_balance = carry_forward_balance + ?, updated_at = ? WHERE id = ?')
        .run(summary.saldo_a_favor, now, req.params.clientId);
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
    if (!amount_paid || amount_paid <= 0) return res.status(400).json({ error: 'Monto de pago inválido' });

    const existing = sqlite.prepare(
      'SELECT * FROM billing_records WHERE client_id = ? AND period = ?'
    ).get(req.params.clientId, period);

    if (!existing) {
      return res.status(404).json({ error: 'No existe registro de facturación para este periodo. Cierre el periodo primero.' });
    }

    const totalPaid = Math.round((existing.amount_paid + amount_paid) * 100) / 100;
    const status = totalPaid >= existing.total_invoiced ? 'paid' : 'pending';

    sqlite.prepare(`
      UPDATE billing_records SET amount_paid = ?, payment_date = ?, payment_status = ?,
      invoice_reference = COALESCE(?, invoice_reference),
      invoice_link = COALESCE(?, invoice_link),
      notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(totalPaid, payment_date || new Date().toISOString().substring(0, 10), status,
           invoice_reference || null, invoice_link || null, notes || null, existing.id);

    // Recalcular accumulated_total
    const newAccumulated = Math.round((existing.accumulated_total - amount_paid) * 100) / 100;
    sqlite.prepare('UPDATE billing_records SET accumulated_total = ? WHERE id = ?')
      .run(Math.max(0, newAccumulated), existing.id);

    res.json({ ok: true, payment_status: status, amount_paid: totalPaid });
  } catch (err) {
    console.error('Error registrando pago:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
