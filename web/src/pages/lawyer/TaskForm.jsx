import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Check } from 'lucide-react';

const TIME_OPTIONS = Array.from({ length: 20 }, (_, i) => {
  const val = (i + 1) / 10;
  const mins = Math.round(val * 60);
  return { value: val, label: `${val}h`, sublabel: `${mins}m` };
});

export default function TaskForm() {
  const [clients, setClients] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  // Formulario tarea (hourly)
  const [taskForm, setTaskForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    client_id: '',
    task_type: '',
    description: '',
    time_tenths: 0,
  });

  // Formulario hito (proceso)
  const [processes, setProcesses] = useState([]);
  const [milestoneForm, setMilestoneForm] = useState({
    process_id: '',
    title: '',
    description: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data.clients?.filter(c => c.is_active) || [])).catch(console.error);
    api.get('/task-types').then(res => setTaskTypes(res.data.task_types)).catch(console.error);
  }, []);

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
    setTaskForm(f => ({ ...f, client_id: clientId }));
    setMilestoneForm(f => ({ ...f, process_id: '' }));
    setProcesses([]);

    if (client?.billing_type === 'process') {
      api.get('/processes', { params: { client_id: clientId } })
        .then(res => setProcesses(res.data.processes || []))
        .catch(console.error);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.time_tenths) { setError('Selecciona el tiempo trabajado'); return; }
    setError(''); setSaving(true);
    try {
      await api.post('/tasks', taskForm);
      setSuccess('Tarea registrada exitosamente');
      setTaskForm(f => ({ ...f, client_id: '', task_type: '', description: '', time_tenths: 0 }));
      setSelectedClient(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar');
    } finally {
      setSaving(false);
    }
  };

  const handleMilestoneSubmit = async (e) => {
    e.preventDefault();
    if (!milestoneForm.process_id) { setError('Selecciona un proceso'); return; }
    if (!milestoneForm.title?.trim()) { setError('El título es requerido'); return; }
    setError(''); setSaving(true);
    try {
      await api.post(`/processes/${milestoneForm.process_id}/milestones`, {
        title: milestoneForm.title,
        description: milestoneForm.description,
      });
      setSuccess('Hito registrado exitosamente');
      setMilestoneForm(f => ({ ...f, title: '', description: '' }));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f] transition-colors';
  const labelCls = 'block text-xs font-medium text-[#6b6b6b] uppercase tracking-wider mb-1.5';
  const isProcess = selectedClient?.billing_type === 'process';

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">
        {isProcess ? 'Registrar Hito' : 'Registrar Tarea'}
      </h1>

      {success && (
        <div className="flex items-center gap-2 text-sm text-[#16a34a] border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2.5 rounded">
          <Check size={15} /> {success}
        </div>
      )}
      {error && (
        <div className="text-sm text-[#dc2626] border border-[#fecaca] bg-[#fff5f5] px-3 py-2.5 rounded">{error}</div>
      )}

      {/* Selector de cliente (siempre visible) */}
      <div>
        <label className={labelCls}>Cliente</label>
        <select
          value={taskForm.client_id}
          onChange={e => handleClientChange(e.target.value)}
          className={inputCls}
          required
        >
          <option value="">Seleccionar cliente</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} {c.billing_type === 'process' ? '(Proceso)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Formulario según tipo */}
      {selectedClient && (
        isProcess ? (
          <form onSubmit={handleMilestoneSubmit} className="space-y-5">
            <div>
              <label className={labelCls}>Proceso</label>
              <select
                value={milestoneForm.process_id}
                onChange={e => setMilestoneForm(f => ({ ...f, process_id: e.target.value }))}
                className={inputCls}
                required
              >
                <option value="">Seleccionar proceso</option>
                {processes.filter(p => p.status === 'active').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {processes.length === 0 && (
                <p className="text-xs text-[#a3a3a3] mt-1">Sin procesos activos — el administrador debe crear uno primero</p>
              )}
            </div>

            <div>
              <label className={labelCls}>Título del hito / avance</label>
              <input
                type="text"
                value={milestoneForm.title}
                onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                className={inputCls}
                placeholder="Ej: Presentación de demanda"
                required
              />
            </div>

            <div>
              <label className={labelCls}>Descripción (opcional)</label>
              <textarea
                value={milestoneForm.description}
                onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className={inputCls}
                placeholder="Detalles del avance realizado..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white font-medium py-3 rounded text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Registrando...' : 'Registrar Hito'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTaskSubmit} className="space-y-5">
            <div>
              <label className={labelCls}>Fecha</label>
              <input
                type="date"
                value={taskForm.date}
                max={new Date().toISOString().substring(0, 10)}
                onChange={e => setTaskForm(f => ({ ...f, date: e.target.value }))}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Tipo de tarea</label>
              <select
                value={taskForm.task_type}
                onChange={e => setTaskForm(f => ({ ...f, task_type: e.target.value }))}
                className={inputCls}
                required
              >
                <option value="">Seleccionar tipo</option>
                {taskTypes.map(tt => <option key={tt.id} value={tt.name}>{tt.name}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Tiempo trabajado</label>
              <div className="grid grid-cols-5 gap-1.5">
                {TIME_OPTIONS.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTaskForm(f => ({ ...f, time_tenths: t.value }))}
                    className={`py-2.5 rounded border text-center transition-colors ${
                      taskForm.time_tenths === t.value
                        ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                        : 'bg-white text-[#6b6b6b] border-[#e5e5e5] hover:border-[#0f0f0f] hover:text-[#0f0f0f]'
                    }`}
                  >
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="text-xs text-[#a3a3a3]">{t.sublabel}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Descripción del trabajo</label>
              <textarea
                value={taskForm.description}
                onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                maxLength={500}
                rows={4}
                className={inputCls}
                placeholder="Describe brevemente el trabajo realizado..."
                required
              />
              <p className="text-xs text-[#a3a3a3] mt-1">{taskForm.description.length}/500</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white font-medium py-3 rounded text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Registrando...' : 'Registrar Tarea'}
            </button>
          </form>
        )
      )}
    </div>
  );
}
