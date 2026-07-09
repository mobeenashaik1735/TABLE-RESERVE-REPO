import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import QrCodeDisplay from '../components/QrCodeDisplay';

const STATUS_STYLE = {
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  waiting: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  notified: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  checked_in: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
};

function formatStatus(s) {
  const map = { confirmed: 'Confirmed', waiting: 'Waiting', notified: 'Table Available', checked_in: 'Checked In', completed: 'Completed', cancelled: 'Cancelled' };
  return map[s] || s;
}

function MyReservations() {
  const [bookings, setBookings] = useState([]);
  const [expandedQr, setExpandedQr] = useState(null);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useTheme();

  const fetchBookings = async () => {
    if (!user || !user.id) return;
    const res = await API.get(`/bookings/user/${user.id}`);
    setBookings(res.data);
  };

  useEffect(() => {
    setTimeout(() => {
      fetchBookings();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const confirmedId = searchParams.get('confirmed');
    if (confirmedId) {
      setTimeout(() => {
        setExpandedQr(parseInt(confirmedId, 10));
      }, 0);
    }
  }, [searchParams]);

  const cancelBooking = async (b) => {
    if (b.booking_type === 'waitlist') {
      await API.put(`/waitlist/${b.waitlist_id}/cancel`);
    } else {
      await API.put(`/reservations/${b.reservation_id}/cancel`);
    }
    setTimeout(() => {
      fetchBookings();
    }, 0);
  };

  const active = bookings.filter((b) => !['cancelled', 'completed'].includes(b.booking_status));

  return (
    <div className={`min-h-screen ${t.bg} p-6 md:p-8`}>
      <div className={`max-w-3xl mx-auto ${t.card} p-8 rounded-2xl shadow-xl`}>
        <h2 className={`text-2xl font-bold mb-1 ${t.text}`}>My Bookings</h2>
        <p className={`${t.muted} text-sm mb-6`}>{active.length} active booking(s)</p>

        {searchParams.get('confirmed') && (
          <div className="bg-emerald-500/10 text-emerald-600 px-4 py-3 rounded-xl mb-4 text-sm">
            🎉 Reservation confirmed and added to My Bookings!
          </div>
        )}

        {bookings.length === 0 && (
          <div className={`text-center py-12 ${t.muted}`}>
            <p className="text-4xl mb-2">📋</p>
            <p>No bookings yet.</p>
            <Link to="/restaurants" className={`${t.link} text-sm mt-2 inline-block`}>Browse restaurants →</Link>
          </div>
        )}

        <ul className="space-y-4">
          {bookings.map((b) => (
            <li key={b.id} className={`border rounded-xl p-5 ${t.card}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-mono ${t.muted}`}>#{b.booking_type === 'waitlist' ? `W-${b.waitlist_id}` : `R-${b.reservation_id}`}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[b.booking_status] || ''}`}>
                      {formatStatus(b.booking_status)}
                    </span>
                  </div>
                  <p className={`font-semibold ${t.text} mt-1`}>{b.emoji} {b.restaurant_name}</p>
                  {b.table_number && (
                    <p className={`text-sm ${t.text}`}>Table {b.table_number} {b.location && `(${b.location})`}</p>
                  )}
                  <div className={`grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm ${t.muted}`}>
                    <span>📅 {String(b.date).slice(0, 10)}</span>
                    <span>🕐 {String(b.time).slice(0, 5)}</span>
                    <span>👥 {b.party_size} guests</span>
                    {b.queue_position && <span>📍 Queue #{b.queue_position}</span>}
                    <span>💳 {b.payment_method}</span>
                    <span>🏷️ {b.payment_type}</span>
                    <span>Status: {b.payment_status}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {b.booking_status === 'notified' && (
                    <Link
                      to={`/book/${b.restaurant_id}?waitlist_id=${b.waitlist_id}&date=${String(b.date).slice(0, 10)}&time=${String(b.time).slice(0, 5)}&party_size=${b.party_size}`}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold text-center"
                    >
                      Confirm & Pay
                    </Link>
                  )}
                  {!['cancelled', 'completed', 'checked_in'].includes(b.booking_status) && (
                    <button
                      type="button"
                      onClick={() => cancelBooking(b)}
                      className="bg-red-500/10 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-500/20"
                    >
                      {b.booking_type === 'waitlist' ? 'Leave Waitlist' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>

              {b.booking_status === 'confirmed' && b.reservation_id && (
                <div className="mt-4">
                  <button type="button" onClick={() => setExpandedQr(expandedQr === b.reservation_id ? null : b.reservation_id)} className={`text-sm ${t.link}`}>
                    {expandedQr === b.reservation_id ? 'Hide QR ▲' : '📱 Show QR Code ▼'}
                  </button>
                  {expandedQr === b.reservation_id && (
                    <div className="mt-3"><QrCodeDisplay reservationId={b.reservation_id} /></div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MyReservations;
