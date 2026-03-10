import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Clock } from 'lucide-react';

export default function Portal() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(() => new Date().toISOString().substring(0, 7));

  useEffect(() => {
    api.get('/portal/me', { params: { period } }).then(res => setData(res.data)).catch(console.error);
  }, [period]);

  if (!data) return <div className="text-gray-500">Cargando...</div>;

  const { summary, tasks, invoices } = data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Portal</h1>
          <p className="text-sm text-gray-500">{summary.client_name}</p>
        </div>
        <input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      </div>

      {/* Summary */}
      {summary.has_fixed_fee && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Horas Consumidas</p>
              <p className="text-3xl font-bold text-gray-900">{summary.consumo_horas}</p>
              <p className="text-xs text-gray-400">de {summary.horas_incluidas} incluidas</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Horas Disponibles</p>
              <p className={`text-3xl font-bold ${summary.horas_disponibles < 0 ? 'text-red-600' : 'text-green-600'}`}>{summary.horas_disponibles}</p>
            </div>
          </div>

          {/* Progress */}
          {summary.porcentaje_consumido != null && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 flex items-center gap-1"><Clock size={14} /> Consumo del mes</span>
                <span className="font-medium text-gray-900">{summary.porcentaje_consumido}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className={`h-4 rounded-full transition-all ${summary.porcentaje_consumido > 100 ? 'bg-red-500' : summary.porcentaje_consumido > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, summary.porcentaje_consumido)}%` }} />
              </div>
            </div>
          )}
        </>
      )}

      {!summary.has_fixed_fee && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Horas Consumidas este mes</p>
          <p className="text-3xl font-bold text-gray-900">{summary.consumo_horas}</p>
        </div>
      )}

      {/* Tasks */}
      <div className="bg-white rounded-xl border border-gray-200">
        <h2 className="px-5 py-3 font-semibold text-gray-900 border-b border-gray-200">Historial de Tareas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Descripción</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Horas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((t, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">{t.date}</td>
                  <td className="px-4 py-3">{t.task_type}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{t.description}</td>
                  <td className="px-4 py-3 text-right font-medium">{t.time_tenths}</td>
                </tr>
              ))}
              {tasks.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Sin tareas este periodo</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-xl border border-gray-200">
        <h2 className="px-5 py-3 font-semibold text-gray-900 border-b border-gray-200">Estado de Facturas</h2>
        <div className="divide-y divide-gray-100">
          {invoices.map((inv, i) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-700">{inv.period}</span>
              <div className="flex items-center gap-3">
                {inv.payment_date && <span className="text-xs text-gray-400">Pagado el {inv.payment_date}</span>}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${inv.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {inv.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                </span>
              </div>
            </div>
          ))}
          {invoices.length === 0 && <div className="px-5 py-8 text-center text-gray-500 text-sm">Sin facturas registradas</div>}
        </div>
      </div>
    </div>
  );
}
