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
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">Tareas</h1>
        <button
          onClick={() => { setEditTask(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white px-3 py-2 text-sm font-medium rounded transition-colors"
        >
          <Plus size={14} /> Nueva Tarea
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="month"
          value={filters.period}
          onChange={e => setFilters(f => ({ ...f, period: e.target.value }))}
          className="px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f]"
        />
        <select
          value={filters.client_id}
          onChange={e => setFilters(f => ({ ...f, client_id: e.target.value }))}
          className="px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f]"
        >
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filters.lawyer_id}
          onChange={e => setFilters(f => ({ ...f, lawyer_id: e.target.value }))}
          className="px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f]"
        >
          <option value="">Todos los abogados</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5e5e5] rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e5e5]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Abogado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Descripción</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Horas</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Monto</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} className="border-b border-[#f0f0f0] hover:bg-[#fafafa]">
                <td className="px-4 py-3 text-[#6b6b6b] tabular-nums">{t.date}</td>
                <td className="px-4 py-3 text-[#0f0f0f]">{t.client_name}</td>
                <td className="px-4 py-3 text-[#6b6b6b]">{t.lawyer_name}</td>
                <td className="px-4 py-3 text-[#6b6b6b]">{t.task_type}</td>
                <td className="px-4 py-3 text-[#6b6b6b] max-w-[240px] truncate">{t.description}</td>
                <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">{t.time_tenths}</td>
                <td className="px-4 py-3 text-right font-medium text-[#0f0f0f] tabular-nums">${t.amount?.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setEditTask(t); setShowForm(true); }}
                      className="p-1.5 text-[#a3a3a3] hover:text-[#0f0f0f] transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-[#a3a3a3] hover:text-[#dc2626] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#a3a3a3]">
                  No hay tareas para este periodo
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-[#6b6b6b]">
        <span>{total} tarea(s) en total</span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 border border-[#e5e5e5] rounded text-sm hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-[#0f0f0f] font-medium">Pág. {page} de {Math.max(1, Math.ceil(total / 50))}</span>
          <button
            disabled={tasks.length < 50}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 border border-[#e5e5e5] rounded text-sm hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>

      {showForm && (
        <TaskFormModal
          clients={clients}
          users={users}
          task={editTask}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
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

  const inputCls = 'w-full px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f] transition-colors';
  const labelCls = 'block text-xs font-medium text-[#6b6b6b] uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-[#0f0f0f]">{task ? 'Editar Tarea' : 'Nueva Tarea'}</h2>

        {error && (
          <div className="text-sm text-[#dc2626] border border-[#fecaca] bg-[#fff5f5] px-3 py-2 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha</label>
              <input
                type="date"
                value={form.date}
                max={new Date().toISOString().substring(0, 10)}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Tiempo (horas)</label>
              <select
                value={form.time_tenths}
                onChange={e => setForm(f => ({ ...f, time_tenths: parseFloat(e.target.value) }))}
                className={inputCls}
              >
                {Array.from({ length: 80 }, (_, i) => (i + 1) / 10).map(v => (
                  <option key={v} value={v}>{v} hr ({Math.round(v * 60)} min)</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Cliente</label>
            <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className={inputCls} required>
              <option value="">Seleccionar cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {clientSummary && clientSummary.has_fixed_fee && (
              <p className={`mt-1 text-xs px-2 py-1.5 rounded ${clientSummary.disponible_usd < 0 ? 'text-[#dc2626] bg-[#fff5f5]' : clientSummary.porcentaje_consumido > 80 ? 'text-[#b45309] bg-[#fffbeb]' : 'text-[#6b6b6b] bg-[#f5f5f5]'}`}>
                Saldo: ${clientSummary.disponible_usd?.toFixed(2)} — {clientSummary.horas_disponibles}h disponibles ({clientSummary.porcentaje_consumido}% consumido)
              </p>
            )}
            {clientSummary && !clientSummary.has_fixed_fee && (
              <p className="mt-1 text-xs px-2 py-1.5 rounded text-[#6b6b6b] bg-[#f5f5f5]">
                Por hora — {clientSummary.consumo_horas}h este mes (${clientSummary.consumo_usd?.toFixed(2)})
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>Abogado</label>
            <select value={form.lawyer_id} onChange={e => setForm(f => ({ ...f, lawyer_id: e.target.value }))} className={inputCls} required>
              <option value="">Seleccionar abogado</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Tipo de tarea</label>
            <select value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))} className={inputCls} required>
              <option value="">Seleccionar tipo</option>
              {taskTypes.map(tt => <option key={tt.id} value={tt.name}>{tt.name}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              maxLength={500}
              rows={3}
              className={inputCls}
              required
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#e5e5e5] rounded text-sm text-[#6b6b6b] hover:bg-[#f5f5f5] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white rounded text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
