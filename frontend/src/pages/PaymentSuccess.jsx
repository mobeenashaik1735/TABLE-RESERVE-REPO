import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import QrCodeDisplay from '../components/QrCodeDisplay';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const reservationIdParam = searchParams.get('reservation_id');
  const { t } = useTheme();
  const [step, setStep] = useState('processing');
  const [reservationId, setReservationId] = useState(reservationIdParam);
  const [error, setError] = useState('');

  useEffect(() => {
    const process = async () => {
      try {
        if (sessionId) {
          const res = await API.post('/payments/verify-session', { session_id: sessionId });
          setReservationId(res.data.reservation_id);
        } else if (reservationIdParam) {
          const res = await API.post(`/payments/mock-complete/${reservationIdParam}`);
          setReservationId(res.data.reservation_id || reservationIdParam);
        } else {
          setError('Invalid payment session');
          setStep('error');
          return;
        }
        setStep('done');
      } catch (err) {
        setError(err.response?.data?.message || 'Payment verification failed');
        setStep('error');
      }
    };
    process();
  }, [sessionId, reservationIdParam]);

  if (step === 'processing') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${t.bg} p-6`}>
        <div className={`${t.card} p-8 rounded-2xl text-center`}>
          <p className="text-4xl mb-4 animate-pulse">💳</p>
          <p className={t.text}>Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${t.bg} p-6`}>
        <div className={`${t.card} p-8 rounded-2xl text-center max-w-md`}>
          <p className="text-red-500 mb-4">{error}</p>
          <Link to="/my-reservations" className={t.link}>View My Bookings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${t.bg} p-6`}>
      <div className={`${t.card} p-8 rounded-2xl shadow-xl text-center max-w-md w-full`}>
        <p className="text-5xl mb-2">🎉</p>
        <h2 className="text-2xl font-bold text-emerald-600 mb-1">Payment Successful!</h2>
        <p className={`${t.muted} text-sm mb-6`}>Your reservation is confirmed · See My Bookings</p>
        {reservationId && <QrCodeDisplay reservationId={reservationId} />}
        <Link to="/my-reservations" className={`block w-full mt-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r ${t.accent}`}>
          View My Bookings
        </Link>
      </div>
    </div>
  );
}

export default PaymentSuccess;
