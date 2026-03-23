import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';

export default function TaskTypes() {
  const [types, setTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editType, setEditType] = useState(null);

  const load = () => {
    api.get('/task-types').then(res => setTypes(res.data.task_types)).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (tt) => {
    await api.put(`/task-types/${tt.id}`, { is_active: !tt.is_active });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">Tipos de Tarea</h1>
        <button
          onClick={() => { setEditType(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white px-3 py-2 text-sm font-medium rounded transition-colors"
        >
          <Plus size={14} /> Nuevo Tipo
        </button>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded">
        <div className="divide-y divide-[#f0f0f0]">
          {types.map(tt => (
            <div key={tt.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#fafafa]">
              <div className="flex items-center gap-3">
                <span className={`text-sm ${tt.is_active ? 'text-[#0f0f0f]' : 'text-[#a3a3a3] line-through'}`}>{tt.name}</span>
                <span className="text-xs text-[#a3a3a3]">#{tt.sort_order}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditType(tt); setShowForm(true); }}
                  className="p-1.5 text-[#a3a3a3] hover:text-[#0f0f0f] transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => toggleActive(tt)}
                  className={`p-1.5 transition-colors ${tt.is_active ? 'text-[#16a34a] hover:text-[#0f0f0f]' : 'text-[#a3a3a3] hover:text-[#0f0f0f]'}`}
                >
                  {tt.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
              </div>
            </div>
          ))}
          {types.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-[#a3a3a3]">Sin tipos de tarea</div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-[#0f0f0f]">{editType ? 'Editar Tipo' : 'Nuevo Tipo de Tarea'}</h2>
            <TaskTypeForm type={editType} onSaved={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function TaskTypeForm({ type, onSaved, onClose }) {
  const [name, setName] = useState(type?.name || '');
  const [sortOrder, setSortOrder] = useState(type?.sort_order || 0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (type) {
        await api.put(`/task-types/${type.id}`, { name, sort_order: sortOrder });
      } else {
        await api.post('/task-types', { name });
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
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="text-sm text-[#dc2626] border border-[#fecaca] bg-[#fff5f5] px-3 py-2 rounded">{error}</div>
      )}
      <div>
        <label className={labelCls}>Nombre</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} required />
      </div>
      {type && (
        <div>
          <label className={labelCls}>Orden</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} className={inputCls} />
        </div>
      )}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[#e5e5e5] rounded text-sm text-[#6b6b6b] hover:bg-[#f5f5f5]">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white rounded text-sm font-medium disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
