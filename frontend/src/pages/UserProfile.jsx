import { useEffect, useState } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AVATAR_COLORS } from '../utils/themes';

function UserProfile() {
  const { t } = useTheme();
  const { user: storedUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(storedUser);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!storedUser) return;
    API.get(`/auth/profile/${storedUser.id}`)
      .then((res) => {
        setProfile(res.data);
        setEditForm({ name: res.data.name, phone: res.data.phone || '' });
        updateUser(res.data);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedUser?.id, updateUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await API.put(`/auth/profile/${profile.id}`, editForm);
      setProfile((p) => ({ ...p, ...res.data }));
      updateUser(res.data);
      setMessage('Profile updated successfully!');
    } catch {
      setMessage('Failed to update profile.');
    }
    setSaving(false);
  };

  if (!profile) return null;

  const initials = profile.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarClass = AVATAR_COLORS[profile.avatar_color] || AVATAR_COLORS.indigo;

  return (
    <div className={`min-h-screen ${t.bg} p-8 transition-colors duration-500`}>
      <div className="max-w-2xl mx-auto">
        <div className={`${t.card} rounded-2xl shadow-xl overflow-hidden`}>
          <div className="bg-gradient-to-r from-cyan-500 via-violet-500 to-rose-500 p-8 text-white">
            <div className="flex items-center gap-5">
              <div className={`w-20 h-20 rounded-2xl ${avatarClass} flex items-center justify-center text-2xl font-bold ring-4 ring-white/30 shadow-lg`}>
                {initials}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="opacity-90">{profile.email}</p>
                <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-white/20 capitalize font-semibold">
                  {profile.role}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-200/50`}>
                <p className={`text-xs uppercase tracking-wide ${t.muted}`}>Total Bookings</p>
                <p className={`text-3xl font-bold ${t.text}`}>{profile.total_reservations ?? 0}</p>
              </div>
              <div className={`p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-200/50`}>
                <p className={`text-xs uppercase tracking-wide ${t.muted}`}>Member Since</p>
                <p className={`text-lg font-bold ${t.text}`}>
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <h3 className={`font-semibold ${t.text}`}>Edit Profile</h3>
              <div>
                <label className={`block text-sm mb-1 ${t.muted}`}>Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={`w-full p-3 rounded-xl border ${t.input}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${t.muted}`}>Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className={`w-full p-3 rounded-xl border ${t.input}`}
                />
              </div>
              {message && (
                <p className={`text-sm ${message.includes('success') ? 'text-emerald-600' : 'text-red-500'}`}>{message}</p>
              )}
              <button
                type="submit"
                disabled={saving}
                className={`w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r ${t.accent} hover:opacity-90 transition-opacity disabled:opacity-50`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
