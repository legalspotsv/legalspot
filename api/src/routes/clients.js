import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/connection.js';
import { clients } from '../db/schema.js';
import { eq, like, desc, sql } from 'drizzle-orm';
import { requireRole } from '../middleware/auth.js';
import { calculateClientPeriod } from '../services/calculations.js';

const router = Router();

// GET /api/clients — solo admin
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, active } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = db.select().from(clients);

    if (active !== undefined) {
      query = query.where(eq(clients.is_active, active === 'true' ? 1 : 0));
    }
    if (search) {
      query = query.where(like(clients.name, `%${search}%`));
    }

    const results = await query.orderBy(clients.name).limit(parseInt(limit)).offset(offset);
    const [{ count }] = await db.select({ count: sql`count(*)` }).from(clients);

    res.json({ clients: results, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Error listando clientes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/clients/:id — solo admin
router.get('/:id', requireRole('admin'), async (req, res) => {
  try {
    const [client] = await db.select().from(clients).where(eq(clients.id, req.params.id)).limit(1);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ client });
  } catch (err) {
    console.error('Error obteniendo cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/clients/:id/summary — admin o cliente dueño
router.get('/:id/summary', async (req, res) => {
  try {
    if (req.user.role === 'client' && req.user.client_id !== req.params.id) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    if (req.user.role === 'lawyer') {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    const period = req.query.period || new Date().toISOString().substring(0, 7);
    const summary = calculateClientPeriod(req.params.id, period);
    if (!summary) return res.status(404).json({ error: 'Cliente no encontrado' });

    // Si es cliente, quitar info financiera
    if (req.user.role === 'client') {
      delete summary.consumo_usd;
      delete summary.disponible_usd;
      delete summary.excedente;
      delete summary.saldo_a_favor;
      delete summary.hourly_rate;
      delete summary.monthly_fee;
    }

    res.json({ summary });
  } catch (err) {
    console.error('Error obteniendo summary:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/clients — solo admin
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name, group_name, has_fixed_fee, monthly_fee, hourly_rate, carry_forward_balance, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre del cliente es requerido' });
    if (!hourly_rate || hourly_rate <= 0) return res.status(400).json({ error: 'Tarifa por hora inválida' });

    const now = new Date().toISOString();
    const id = uuid();
    const newClient = {
      id,
      name: name.trim(),
      group_name: group_name?.trim() || null,
      has_fixed_fee: has_fixed_fee ? 1 : 0,
      monthly_fee: has_fixed_fee ? (monthly_fee || 0) : 0,
      hourly_rate,
      carry_forward_balance: carry_forward_balance || 0,
      notes: notes || null,
      is_active: 1,
      created_at: now,
      updated_at: now,
    };

    await db.insert(clients).values(newClient);
    res.status(201).json({ client: newClient });
  } catch (err) {
    console.error('Error creando cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/clients/:id — solo admin
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { name, group_name, has_fixed_fee, monthly_fee, hourly_rate, carry_forward_balance, notes, is_active } = req.body;
    const updates = { updated_at: new Date().toISOString() };

    if (name !== undefined) updates.name = name.trim();
    if (group_name !== undefined) updates.group_name = group_name?.trim() || null;
    if (has_fixed_fee !== undefined) updates.has_fixed_fee = has_fixed_fee ? 1 : 0;
    if (monthly_fee !== undefined) updates.monthly_fee = monthly_fee;
    if (hourly_rate !== undefined) updates.hourly_rate = hourly_rate;
    if (carry_forward_balance !== undefined) updates.carry_forward_balance = carry_forward_balance;
    if (notes !== undefined) updates.notes = notes || null;
    if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;

    await db.update(clients).set(updates).where(eq(clients.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error('Error actualizando cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
