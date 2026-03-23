import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db/connection.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/documents?client_id=...&cloud_type=firm|client
router.get('/', async (req, res) => {
  try {
    const { client_id, cloud_type, process_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id requerido' });

    // Control de acceso
    if (req.user.role === 'client') {
      if (req.user.client_id !== client_id) return res.status(403).json({ error: 'Sin acceso' });
    } else if (req.user.role === 'lawyer') {
      const [client] = await sql`SELECT assigned_lawyer_id FROM clients WHERE id = ${client_id}`;
      if (!client || client.assigned_lawyer_id !== req.user.id) {
        return res.status(403).json({ error: 'Sin acceso a este cliente' });
      }
      // Abogado no ve nube del cliente
      if (cloud_type === 'client') return res.status(403).json({ error: 'Sin acceso a nube del cliente' });
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    let query = sql`
      SELECT d.*, u.name as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE d.client_id = ${client_id}
    `;

    // Construir query con filtros
    const conditions = [`d.client_id = '${client_id}'`];
    if (cloud_type) conditions.push(`d.cloud_type = '${cloud_type}'`);
    if (process_id) conditions.push(`d.process_id = '${process_id}'`);

    const documents = await sql.unsafe(`
      SELECT d.*, u.name as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.created_at DESC
    `);

    res.json({ documents });
  } catch (err) {
    console.error('Error listando documentos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/documents — subir documento (URL)
router.post('/', async (req, res) => {
  try {
    const { client_id, process_id, name, description, file_url, cloud_type } = req.body;
    if (!client_id) return res.status(400).json({ error: 'client_id requerido' });
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    if (!file_url?.trim()) return res.status(400).json({ error: 'URL del archivo requerida' });
    if (!['firm', 'client'].includes(cloud_type)) return res.status(400).json({ error: 'cloud_type debe ser firm o client' });

    // Control de acceso
    if (req.user.role === 'client') {
      if (req.user.client_id !== client_id) return res.status(403).json({ error: 'Sin acceso' });
      if (cloud_type !== 'client') return res.status(403).json({ error: 'Solo puedes subir a tu nube' });
    } else if (req.user.role === 'lawyer') {
      const [client] = await sql`SELECT assigned_lawyer_id FROM clients WHERE id = ${client_id}`;
      if (!client || client.assigned_lawyer_id !== req.user.id) {
        return res.status(403).json({ error: 'Sin acceso a este cliente' });
      }
      if (cloud_type !== 'firm') return res.status(403).json({ error: 'Solo puedes subir a nube del bufete' });
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const now = new Date().toISOString();
    const id = uuid();

    await sql`
      INSERT INTO documents (id, client_id, process_id, name, description, file_url, cloud_type, uploaded_by, created_at)
      VALUES (${id}, ${client_id}, ${process_id || null}, ${name.trim()}, ${description || null}, ${file_url.trim()}, ${cloud_type}, ${req.user.id}, ${now})
    `;

    const [doc] = await sql`SELECT * FROM documents WHERE id = ${id}`;
    res.status(201).json({ document: doc });
  } catch (err) {
    console.error('Error creando documento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/documents/:id — admin o quien lo subió
router.delete('/:id', async (req, res) => {
  try {
    const [doc] = await sql`SELECT * FROM documents WHERE id = ${req.params.id}`;
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

    if (req.user.role !== 'admin' && doc.uploaded_by !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso para eliminar este documento' });
    }

    await sql`DELETE FROM documents WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    console.error('Error eliminando documento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
