import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Plus, Search } from 'lucide-react';

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    api.get('/clients', { params: { search: search || undefined } })
      .then(res => setClients(res.data.clients))
      .catch(console.error);
  };

  useEffect(() => { load(); }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Fee Mensual</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Tarifa/Hora</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/clients/${c.id}`)}>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-700">{c.has_fixed_fee ? 'Fee Fijo' : 'Por Hora'}</td>
                <td className="px-4 py-3 text-right text-gray-900">{c.has_fixed_fee ? `$${c.monthly_fee?.toFixed(2)}` : '—'}</td>
                <td className="px-4 py-3 text-right text-gray-900">${c.hourly_rate?.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <ClientFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function ClientFormModal({ client, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: client?.name || '',
    group_name: client?.group_name || '',
    has_fixed_fee: client?.has_fixed_fee ?? true,
    monthly_fee: client?.monthly_fee || 0,
    hourly_rate: client?.hourly_rate || 175,
    carry_forward_balance: client?.carry_forward_balance || 0,
    notes: client?.notes || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (client) {
        await api.put(`/clients/${client.id}`, form);
      } else {
        await api.post('/clients', form);
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
        <h2 className="text-lg font-bold text-gray-900">{client ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del cliente / grupo</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del grupo (opcional)</label>
            <input type="text" value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">¿Tiene fee mensual fijo?</label>
            <input type="checkbox" checked={form.has_fixed_fee} onChange={e => setForm(f => ({ ...f, has_fixed_fee: e.target.checked }))} className="rounded" />
          </div>
          {form.has_fixed_fee && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Mensual (USD)</label>
              <input type="number" step="0.01" value={form.monthly_fee} onChange={e => setForm(f => ({ ...f, monthly_fee: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa por Hora (USD)</label>
            <input type="number" step="0.01" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo a favor acumulado (USD)</label>
            <input type="number" step="0.01" value={form.carry_forward_balance} onChange={e => setForm(f => ({ ...f, carry_forward_balance: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
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
