import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [clients, setClients] = useState([]);

  const load = () => {
    api.get('/users').then(res => setUsers(res.data.users)).catch(console.error);
  };

  useEffect(() => {
    load();
    api.get('/clients').then(res => setClients(res.data.clients)).catch(console.error);
  }, []);

  const toggleActive = async (u) => {
    if (!confirm(`¿${u.is_active ? 'Desactivar' : 'Activar'} a ${u.name}?`)) return;
    await api.put(`/users/${u.id}`, { is_active: !u.is_active });
    load();
  };

  const roleLabels = { admin: 'Administrador', lawyer: 'Abogado', client: 'Cliente' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">Usuarios</h1>
        <button
          onClick={() => { setEditUser(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white px-3 py-2 text-sm font-medium rounded transition-colors"
        >
          <Plus size={14} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e5e5]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Rol</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-[#f0f0f0] hover:bg-[#fafafa]">
                <td className="px-4 py-3 font-medium text-[#0f0f0f]">{u.name}</td>
                <td className="px-4 py-3 text-[#6b6b6b]">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-[#f5f5f5] text-[#6b6b6b]">
                    {roleLabels[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded ${u.is_active ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#f5f5f5] text-[#a3a3a3]'}`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setEditUser(u); setShowForm(true); }}
                      className="p-1.5 text-[#a3a3a3] hover:text-[#0f0f0f] transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      className={`p-1.5 transition-colors ${u.is_active ? 'text-[#16a34a] hover:text-[#0f0f0f]' : 'text-[#a3a3a3] hover:text-[#0f0f0f]'}`}
                    >
                      {u.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-[#0f0f0f]">{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
            <UserForm user={editUser} clients={clients} onSaved={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function UserForm({ user, clients, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'lawyer',
    client_id: user?.client_id || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (user) {
        const updates = { name: form.name, email: form.email, role: form.role, client_id: form.client_id || null };
        if (form.password) updates.password = form.password;
        await api.put(`/users/${user.id}`, updates);
      } else {
        await api.post('/users', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
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
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} required />
      </div>
      <div>
        <label className={labelCls}>Email</label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} required />
      </div>
      <div>
        <label className={labelCls}>{user ? 'Nueva contraseña (vacío = sin cambios)' : 'Contraseña'}</label>
        <input
          type="password"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          className={inputCls}
          {...(!user ? { required: true, minLength: 6 } : {})}
          placeholder={user ? 'Sin cambios' : 'Mínimo 6 caracteres'}
        />
      </div>
      <div>
        <label className={labelCls}>Rol</label>
        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
          <option value="lawyer">Abogado</option>
          <option value="admin">Administrador</option>
          <option value="client">Cliente</option>
        </select>
      </div>
      {form.role === 'client' && (
        <div>
          <label className={labelCls}>Cliente vinculado</label>
          <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className={inputCls} required>
            <option value="">Seleccionar cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[#e5e5e5] rounded text-sm text-[#6b6b6b] hover:bg-[#f5f5f5]">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white rounded text-sm font-medium disabled:opacity-50">
          {saving ? 'Guardando...' : user ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
