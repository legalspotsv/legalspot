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
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <button onClick={() => { setEditUser(null); setShowForm(true); }} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Rol</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Estado</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-700">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'lawyer' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {roleLabels[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                  <button onClick={() => { setEditUser(u); setShowForm(true); }} className="text-blue-500 hover:text-blue-700 p-1" title="Editar">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => toggleActive(u)} className={`p-1 ${u.is_active ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`} title={u.is_active ? 'Desactivar' : 'Activar'}>
                    {u.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{user ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
        <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" {...(!user ? { required: true, minLength: 6 } : {})} placeholder={user ? 'Sin cambios' : 'Mínimo 6 caracteres'} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="lawyer">Abogado</option>
          <option value="admin">Administrador</option>
          <option value="client">Cliente</option>
        </select>
      </div>
      {form.role === 'client' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente vinculado</label>
          <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
            <option value="">Seleccionar cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
        <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Guardando...' : user ? 'Actualizar' : 'Crear'}</button>
      </div>
    </form>
  );
}
