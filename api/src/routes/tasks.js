import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db, sqlite } from '../db/connection.js';
import { tasks, clients, users } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, client_id, lawyer_id, period } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = sql`1=1`;

    // Abogado solo ve sus propias tareas
    if (req.user.role === 'lawyer') {
      whereClause = sql`${whereClause} AND ${tasks.lawyer_id} = ${req.user.id}`;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    if (client_id) whereClause = sql`${whereClause} AND ${tasks.client_id} = ${client_id}`;
    if (lawyer_id && req.user.role === 'admin') whereClause = sql`${whereClause} AND ${tasks.lawyer_id} = ${lawyer_id}`;
    if (period) whereClause = sql`${whereClause} AND ${tasks.month_period} = ${period}`;

    const stmt = sqlite.prepare(`
      SELECT t.*, c.name as client_name, u.name as lawyer_name
      FROM tasks t
      JOIN clients c ON c.id = t.client_id
      JOIN users u ON u.id = t.lawyer_id
      WHERE ${req.user.role === 'lawyer' ? `t.lawyer_id = '${req.user.id}'` : '1=1'}
      ${client_id ? `AND t.client_id = '${client_id}'` : ''}
      ${lawyer_id && req.user.role === 'admin' ? `AND t.lawyer_id = '${lawyer_id}'` : ''}
      ${period ? `AND t.month_period = '${period}'` : ''}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const results = stmt.all(parseInt(limit), offset);

    // Si es abogado, quitar montos
    if (req.user.role === 'lawyer') {
      results.forEach(t => {
        delete t.hourly_rate_applied;
        delete t.amount;
      });
    }

    const countStmt = sqlite.prepare(`
      SELECT count(*) as count FROM tasks t
      WHERE ${req.user.role === 'lawyer' ? `t.lawyer_id = '${req.user.id}'` : '1=1'}
      ${client_id ? `AND t.client_id = '${client_id}'` : ''}
      ${lawyer_id && req.user.role === 'admin' ? `AND t.lawyer_id = '${lawyer_id}'` : ''}
      ${period ? `AND t.month_period = '${period}'` : ''}
    `);
    const { count } = countStmt.get();

    res.json({ tasks: results, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Error listando tareas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/tasks — admin o lawyer
router.post('/', requireRole('admin', 'lawyer'), async (req, res) => {
  try {
    const { date, client_id, task_type, description, time_tenths, lawyer_id: bodyLawyerId } = req.body;

    // Validaciones
    if (!date) return res.status(400).json({ error: 'Fecha es requerida' });
    if (!client_id) return res.status(400).json({ error: 'Cliente es requerido' });
    if (!task_type) return res.status(400).json({ error: 'Tipo de tarea es requerido' });
    if (!description?.trim()) return res.status(400).json({ error: 'Descripción es requerida' });
    if (description.length > 500) return res.status(400).json({ error: 'Descripción máximo 500 caracteres' });
    if (!time_tenths || time_tenths < 0.1 || time_tenths > 24) {
      return res.status(400).json({ error: 'Tiempo debe ser entre 0.1 y 24 horas' });
    }

    // Validar que time_tenths sea múltiplo de 0.1
    if (Math.round(time_tenths * 10) !== time_tenths * 10) {
      return res.status(400).json({ error: 'Tiempo debe ser en décimas (0.1, 0.2, ... 1.0)' });
    }

    // No permitir fechas futuras
    const today = new Date().toISOString().substring(0, 10);
    if (date > today) {
      return res.status(400).json({ error: 'No se permiten fechas futuras' });
    }

    // Obtener cliente
    const [client] = await db.select().from(clients).where(eq(clients.id, client_id)).limit(1);
    if (!client || !client.is_active) {
      return res.status(400).json({ error: 'Cliente no encontrado o inactivo' });
    }

    // Determinar lawyer_id
    const lawyerId = req.user.role === 'admin' && bodyLawyerId ? bodyLawyerId : req.user.id;

    const now = new Date().toISOString();
    const roundedTime = Math.round(time_tenths * 10) / 10;
    const amount = Math.round(roundedTime * client.hourly_rate * 100) / 100;
    const month_period = date.substring(0, 7);

    const id = uuid();
    const newTask = {
      id,
      date,
      lawyer_id: lawyerId,
      client_id,
      task_type,
      description: description.trim(),
      time_tenths: roundedTime,
      hourly_rate_applied: client.hourly_rate,
      amount,
      month_period,
      created_at: now,
      updated_at: now,
    };

    await db.insert(tasks).values(newTask);

    // Para el response del abogado, quitar montos
    const response = { ...newTask };
    if (req.user.role === 'lawyer') {
      delete response.hourly_rate_applied;
      delete response.amount;
    }

    res.status(201).json({ task: response });
  } catch (err) {
    console.error('Error creando tarea:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/tasks/:id — solo admin
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { date, client_id, task_type, description, time_tenths } = req.body;
    const now = new Date().toISOString();
    const updates = { updated_at: now };

    if (date !== undefined) {
      updates.date = date;
      updates.month_period = date.substring(0, 7);
    }
    if (client_id !== undefined) updates.client_id = client_id;
    if (task_type !== undefined) updates.task_type = task_type;
    if (description !== undefined) updates.description = description.trim();
    if (time_tenths !== undefined) updates.time_tenths = Math.round(time_tenths * 10) / 10;

    // Recalcular monto si cambió tiempo o cliente
    if (time_tenths !== undefined || client_id !== undefined) {
      const cid = client_id || (await db.select().from(tasks).where(eq(tasks.id, req.params.id)).limit(1))[0]?.client_id;
      const [client] = await db.select().from(clients).where(eq(clients.id, cid)).limit(1);
      if (client) {
        const t = updates.time_tenths || time_tenths;
        updates.hourly_rate_applied = client.hourly_rate;
        updates.amount = Math.round(t * client.hourly_rate * 100) / 100;
      }
    }

    await db.update(tasks).set(updates).where(eq(tasks.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error('Error actualizando tarea:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/tasks/:id — solo admin
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await db.delete(tasks).where(eq(tasks.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error('Error eliminando tarea:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
