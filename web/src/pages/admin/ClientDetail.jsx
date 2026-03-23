import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import { Download } from 'lucide-react';

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [billing, setBilling] = useState([]);
  const [period, setPeriod] = useState(() => new Date().toISOString().substring(0, 7));

  useEffect(() => {
    api.get(`/clients/${id}`).then(res => setClient(res.data.client)).catch(console.error);
    api.get(`/billing/${id}`).then(res => setBilling(res.data.billing_records)).catch(console.error);
  }, [id]);

  useEffect(() => {
    api.get(`/clients/${id}/summary`, { params: { period } }).then(res => setSummary(res.data.summary)).catch(console.error);
    api.get('/tasks', { params: { client_id: id, period } }).then(res => setTasks(res.data.tasks)).catch(console.error);
  }, [id, period]);

  if (!client) return <div className="text-sm text-[#a3a3a3]">Cargando...</div>;

  const pct = summary?.porcentaje_consumido ?? 0;
  const barColor = pct > 100 ? '#dc2626' : pct > 80 ? '#b45309' : '#0f0f0f';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">{client.name}</h1>
          <p className="text-sm text-[#6b6b6b] mt-0.5">
            {client.has_fixed_fee ? `Fee fijo $${client.monthly_fee?.toFixed(2)}/mes` : 'Por hora'} · Tarifa ${client.hourly_rate?.toFixed(2)}/hr
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f]"
          />
          <a
            href={`/api/reports/monthly/${id}/${period}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 border border-[#e5e5e5] bg-white hover:bg-[#f5f5f5] text-sm rounded transition-colors"
          >
            <Download size={13} /> Informe
          </a>
          <a
            href={`/api/reports/statement/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 border border-[#e5e5e5] bg-white hover:bg-[#f5f5f5] text-sm rounded transition-colors"
          >
            <Download size={13} /> Estado
          </a>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e5e5e5] rounded p-4">
            <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">Horas Consumidas</p>
            <p className="text-2xl font-semibold text-[#0f0f0f]">{summary.consumo_horas}</p>
            {summary.horas_incluidas && <p className="text-xs text-[#a3a3a3] mt-1">de {summary.horas_incluidas} incluidas</p>}
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded p-4">
            <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">Consumido (USD)</p>
            <p className="text-2xl font-semibold text-[#0f0f0f]">${summary.consumo_usd?.toFixed(2)}</p>
          </div>
          {summary.has_fixed_fee && (
            <>
              <div className="bg-white border border-[#e5e5e5] rounded p-4">
                <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">Disponible</p>
                <p className={`text-2xl font-semibold ${summary.disponible_usd < 0 ? 'text-[#dc2626]' : 'text-[#0f0f0f]'}`}>
                  ${summary.disponible_usd?.toFixed(2)}
                </p>
              </div>
              <div className="bg-white border border-[#e5e5e5] rounded p-4">
                <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">Excedente</p>
                <p className={`text-2xl font-semibold ${summary.excedente > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}>
                  ${summary.excedente?.toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Progress bar */}
      {summary?.porcentaje_consumido != null && (
        <div className="bg-white border border-[#e5e5e5] rounded p-4">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-[#6b6b6b]">Consumo del mes</span>
            <span className="font-medium text-[#0f0f0f] tabular-nums">{pct}%</span>
          </div>
          <div className="w-full bg-[#f0f0f0] rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }}
            />
          </div>
        </div>
      )}

      {/* Tasks table */}
      <div className="bg-white border border-[#e5e5e5] rounded">
        <div className="px-5 py-3 border-b border-[#e5e5e5]">
          <h2 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Tareas del Periodo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Abogado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Horas</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Monto</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} className="border-b border-[#f0f0f0]">
                  <td className="px-4 py-3 text-[#6b6b6b] tabular-nums">{t.date}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{t.lawyer_name}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{t.task_type}</td>
                  <td className="px-4 py-3 text-[#6b6b6b] max-w-[240px] truncate">{t.description}</td>
                  <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">{t.time_tenths}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#0f0f0f] tabular-nums">${t.amount?.toFixed(2)}</td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-[#a3a3a3]">Sin tareas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing history */}
      <div className="bg-white border border-[#e5e5e5] rounded">
        <div className="px-5 py-3 border-b border-[#e5e5e5]">
          <h2 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Estado de Cuenta</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Periodo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Tarifa Fija</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Excedentes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Pagado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Referencia</th>
              </tr>
            </thead>
            <tbody>
              {billing.map(b => (
                <tr key={b.id} className="border-b border-[#f0f0f0]">
                  <td className="px-4 py-3 font-medium text-[#0f0f0f] tabular-nums">{b.period}</td>
                  <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">${b.fixed_fee?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">${b.excess_amount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#0f0f0f] tabular-nums">${b.total_invoiced?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">${b.amount_paid?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded ${b.payment_status === 'paid' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#fff5f5] text-[#dc2626]'}`}>
                      {b.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{b.invoice_reference || '—'}</td>
                </tr>
              ))}
              {billing.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-[#a3a3a3]">Sin registros de facturación</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="bg-white border border-[#e5e5e5] rounded p-4">
          <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">Notas internas</p>
          <p className="text-sm text-[#6b6b6b]">{client.notes}</p>
        </div>
      )}
    </div>
  );
}
