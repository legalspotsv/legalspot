import { Router } from 'express';
import { sqlite } from '../db/connection.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard — metricas del mes actual
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const period = req.query.period || new Date().toISOString().substring(0, 7);

    // Total facturado del mes (suma de amounts de tasks)
    const { total_facturado } = sqlite.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_facturado
      FROM tasks WHERE month_period = ?
    `).get(period);

    // Total cobrado del mes
    const { total_cobrado } = sqlite.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) as total_cobrado
      FROM billing_records WHERE period = ?
    `).get(period);

    // Total pendiente
    const total_pendiente = Math.round((total_facturado - total_cobrado) * 100) / 100;

    // Excedentes generados
    const { total_excedentes } = sqlite.prepare(`
      SELECT COALESCE(SUM(
        CASE WHEN c.has_fixed_fee = 1 AND sub.consumed > c.monthly_fee
          THEN sub.consumed - c.monthly_fee ELSE 0 END
      ), 0) as total_excedentes
      FROM clients c
      JOIN (
        SELECT client_id, SUM(amount) as consumed
        FROM tasks WHERE month_period = ?
        GROUP BY client_id
      ) sub ON sub.client_id = c.id
    `).get(period);

    // Tareas registradas
    const { total_tareas } = sqlite.prepare(`
      SELECT COUNT(*) as total_tareas FROM tasks WHERE month_period = ?
    `).get(period);

    // Tareas por abogado
    const tareas_por_abogado = sqlite.prepare(`
      SELECT u.name, COUNT(*) as total, COALESCE(SUM(t.time_tenths), 0) as horas
      FROM tasks t JOIN users u ON u.id = t.lawyer_id
      WHERE t.month_period = ?
      GROUP BY t.lawyer_id ORDER BY total DESC
    `).all(period);

    // Clientes activos (con al menos una tarea)
    const { clientes_activos } = sqlite.prepare(`
      SELECT COUNT(DISTINCT client_id) as clientes_activos
      FROM tasks WHERE month_period = ?
    `).get(period);

    // Top clientes por consumo
    const top_clientes = sqlite.prepare(`
      SELECT c.name, SUM(t.amount) as consumido, SUM(t.time_tenths) as horas
      FROM tasks t JOIN clients c ON c.id = t.client_id
      WHERE t.month_period = ?
      GROUP BY t.client_id ORDER BY consumido DESC LIMIT 10
    `).all(period);

    // Alertas de excedente
    const alertas_excedente = sqlite.prepare(`
      SELECT c.name, c.monthly_fee, sub.consumed,
        ROUND(sub.consumed - c.monthly_fee, 2) as excedente
      FROM clients c
      JOIN (
        SELECT client_id, SUM(amount) as consumed
        FROM tasks WHERE month_period = ?
        GROUP BY client_id
      ) sub ON sub.client_id = c.id
      WHERE c.has_fixed_fee = 1 AND sub.consumed > c.monthly_fee
    `).all(period);

    // Total horas del mes
    const { total_horas } = sqlite.prepare(`
      SELECT COALESCE(SUM(time_tenths), 0) as total_horas
      FROM tasks WHERE month_period = ?
    `).get(period);

    res.json({
      period,
      total_facturado: Math.round(total_facturado * 100) / 100,
      total_cobrado: Math.round(total_cobrado * 100) / 100,
      total_pendiente: Math.max(0, total_pendiente),
      total_excedentes: Math.round(total_excedentes * 100) / 100,
      total_tareas,
      total_horas: Math.round(total_horas * 10) / 10,
      clientes_activos,
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
