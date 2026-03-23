import { useState, useEffect } from 'react';
import api from '../../api/client';
import { AlertTriangle } from 'lucide-react';

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-[#e5e5e5] p-5 rounded">
      <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-semibold text-[#0f0f0f] tracking-tight">{value}</p>
      {sub && <p className="text-xs text-[#a3a3a3] mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(() => new Date().toISOString().substring(0, 7));

  useEffect(() => {
    api.get('/dashboard', { params: { period } }).then(res => setData(res.data)).catch(console.error);
  }, [period]);

  if (!data) return <div className="text-sm text-[#a3a3a3]">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">Dashboard</h1>
        <input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border border-[#e5e5e5] bg-white text-sm text-[#0f0f0f] rounded focus:outline-none focus:border-[#0f0f0f]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Facturado" value={`$${data.total_facturado?.toFixed(2)}`} />
        <StatCard label="Total Cobrado" value={`$${data.total_cobrado?.toFixed(2)}`} />
        <StatCard label="Pendiente" value={`$${data.total_pendiente?.toFixed(2)}`} />
        <StatCard label="Excedentes" value={`$${data.total_excedentes?.toFixed(2)}`} />
        <StatCard label="Tareas" value={data.total_tareas} />
        <StatCard label="Horas Totales" value={data.total_horas} />
        <StatCard label="Clientes Activos" value={data.clientes_activos} />
      </div>

      {/* Alertas */}
      {data.alertas_excedente?.length > 0 && (
        <div className="bg-white border border-[#e5e5e5] rounded">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[#e5e5e5]">
            <AlertTriangle size={14} className="text-[#dc2626]" />
            <h2 className="text-xs font-medium text-[#dc2626] uppercase tracking-wider">Alertas de Excedente</h2>
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {data.alertas_excedente.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-[#0f0f0f]">{a.name}</span>
                <span className="text-[#dc2626] font-medium">+${a.excedente?.toFixed(2)} sobre ${ a.monthly_fee?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top clientes */}
      {data.top_clientes?.length > 0 && (
        <div className="bg-white border border-[#e5e5e5] rounded">
          <div className="px-5 py-3 border-b border-[#e5e5e5]">
            <h2 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Top Clientes por Consumo</h2>
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {data.top_clientes.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-[#0f0f0f]">{c.name}</span>
                <div className="text-right">
                  <span className="font-medium text-[#0f0f0f]">${c.consumido?.toFixed(2)}</span>
                  <span className="text-[#a3a3a3] ml-2">{c.horas}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tareas por abogado */}
      {data.tareas_por_abogado?.length > 0 && (
        <div className="bg-white border border-[#e5e5e5] rounded">
          <div className="px-5 py-3 border-b border-[#e5e5e5]">
            <h2 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Tareas por Abogado</h2>
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {data.tareas_por_abogado.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-[#0f0f0f]">{a.name}</span>
                <span className="text-[#6b6b6b]">{a.total} tareas · {a.horas}h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
