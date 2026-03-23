import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Download } from 'lucide-react';

export default function BillingPage() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [billing, setBilling] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [showPayment, setShowPayment] = useState(null);

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data.clients)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedClient) { setBilling([]); return; }
    api.get(`/billing/${selectedClient}`).then(res => {
      setBilling(res.data.billing_records);
      setCurrentPeriod(res.data.current_period);
    }).catch(console.error);
  }, [selectedClient]);

  const handleClosePeriod = async (period) => {
    if (!confirm(`¿Cerrar el periodo ${period}?`)) return;
    await api.post(`/billing/${selectedClient}/close-period`, { period });
    const res = await api.get(`/billing/${selectedClient}`);
    setBilling(res.data.billing_records);
    setCurrentPeriod(res.data.current_period);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    await api.post(`/billing/${selectedClient}/payment`, {
      period: showPayment.period,
      amount_paid: parseFloat(form.get('amount')),
      payment_date: form.get('date'),
      invoice_reference: form.get('reference'),
    });
    setShowPayment(null);
    const res = await api.get(`/billing/${selectedClient}`);
    setBilling(res.data.billing_records);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-[#0f0f0f] tracking-tight">Facturación</h1>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
          className="px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f] flex-1 max-w-sm"
        >
          <option value="">Seleccionar cliente</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {selectedClient && (
          <a
            href={`/api/reports/statement/${selectedClient}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 border border-[#e5e5e5] bg-white hover:bg-[#f5f5f5] text-sm rounded transition-colors"
          >
            <Download size={13} /> Estado de Cuenta PDF
          </a>
        )}
      </div>

      {/* Current period */}
      {selectedClient && currentPeriod && (
        <div className="bg-white border border-[#e5e5e5] rounded p-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider mb-1">Periodo Actual</p>
            <p className="font-medium text-[#0f0f0f]">{currentPeriod.period}</p>
            <p className="text-sm text-[#6b6b6b] mt-0.5">
              ${currentPeriod.consumo_usd?.toFixed(2)} · {currentPeriod.consumo_horas}h
              {currentPeriod.excedente > 0 && (
                <span className="text-[#dc2626] ml-2">· Excedente ${currentPeriod.excedente?.toFixed(2)}</span>
              )}
            </p>
          </div>
          <button
            onClick={() => handleClosePeriod(currentPeriod.period)}
            className="px-3 py-2 bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white text-sm rounded transition-colors"
          >
            Cerrar Periodo
          </button>
        </div>
      )}

      {/* Billing table */}
      {billing.length > 0 && (
        <div className="bg-white border border-[#e5e5e5] rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Periodo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Tarifa Fija</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Excedentes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Acumulado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Pagado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Referencia</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {billing.map(b => (
                <tr key={b.id} className="border-b border-[#f0f0f0]">
                  <td className="px-4 py-3 font-medium text-[#0f0f0f] tabular-nums">{b.period}</td>
                  <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">${b.fixed_fee?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">${b.excess_amount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#0f0f0f] tabular-nums">${b.total_invoiced?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">${b.accumulated_total?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[#6b6b6b] tabular-nums">${b.amount_paid?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded ${b.payment_status === 'paid' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#fff5f5] text-[#dc2626]'}`}>
                      {b.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{b.invoice_reference || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {b.payment_status !== 'paid' && (
                      <button
                        onClick={() => setShowPayment(b)}
                        className="text-xs text-[#0f0f0f] underline underline-offset-2 hover:text-[#6b6b6b]"
                      >
                        Registrar Pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowPayment(null)}>
          <div className="bg-white rounded w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-[#0f0f0f] mb-1">Registrar Pago</h2>
            <p className="text-sm text-[#6b6b6b] mb-4">Periodo {showPayment.period} · Pendiente ${(showPayment.total_invoiced - showPayment.amount_paid).toFixed(2)}</p>

            <form onSubmit={handlePayment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#6b6b6b] uppercase tracking-wider mb-1.5">Monto pagado (USD)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={(showPayment.total_invoiced - showPayment.amount_paid).toFixed(2)}
                  className="w-full px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6b6b] uppercase tracking-wider mb-1.5">Fecha de pago</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={new Date().toISOString().substring(0, 10)}
                  className="w-full px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6b6b] uppercase tracking-wider mb-1.5">Referencia de factura</label>
                <input
                  name="reference"
                  type="text"
                  placeholder="CF330, DTE, etc."
                  className="w-full px-3 py-2 border border-[#e5e5e5] bg-white text-sm rounded focus:outline-none focus:border-[#0f0f0f]"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPayment(null)}
                  className="flex-1 px-4 py-2 border border-[#e5e5e5] rounded text-sm text-[#6b6b6b] hover:bg-[#f5f5f5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white rounded text-sm font-medium"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
