import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { generateMonthlyReport, generateAccountStatement } from '../services/pdf.js';

const router = Router();

// GET /api/reports/monthly/:clientId/:period â PDF informe mensual
router.get('/monthly/:clientId/:period', requireRole('admin'), async (req, res) => {
  try {
    const doc = await generateMonthlyReport(req.params.clientId, req.params.period);
    if (!doc) return res.status(404).json({ error: 'Cliente no encontrado' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Informe_${req.params.period}_${req.params.clientId}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error('Error generando PDF mensual:', err);
    res.status(500).json({ error: 'Error generando PDF' });
  }
});

// GET /api/reports/statement/:clientId â PDF estado de cuenta
router.get('/statement/:clientId', requireRole('admin'), async (req, res) => {
  try {
    const doc = await generateAccountStatement(req.params.clientId);
    if (!doc) return res.status(404).json({ error: 'Cliente no encontrado' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Estado_Cuenta_${req.params.clientId}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error('Error generando PDF estado de cuenta:', err);
    res.status(500).json({ error: 'Error generando PDF' });
  }
});

export default router;
