import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql as dbSql } from '../db/connection.js';
import { requireRole } from '../middleware/auth.js';
import { calculateClientPeriod } from '../services/calculations.js';

const router = Router();

// GET /api/clients — admin ve todos, abogado ve sus asignados
router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'client') return res.status(403).json({ error: 'Sin permiso' });

    const { search, active } = req.query;
    const conditions = [];

    if (req.user.role === 'lawyer') {
      conditions.push(`c.assigned_lawyer_id = '${req.user.id}'`);
    }
    if (active !== undefined) {
      conditions.push(`c.is_active = ${active === 'true' ? 1 : 0}`);
    }
    if (search) {
      conditions.push(`c.name ILIKE '%${search.replace(/'/g, "''")}%'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const clients = await dbSql.unsafe(`
      SELECT c.*, u.name as assigned_lawyer_name
      FROM clients c
      LEFT JOIN users u ON u.id = c.assigned_lawyer_id
      ${whereClause}
      ORDER BY c.name ASC
    `);

    res.json({ clients });
  } catch (err) {
    console.error('Error listando clientes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/clients/:id — admin o abogado asignado
router.get('/:id', async (req, res) => {
  try {
    if (req.user.role === 'client') return res.status(403).json({ error: 'Sin permiso' });

    const [client] = await dbSql`
      SELECT c.*, u.name as assigned_lawyer_name
      FROM clients c
      LEFT JOIN users u ON u.id = c.assigned_lawyer_id
      WHERE c.id = ${req.params.id}
    `;
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    if (req.user.role === 'lawyer' && client.assigned_lawyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin acceso a este cliente' });
    }

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
      return res.status(403).json({ error: 'Sin permiso' });
    }
    if (req.user.role === 'lawyer') {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const period = req.query.period || new Date().toISOString().substring(0, 7);
    const summary = await calculateClientPeriod(req.params.id, period);
    if (!summary) return res.status(404).json({ error: 'Cliente no encontrado' });

    res.json({ summary });
  } catch (err) {
    console.error('Error obteniendo summary:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/clients — solo admin
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const {
      name, group_name, billing_type = 'hourly',
      has_fixed_fee, monthly_fee, hourly_rate = 175,
      carry_forward_balance, assigned_lawyer_id, notes
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Nombre del cliente es requerido' });
    if (!['hourly', 'process'].includes(billing_type)) {
      return res.status(400).json({ error: 'billing_type debe ser hourly o process' });
    }
    if (billing_type === 'hourly' && (!hourly_rate || hourly_rate <= 0)) {
      return res.status(400).json({ error: 'Tarifa por hora inválida' });
    }

    const now = new Date().toISOString();
    const id = uuid();

    await dbSql`
      INSERT INTO clients (id, name, group_name, billing_type, has_fixed_fee, monthly_fee, hourly_rate,
        carry_forward_balance, assigned_lawyer_id, notes, is_active, created_at, updated_at)
      VALUES (
        ${id}, ${name.trim()}, ${group_name?.trim() || null}, ${billing_type},
        ${billing_type === 'hourly' && has_fixed_fee ? 1 : 0},
        ${billing_type === 'hourly' && has_fixed_fee ? (monthly_fee || 0) : 0},
        ${billing_type === 'hourly' ? hourly_rate : 0},
        ${carry_forward_balance || 0},
        ${assigned_lawyer_id || null},
        ${notes || null}, 1, ${now}, ${now}
      )
    `;

    const [client] = await dbSql`SELECT * FROM clients WHERE id = ${id}`;
    res.status(201).json({ client });
  } catch (err) {
    console.error('Error creando cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/clients/:id — solo admin
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const {
      name, group_name, billing_type, has_fixed_fee, monthly_fee,
      hourly_rate, carry_forward_balance, assigned_lawyer_id, notes, is_active
    } = req.body;

    const now = new Date().toISOString();
    const setClauses = [`updated_at = '${now}'`];

    if (name !== undefined) setClauses.push(`name = '${name.trim().replace(/'/g, "''")}'`);
    if (group_name !== undefined) setClauses.push(`group_name = ${group_name ? `'${group_name.trim()}'` : 'NULL'}`);
    if (billing_type !== undefined) setClauses.push(`billing_type = '${billing_type}'`);
    if (has_fixed_fee !== undefined) setClauses.push(`has_fixed_fee = ${has_fixed_fee ? 1 : 0}`);
    if (monthly_fee !== undefined) setClauses.push(`monthly_fee = ${monthly_fee}`);
    if (hourly_rate !== undefined) setClauses.push(`hourly_rate = ${hourly_rate}`);
    if (carry_forward_balance !== undefined) setClauses.push(`carry_forward_balance = ${carry_forward_balance}`);
    if (assigned_lawyer_id !== undefined) setClauses.push(`assigned_lawyer_id = ${assigned_lawyer_id ? `'${assigned_lawyer_id}'` : 'NULL'}`);
    if (notes !== undefined) setClauses.push(`notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}`);
    if (is_active !== undefined) setClauses.push(`is_active = ${is_active ? 1 : 0}`);

    await dbSql.unsafe(`UPDATE clients SET ${setClauses.join(', ')} WHERE id = '${req.params.id}'`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error actualizando cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
