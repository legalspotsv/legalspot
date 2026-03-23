import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import { Download, Plus, Check, ChevronDown, ChevronRight, Pencil, X } from 'lucide-react';

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [tab, setTab] = useState('main'); // 'main' | 'documents'

  useEffect(() => {
    api.get(`/clients/${id}`).then(res => setClient(res.data.client)).catch(console.error);
  }, [id]);

  if (!client) return <div className="text-sm text-[#a3a3a3]">Cargando...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
              client.billing_type === 'process' ? 'bg-[#f0f4ff] text-[#3730a3]' : 'bg-[#f5f5f5] text-[#6b6b6b]'
            }`}>
              {client.billing_type === 'process' ? 'Por Proceso' : client.has_fixed_fee ? 'Fee + Horas' : 'Por Hora'}
            </span>
            {client.assigned_lawyer_name && (
              <span className="text-sm text-[#6b6b6b]">· {client.assigned_lawyer_name}</span>
            )}
          </div>
        </div>
        {client.billing_type === 'hourly' && (
          <div className="flex items-center gap-2">
            <a href={`/api/reports/statement/${id}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 border border-[#e5e5e5] bg-white hover:bg-[#f5f5f5] text-sm rounded transition-colors">
              <Download size={13} /> Estado de cuenta
            </a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[#e5e5e5]">
        {[
          { key: 'main', label: client.billing_type === 'process' ? 'Procesos' : 'Tareas' },
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
        <>
          {client.billing_type === 'process'
            ? <ProcessView clientId={id} />
            : <HourlyView clientId={id} client={client} />
          }
        </>
      )}

      {tab === 'documents' && <DocumentsView clientId={id} />}
    </div>
  );
}

/* ─── Vista Horas / Fee ─── */
function HourlyView({ clientId, client }) {
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [billing, setBilling] = useState([]);
  const [period, setPeriod] = useState(() => new Date().toISOString().substring(0, 7));

  useEffect(() => {
    api.get(`/billing/${clientId}`).then(res => setBilling(res.data.billing_records)).catch(console.error);
  }, [clientId]);

  useEffect(() => {
    api.get(`/clients/${clientId}/summary`, { params: { period } }).then(res => setSummary(res.data.summary)).catch(console.error);
    api.get('/tasks', { params: { client_id: clientId, period } }).then(res => setTasks(res.data.tasks)).catch(console.error);
  }, [clientId, period]);

  const pct = summary?.porcentaje_consumido ?? 0;
  const barColor = pct > 100 ? '#dc2626' : pct > 80 ? '#b45309' : '#0f0f0f';

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#6b6b6b]">Período</span>
        <div className="flex items-center gap-2">
          <input
            type="month" value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-1.5 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f]"
          />
          <a href={`/api/reports/monthly/${clientId}/${period}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e5e5] bg-white hover:bg-[#f5f5f5] text-sm rounded transition-colors">
            <Download size={13} /> Informe
          </a>
        </div>
      </div>

      {/* Stat cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Horas consumidas" value={`${summary.consumo_horas}h`} sub={summary.horas_incluidas ? `de ${summary.horas_incluidas}h incluidas` : null} />
          <StatCard label="Consumido" value={`$${summary.consumo_usd?.toFixed(2)}`} />
          {summary.has_fixed_fee && (
            <>
              <StatCard label="Disponible" value={`$${summary.disponible_usd?.toFixed(2)}`} danger={summary.disponible_usd < 0} />
              <StatCard label="Excedente" value={`$${summary.excedente?.toFixed(2)}`} danger={summary.excedente > 0} success={summary.excedente <= 0} />
            </>
          )}
        </div>
      )}

      {/* Progress bar */}
      {pct != null && summary?.has_fixed_fee && (
        <div className="bg-white border border-[#e5e5e5] rounded p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#6b6b6b]">Consumo del mes</span>
            <span className="font-medium tabular-nums">{pct}%</span>
          </div>
          <div className="w-full bg-[#f0f0f0] h-1">
            <div className="h-1 transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }} />
          </div>
        </div>
      )}

      {/* Tasks table */}
      <div className="bg-white border border-[#e5e5e5] rounded">
        <div className="px-5 py-3 border-b border-[#e5e5e5]">
          <h2 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Tareas del Período</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Abogado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Horas</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Monto</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} className="border-b border-[#f0f0f0]">
                  <td className="px-4 py-3 text-[#6b6b6b] tabular-nums">{t.date}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{t.lawyer_name}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{t.task_type}</td>
                  <td className="px-4 py-3 text-[#6b6b6b] max-w-[240px] truncate">{t.description}</td>
                  <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">{t.time_tenths}h</td>
                  <td className="px-4 py-3 text-right font-medium text-[#0f0f0f] tabular-nums">${t.amount?.toFixed(2)}</td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-[#a3a3a3]">Sin tareas en este período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing history */}
      <div className="bg-white border border-[#e5e5e5] rounded">
        <div className="px-5 py-3 border-b border-[#e5e5e5]">
          <h2 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Historial de Facturación</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Período</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Fee</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Excedente</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Pagado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {billing.map(b => (
                <tr key={b.id} className="border-b border-[#f0f0f0]">
                  <td className="px-4 py-3 font-medium tabular-nums">{b.period}</td>
                  <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">${b.fixed_fee?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">${b.excess_amount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">${b.total_invoiced?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">${b.amount_paid?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={b.payment_status} />
                  </td>
                </tr>
              ))}
              {billing.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-[#a3a3a3]">Sin registros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Vista Proceso ─── */
function ProcessView({ clientId }) {
  const [processes, setProcesses] = useState([]);
  const [showNewProcess, setShowNewProcess] = useState(false);
  const [expanded, setExpanded] = useState({});

  const load = () => {
    api.get('/processes', { params: { client_id: clientId } })
      .then(res => setProcesses(res.data.processes))
      .catch(console.error);
  };

  useEffect(() => { load(); }, [clientId]);

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#6b6b6b]">{processes.length} proceso{processes.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setShowNewProcess(true)}
          className="flex items-center gap-1.5 bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white px-3 py-2 text-sm font-medium rounded transition-colors"
        >
          <Plus size={13} /> Nuevo Proceso
        </button>
      </div>

      {processes.length === 0 && (
        <div className="bg-white border border-[#e5e5e5] rounded px-5 py-12 text-center text-sm text-[#a3a3a3]">
          Sin procesos activos
        </div>
      )}

      {processes.map(p => (
        <div key={p.id} className="bg-white border border-[#e5e5e5] rounded">
          {/* Process header */}
          <div
            className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#fafafa] transition-colors"
            onClick={() => toggle(p.id)}
          >
            {expanded[p.id] ? <ChevronDown size={15} className="text-[#a3a3a3]" /> : <ChevronRight size={15} className="text-[#a3a3a3]" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#0f0f0f]">{p.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${p.status === 'active' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#f5f5f5] text-[#a3a3a3]'}`}>
                  {p.status === 'active' ? 'Activo' : 'Cerrado'}
                </span>
              </div>
              {p.description && <p className="text-xs text-[#a3a3a3] mt-0.5 truncate">{p.description}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium tabular-nums">{p.milestones?.filter(m => m.completed_at).length}/{p.milestones?.length} hitos</p>
              {p.fixed_amount > 0 && <p className="text-xs text-[#a3a3a3] tabular-nums">${p.fixed_amount?.toFixed(2)}</p>}
            </div>
          </div>

          {/* Milestones */}
          {expanded[p.id] && (
            <div className="border-t border-[#f0f0f0] px-5 py-4 space-y-3">
              <MilestonesList process={p} onRefresh={load} />
            </div>
          )}
        </div>
      ))}

      {showNewProcess && (
        <ProcessFormModal
          clientId={clientId}
          onClose={() => setShowNewProcess(false)}
          onSaved={() => { setShowNewProcess(false); load(); }}
        />
      )}
    </div>
  );
}

