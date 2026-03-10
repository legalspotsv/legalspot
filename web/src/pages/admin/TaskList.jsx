import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ client_id: '', lawyer_id: '', period: new Date().toISOString().substring(0, 7) });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const load = () => {
    api.get('/tasks', { params: { ...filters, page, limit: 50 } })
      .then(res => { setTasks(res.data.tasks); setTotal(res.data.total); })
      .catch(console.error);
  };

  useEffect(() => { load(); }, [filters, page]);
  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data.clients)).catch(console.error);
    api.get('/users').then(res => setUsers(res.data.users.filter(u => u.role === 'lawyer' || u.role === 'admin'))).catch(console.error);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    await api.delete(`/tasks/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
        <button onClick={() => { setEditTask(null); setShowForm(true); }} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Nueva Tarea
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="month" value={filters.period} onChange={e => setFilters(f => ({ ...f, period: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        <select value={filters.client_id} onChange={e => setFilters(f => ({ ...f, client_id: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.lawyer_id} onChange={e => setFilters(f => ({ ...f, lawyer_id: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Todos los abogados</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Abogado</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Horas</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Monto</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{t.date}</td>
                <td className="px-4 py-3 text-gray-700">{t.client_name}</td>
                <td className="px-4 py-3 text-gray-700">{t.lawyer_name}</td>
                <td className="px-4 py-3 text-gray-700">{t.task_type}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{t.description}</td>
                <td className="px-4 py-3 text-right text-gray-900">{t.time_tenths}</td>
                <td className="px-4 py-3 text-right text-gray-900 font-medium">${t.amount?.toFixed(2)}</td>
                <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                  <button onClick={() => { setEditTask(t); setShowForm(true); }} className="text-blue-500 hover:text-blue-700 p-1" title="Editar">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 p-1" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No hay tareas para este periodo</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{total} tarea(s) en total</span>
        <div className="flex items-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
          <span className="text-gray-700 font-medium">Pág. {page} de {Math.max(1, Math.ceil(total / 50))}</span>
          <button disabled={tasks.length < 50} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
        </div>
      </div>

      {/* Modal form */}
      {showForm && <TaskFormModal clients={clients} users={users} task={editTask} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function TaskFormModal({ clients, users, task, onClose, onSaved }) {
  const [taskTypes, setTaskTypes] = useState([]);
  const [clientSummary, setClientSummary] = useState(null);
  const [form, setForm] = useState({
    date: task?.date || new Date().toISOString().substring(0, 10),
    client_id: task?.client_id || '',
    task_type: task?.task_type || '',
    description: task?.description || '',
    time_tenths: task?.time_tenths || 0.1,
    lawyer_id: task?.lawyer_id || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/task-types').then(res => setTaskTypes(res.data.task_types)).catch(console.error);
  }, []);

  // Cargar saldo del cliente cuando cambia
  useEffect(() => {
    if (!form.client_id) { setClientSummary(null); return; }
    const period = form.date?.substring(0, 7) || new Date().toISOString().substring(0, 7);
    api.get(`/clients/${form.client_id}/summary`, { params: { period } })
      .then(res => setClientSummary(res.data.summary))
      .catch(() => setClientSummary(null));
  }, [form.client_id, form.date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (task) {
        await api.put(`/tasks/${task.id}`, form);
      } else {
        await api.post('/tasks', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900">{task ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" value={form.date} max={new Date().toISOString().substring(0, 10)} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo (horas)</label>
              <select value={form.time_tenths} onChange={e => setForm(f => ({ ...f, time_tenths: parseFloat(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {Array.from({ length: 80 }, (_, i) => (i + 1) / 10).map(v => (
                  <option key={v} value={v}>{v} hr ({Math.round(v * 60)} min)</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
              <option value="">Seleccionar cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {clientSummary && clientSummary.has_fixed_fee && (
              <div className={`mt-1 px-3 py-2 rounded-lg text-xs ${clientSummary.disponible_usd < 0 ? 'bg-red-50 text-red-700' : clientSummary.porcentaje_consumido > 80 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                Saldo: ${clientSummary.disponible_usd?.toFixed(2)} — {clientSummary.horas_disponibles}h disponibles ({clientSummary.porcentaje_consumido}% consumido)
              </div>
            )}
            {clientSummary && !clientSummary.has_fixed_fee && (
              <div className="mt-1 px-3 py-2 rounded-lg text-xs bg-blue-50 text-blue-700">
                Pago por hora — {clientSummary.consumo_horas}h consumidas este mes (${clientSummary.consumo_usd?.toFixed(2)})
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Abogado</label>
            <select value={form.lawyer_id} onChange={e => setForm(f => ({ ...f, lawyer_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
              <option value="">Seleccionar abogado</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de tarea</label>
            <select value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
              <option value="">Seleccionar tipo</option>
              {taskTypes.map(tt => <option key={tt.id} value={tt.name}>{tt.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={500} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
