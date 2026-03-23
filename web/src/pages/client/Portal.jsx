import { useState, useEffect } from 'react';
import api from '../../api/client';
import { ChevronRight, ChevronDown, Check, Plus, X } from 'lucide-react';

export default function Portal() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(() => new Date().toISOString().substring(0, 7));
  const [tab, setTab] = useState('main');

  const load = () => {
    api.get('/portal/me', { params: { period } }).then(res => setData(res.data)).catch(console.error);
  };

  useEffect(() => { load(); }, [period]);

  if (!data) return <div className="text-sm text-[#a3a3a3]">Cargando...</div>;

  const isProcess = data.billing_type === 'process';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">Mi Portal</h1>
          <p className="text-sm text-[#6b6b6b] mt-0.5">{data.client_name}</p>
        </div>
        {!isProcess && (
          <input
            type="month" value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f]"
          />
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e5e5]">
        {[
          { key: 'main', label: isProcess ? 'Mis Procesos' : 'Mi Consumo' },
          { key: 'documents', label: 'Documentos' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-[2px] ${
              tab === t.key ? 'border-[#0f0f0f] text-[#0f0f0f]' : 'border-transparent text-[#6b6b6b] hover:text-[#0f0f0f]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'main' && (
        isProcess ? <ProcessClientView processes={data.processes || []} /> : <HourlyClientView data={data} />
      )}

      {tab === 'documents' && (
        <DocumentsClientView
          clientId={null} // client uploads via API using their token
          firmDocs={data.firm_documents || []}
          clientDocs={data.client_documents || []}
          onRefresh={load}
        />
      )}
    </div>
  );
}

