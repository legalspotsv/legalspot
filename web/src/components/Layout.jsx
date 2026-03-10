import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Users, FileText, ClipboardList, CreditCard, Settings, Menu, X, Tag } from 'lucide-react';
import { useState } from 'react';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/tasks', icon: ClipboardList, label: 'Tareas' },
  { to: '/admin/clients', icon: Users, label: 'Clientes' },
  { to: '/admin/billing', icon: CreditCard, label: 'Facturación' },
  { to: '/admin/users', icon: Settings, label: 'Usuarios' },
  { to: '/admin/task-types', icon: Tag, label: 'Tipos de Tarea' },
];

const lawyerNav = [
  { to: '/lawyer', icon: ClipboardList, label: 'Registrar Tarea', end: true },
  { to: '/lawyer/tasks', icon: FileText, label: 'Mis Tareas' },
];

const clientNav = [
  { to: '/portal', icon: LayoutDashboard, label: 'Mi Portal', end: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = user?.role === 'admin' ? adminNav : user?.role === 'lawyer' ? lawyerNav : clientNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = user?.role === 'admin' ? 'Administrador' : user?.role === 'lawyer' ? 'Abogado' : 'Cliente';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-sm">L.</div>
          <span className="font-bold text-gray-900">LegalSpot</span>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{roleLabel}</p>
        </div>

        <nav className="p-4 space-y-1">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full">
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-4 py-3 lg:hidden flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <Menu size={24} />
          </button>
          <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs">L.</div>
          <span className="font-bold text-gray-900 text-sm">LegalSpot</span>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
