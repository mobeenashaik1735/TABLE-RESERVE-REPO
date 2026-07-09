import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const TYPE_LABELS = { upi: 'UPI', card: 'Debit / Credit Card', netbanking: 'Net Banking' };

function MockPayment() {
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservation_id');
  const paymentType = searchParams.get('type') || 'card';
  const navigate = useNavigate();
  const { t } = useTheme();

  // Interactive Payment State
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  // Auto-format helper functions
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const parts = val.match(/.{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      setCardExpiry(`${val.substring(0, 2)}/${val.substring(2)}`);
    } else {
      setCardExpiry(val);
    }
  };

  const handlePay = () => {
    setLoading(true);
    setProgress(10);
  };

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigate(`/payment-success?reservation_id=${reservationId}`, { replace: true });
          }, 300);
          return 100;
        }
        return prev + 15;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [loading, navigate, reservationId]);

  return (
    <div className={`min-h-screen flex items-center justify-center ${t.bg} p-6`}>
      <div className={`${t.card} p-8 rounded-2xl shadow-2xl max-w-md w-full transition-all duration-300`}>
        {loading ? (
          <div className="text-center py-12 space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-violet-200 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-violet-600 animate-spin"></div>
              <span className="absolute inset-0 flex items-center justify-center text-xl">🔒</span>
            </div>
            <div className="space-y-2">
              <h3 className={`text-xl font-bold ${t.text}`}>Processing Payment</h3>
              <p className={`text-sm ${t.muted}`}>Contacting secure gateway...</p>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 font-mono">Secure 256-bit SSL encryption</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-500">Secure Payment Gateway</span>
                <h2 className={`text-2xl font-bold ${t.text}`}>TableReserve Pay</h2>
              </div>
              <span className="text-3xl">💳</span>
            </div>

            {/* Reservation Summary Card */}
            <div className="bg-slate-500/5 border border-slate-500/10 rounded-xl p-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span className={t.muted}>Reservation ID</span>
                <span className={`font-mono font-semibold ${t.text}`}>#TR-{reservationId || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={t.muted}>Selected Channel</span>
                <span className={`font-semibold ${t.text}`}>{TYPE_LABELS[paymentType] || paymentType}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t mt-2">
                <span className={`text-sm font-bold ${t.text}`}>Amount Due</span>
                <span className="text-lg font-extrabold text-violet-600 dark:text-violet-400">$5.00</span>
              </div>
            </div>

            {/* Dynamic UI depending on payment type */}
            {paymentType === 'upi' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-slate-200">
                  <div className="w-40 h-40 bg-slate-100 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 relative">
                    {/* Simulated QR Code using CSS Grid */}
                    <div className="grid grid-cols-4 gap-1 p-2 w-full h-full opacity-80">
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          className={`rounded ${i % 3 === 0 || i % 5 === 1 ? 'bg-slate-800' : 'bg-transparent'}`}
                        ></div>
                      ))}
                    </div>
                    <span className="absolute bg-white px-2 py-0.5 rounded text-[10px] font-bold text-slate-800 shadow">SCAN ME</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-center">Scan QR code using any UPI app to complete booking</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">Or Pay via UPI ID</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="upiId" className={`text-xs font-semibold ${t.muted}`}>Enter UPI ID</label>
                  <input
                    id="upiId"
                    type="text"
                    placeholder="username@okaxis"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className={`w-full p-3 rounded-xl border ${t.input} text-sm focus:ring-2 focus:ring-violet-500`}
                  />
                </div>
              </div>
            )}

            {paymentType === 'card' && (
              <div className="space-y-4">
                {/* Visual Debit Card Mock */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-5 text-white shadow-lg space-y-6 font-mono relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold tracking-widest opacity-80">TableReserve Premium</span>
                    <span className="text-xl italic font-bold">VISA</span>
                  </div>
                  <div className="space-y-3">
                    <div className="text-lg tracking-widest min-h-[28px]">{cardNumber || '•••• •••• •••• ••••'}</div>
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <p className="text-[8px] opacity-60">CARDHOLDER</p>
                        <p className="truncate max-w-[150px] uppercase">{cardName || 'YOUR NAME'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] opacity-60">VALID THRU</p>
                        <p>{cardExpiry || 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label htmlFor="cardName" className={`text-xs font-semibold ${t.muted}`}>Cardholder Name</label>
                    <input
                      id="cardName"
                      type="text"
                      placeholder="Jane Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className={`w-full p-3 rounded-xl border ${t.input} text-sm focus:ring-2 focus:ring-violet-500`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="cardNumber" className={`text-xs font-semibold ${t.muted}`}>Card Number</label>
                    <input
                      id="cardNumber"
                      type="text"
                      placeholder="4111 1111 1111 1111"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className={`w-full p-3 rounded-xl border ${t.input} text-sm focus:ring-2 focus:ring-violet-500`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="cardExpiry" className={`text-xs font-semibold ${t.muted}`}>Expiry Date</label>
                      <input
                        id="cardExpiry"
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className={`w-full p-3 rounded-xl border ${t.input} text-sm focus:ring-2 focus:ring-violet-500`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="cardCvv" className={`text-xs font-semibold ${t.muted}`}>CVV Code</label>
                      <input
                        id="cardCvv"
                        type="password"
                        placeholder="***"
                        maxLength="3"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className={`w-full p-3 rounded-xl border ${t.input} text-sm focus:ring-2 focus:ring-violet-500`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentType === 'netbanking' && (
              <div className="space-y-4">
                <p className={`text-xs font-semibold ${t.muted}`}>Select Your Bank</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'hdfc', label: 'HDFC Bank', logo: '🏦' },
                    { id: 'sbi', label: 'State Bank of India', logo: '🏛️' },
                    { id: 'icici', label: 'ICICI Bank', logo: '🏢' },
                    { id: 'axis', label: 'Axis Bank', logo: '🏬' },
                  ].map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBank(bank.id)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all
                        ${selectedBank === bank.id ? 'border-violet-500 bg-violet-500/10' : t.surface}`}
                    >
                      <span className="text-lg">{bank.logo}</span>
                      <span className={t.text}>{bank.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handlePay}
                disabled={
                  (paymentType === 'upi' && !upiId) ||
                  (paymentType === 'card' && (!cardNumber || !cardExpiry || !cardCvv || !cardName)) ||
                  (paymentType === 'netbanking' && !selectedBank)
                }
                className={`w-full py-3.5 rounded-xl text-white font-bold bg-gradient-to-r ${t.accent} shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}
              >
                Authorize & Pay $5.00
              </button>
              <button
                type="button"
                onClick={() => navigate('/my-reservations')}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold border ${t.muted} border-slate-300 hover:bg-slate-100 transition-colors dark:hover:bg-slate-800`}
              >
                Cancel and Pay Later
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-[10px] text-slate-400">
                🔒 Secured by TableReserve Sandbox Payment Gateway. This is a secure simulation inside the AI Studio container.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MockPayment;
