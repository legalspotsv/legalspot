import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/connection.js';
import { taskTypes } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/task-types — cualquier usuario autenticado
router.get('/', async (req, res) => {
  try {
    const types = await db.select().from(taskTypes).where(eq(taskTypes.is_active, 1)).orderBy(asc(taskTypes.sort_order));
    res.json({ task_types: types });
  } catch (err) {
    console.error('Error listando task types:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/task-types — solo admin
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });

    const id = uuid();
    const maxOrder = db.select({ max: taskTypes.sort_order }).from(taskTypes).get();
    const sort_order = (maxOrder?.max || 0) + 1;

    await db.insert(taskTypes).values({ id, name: name.trim(), is_active: 1, sort_order });
    res.status(201).json({ id, name: name.trim(), is_active: 1, sort_order });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Ya existe un tipo de tarea con ese nombre' });
    }
    console.error('Error creando task type:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/task-types/:id — solo admin
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { name, is_active, sort_order } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    await db.update(taskTypes).set(updates).where(eq(taskTypes.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error('Error actualizando task type:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
