import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Check, Clock } from 'lucide-react';

const TIME_OPTIONS = Array.from({ length: 20 }, (_, i) => {
  const val = (i + 1) / 10;
  const mins = Math.round(val * 60);
  return { value: val, label: `${val}h`, sublabel: `${mins} min` };
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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Registrar Tarea</h1>

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check size={18} /> Tarea registrada exitosamente
        </div>
      )}
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input type="date" value={form.date} max={new Date().toISOString().substring(0, 10)} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
        </div>

        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
            <option value="">Seleccionar cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Task type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de tarea</label>
          <select value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
            <option value="">Seleccionar tipo</option>
            {taskTypes.map(tt => <option key={tt.id} value={tt.name}>{tt.name}</option>)}
          </select>
        </div>

        {/* Time grid — mobile-friendly */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock size={16} className="inline mr-1" />Tiempo trabajado
          </label>
          <div className="grid grid-cols-5 gap-2">
            {TIME_OPTIONS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, time_tenths: t.value }))}
                className={`p-3 rounded-lg border text-center transition-all ${
                  form.time_tenths === t.value
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                }`}
              >
                <div className="text-sm font-bold">{t.label}</div>
                <div className={`text-xs ${form.time_tenths === t.value ? 'text-red-100' : 'text-gray-400'}`}>{t.sublabel}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del trabajo</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            placeholder="Describe brevemente el trabajo realizado..."
            required
          />
          <p className="text-xs text-gray-400 mt-1">{form.description.length}/500</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 rounded-lg text-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Registrando...' : 'Registrar Tarea'}
        </button>
      </form>
    </div>
  );
}