/* ─── Vista Horas/Fee ─── */
function HourlyClientView({ data }) {
  const { summary, tasks, invoices } = data;
  const pct = summary?.porcentaje_consumido ?? 0;
  const barColor = pct > 100 ? '#dc2626' : pct > 80 ? '#b45309' : '#0f0f0f';

  return (
    <div className="space-y-6">
      {summary?.has_fixed_fee ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-[#e5e5e5] rounded p-5">
              <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">Horas Consumidas</p>
              <p className="text-3xl font-semibold text-[#0f0f0f] tabular-nums">{summary.consumo_horas}h</p>
              {summary.horas_incluidas && <p className="text-xs text-[#a3a3a3] mt-1">de {summary.horas_incluidas}h incluidas</p>}
            </div>
            <div className="bg-white border border-[#e5e5e5] rounded p-5">
              <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">Horas Disponibles</p>
              <p className={`text-3xl font-semibold tabular-nums ${summary.horas_disponibles < 0 ? 'text-[#dc2626]' : 'text-[#0f0f0f]'}`}>
                {summary.horas_disponibles}h
              </p>
            </div>
          </div>
          <div className="bg-white border border-[#e5e5e5] rounded p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[#6b6b6b]">Consumo del mes</span>
              <span className="font-medium tabular-nums">{pct}%</span>
            </div>
            <div className="w-full bg-[#f0f0f0] h-1">
              <div className="h-1 transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }} />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-[#e5e5e5] rounded p-5">
          <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">Horas este mes</p>
          <p className="text-3xl font-semibold text-[#0f0f0f] tabular-nums">{summary?.consumo_horas}h</p>
        </div>
      )}

      {/* Tareas */}
      <div className="bg-white border border-[#e5e5e5] rounded">
        <div className="px-5 py-3 border-b border-[#e5e5e5]">
          <h2 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Trabajo Realizado</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Horas</th>
              </tr>
            </thead>
            <tbody>
              {tasks?.map((t, i) => (
                <tr key={i} className="border-b border-[#f0f0f0]">
                  <td className="px-4 py-3 text-[#6b6b6b] tabular-nums">{t.date}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{t.task_type}</td>
                  <td className="px-4 py-3 text-[#6b6b6b] max-w-[220px] truncate">{t.description}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{t.time_tenths}h</td>
                </tr>
              ))}
              {(!tasks || tasks.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-[#a3a3a3]">Sin actividad este período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Facturas */}
      <div className="bg-white border border-[#e5e5e5] rounded">
        <div className="px-5 py-3 border-b border-[#e5e5e5]">
          <h2 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Historial de Pagos</h2>
        </div>
        <div className="divide-y divide-[#f0f0f0]">
          {invoices?.map((inv, i) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-medium tabular-nums">{inv.period}</span>
              <div className="flex items-center gap-3">
                {inv.payment_date && <span className="text-xs text-[#a3a3a3]">{inv.payment_date}</span>}
                <span className={`text-xs px-2 py-0.5 rounded ${inv.payment_status === 'paid' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#fff5f5] text-[#dc2626]'}`}>
                  {inv.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
          {(!invoices || invoices.length === 0) && (
            <div className="px-5 py-10 text-center text-sm text-[#a3a3a3]">Sin historial de pagos</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Vista Proceso ─── */
function ProcessClientView({ processes }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const activeProcesses = processes.filter(p => p.status === 'active');
  const closedProcesses = processes.filter(p => p.status === 'closed');

  if (processes.length === 0) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded px-5 py-12 text-center text-sm text-[#a3a3a3]">
        Sin procesos activos
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeProcesses.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-3">Procesos Activos</p>
          <div className="space-y-3">
            {activeProcesses.map(p => <ProcessCard key={p.id} process={p} expanded={expanded[p.id]} onToggle={() => toggle(p.id)} />)}
          </div>
        </div>
      )}
      {closedProcesses.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-3 mt-6">Cerrados</p>
          <div className="space-y-3">
            {closedProcesses.map(p => <ProcessCard key={p.id} process={p} expanded={expanded[p.id]} onToggle={() => toggle(p.id)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ProcessCard({ process, expanded, onToggle }) {
  const completed = process.milestones?.filter(m => m.completed_at).length || 0;
  const total = process.milestones?.length || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white border border-[#e5e5e5] rounded">
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#fafafa] transition-colors" onClick={onToggle}>
        {expanded ? <ChevronDown size={15} className="text-[#a3a3a3]" /> : <ChevronRight size={15} className="text-[#a3a3a3]" />}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#0f0f0f]">{process.name}</p>
          {process.description && <p className="text-xs text-[#a3a3a3] mt-0.5 truncate">{process.description}</p>}
        </div>
        <div className="text-right shrink-0 space-y-1">
          <p className="text-sm font-medium tabular-nums">{completed}/{total} hitos</p>
          {total > 0 && (
            <div className="w-24 bg-[#f0f0f0] h-1">
              <div className="h-1 bg-[#0f0f0f] transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </div>

      {expanded && process.milestones?.length > 0 && (
        <div className="border-t border-[#f0f0f0] px-5 py-4 space-y-3">
          {process.milestones.map(m => (
            <div key={m.id} className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                m.completed_at ? 'bg-[#0f0f0f] border-[#0f0f0f]' : 'border-[#d4d4d4]'
              }`}>
                {m.completed_at && <Check size={11} className="text-white" />}
              </div>
              <div>
                <p className={`text-sm ${m.completed_at ? 'line-through text-[#a3a3a3]' : 'text-[#0f0f0f]'}`}>{m.title}</p>
                {m.description && <p className="text-xs text-[#a3a3a3] mt-0.5">{m.description}</p>}
                {m.completed_at && <p className="text-xs text-[#a3a3a3] mt-0.5">{new Date(m.completed_at).toLocaleDateString()}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Vista Documentos del Cliente ─── */
function DocumentsClientView({ firmDocs, clientDocs, onRefresh }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Nube del Bufete (solo lectura) */}
      <div className="bg-white border border-[#e5e5e5] rounded">
        <div className="px-5 py-3 border-b border-[#e5e5e5]">
          <h3 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Documentos del Bufete</h3>
        </div>
        <div className="divide-y divide-[#f0f0f0]">
          {firmDocs.map(d => (
            <div key={d.id} className="px-5 py-3">
              <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-[#0f0f0f] hover:underline block">
                {d.name}
              </a>
              {d.description && <p className="text-xs text-[#a3a3a3]">{d.description}</p>}
              <p className="text-xs text-[#d4d4d4] mt-0.5">{new Date(d.created_at).toLocaleDateString()}</p>
            </div>
          ))}
          {firmDocs.length === 0 && (
            <p className="px-5 py-8 text-center text-xs text-[#a3a3a3]">Sin documentos del bufete</p>
          )}
        </div>
      </div>

      {/* Mis Documentos */}
      <div className="bg-white border border-[#e5e5e5] rounded">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e5e5]">
          <h3 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Mis Documentos</h3>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-[#0f0f0f] transition-colors">
            <Plus size={12} /> Agregar
          </button>
        </div>
        <div className="divide-y divide-[#f0f0f0]">
          {clientDocs.map(d => (
            <div key={d.id} className="px-5 py-3">
              <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-[#0f0f0f] hover:underline block">
                {d.name}
              </a>
              {d.description && <p className="text-xs text-[#a3a3a3]">{d.description}</p>}
              <p className="text-xs text-[#d4d4d4] mt-0.5">{new Date(d.created_at).toLocaleDateString()}</p>
            </div>
          ))}
          {clientDocs.length === 0 && (
            <p className="px-5 py-8 text-center text-xs text-[#a3a3a3]">Sin documentos subidos</p>
          )}
        </div>
      </div>

      {showForm && (
        <ClientDocFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

function ClientDocFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', file_url: '', cloud_type: 'client' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // El backend determina el client_id desde el token del usuario
      await api.post('/documents', { ...form, client_id: 'me' }); // backend usa req.user.client_id
      onSaved();
    } catch (err) {
      // Workaround: usar el cliente desde el contexto
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f] transition-colors';
  const labelCls = 'block text-xs font-medium text-[#6b6b6b] uppercase tracking-wider mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold">Agregar Documento</h2>
        {error && <div className="text-sm text-[#dc2626] border border-[#fecaca] bg-[#fff5f5] px-3 py-2 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelCls}>Nombre del documento</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>URL del archivo</label>
            <input type="url" value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} className={inputCls} required placeholder="https://drive.google.com/..." />
          </div>
          <div>
            <label className={labelCls}>Descripción (opcional)</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[#e5e5e5] rounded text-sm text-[#6b6b6b] hover:bg-[#f5f5f5] transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#0f0f0f] text-white rounded text-sm font-medium disabled:opacity-50 transition-colors">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
