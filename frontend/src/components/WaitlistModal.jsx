import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

function WaitlistModal({ user, form, restaurantId, onClose, onSuccess }) {
  const [guest, setGuest] = useState({
    guest_name: user?.name || '',
    guest_email: user?.email || '',
    guest_phone: user?.phone || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const API = (await import('../api/axios')).default;
      const res = await API.post('/waitlist', {
        user_id: user.id,
        restaurant_id: restaurantId,
        requested_date: form.date,
        requested_time: form.time,
        party_size: form.party_size,
        ...guest,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join waitlist');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`${t.card} rounded-2xl shadow-2xl p-6 w-full max-w-md`}>
        <h3 className={`text-xl font-bold mb-1 ${t.text}`}>📋 Join Waitlist</h3>
        <p className={`text-sm ${t.muted} mb-4`}>No payment required. Appears in My Bookings as <strong>Waiting</strong>.</p>
        <div className={`${t.surface} rounded-xl p-3 mb-4 text-sm ${t.muted}`}>
          📅 {form.date} at {form.time?.slice(0, 5)} · 👥 {form.party_size} guests
        </div>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Full Name" value={guest.guest_name} onChange={(e) => setGuest({ ...guest, guest_name: e.target.value })} className={`w-full p-3 rounded-xl border ${t.input}`} required />
          <input type="email" placeholder="Email" value={guest.guest_email} onChange={(e) => setGuest({ ...guest, guest_email: e.target.value })} className={`w-full p-3 rounded-xl border ${t.input}`} required />
          <input type="tel" placeholder="Phone" value={guest.guest_phone} onChange={(e) => setGuest({ ...guest, guest_phone: e.target.value })} className={`w-full p-3 rounded-xl border ${t.input}`} required />
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-yellow-500 text-white font-semibold disabled:opacity-50">
            {loading ? 'Joining...' : 'Join Waitlist (Free)'}
          </button>
          <button type="button" onClick={onClose} className={`w-full text-sm ${t.muted}`}>Cancel</button>
        </form>
      </div>
    </div>
  );
}

export default WaitlistModal;
