import { useEffect, useState } from 'react';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';

function QrCodeDisplay({ reservationId }) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTheme();

  useEffect(() => {
    if (!reservationId) return;
    API.get(`/qr/${reservationId}`)
      .then((res) => setQr(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reservationId]);

  if (loading) return <p className={`text-sm ${t.muted}`}>Loading QR code...</p>;
  if (!qr) return null;

  return (
    <div className={`${t.surface} rounded-xl p-4 text-center`}>
      <p className={`text-sm font-semibold ${t.text} mb-2`}>📱 Scan at Restaurant</p>
      <img src={qr.qr_image} alt="Reservation QR Code" className="mx-auto rounded-lg border-4 border-white shadow-md" />
      <p className={`text-xs ${t.muted} mt-2 font-mono`}>{qr.qr_code}</p>
      <p className={`text-xs ${t.muted} mt-1`}>
        {qr.reservation.restaurant_name} · Table {qr.reservation.table_number}
      </p>
    </div>
  );
}

export default QrCodeDisplay;
