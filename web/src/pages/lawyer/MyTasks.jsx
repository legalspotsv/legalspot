import { useState, useEffect } from 'react';
import api from '../../api/client';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [period, setPeriod] = useState(() => new Date().toISOString().substring(0, 7));
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get('/tasks', { params: { period } })
      .then(res => { setTasks(res.data.tasks); setTotal(res.data.total); })
      .catch(console.error);
  }, [period]);

  const totalHours = tasks.reduce((sum, t) => sum + t.time_tenths, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Mis Tareas</h1>
        <input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">{total} tarea(s) este periodo</span>
        <span className="text-sm font-medium text-gray-900">{totalHours.toFixed(1)} horas totales</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Horas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map(t => (
              <tr key={t.id}>
                <td className="px-4 py-3">{t.date}</td>
                <td className="px-4 py-3">{t.client_name}</td>
                <td className="px-4 py-3">{t.task_type}</td>
                <td className="px-4 py-3 max-w-xs truncate">{t.description}</td>
                <td className="px-4 py-3 text-right font-medium">{t.time_tenths}</td>
              </tr>
            ))}
            {tasks.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Sin tareas este periodo</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
