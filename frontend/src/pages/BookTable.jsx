import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RESTAURANT_THEMES } from '../utils/themes';
import LiveFloorMap from '../components/LiveFloorMap';
import BookingChatbot from '../components/BookingChatbot';
import WaitlistModal from '../components/WaitlistModal';
import PaymentMethodModal from '../components/PaymentMethodModal';

function PricingBadge({ pricing }) {
  if (!pricing) return null;
  return (
    <div className="rounded-xl p-4 mb-4 border bg-violet-500/10 border-violet-300">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-semibold">💰 Reservation Fee</p>
          <p className="text-xs opacity-70">{pricing.label}</p>
        </div>
        <p className="text-2xl font-bold">${pricing.amount}</p>
      </div>
    </div>
  );
}

function BookTable() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const waitlistId = searchParams.get('waitlist_id');
  const { user } = useAuth();
  const { t } = useTheme();

  const [restaurant, setRestaurant] = useState(null);
  const [form, setForm] = useState({
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
    party_size: searchParams.get('party_size') || '',
  });
  const [availableTables, setAvailableTables] = useState([]);
  const [floorMap, setFloorMap] = useState({ tables: [], summary: {}, legend: {} });
  const [pricing, setPricing] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedTableInfo, setSelectedTableInfo] = useState(null);
  const [confirmedReservationId, setConfirmedReservationId] = useState(null);
  const [checkedAvailability, setCheckedAvailability] = useState(!!searchParams.get('date'));
  const [message, setMessage] = useState(waitlistId ? 'A table is available for you — select your table to confirm!' : '');
  const [error, setError] = useState('');
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [processing, setProcessing] = useState(false);
  const [confirmingTableId, setConfirmingTableId] = useState(null);

  const [recommendationPrefs, setRecommendationPrefs] = useState({
    outdoor: false,
    window: false,
    quiet: false,
    vip: false,
  });

  const recommendedTable = useMemo(() => {
    if (!availableTables || !availableTables.length) return null;
    const partySizeInt = parseInt(form.party_size, 10) || 1;
    
    let bestTable = null;
    let highestScore = -Infinity;

    availableTables.forEach((table) => {
      let score = 0;
      
      const capacityDiff = table.capacity - partySizeInt;
      if (capacityDiff === 0) {
        score += 35;
      } else if (capacityDiff === 1 || capacityDiff === 2) {
        score += 20;
      } else if (capacityDiff > 2) {
        score += 5;
      } else if (capacityDiff < 0) {
        score -= 100;
      }

      const isOutdoorTable = table.table_type === 'outdoor' || 
        /outdoor|terrace|patio|deck|garden/i.test(table.location) || 
        /outdoor|terrace|patio/i.test(table.table_type);
      if (recommendationPrefs.outdoor) {
        if (isOutdoorTable) score += 30;
        else score -= 15;
      }

      const isWindowTable = /window|deck view|river view|lake view|scenic/i.test(table.location);
      if (recommendationPrefs.window) {
        if (isWindowTable) score += 30;
        else score -= 10;
      }

      const isQuietTable = table.table_type === 'private' || 
        /private|quiet|cellar|corner|booth/i.test(table.location) ||
        /private|booth/i.test(table.table_type);
      if (recommendationPrefs.quiet) {
        if (isQuietTable) score += 30;
        else score -= 10;
      }

      if (recommendationPrefs.vip) {
        if (table.is_vip) score += 35;
        else score -= 15;
      }

      if (score > highestScore) {
        highestScore = score;
        bestTable = { ...table, matchScore: score };
      }
    });

    return bestTable;
  }, [availableTables, recommendationPrefs, form.party_size]);

  const fetchFloorMap = useCallback(async () => {
    if (!form.date || !form.time) return;
    const res = await API.get('/features/floor-map', { params: { restaurant_id: restaurantId, date: form.date, time: form.time } });
    setFloorMap(res.data);
  }, [restaurantId, form.date, form.time]);

  const fetchPricing = useCallback(async () => {
    if (!form.date || !form.time) return;
    const res = await API.get('/features/pricing', { params: { date: form.date, time: form.time } });
    setPricing(res.data);
  }, [form.date, form.time]);

  const refreshAvailability = useCallback(async () => {
    if (!form.date || !form.time || !form.party_size) return;
    const res = await API.get('/reservations/available', { params: { ...form, restaurant_id: restaurantId } });
    setAvailableTables(res.data);
  }, [form, restaurantId]);

  useEffect(() => {
    API.get(`/restaurants/${restaurantId}`).then((res) => setRestaurant(res.data));
  }, [restaurantId]);

  useEffect(() => {
    if (checkedAvailability && form.date && form.time && form.party_size) {
      setTimeout(() => {
        refreshAvailability();
        fetchFloorMap();
        fetchPricing();
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedAvailability, form]);

  useEffect(() => {
    const socket = io();
    socket.emit('joinRestaurant', restaurantId);
    const refresh = () => { if (checkedAvailability) refreshAvailability(); fetchFloorMap(); };
    socket.on('tableBooked', refresh);
    socket.on('tableCancelled', refresh);
    socket.on('floorMapUpdate', refresh);
    return () => socket.disconnect();
  }, [restaurantId, checkedAvailability, refreshAvailability, fetchFloorMap]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSelectedTable(null);
    setConfirmedReservationId(null);
    setCheckedAvailability(false);
  };

  const checkAvailability = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setCheckedAvailability(true);
    try {
      const availRes = await API.get('/reservations/available', { params: { ...form, restaurant_id: restaurantId } });
      await Promise.all([fetchFloorMap(), fetchPricing()]);
      setAvailableTables(availRes.data);
      if (availRes.data.length === 0) setError('No tables available for this time.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const confirmTableAndProceed = async (table) => {
    if (table.capacity < parseInt(form.party_size, 10)) {
      setError(`Table ${table.table_number} only seats ${table.capacity}.`);
      return;
    }

    setConfirmingTableId(table.id);
    setProcessing(true);
    setError('');
    setMessage('');

    try {
      const res = await API.post('/bookings/confirm', {
        user_id: user.id,
        table_id: table.id,
        restaurant_id: restaurantId,
        reservation_date: form.date,
        reservation_time: form.time,
        party_size: form.party_size,
        waitlist_id: waitlistId || undefined,
      });

      const reservationId = res.data.reservation?.id;
      if (!reservationId) {
        throw new Error('Reservation was not created. Please try again.');
      }

      setConfirmedReservationId(reservationId);
      setSelectedTable(table.id);
      setSelectedTableInfo(table);
      setMessage('✅ Reservation confirmed! Choose your payment method below.');
      setShowPaymentModal(true);
      refreshAvailability();
      fetchFloorMap();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to confirm reservation. Please try another table.');
    } finally {
      setProcessing(false);
      setConfirmingTableId(null);
    }
  };

  const handlePaymentConfirm = async ({ paymentMethod, paymentType }) => {
    if (!confirmedReservationId) {
      setError('No confirmed reservation found. Please select a table again.');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      await API.post('/bookings/apply-payment', {
        reservation_id: confirmedReservationId,
        payment_method: paymentMethod,
        payment_type: paymentType,
        user_id: user.id,
      });

      if (paymentMethod === 'online') {
        const checkout = await API.post('/payments/create-checkout-session', {
          reservation_id: confirmedReservationId,
          user_email: user.email,
          payment_type: paymentType,
          origin: window.location.origin,
        });

        if (!checkout.data?.url) {
          throw new Error('Payment page could not be loaded. Your reservation is still confirmed — check My Bookings.');
        }
        window.location.href = checkout.data.url;
        return;
      }

      setShowPaymentModal(false);
      navigate(`/my-reservations?confirmed=${confirmedReservationId}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment setup failed. Your reservation is confirmed — you can pay from My Bookings.');
      setProcessing(false);
    }
  };

  const noTablesAvailable = checkedAvailability && availableTables.length === 0;

  return (
    <div className={`min-h-screen ${t.bg} p-6 md:p-8 transition-colors duration-500`}>
      <BookingChatbot restaurantId={restaurantId} onParsed={(p) => setForm({ date: p.date, time: p.time, party_size: String(p.party_size) })} />

      {showWaitlist && (
        <WaitlistModal
          user={user}
          form={form}
          restaurantId={restaurantId}
          onClose={() => setShowWaitlist(false)}
          onSuccess={(data) => {
            setShowWaitlist(false);
            setMessage(data.message);
            navigate('/my-reservations');
          }}
        />
      )}

      {showPaymentModal && (
        <PaymentMethodModal
          tableInfo={selectedTableInfo}
          pricing={pricing}
          confirmed
          onConfirm={handlePaymentConfirm}
          onClose={() => setShowPaymentModal(false)}
          loading={processing}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {restaurant && (
          <div className={`p-4 rounded-xl bg-gradient-to-r ${RESTAURANT_THEMES[restaurant.theme_color] || RESTAURANT_THEMES.ocean} text-white flex items-center gap-4`}>
            <span className="text-4xl">{restaurant.emoji || '🍽️'}</span>
            <div>
              <h2 className="text-xl font-bold">Book at {restaurant.name}</h2>
              <p className="text-sm opacity-90">{restaurant.city} · {restaurant.cuisine_type}</p>
            </div>
          </div>
        )}

        <div className={`${t.card} p-6 rounded-2xl shadow-xl`}>
          <h3 className={`font-semibold mb-4 ${t.text}`}>Step 1 — Select Date & Time</h3>
          <form onSubmit={checkAvailability} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <input type="date" name="date" value={form.date} onChange={handleChange} className={`p-3 rounded-xl border ${t.input}`} required />
            <input type="time" name="time" value={form.time} onChange={handleChange} className={`p-3 rounded-xl border ${t.input}`} required />
            <input type="number" name="party_size" placeholder="Guests" value={form.party_size} onChange={handleChange} className={`p-3 rounded-xl border ${t.input}`} min="1" required />
            <button type="submit" className={`sm:col-span-3 py-3 rounded-xl text-white font-semibold bg-gradient-to-r ${t.accent}`}>
              Check Availability
            </button>
          </form>

          {checkedAvailability && <PricingBadge pricing={pricing} />}
          {error && <p className="text-red-500 mb-4 text-sm font-medium">{error}</p>}
          {message && <p className="text-green-600 mb-4 text-sm font-medium">{message}</p>}

          {noTablesAvailable && (
            <div className={`${t.surface} rounded-xl p-4 border border-yellow-300`}>
              <p className={`font-semibold ${t.text} mb-2`}>No tables available</p>
              <p className={`text-sm ${t.muted} mb-3`}>Join the waitlist — no payment required. You&apos;ll appear in My Bookings with Waiting status.</p>
              <button type="button" onClick={() => setShowWaitlist(true)} className="w-full bg-yellow-500 text-white py-3 rounded-xl font-semibold">
                📋 Join Waitlist
              </button>
            </div>
          )}
        </div>

        {checkedAvailability && availableTables.length > 0 && (
          <div className={`${t.card} p-6 rounded-2xl shadow-xl`}>
            <h3 className={`font-semibold mb-4 ${t.text}`}>Step 2 — Select Your Table</h3>
            <p className={`text-sm ${t.muted} mb-4`}>Selecting a table confirms your reservation immediately. Payment comes next.</p>

            {/* AI Seating Optimizer widget */}
            <div className={`p-5 rounded-2xl border border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50/50 to-fuchsia-50/30 dark:from-violet-950/20 dark:to-fuchsia-950/10 mb-6`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h4 className={`font-bold ${t.text}`}>AI Table Seating Assistant & Optimizer</h4>
                  <p className={`text-xs ${t.muted}`}>Seating algorithms optimize floor plans based on your criteria</p>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {[
                  { key: 'outdoor', label: '🌿 Outdoor', desc: 'Terrace or patio' },
                  { key: 'window', label: '🪟 Window View', desc: 'By the window' },
                  { key: 'quiet', label: '🤫 Quiet Spot', desc: 'Tranquil location' },
                  { key: 'vip', label: '⭐ VIP Booth', desc: 'Premium luxury' },
                ].map((pref) => {
                  const active = recommendationPrefs[pref.key];
                  return (
                    <button
                      key={pref.key}
                      type="button"
                      onClick={() => setRecommendationPrefs({ ...recommendationPrefs, [pref.key]: !active })}
                      className={`p-2.5 rounded-xl border text-left transition-all duration-300 ${
                        active 
                          ? 'border-violet-500 bg-violet-500 text-white shadow-md' 
                          : `${t.surface} ${t.text} border-slate-200 dark:border-slate-700 hover:border-violet-300`
                      }`}
                    >
                      <p className="text-xs font-bold">{pref.label}</p>
                      <p className={`text-[10px] ${active ? 'text-white/80' : t.muted} mt-0.5`}>{pref.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Recommendation output */}
              {recommendedTable ? (
                <div className={`p-4 rounded-xl border border-violet-300 dark:border-violet-700 bg-violet-500/10 dark:bg-violet-950/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-violet-500 text-white px-2 py-0.5 rounded-full">AI Optimal Table Selected</span>
                    <h5 className={`font-bold text-lg ${t.text} mt-1`}>
                      Table T{recommendedTable.table_number} ({recommendedTable.location})
                    </h5>
                    <p className={`text-xs ${t.muted} mt-0.5`}>
                      Capacity: {recommendedTable.capacity} guests · Status: <span className="text-emerald-500 font-semibold">Available</span>
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-full font-medium">
                        📊 Capacity Optimization Score: {Math.max(0, Math.min(100, Math.round(recommendedTable.matchScore + 40)))}/100
                      </span>
                      {recommendedTable.is_vip && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500 text-white rounded-full font-bold">
                          👑 VIP Tier
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => confirmTableAndProceed(recommendedTable)}
                    className="w-full sm:w-auto bg-violet-500 hover:bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
                  >
                    ⚡ Book Table T{recommendedTable.table_number} Instantly
                  </button>
                </div>
              ) : (
                <p className={`text-xs ${t.muted}`}>Select your seating preferences above to see your AI matching score.</p>
              )}
            </div>

            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setActiveTab('map')} className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === 'map' ? 'bg-violet-500 text-white' : t.surface}`}>🗺️ Floor Map</button>
              <button type="button" onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === 'list' ? 'bg-violet-500 text-white' : t.surface}`}>📋 List</button>
            </div>

            {activeTab === 'map' ? (
              <LiveFloorMap tables={floorMap.tables} summary={floorMap.summary} legend={floorMap.legend} onTableClick={confirmTableAndProceed} selectedTableId={selectedTable} />
            ) : (
              <ul className="space-y-3">
                {availableTables.map((table) => (
                  <li key={table.id} className={`flex justify-between items-center border p-4 rounded-xl ${t.card}`}>
                    <div>
                      <span className={`font-semibold ${t.text}`}>Table {table.table_number}</span>
                      <p className={`text-sm ${t.muted}`}>Seats {table.capacity} · {table.location}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => confirmTableAndProceed(table)}
                      disabled={processing}
                      className="bg-violet-500 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                      {confirmingTableId === table.id ? 'Confirming...' : 'Select →'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookTable;