function MilestonesList({ process, onRefresh }) {
  const [showNewMilestone, setShowNewMilestone] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const toggleComplete = async (m) => {
    try {
      await api.put(`/processes/milestones/${m.id}`, { completed: !m.completed_at });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const addMilestone = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/processes/${process.id}/milestones`, form);
      setForm({ title: '', description: '' });
      setShowNewMilestone(false);
      onRefresh();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const inputCls = 'w-full px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f] transition-colors';

  return (
    <div className="space-y-2">
      {process.milestones?.map(m => (
        <div key={m.id} className="flex items-start gap-3 py-2">
          <button
            onClick={() => toggleComplete(m)}
            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
              m.completed_at ? 'bg-[#0f0f0f] border-[#0f0f0f]' : 'border-[#d4d4d4] hover:border-[#0f0f0f]'
            }`}
          >
            {m.completed_at && <Check size={11} className="text-white" />}
          </button>
          <div className="flex-1">
            <p className={`text-sm ${m.completed_at ? 'line-through text-[#a3a3a3]' : 'text-[#0f0f0f]'}`}>{m.title}</p>
            {m.description && <p className="text-xs text-[#a3a3a3] mt-0.5">{m.description}</p>}
            {m.completed_at && (
              <p className="text-xs text-[#a3a3a3] mt-0.5">Completado {new Date(m.completed_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      ))}

      {process.milestones?.length === 0 && !showNewMilestone && (
        <p className="text-xs text-[#a3a3a3]">Sin hitos registrados</p>
      )}

      {showNewMilestone ? (
        <form onSubmit={addMilestone} className="space-y-2 pt-2 border-t border-[#f0f0f0]">
          <input
            type="text" placeholder="Título del hito" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className={inputCls} required autoFocus
          />
          <input
            type="text" placeholder="Descripción (opcional)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className={inputCls}
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowNewMilestone(false)} className="px-3 py-1.5 border border-[#e5e5e5] text-sm text-[#6b6b6b] rounded hover:bg-[#f5f5f5] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-3 py-1.5 bg-[#0f0f0f] text-white text-sm rounded disabled:opacity-50 transition-colors">
              Agregar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowNewMilestone(true)}
          className="flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-[#0f0f0f] mt-1 transition-colors"
        >
          <Plus size={12} /> Agregar hito
        </button>
      )}
    </div>
  );
}

