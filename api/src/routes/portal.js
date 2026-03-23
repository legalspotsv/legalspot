import { Router } from 'express';
import { sql } from '../db/connection.js';
import { requireRole } from '../middleware/auth.js';
import { calculateClientPeriod } from '../services/calculations.js';

const router = Router();

// GET /api/portal/me — datos del portal del cliente
router.get('/me', requireRole('client'), async (req, res) => {
  try {
    const clientId = req.user.client_id;
    if (!clientId) return res.status(400).json({ error: 'Usuario no vinculado a un cliente' });

    const [client] = await sql`SELECT * FROM clients WHERE id = ${clientId}`;
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    const period = req.query.period || new Date().toISOString().substring(0, 7);

    // Respuesta base
    const response = {
      billing_type: client.billing_type,
      client_name: client.name,
    };

    if (client.billing_type === 'process') {
      // Vista proceso: traer procesos con sus hitos
      const processes = await sql`
        SELECT * FROM processes WHERE client_id = ${clientId} ORDER BY created_at DESC
      `;
      for (const p of processes) {
        p.milestones = await sql`
          SELECT * FROM milestones WHERE process_id = ${p.id} ORDER BY created_at ASC
        `;
      }
      response.processes = processes;
    } else {
      // Vista horas/fee
      const summary = await calculateClientPeriod(clientId, period);
      if (!summary) return res.status(404).json({ error: 'Cliente no encontrado' });

      const tasks = await sql`
        SELECT date, task_type, description, time_tenths
        FROM tasks
        WHERE client_id = ${clientId} AND month_period = ${period}
        ORDER BY date DESC
      `;

      const invoices = await sql`
        SELECT period, payment_status, payment_date
        FROM billing_records
        WHERE client_id = ${clientId}
        ORDER BY period DESC
      `;

      response.summary = {
        period: summary.period,
        has_fixed_fee: summary.has_fixed_fee,
        consumo_horas: summary.consumo_horas,
        horas_incluidas: summary.horas_incluidas,
        horas_disponibles: summary.horas_disponibles,
        porcentaje_consumido: summary.porcentaje_consumido,
      };
      response.tasks = tasks;
      response.invoices = invoices;
    }

    // Documentos (ambos tipos)
    const firmDocs = await sql`
      SELECT d.*, u.name as uploaded_by_name FROM documents d
      LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE d.client_id = ${clientId} AND d.cloud_type = 'firm'
      ORDER BY d.created_at DESC
    `;
    const clientDocs = await sql`
      SELECT d.*, u.name as uploaded_by_name FROM documents d
      LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE d.client_id = ${clientId} AND d.cloud_type = 'client'
      ORDER BY d.created_at DESC
    `;
    response.firm_documents = firmDocs;
    response.client_documents = clientDocs;

    res.json(response);
  } catch (err) {
    console.error('Error en portal:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
