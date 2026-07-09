import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';

function QrScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        scanner.clear().catch(() => {});
        onScan(decodedText);
      },
      (err) => {
        if (onError) onError(err);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [onScan, onError]);

  return <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />;
}

function QrVerify() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('camera');
  const { t } = useTheme();

  const verify = async (qrCode, doCheckIn = false) => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await API.post('/qr/verify', { qr_code: qrCode.trim(), check_in: doCheckIn });
      setResult(res.data);
      setCode(qrCode.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      if (err.response?.data?.alreadyUsed) {
        setResult(err.response.data);
      }
    }
    setLoading(false);
  };

  const handleScan = (decodedText) => {
    setMode('manual');
    verify(decodedText, false);
  };

  const handleCheckIn = () => {
    if (code || result?.reservation) {
      verify(code || result.reservation.qr_code, true);
    }
  };

  return (
    <div className={`min-h-screen ${t.bg} p-6 md:p-8`}>
      <div className={`max-w-lg mx-auto ${t.card} p-8 rounded-2xl shadow-xl`}>
        <h2 className={`text-2xl font-bold mb-2 ${t.text}`}>📱 QR Check-in Scanner</h2>
        <p className={`text-sm ${t.muted} mb-6`}>Scan customer QR code with camera or enter manually</p>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => { setMode('camera'); setResult(null); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold ${mode === 'camera' ? 'bg-violet-500 text-white' : t.surface}`}
          >
            📷 Camera Scan
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold ${mode === 'manual' ? 'bg-violet-500 text-white' : t.surface}`}
          >
            ⌨️ Manual Entry
          </button>
        </div>

        {mode === 'camera' && !result && (
          <div className="mb-4">
            <QrScanner onScan={handleScan} />
          </div>
        )}

        {mode === 'manual' && (
          <form
            onSubmit={(e) => { e.preventDefault(); verify(code, false); }}
            className="space-y-4 mb-4"
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="TR-123-abc456def789"
              className={`w-full p-3 rounded-xl border font-mono ${t.input}`}
            />
            <button type="submit" disabled={loading} className={`w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r ${t.accent} disabled:opacity-50`}>
              {loading ? 'Verifying...' : 'Verify Reservation'}
            </button>
          </form>
        )}

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {result?.valid && !result.checked_in && (
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-300 mb-4">
            <p className="text-emerald-600 font-bold text-lg mb-3">✅ Valid Reservation</p>
            <div className={`space-y-1 text-sm ${t.text}`}>
              <p><strong>Guest:</strong> {result.reservation.user_name}</p>
              <p><strong>Restaurant:</strong> {result.reservation.restaurant_name}</p>
              <p><strong>Table:</strong> {result.reservation.table_number} ({result.reservation.location})</p>
              <p><strong>Date:</strong> {String(result.reservation.date).slice(0, 10)} at {String(result.reservation.time).slice(0, 5)}</p>
              <p><strong>Party:</strong> {result.reservation.party_size}</p>
            </div>
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Checking in...' : '✓ Mark as Checked In'}
            </button>
          </div>
        )}

        {result?.checked_in && (
          <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-300">
            <p className="text-blue-600 font-bold text-lg">🎉 Checked In Successfully!</p>
            <p className={`text-sm ${t.muted} mt-2`}>
              {result.reservation.user_name} — Table {result.reservation.table_number}
            </p>
          </div>
        )}

        {result?.alreadyUsed && (
          <div className="p-5 rounded-xl bg-red-500/10 border border-red-300">
            <p className="text-red-600 font-bold">⚠️ QR Code Already Used</p>
            <p className={`text-sm ${t.muted} mt-1`}>This QR was scanned at {result.reservation?.checked_in_at ? new Date(result.reservation.checked_in_at).toLocaleString() : 'earlier'}.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default QrVerify;
