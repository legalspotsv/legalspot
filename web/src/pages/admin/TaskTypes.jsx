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
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Tipos de Tarea</h1>
        <button onClick={() => { setEditType(null); setShowForm(true); }} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Nuevo Tipo
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="divide-y divide-gray-100">
          {types.map(tt => (
            <div key={tt.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${tt.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{tt.name}</span>
                <span className="text-xs text-gray-400">#{tt.sort_order}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditType(tt); setShowForm(true); }} className="text-blue-500 hover:text-blue-700 p-1" title="Editar">
                  <Pencil size={16} />
                </button>
                <button onClick={() => toggleActive(tt)} className={`p-1 ${tt.is_active ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`} title={tt.is_active ? 'Desactivar' : 'Activar'}>
                  {tt.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
              </div>
            </div>
          ))}
          {types.length === 0 && <div className="px-5 py-8 text-center text-gray-500 text-sm">Sin tipos de tarea</div>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">{editType ? 'Editar Tipo' : 'Nuevo Tipo de Tarea'}</h2>
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
      </div>
      {type && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
        <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
}
