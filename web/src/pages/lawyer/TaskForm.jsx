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
  const [form, setForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    client_id: '',
    task_type: '',
    description: '',
    time_tenths: 0,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data.clients?.filter(c => c.is_active) || [])).catch(console.error);
    api.get('/task-types').then(res => setTaskTypes(res.data.task_types)).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.time_tenths) { setError('Selecciona el tiempo trabajado'); return; }
    setError('');
    setSaving(true);
    try {
      await api.post('/tasks', form);
      setSuccess(true);
      setForm(f => ({ ...f, client_id: '', task_type: '', description: '', time_tenths: 0 }));
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f] transition-colors';
  const labelCls = 'block text-xs font-medium text-[#6b6b6b] uppercase tracking-wider mb-1.5';

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">Registrar Tarea</h1>

      {success && (
        <div className="flex items-center gap-2 text-sm text-[#16a34a] border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2.5 rounded">
          <Check size={15} /> Tarea registrada exitosamente
        </div>
      )}
      {error && (
        <div className="text-sm text-[#dc2626] border border-[#fecaca] bg-[#fff5f5] px-3 py-2.5 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
          <label className={labelCls}>Cliente</label>
          <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className={inputCls} required>
            <option value="">Seleccionar cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Tipo de tarea</label>
          <select value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))} className={inputCls} required>
            <option value="">Seleccionar tipo</option>
            {taskTypes.map(tt => <option key={tt.id} value={tt.name}>{tt.name}</option>)}
          </select>
        </div>

        {/* Time grid */}
        <div>
          <label className={labelCls}>Tiempo trabajado</label>
          <div className="grid grid-cols-5 gap-1.5">
            {TIME_OPTIONS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, time_tenths: t.value }))}
                className={`py-2.5 rounded border text-center transition-colors ${
                  form.time_tenths === t.value
                    ? 'bg-[#0f0f0f] text-white border-[#0f0f0f]'
                    : 'bg-white text-[#6b6b6b] border-[#e5e5e5] hover:border-[#0f0f0f] hover:text-[#0f0f0f]'
                }`}
              >
                <div className="text-sm font-medium">{t.label}</div>
                <div className={`text-xs ${form.time_tenths === t.value ? 'text-[#a3a3a3]' : 'text-[#a3a3a3]'}`}>{t.sublabel}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Descripción del trabajo</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            maxLength={500}
            rows={4}
            className={inputCls}
            placeholder="Describe brevemente el trabajo realizado..."
            required
          />
          <p className="text-xs text-[#a3a3a3] mt-1">{form.description.length}/500</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white font-medium py-3 rounded text-sm transition-colors disabled:opacity-50"
        >
          {saving ? 'Registrando...' : 'Registrar Tarea'}
        </button>
      </form>
    </div>
  );
}