function ProcessFormModal({ clientId, process, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: process?.name || '',
    description: process?.description || '',
    fixed_amount: process?.fixed_amount || 0,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (process) {
        await api.put(`/processes/${process.id}`, form);
      } else {
        await api.post('/processes', { ...form, client_id: clientId });
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
      <div className="bg-white rounded w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold">{process ? 'Editar Proceso' : 'Nuevo Proceso'}</h2>
        {error && <div className="text-sm text-[#dc2626] border border-[#fecaca] bg-[#fff5f5] px-3 py-2 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelCls}>Nombre del proceso</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} required placeholder="Ej: Divorcio por mutuo consentimiento" />
          </div>
          <div>
            <label className={labelCls}>Descripción</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Honorario fijo (USD)</label>
            <input type="number" step="0.01" value={form.fixed_amount} onChange={e => setForm(f => ({ ...f, fixed_amount: parseFloat(e.target.value) || 0 }))} className={inputCls} />
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

/* ─── Vista Documentos ─── */
function DocumentsView({ clientId }) {
  const [firmDocs, setFirmDocs] = useState([]);
  const [clientDocs, setClientDocs] = useState([]);
  const [showForm, setShowForm] = useState(null); // 'firm' | 'client'

  const load = () => {
    api.get('/documents', { params: { client_id: clientId, cloud_type: 'firm' } })
      .then(res => setFirmDocs(res.data.documents)).catch(console.error);
    api.get('/documents', { params: { client_id: clientId, cloud_type: 'client' } })
      .then(res => setClientDocs(res.data.documents)).catch(console.error);
  };

  useEffect(() => { load(); }, [clientId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CloudSection
        title="Nube del Bufete"
        docs={firmDocs}
        cloudType="firm"
        clientId={clientId}
        onAdd={() => setShowForm('firm')}
        onRefresh={load}
      />
      <CloudSection
        title="Nube del Cliente"
        docs={clientDocs}
        cloudType="client"
        clientId={clientId}
        onAdd={() => setShowForm('client')}
        onRefresh={load}
        readOnly
      />
      {showForm && (
        <DocumentFormModal
          clientId={clientId}
          cloudType={showForm}
          onClose={() => setShowForm(null)}
          onSaved={() => { setShowForm(null); load(); }}
        />
      )}
    </div>
  );
}

function CloudSection({ title, docs, cloudType, clientId, onAdd, onRefresh, readOnly }) {
  const handleDelete = async (docId) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      onRefresh();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-white border border-[#e5e5e5] rounded">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e5e5]">
        <h3 className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">{title}</h3>
        {!readOnly && (
          <button onClick={onAdd} className="flex items-center gap-1 text-xs text-[#6b6b6b] hover:text-[#0f0f0f] transition-colors">
            <Plus size={12} /> Agregar
          </button>
        )}
      </div>
      <div className="divide-y divide-[#f0f0f0]">
        {docs.map(d => (
          <div key={d.id} className="flex items-center justify-between px-5 py-3">
            <div className="min-w-0 flex-1">
              <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-[#0f0f0f] hover:underline truncate block">
                {d.name}
              </a>
              {d.description && <p className="text-xs text-[#a3a3a3] truncate">{d.description}</p>}
              <p className="text-xs text-[#d4d4d4]">{d.uploaded_by_name} · {new Date(d.created_at).toLocaleDateString()}</p>
            </div>
            {!readOnly && (
              <button onClick={() => handleDelete(d.id)} className="ml-3 text-[#d4d4d4] hover:text-[#dc2626] transition-colors shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        {docs.length === 0 && (
          <p className="px-5 py-8 text-center text-xs text-[#a3a3a3]">Sin documentos</p>
        )}
      </div>
    </div>
  );
}

function DocumentFormModal({ clientId, cloudType, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', file_url: '', cloud_type: cloudType });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/documents', { ...form, client_id: clientId });
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
      <div className="bg-white rounded w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold">Agregar Documento</h2>
        <p className="text-xs text-[#a3a3a3]">Nube: {cloudType === 'firm' ? 'Bufete' : 'Cliente'}</p>
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

/* ─── Shared components ─── */
function StatCard({ label, value, sub, danger, success }) {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded p-4">
      <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${danger ? 'text-[#dc2626]' : success ? 'text-[#16a34a]' : 'text-[#0f0f0f]'}`}>{value}</p>
      {sub && <p className="text-xs text-[#a3a3a3] mt-1">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    paid: { label: 'Pagado', cls: 'bg-[#f0fdf4] text-[#16a34a]' },
    pending: { label: 'Pendiente', cls: 'bg-[#fff5f5] text-[#dc2626]' },
    partial: { label: 'Parcial', cls: 'bg-[#fffbeb] text-[#b45309]' },
  };
  const s = map[status] || map.pending;
  return <span className={`inline-block text-xs px-2 py-0.5 rounded ${s.cls}`}>{s.label}</span>;
}
