import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/connection.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/processes?client_id=... — admin o abogado asignado
router.get('/', async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id requerido' });

    // Verificar acceso
    if (req.user.role === 'lawyer') {
      const [client] = await sql`SELECT assigned_lawyer_id FROM clients WHERE id = ${client_id}`;
      if (!client || client.assigned_lawyer_id !== req.user.id) {
        return res.status(403).json({ error: 'No tienes acceso a este cliente' });
      }
    } else if (req.user.role === 'client') {
      if (req.user.client_id !== client_id) {
        return res.status(403).json({ error: 'No tienes acceso' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    const processes = await sql`
      SELECT p.*, u.name as created_by_name
      FROM processes p
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.client_id = ${client_id}
      ORDER BY p.created_at DESC
    `;

    // Para cada proceso, cargar sus hitos
    for (const process of processes) {
      process.milestones = await sql`
        SELECT m.*, u.name as created_by_name
        FROM milestones m
        LEFT JOIN users u ON u.id = m.created_by
        WHERE m.process_id = ${process.id}
        ORDER BY m.created_at ASC
      `;
    }

    res.json({ processes });
  } catch (err) {
    console.error('Error listando procesos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/processes/:id — detalle de un proceso con hitos
router.get('/:id', async (req, res) => {
  try {
    const [process] = await sql`
      SELECT p.*, c.name as client_name, c.billing_type
      FROM processes p
      JOIN clients c ON c.id = p.client_id
      WHERE p.id = ${req.params.id}
    `;
    if (!process) return res.status(404).json({ error: 'Proceso no encontrado' });

    // Verificar acceso
    if (req.user.role === 'lawyer') {
      const [client] = await sql`SELECT assigned_lawyer_id FROM clients WHERE id = ${process.client_id}`;
      if (!client || client.assigned_lawyer_id !== req.user.id) {
        return res.status(403).json({ error: 'No tienes acceso a este proceso' });
      }
    } else if (req.user.role === 'client') {
      if (req.user.client_id !== process.client_id) {
        return res.status(403).json({ error: 'No tienes acceso' });
      }
    }

    process.milestones = await sql`
      SELECT m.*, u.name as created_by_name
      FROM milestones m
      LEFT JOIN users u ON u.id = m.created_by
      WHERE m.process_id = ${process.id}
      ORDER BY m.created_at ASC
    `;

    res.json({ process });
  } catch (err) {
    console.error('Error obteniendo proceso:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/processes — admin o abogado asignado
router.post('/', requireRole('admin', 'lawyer'), async (req, res) => {
  try {
    const { client_id, name, description, fixed_amount } = req.body;
    if (!client_id) return res.status(400).json({ error: 'client_id requerido' });
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });

    // Verificar que el cliente existe y es tipo proceso
    const [client] = await sql`SELECT * FROM clients WHERE id = ${client_id}`;
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    if (client.billing_type !== 'process') {
      return res.status(400).json({ error: 'Este cliente no es de tipo proceso' });
    }

    // Abogado: verificar que es el asignado
    if (req.user.role === 'lawyer' && client.assigned_lawyer_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a este cliente' });
    }

    const now = new Date().toISOString();
    const id = uuid();

    await sql`
      INSERT INTO processes (id, client_id, name, description, fixed_amount, status, created_by, created_at, updated_at)
      VALUES (${id}, ${client_id}, ${name.trim()}, ${description || null}, ${fixed_amount || 0}, 'active', ${req.user.id}, ${now}, ${now})
    `;

    const [process] = await sql`SELECT * FROM processes WHERE id = ${id}`;
    res.status(201).json({ process });
  } catch (err) {
    console.error('Error creando proceso:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/processes/:id — admin o abogado asignado
router.put('/:id', requireRole('admin', 'lawyer'), async (req, res) => {
  try {
    const { name, description, fixed_amount, status } = req.body;

    const [process] = await sql`SELECT * FROM processes WHERE id = ${req.params.id}`;
    if (!process) return res.status(404).json({ error: 'Proceso no encontrado' });

    if (req.user.role === 'lawyer') {
      const [client] = await sql`SELECT assigned_lawyer_id FROM clients WHERE id = ${process.client_id}`;
      if (!client || client.assigned_lawyer_id !== req.user.id) {
        return res.status(403).json({ error: 'No tienes acceso a este proceso' });
      }
    }

    const now = new Date().toISOString();
    await sql`
      UPDATE processes SET
        name = ${name ?? process.name},
        description = ${description ?? process.description},
        fixed_amount = ${fixed_amount ?? process.fixed_amount},
        status = ${status ?? process.status},
        updated_at = ${now}
      WHERE id = ${req.params.id}
    `;

    res.json({ ok: true });
  } catch (err) {
    console.error('Error actualizando proceso:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/processes/:id/milestones — agregar hito
router.post('/:id/milestones', requireRole('admin', 'lawyer'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Título requerido' });

    const [process] = await sql`SELECT * FROM processes WHERE id = ${req.params.id}`;
    if (!process) return res.status(404).json({ error: 'Proceso no encontrado' });

    if (req.user.role === 'lawyer') {
      const [client] = await sql`SELECT assigned_lawyer_id FROM clients WHERE id = ${process.client_id}`;
      if (!client || client.assigned_lawyer_id !== req.user.id) {
        return res.status(403).json({ error: 'No tienes acceso a este proceso' });
      }
    }

    const now = new Date().toISOString();
    const id = uuid();

    await sql`
      INSERT INTO milestones (id, process_id, title, description, completed_at, created_by, created_at, updated_at)
      VALUES (${id}, ${req.params.id}, ${title.trim()}, ${description || null}, null, ${req.user.id}, ${now}, ${now})
    `;

    const [milestone] = await sql`SELECT * FROM milestones WHERE id = ${id}`;
    res.status(201).json({ milestone });
  } catch (err) {
    console.error('Error creando hito:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/processes/milestones/:milestoneId — actualizar hito (marcar completado, editar)
router.put('/milestones/:milestoneId', requireRole('admin', 'lawyer'), async (req, res) => {
  try {
    const { title, description, completed } = req.body;

    const [milestone] = await sql`
      SELECT m.*, p.client_id FROM milestones m
      JOIN processes p ON p.id = m.process_id
      WHERE m.id = ${req.params.milestoneId}
    `;
    if (!milestone) return res.status(404).json({ error: 'Hito no encontrado' });

    if (req.user.role === 'lawyer') {
      const [client] = await sql`SELECT assigned_lawyer_id FROM clients WHERE id = ${milestone.client_id}`;
      if (!client || client.assigned_lawyer_id !== req.user.id) {
        return res.status(403).json({ error: 'No tienes acceso' });
      }
    }

    const now = new Date().toISOString();
    const completed_at = completed === true ? now : completed === false ? null : milestone.completed_at;

    await sql`
      UPDATE milestones SET
        title = ${title ?? milestone.title},
        description = ${description ?? milestone.description},
        completed_at = ${completed_at},
        updated_at = ${now}
      WHERE id = ${req.params.milestoneId}
    `;

    res.json({ ok: true });
  } catch (err) {
    console.error('Error actualizando hito:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/processes/milestones/:milestoneId — solo admin
router.delete('/milestones/:milestoneId', requireRole('admin'), async (req, res) => {
  try {
    await sql`DELETE FROM milestones WHERE id = ${req.params.milestoneId}`;
    res.json({ ok: true });
  } catch (err) {
    console.error('Error eliminando hito:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
