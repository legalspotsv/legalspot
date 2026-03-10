import { useState, useEffect } from 'react';
import api from '../../api/client';
import { DollarSign, Clock, Users, AlertTriangle, FileText, TrendingUp } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(() => new Date().toISOString().substring(0, 7));

  useEffect(() => {
    api.get('/dashboard', { params: { period } }).then(res => setData(res.data)).catch(console.error);
  }, [period]);

  if (!data) return <div className="text-gray-500">Cargando dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={DollarSign} label="Total Facturado" value={`$${data.total_facturado.toFixed(2)}`} color="blue" />
        <StatCard icon={TrendingUp} label="Total Cobrado" value={`$${data.total_cobrado.toFixed(2)}`} color="green" />
        <StatCard icon={DollarSign} label="Pendiente de Cobro" value={`$${data.total_pendiente.toFixed(2)}`} color="red" />
        <StatCard icon={AlertTriangle} label="Excedentes" value={`$${data.total_excedentes.toFixed(2)}`} color="amber" />
        <StatCard icon={FileText} label="Tareas Registradas" value={data.total_tareas} color="purple" />
        <StatCard icon={Clock} label="Horas Totales" value={data.total_horas} color="blue" />
        <StatCard icon={Users} label="Clientes Activos" value={data.clientes_activos} color="green" />
      </div>

      {/* Top clientes */}
      {data.top_clientes?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Clientes por Consumo</h2>
          <div className="space-y-3">
            {data.top_clientes.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{c.name}</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">${c.consumido?.toFixed(2)}</span>
                  <span className="text-xs text-gray-500 ml-2">({c.horas}h)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas de excedente */}
      {data.alertas_excedente?.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
          <h2 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} /> Alertas de Excedente
          </h2>
          {data.alertas_excedente.map((a, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1">
              <span className="text-red-700">{a.name}</span>
              <span className="font-medium text-red-800">+${a.excedente?.toFixed(2)} sobre fee de ${a.monthly_fee?.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tareas por abogado */}
      {data.tareas_por_abogado?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tareas por Abogado</h2>
          <div className="space-y-2">
            {data.tareas_por_abogado.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{a.name}</span>
                <span className="text-gray-900 font-medium">{a.total} tareas ({a.horas}h)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
