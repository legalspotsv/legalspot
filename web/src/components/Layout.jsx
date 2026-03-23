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
    <div className="min-h-screen bg-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[220px] bg-white border-r border-[#e5e5e5] flex flex-col transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-[#e5e5e5]">
          <div className="w-7 h-7 bg-[#0f0f0f] flex items-center justify-center text-white text-xs font-bold tracking-tight">LS</div>
          <span className="font-semibold text-[#0f0f0f] tracking-tight">LegalSpot</span>
          <button className="lg:hidden ml-auto text-[#6b6b6b] hover:text-[#0f0f0f]" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-[#e5e5e5]">
          <p className="text-sm font-medium text-[#0f0f0f] truncate">{user?.name}</p>
          <p className="text-xs text-[#a3a3a3] mt-0.5">{roleLabel}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 text-sm transition-colors rounded ${
                  isActive
                    ? 'bg-[#f5f5f5] text-[#0f0f0f] font-medium'
                    : 'text-[#6b6b6b] hover:bg-[#f5f5f5] hover:text-[#0f0f0f]'
                }`
              }
            >
              <Icon size={15} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-[#e5e5e5]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 w-full text-sm text-[#6b6b6b] hover:bg-[#f5f5f5] hover:text-[#0f0f0f] transition-colors rounded"
          >
            <LogOut size={15} strokeWidth={1.75} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile header */}
        <header className="bg-white border-b border-[#e5e5e5] px-4 h-14 lg:hidden flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-[#6b6b6b] hover:text-[#0f0f0f]">
            <Menu size={20} />
          </button>
          <div className="w-6 h-6 bg-[#0f0f0f] flex items-center justify-center text-white text-xs font-bold">LS</div>
          <span className="font-semibold text-[#0f0f0f] text-sm tracking-tight">LegalSpot</span>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto bg-[#fafafa]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
