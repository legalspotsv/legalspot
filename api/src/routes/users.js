import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/users — solo admin
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      client_id: users.client_id,
      is_active: users.is_active,
      created_at: users.created_at,
    }).from(users).orderBy(users.name);

    res.json({ users: allUsers });
  } catch (err) {
    console.error('Error listando usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/users — solo admin
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, client_id } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    if (!email?.trim()) return res.status(400).json({ error: 'Email requerido' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' });
    if (!['admin', 'lawyer', 'client'].includes(role)) return res.status(400).json({ error: 'Rol inválido' });
    if (role === 'client' && !client_id) return res.status(400).json({ error: 'client_id requerido para rol cliente' });

    const password_hash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const id = uuid();

    await db.insert(users).values({
      id, name: name.trim(), email: email.toLowerCase().trim(),
      password_hash, role, client_id: client_id || null,
      is_active: 1, created_at: now, updated_at: now,
    });

    res.status(201).json({ user: { id, name: name.trim(), email: email.toLowerCase().trim(), role, client_id } });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }
    console.error('Error creando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/users/:id — solo admin
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, client_id, is_active } = req.body;
    const updates = { updated_at: new Date().toISOString() };

    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (password) updates.password_hash = await bcrypt.hash(password, 10);
    if (role !== undefined) updates.role = role;
    if (client_id !== undefined) updates.client_id = client_id;
    if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;

    await db.update(users).set(updates).where(eq(users.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error('Error actualizando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
