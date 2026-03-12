import { Router } from 'express';
import { sql } from '../db/connection.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard â metricas del mes actual
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const period = req.query.period || new Date().toISOString().substring(0, 7);

    const [{ total_facturado }] = await sql`
      SELECT COALESCE(SUM(amount), 0) as total_facturado
      FROM tasks WHERE month_period = ${period}
    `;

    const [{ total_cobrado }] = await sql`
      SELECT COALESCE(SUM(amount_paid), 0) as total_cobrado
      FROM billing_records WHERE period = ${period}
    `;

    const total_pendiente = Math.round((total_facturado - total_cobrado) * 100) / 100;

    const [{ total_excedentes }] = await sql`
      SELECT COALESCE(SUM(
        CASE WHEN c.has_fixed_fee = 1 AND sub.consumed > c.monthly_fee
          THEN sub.consumed - c.monthly_fee ELSE 0 END
      ), 0) as total_excedentes
      FROM clients c
      JOIN (
        SELECT client_id, SUM(amount) as consumed
        FROM tasks WHERE month_period = ${period}
        GROUP BY client_id
      ) sub ON sub.client_id = c.id
    `;

    const [{ total_tareas }] = await sql`
      SELECT COUNT(*) as total_tareas FROM tasks WHERE month_period = ${period}
    `;

    const tareas_por_abogado = await sql`
      SELECT u.name, COUNT(*) as total, COALESCE(SUM(t.time_tenths), 0) as horas
      FROM tasks t JOIN users u ON u.id = t.lawyer_id
      WHERE t.month_period = ${period}
      GROUP BY t.lawyer_id, u.name ORDER BY total DESC
    `;

    const [{ clientes_activos }] = await sql`
      SELECT COUNT(DISTINCT client_id) as clientes_activos
      FROM tasks WHERE month_period = ${period}
    `;

    const top_clientes = await sql`
      SELECT c.name, SUM(t.amount) as consumido, SUM(t.time_tenths) as horas
      FROM tasks t JOIN clients c ON c.id = t.client_id
      WHERE t.month_period = ${period}
      GROUP BY t.client_id, c.name ORDER BY consumido DESC LIMIT 10
    `;

    const alertas_excedente = await sql`
      SELECT c.name, c.monthly_fee, sub.consumed,
        ROUND(CAST(sub.consumed - c.monthly_fee AS numeric), 2) as excedente
      FROM clients c
      JOIN (
        SELECT client_id, SUM(amount) as consumed
        FROM tasks WHERE month_period = ${period}
        GROUP BY client_id
      ) sub ON sub.client_id = c.id
      WHERE c.has_fixed_fee = 1 AND sub.consumed > c.monthly_fee
    `;

    const [{ total_horas }] = await sql`
      SELECT COALESCE(SUM(time_tenths), 0) as total_horas
      FROM tasks WHERE month_period = ${period}
    `;

    res.json({
      period,
      total_facturado: Math.round(total_facturado * 100) / 100,
      total_cobrado: Math.round(total_cobrado * 100) / 100,
      total_pendiente: Math.max(0, total_pendiente),
      total_excedentes: Math.round(total_excedentes * 100) / 100,
      total_tareas: parseInt(total_tareas),
      total_horas: Math.round(total_horas * 10) / 10,
      clientes_activos: parseInt(clientes_activos),
      tareas_por_abogado,
      top_clientes,
      alertas_excedente,
    });
  } catch (err) {
    console.error('Error en dashboard:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
