import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

function PaymentMethodModal({ tableInfo, pricing, onConfirm, onClose, loading, confirmed }) {
  const { t } = useTheme();
  const [step, setStep] = useState('method');
  const [method, setMethod] = useState(null);
  const [paymentType, setPaymentType] = useState(null);

  const handleMethodSelect = (m) => {
    setMethod(m);
    setStep('type');
    setPaymentType(null);
  };

  const handleConfirm = () => {
    if (!method || !paymentType) return;
    onConfirm({ paymentMethod: method, paymentType });
  };

  const onlineTypes = [
    { id: 'upi', label: 'UPI', icon: '📱' },
    { id: 'card', label: 'Debit / Credit Card', icon: '💳' },
    { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
  ];

  const restaurantTypes = [
    { id: 'cash', label: 'Cash', icon: '💵' },
    { id: 'upi', label: 'UPI at Counter', icon: '📱' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`${t.card} rounded-2xl shadow-2xl p-6 w-full max-w-md`}>
        {confirmed && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400 text-emerald-700 text-sm font-medium">
            ✅ Reservation confirmed! Your booking is saved in My Bookings.
          </div>
        )}

        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`text-xl font-bold ${t.text}`}>Step 3 — Payment Method</h3>
            {tableInfo && (
              <p className={`text-sm ${t.muted} mt-1`}>
                Table {tableInfo.table_number} · {tableInfo.capacity} seats · ${pricing?.amount || 5} fee
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className={`text-2xl ${t.muted}`}>×</button>
        </div>

        {step === 'method' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleMethodSelect('online')}
              className={`w-full p-4 rounded-xl border-2 text-left hover:border-violet-400 transition-all ${t.surface}`}
            >
              <p className={`font-semibold ${t.text}`}>💳 Pay Online</p>
              <p className={`text-xs ${t.muted}`}>UPI · Card · Net Banking</p>
            </button>
            <button
              type="button"
              onClick={() => handleMethodSelect('pay_at_restaurant')}
              className={`w-full p-4 rounded-xl border-2 text-left hover:border-emerald-400 transition-all ${t.surface}`}
            >
              <p className={`font-semibold ${t.text}`}>🏪 Pay at Restaurant</p>
              <p className={`text-xs ${t.muted}`}>Cash · UPI at counter — confirm now, pay when you arrive</p>
            </button>
          </div>
        )}

        {step === 'type' && (
          <div>
            <button type="button" onClick={() => setStep('method')} className={`text-sm ${t.link} mb-3`}>← Back</button>
            <p className={`text-sm font-medium mb-3 ${t.text}`}>
              {method === 'online' ? 'Select online payment type:' : 'How will you pay at the restaurant?'}
            </p>
            <div className="space-y-2 mb-4">
              {(method === 'online' ? onlineTypes : restaurantTypes).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentType(opt.id)}
                  className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all
                    ${paymentType === opt.id ? 'border-violet-500 bg-violet-500/10' : t.surface}`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className={`font-medium ${t.text}`}>{opt.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!paymentType || loading}
              className={`w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r ${t.accent} disabled:opacity-50`}
            >
              {loading ? 'Processing...' : method === 'online' ? 'Proceed to Payment →' : 'Confirm Reservation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentMethodModal;
