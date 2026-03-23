import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'lawyer') navigate('/lawyer');
      else navigate('/portal');
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-[360px]">
        {/* Brand */}
        <div className="mb-8">
          <div className="w-9 h-9 bg-[#FF2800] flex items-center justify-center mb-4">
            <span className="text-white font-bold leading-none" style={{ fontSize: '1.6rem' }}>L.</span>
          </div>
          <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">LegalSpot</h1>
          <p className="text-sm text-[#6b6b6b] mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-[#dc2626] border border-[#fecaca] bg-[#fff5f5] px-3 py-2.5 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#e5e5e5] bg-white text-sm text-[#0f0f0f] rounded focus:outline-none focus:border-[#0f0f0f] transition-colors"
              placeholder="nombre@despacho.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#e5e5e5] bg-white text-sm text-[#0f0f0f] rounded focus:outline-none focus:border-[#0f0f0f] transition-colors"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white text-sm font-medium py-2.5 rounded transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
