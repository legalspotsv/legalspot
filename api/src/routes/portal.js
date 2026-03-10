import { Router } from 'express';
import { sqlite } from '../db/connection.js';
import { requireRole } from '../middleware/auth.js';
import { calculateClientPeriod } from '../services/calculations.js';

const router = Router();

// GET /api/portal/me — datos del portal del cliente
router.get('/me', requireRole('client'), async (req, res) => {
  try {
    const clientId = req.user.client_id;
    if (!clientId) return res.status(400).json({ error: 'Usuario no vinculado a un cliente' });

    const period = req.query.period || new Date().toISOString().substring(0, 7);
    const summary = calculateClientPeriod(clientId, period);
    if (!summary) return res.status(404).json({ error: 'Cliente no encontrado' });

    // Tareas del mes (SIN montos)
    const tasks = sqlite.prepare(`
      SELECT t.date, t.task_type, t.description, t.time_tenths
      FROM tasks t
      WHERE t.client_id = ? AND t.month_period = ?
      ORDER BY t.date DESC
    `).all(clientId, period);

    // Estado de facturas (sin montos detallados)
    const invoices = sqlite.prepare(`
      SELECT period, payment_status, payment_date
      FROM billing_records
      WHERE client_id = ?
      ORDER BY period DESC
    `).all(clientId);

    // Filtrar info financiera del summary
    const portalSummary = {
      client_name: summary.client_name,
      period: summary.period,
      has_fixed_fee: summary.has_fixed_fee,
      consumo_horas: summary.consumo_horas,
      horas_incluidas: summary.horas_incluidas,
      horas_disponibles: summary.horas_disponibles,
      porcentaje_consumido: summary.porcentaje_consumido,
    };

    res.json({ summary: portalSummary, tasks, invoices });
  } catch (err) {
    console.error('Error en portal:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
