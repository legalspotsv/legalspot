import { useState, useEffect } from 'react';
import api from '../../api/client';

export default function Portal() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(() => new Date().toISOString().substring(0, 7));

  useEffect(() => {
    api.get('/portal/me', { params: { period } }).then(res => setData(res.data)).catch(console.error);
  }, [period]);

  if (!data) return <div className="text-sm text-[#a3a3a3]">Cargando...</div>;

  const { summary, tasks, invoices } = data;
  const pct = summary.porcentaje_consumido ?? 0;
  const barColor = pct > 100 ? '#dc2626' : pct > 80 ? '#b45309' : '#0f0f0f';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">Mi Portal</h1>
          <p className="text-sm text-[#6b6b6b] mt-0.5">{summary.client_name}</p>
        </div>
        <input
          type="month"
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f]"
        />
      </div>

      {/* Stats */}
      {summary.has_fixed_fee ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-[#e5e5e5] rounded p-5">
              <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">Horas Consumidas</p>
              <p className="text-3xl font-semibold text-[#0f0f0f] tabular-nums">{summary.consumo_horas}</p>
              <p className="text-xs text-[#a3a3a3] mt-1">de {summary.horas_incluidas} incluidas</p>
            </div>
            <div className="bg-white border border-[#e5e5e5] rounded p-5">
              <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">Horas Disponibles</p>
              <p className={`text-3xl font-semibold tabular-nums ${summary.horas_disponibles < 0 ? 'text-[#dc2626]' : 'text-[#0f0f0f]'}`}>
                {summary.horas_disponibles}
              </p>
            </div>
          </div>

          {summary.porcentaje_consumido != null && (
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
        </>
      ) : (
        <div className="bg-white border border-[#e5e5e5] rounded p-5">
          <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">Horas Consumidas este mes</p>
          <p className="text-3xl font-semibold text-[#0f0f0f] tabular-nums">{summary.consumo_horas}</p>
        </div>
      )}

      {/* Tasks */}
      <div className="bg-white border border-[#e5e5e5] rounded">
        <div className="px-5 py-3 border-b border-[#e5e5e5]">
          <h2 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Historial de Tareas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Horas</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={i} className="border-b border-[#f0f0f0]">
                  <td className="px-4 py-3 text-[#6b6b6b] tabular-nums">{t.date}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{t.task_type}</td>
                  <td className="px-4 py-3 text-[#6b6b6b] max-w-[240px] truncate">{t.description}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#0f0f0f] tabular-nums">{t.time_tenths}</td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-[#a3a3a3]">Sin tareas este periodo</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white border border-[#e5e5e5] rounded">
        <div className="px-5 py-3 border-b border-[#e5e5e5]">
          <h2 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Estado de Facturas</h2>
        </div>
        <div className="divide-y divide-[#f0f0f0]">
          {invoices.map((inv, i) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-[#0f0f0f] font-medium tabular-nums">{inv.period}</span>
              <div className="flex items-center gap-3">
                {inv.payment_date && (
                  <span className="text-xs text-[#a3a3a3]">Pagado {inv.payment_date}</span>
                )}
                <span className={`inline-block text-xs px-2 py-0.5 rounded ${inv.payment_status === 'paid' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#fff5f5] text-[#dc2626]'}`}>
                  {inv.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
          {invoices.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-[#a3a3a3]">Sin facturas registradas</div>
          )}
        </div>
      </div>
    </div>
  );
}
