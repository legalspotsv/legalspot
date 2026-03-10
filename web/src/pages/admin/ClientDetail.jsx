import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import { DollarSign, Clock, AlertTriangle, TrendingUp, Download } from 'lucide-react';

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

  if (!client) return <div className="text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-sm text-gray-500">{client.has_fixed_fee ? `Fee Fijo: $${client.monthly_fee?.toFixed(2)}/mes` : 'Pago por hora'} — Tarifa: ${client.hourly_rate?.toFixed(2)}/hr</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <a href={`/api/reports/monthly/${id}/${period}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium" title="Descargar Informe Mensual">
            <Download size={16} /> Informe
          </a>
          <a href={`/api/reports/statement/${id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium" title="Descargar Estado de Cuenta">
            <Download size={16} /> Estado
          </a>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Clock size={16} /> Horas Consumidas</div>
            <p className="text-2xl font-bold text-gray-900">{summary.consumo_horas}</p>
            {summary.horas_incluidas && <p className="text-xs text-gray-500">de {summary.horas_incluidas} incluidas</p>}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><DollarSign size={16} /> Consumido (USD)</div>
            <p className="text-2xl font-bold text-gray-900">${summary.consumo_usd?.toFixed(2)}</p>
          </div>
          {summary.has_fixed_fee && (
            <>
              <div className={`rounded-xl border p-4 ${summary.disponible_usd < 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><TrendingUp size={16} /> Disponible</div>
                <p className={`text-2xl font-bold ${summary.disponible_usd < 0 ? 'text-red-600' : 'text-gray-900'}`}>${summary.disponible_usd?.toFixed(2)}</p>
              </div>
              <div className={`rounded-xl border p-4 ${summary.excedente > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><AlertTriangle size={16} /> Excedente</div>
                <p className={`text-2xl font-bold ${summary.excedente > 0 ? 'text-red-600' : 'text-green-600'}`}>${summary.excedente?.toFixed(2)}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Progress bar */}
      {summary?.porcentaje_consumido != null && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Consumo del mes</span>
            <span className="font-medium text-gray-900">{summary.porcentaje_consumido}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${summary.porcentaje_consumido > 100 ? 'bg-red-500' : summary.porcentaje_consumido > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, summary.porcentaje_consumido)}%` }} />
          </div>
        </div>
      )}

      {/* Tasks table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <h2 className="px-5 py-3 font-semibold text-gray-900 border-b border-gray-200">Tareas del Periodo</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Abogado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Descripción</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Horas</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map(t => (
                <tr key={t.id}>
                  <td className="px-4 py-3">{t.date}</td>
                  <td className="px-4 py-3">{t.lawyer_name}</td>
                  <td className="px-4 py-3">{t.task_type}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{t.description}</td>
                  <td className="px-4 py-3 text-right">{t.time_tenths}</td>
                  <td className="px-4 py-3 text-right font-medium">${t.amount?.toFixed(2)}</td>
                </tr>
              ))}
              {tasks.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Sin tareas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing history */}
      <div className="bg-white rounded-xl border border-gray-200">
        <h2 className="px-5 py-3 font-semibold text-gray-900 border-b border-gray-200">Estado de Cuenta</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Periodo</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Tarifa Fija</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Excedentes</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Total Facturado</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Pagado</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {billing.map(b => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium">{b.period}</td>
                  <td className="px-4 py-3 text-right">${b.fixed_fee?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${b.excess_amount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium">${b.total_invoiced?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${b.amount_paid?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {b.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.invoice_reference || '—'}</td>
                </tr>
              ))}
              {billing.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Sin registros de facturación</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {client.notes && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <p className="text-sm font-medium text-amber-800">Notas internas</p>
          <p className="text-sm text-amber-700 mt-1">{client.notes}</p>
        </div>
      )}
    </div>
  );
}
