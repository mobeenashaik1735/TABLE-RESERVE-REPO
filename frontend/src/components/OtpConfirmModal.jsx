import { useState } from 'react';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';

function OtpConfirmModal({ reservationId, user, onConfirmed, onClose }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('OTP sent to your email and phone.');
  const { t } = useTheme();

  const resendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await API.post('/otp/send', { reservation_id: reservationId });
      setMessage('New OTP sent to your email and mobile number.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/otp/verify-and-confirm', {
        reservation_id: reservationId,
        otp,
        user_id: user.id,
      });
      onConfirmed(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    }
    setLoading(false);
  };

  return (
    <div className={`${t.card} rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto`}>
      <h3 className={`text-xl font-bold ${t.text} mb-1`}>🔐 Verify OTP to Confirm</h3>
      <p className={`text-sm ${t.muted} mb-4`}>
        Payment received! Enter the 6-digit code sent to <strong>{user.email}</strong>
        {user.phone && <> and <strong>{user.phone}</strong></>}.
        <br />
        <span className="text-xs opacity-70">If email is not configured, check the backend terminal for the OTP code.</span>
      </p>

      {message && <div className="bg-blue-500/10 text-blue-600 text-sm px-4 py-2 rounded-xl mb-4">{message}</div>}
      {error && <div className="bg-red-500/10 text-red-600 text-sm px-4 py-2 rounded-xl mb-4">{error}</div>}

      <form onSubmit={handleVerify}>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className={`w-full p-3 rounded-xl border text-center text-2xl tracking-widest ${t.input} mb-4`}
          maxLength={6}
          required
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-50"
        >
          {loading ? 'Confirming...' : 'Verify OTP & Confirm Reservation'}
        </button>
        <button type="button" onClick={resendOtp} disabled={loading} className={`w-full mt-2 text-sm ${t.link}`}>
          Resend OTP
        </button>
        {onClose && (
          <button type="button" onClick={onClose} className={`w-full mt-2 text-sm ${t.muted}`}>
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}

export default OtpConfirmModal;
