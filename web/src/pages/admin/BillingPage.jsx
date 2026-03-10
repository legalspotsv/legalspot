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
    // Reload
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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>

      <div className="flex flex-wrap items-center gap-3">
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 max-w-md">
          <option value="">Seleccionar cliente</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {selectedClient && (
          <a href={`/api/reports/statement/${selectedClient}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">
            <Download size={16} /> Descargar Estado de Cuenta PDF
          </a>
        )}
      </div>

      {selectedClient && currentPeriod && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-medium text-blue-900">Periodo actual: {currentPeriod.period}</p>
              <p className="text-sm text-blue-700">Consumido: ${currentPeriod.consumo_usd?.toFixed(2)} ({currentPeriod.consumo_horas}h)
                {currentPeriod.excedente > 0 && <span className="text-red-600 font-medium"> — Excedente: ${currentPeriod.excedente?.toFixed(2)}</span>}
              </p>
            </div>
            <button onClick={() => handleClosePeriod(currentPeriod.period)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Cerrar Periodo</button>
          </div>
        </div>
      )}

      {billing.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Periodo</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Tarifa Fija</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Excedentes</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Total Facturado</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Acumulado</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Pagado</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Referencia</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {billing.map(b => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium">{b.period}</td>
                  <td className="px-4 py-3 text-right">${b.fixed_fee?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${b.excess_amount?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium">${b.total_invoiced?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${b.accumulated_total?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${b.amount_paid?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {b.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.invoice_reference || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {b.payment_status !== 'paid' && (
                      <button onClick={() => setShowPayment(b)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Registrar Pago</button>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPayment(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Registrar Pago — {showPayment.period}</h2>
            <p className="text-sm text-gray-500 mb-4">Pendiente: ${(showPayment.total_invoiced - showPayment.amount_paid).toFixed(2)}</p>
            <form onSubmit={handlePayment} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto pagado (USD)</label>
                <input name="amount" type="number" step="0.01" defaultValue={(showPayment.total_invoiced - showPayment.amount_paid).toFixed(2)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de pago</label>
                <input name="date" type="date" defaultValue={new Date().toISOString().substring(0, 10)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia de factura</label>
                <input name="reference" type="text" placeholder="CF330, DTE, etc." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPayment(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Registrar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
