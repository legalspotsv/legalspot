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
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">Clientes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white px-3 py-2 text-sm font-medium rounded transition-colors"
        >
          <Plus size={14} /> Nuevo Cliente
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3]" />
        <input
          type="text"
          placeholder="Buscar clientes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f] transition-colors"
        />
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e5e5]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Modalidad</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Fee Mensual</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Tarifa/Hr</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr
                key={c.id}
                className="border-b border-[#f0f0f0] hover:bg-[#fafafa] cursor-pointer"
                onClick={() => navigate(`/admin/clients/${c.id}`)}
              >
                <td className="px-4 py-3 font-medium text-[#0f0f0f]">{c.name}</td>
                <td className="px-4 py-3 text-[#6b6b6b]">{c.has_fixed_fee ? 'Fee Fijo' : 'Por Hora'}</td>
                <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">
                  {c.has_fixed_fee ? `$${c.monthly_fee?.toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">${c.hourly_rate?.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded ${c.is_active ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#f5f5f5] text-[#a3a3a3]'}`}>
                    {c.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#a3a3a3]">Sin clientes</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ClientFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
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

  const inputCls = 'w-full px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f] transition-colors';
  const labelCls = 'block text-xs font-medium text-[#6b6b6b] uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-[#0f0f0f]">{client ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>

        {error && (
          <div className="text-sm text-[#dc2626] border border-[#fecaca] bg-[#fff5f5] px-3 py-2 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelCls}>Nombre del cliente / grupo</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} required />
          </div>

          <div>
            <label className={labelCls}>Nombre del grupo (opcional)</label>
            <input type="text" value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))} className={inputCls} />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="fixed-fee"
              checked={form.has_fixed_fee}
              onChange={e => setForm(f => ({ ...f, has_fixed_fee: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="fixed-fee" className="text-sm text-[#0f0f0f]">Tiene fee mensual fijo</label>
          </div>

          {form.has_fixed_fee && (
            <div>
              <label className={labelCls}>Fee Mensual (USD)</label>
              <input
                type="number"
                step="0.01"
                value={form.monthly_fee}
                onChange={e => setForm(f => ({ ...f, monthly_fee: parseFloat(e.target.value) || 0 }))}
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className={labelCls}>Tarifa por Hora (USD)</label>
            <input
              type="number"
              step="0.01"
              value={form.hourly_rate}
              onChange={e => setForm(f => ({ ...f, hourly_rate: parseFloat(e.target.value) || 0 }))}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Saldo a favor acumulado (USD)</label>
            <input
              type="number"
              step="0.01"
              value={form.carry_forward_balance}
              onChange={e => setForm(f => ({ ...f, carry_forward_balance: parseFloat(e.target.value) || 0 }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Notas internas</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inputCls} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[#e5e5e5] rounded text-sm text-[#6b6b6b] hover:bg-[#f5f5f5] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white rounded text-sm font-medium disabled:opacity-50 transition-colors">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
