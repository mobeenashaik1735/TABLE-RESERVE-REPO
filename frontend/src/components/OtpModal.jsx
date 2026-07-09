import { useState } from 'react';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';

function OtpModal({ user, onVerified, onClose }) {
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('send');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { t } = useTheme();

  const sendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/otp/send', { email: user.email, user_id: user.id, purpose: 'booking' });
      setMessage(res.data.message);
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/otp/verify', { email: user.email, otp, user_id: user.id });
      onVerified();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`${t.card} rounded-2xl shadow-2xl p-6 w-full max-w-md`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`text-xl font-bold ${t.text}`}>🔐 OTP Verification</h3>
            <p className={`text-sm ${t.muted} mt-1`}>Verify your identity before confirming the booking</p>
          </div>
          <button type="button" onClick={onClose} className={`text-2xl ${t.muted} hover:opacity-70`}>×</button>
        </div>

        {error && <div className="bg-red-500/10 text-red-600 text-sm px-4 py-2 rounded-xl mb-4">{error}</div>}
        {message && <div className="bg-emerald-500/10 text-emerald-600 text-sm px-4 py-2 rounded-xl mb-4">{message}</div>}

        {step === 'send' ? (
          <div>
            <p className={`text-sm ${t.muted} mb-4`}>
              We&apos;ll send a 6-digit code to <strong>{user.email}</strong>
            </p>
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r ${t.accent} disabled:opacity-50`}
            >
              {loading ? 'Sending...' : 'Send OTP to Email'}
            </button>
          </div>
        ) : (
          <form onSubmit={verifyOtp}>
            <label className={`block text-sm font-medium mb-2 ${t.muted}`}>Enter 6-digit code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className={`w-full p-3 rounded-xl border text-center text-2xl tracking-widest ${t.input} mb-4`}
              maxLength={6}
              required
            />
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className={`w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-50`}
            >
              {loading ? 'Verifying...' : 'Verify & Confirm Booking'}
            </button>
            <button type="button" onClick={sendOtp} className={`w-full mt-2 text-sm ${t.link}`}>
              Resend OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default OtpModal;
