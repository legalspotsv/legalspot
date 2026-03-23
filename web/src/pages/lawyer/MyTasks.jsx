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
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">Mis Tareas</h1>
        <input
          type="month"
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f]"
        />
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded px-5 py-3 flex items-center justify-between">
        <span className="text-sm text-[#6b6b6b]">{total} tarea(s) este periodo</span>
        <span className="text-sm font-medium text-[#0f0f0f] tabular-nums">{totalHours.toFixed(1)} horas</span>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e5e5]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Descripción</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Horas</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} className="border-b border-[#f0f0f0]">
                <td className="px-4 py-3 text-[#6b6b6b] tabular-nums">{t.date}</td>
                <td className="px-4 py-3 text-[#0f0f0f]">{t.client_name}</td>
                <td className="px-4 py-3 text-[#6b6b6b]">{t.task_type}</td>
                <td className="px-4 py-3 text-[#6b6b6b] max-w-[240px] truncate">{t.description}</td>
                <td className="px-4 py-3 text-right font-medium text-[#0f0f0f] tabular-nums">{t.time_tenths}</td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#a3a3a3]">Sin tareas este periodo</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
