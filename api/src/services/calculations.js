import { sqlite } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export const PACKAGES = {
  individual:       { hours: 1,    rate: 175, fee: 175 },
  basico:           { hours: 3,    rate: 150, fee: 450 },
  empresarial:      { hours: 5,    rate: 125, fee: 625 },
  corporativo_plus: { hours: 10,   rate: 100, fee: 1000 },
  alta_direccion:   { hours: null, rate: null, fee: 4500 },
  por_hora:         { hours: null, rate: null, fee: 0 },
};

/**
 * Calcula el resumen del periodo actual para un cliente.
 */
export function calculateClientPeriod(clientId, period) {
  const client = sqlite.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
  if (!client) return null;

  const consumption = sqlite.prepare(`
    SELECT COALESCE(SUM(time_tenths), 0) as total_hours,
           COALESCE(SUM(amount), 0) as total_consumed
    FROM tasks
    WHERE client_id = ? AND month_period = ?
  `).get(clientId, period);

  const total_hours = Math.round(consumption.total_hours * 10) / 10;
  const total_consumed = Math.round(consumption.total_consumed * 100) / 100;

  const result = {
    client_id: clientId,
    client_name: client.name,
    period,
    has_fixed_fee: !!client.has_fixed_fee,
    monthly_fee: client.monthly_fee,
    hourly_rate: client.hourly_rate,
    carry_forward_balance: client.carry_forward_balance,
    consumo_horas: total_hours,
    consumo_usd: total_consumed,
  };

  if (client.has_fixed_fee && client.monthly_fee > 0) {
    const horas_incluidas = client.hourly_rate > 0 ? client.monthly_fee / client.hourly_rate : 0;
    result.horas_incluidas = Math.round(horas_incluidas * 10) / 10;
    result.disponible_usd = Math.round((client.monthly_fee - total_consumed) * 100) / 100;
    result.horas_disponibles = Math.round((horas_incluidas - total_hours) * 10) / 10;
    result.excedente = Math.round(Math.max(0, total_consumed - client.monthly_fee) * 100) / 100;
    result.saldo_a_favor = Math.round(Math.max(0, client.monthly_fee - total_consumed) * 100) / 100;
    result.porcentaje_consumido = client.monthly_fee > 0
      ? Math.round((total_consumed / client.monthly_fee) * 100)
      : 0;
  } else {
    // Cliente sin fee fijo — pago por hora
    result.horas_incluidas = null;
    result.disponible_usd = null;
    result.horas_disponibles = null;
    result.excedente = null;
    result.saldo_a_favor = null;
    result.total_a_cobrar = total_consumed;
    result.porcentaje_consumido = null;
  }

  return result;
}

/**
 * Genera o actualiza el billing record para un cliente/periodo.
 */
export function generateBillingRecord(clientId, period) {
  const summary = calculateClientPeriod(clientId, period);
  if (!summary) return null;

  const existing = sqlite.prepare(
    'SELECT * FROM billing_records WHERE client_id = ? AND period = ?'
  ).get(clientId, period);

  const fixed_fee = summary.has_fixed_fee ? summary.monthly_fee : 0;
  const excess_amount = summary.excedente || 0;
  const total_invoiced = summary.has_fixed_fee
    ? Math.round((fixed_fee + excess_amount) * 100) / 100
    : summary.total_a_cobrar;

  // Calcular acumulado: buscar el billing anterior
  const prevBilling = sqlite.prepare(`
    SELECT accumulated_total FROM billing_records
    WHERE client_id = ? AND period < ?
    ORDER BY period DESC LIMIT 1
  `).get(clientId, period);

  const prevAccumulated = prevBilling?.accumulated_total || 0;
  const accumulated_total = Math.round((prevAccumulated + total_invoiced - (existing?.amount_paid || 0)) * 100) / 100;

  const now = new Date().toISOString();

  if (existing) {
    sqlite.prepare(`
      UPDATE billing_records SET
        fixed_fee = ?, total_consumed = ?, excess_amount = ?,
        total_invoiced = ?, accumulated_total = ?
      WHERE id = ?
    `).run(fixed_fee, summary.consumo_usd, excess_amount, total_invoiced, accumulated_total, existing.id);
    return { ...existing, fixed_fee, total_consumed: summary.consumo_usd, excess_amount, total_invoiced, accumulated_total };
  } else {
    const id = uuidv4();
    sqlite.prepare(`
      INSERT INTO billing_records (id, client_id, period, fixed_fee, total_consumed, excess_amount, total_invoiced, amount_paid, payment_status, accumulated_total, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?)
    `).run(id, clientId, period, fixed_fee, summary.consumo_usd, excess_amount, total_invoiced, accumulated_total, now);
    return { id, client_id: clientId, period, fixed_fee, total_consumed: summary.consumo_usd, excess_amount, total_invoiced, amount_paid: 0, payment_status: 'pending', accumulated_total };
  }
}

/**
 * Cierra un periodo: genera billing record y actualiza carry_forward_balance.
 */
export function closePeriod(clientId, period) {
  const summary = calculateClientPeriod(clientId, period);
  if (!summary) return null;

  const record = generateBillingRecord(clientId, period);

  // Actualizar carry_forward_balance del cliente
  if (summary.has_fixed_fee) {
    const newBalance = Math.round((summary.carry_forward_balance + (summary.saldo_a_favor || 0)) * 100) / 100;
    sqlite.prepare('UPDATE clients SET carry_forward_balance = ?, updated_at = ? WHERE id = ?')
      .run(newBalance, new Date().toISOString(), clientId);
  }

  return record;
}
