import { useState } from 'react';

import { Link } from 'react-router-dom';

import { useTheme } from '../context/ThemeContext';

import { AVATAR_COLORS } from '../utils/themes';



function UserProfileBadge({ user }) {

  const [open, setOpen] = useState(false);

  const { t } = useTheme();

  if (!user) return null;



  const initials = user.name

    ?.split(' ')

    .map((n) => n[0])

    .join('')

    .toUpperCase()

    .slice(0, 2) || '?';



  const avatarClass = AVATAR_COLORS[user.avatar_color] || AVATAR_COLORS.indigo;

  const roleColors = {

    admin: 'bg-red-500/20 text-red-300 border-red-400/30',

    owner: 'bg-amber-500/20 text-amber-200 border-amber-400/30',

    customer: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',

  };



  return (

    <div className="relative">

      <button

        type="button"

        onClick={() => setOpen(!open)}

        className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all"

      >

        <div className={`w-9 h-9 rounded-full ${avatarClass} flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/30`}>

          {initials}

        </div>

        <div className="text-left hidden md:block">

          <p className="text-sm font-semibold leading-tight">{user.name}</p>

          <p className="text-xs opacity-75">{user.email}</p>

        </div>

        <span className="text-xs opacity-60">▾</span>

      </button>



      {open && (

        <>

          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className={`absolute right-0 top-full mt-2 z-50 w-72 ${t.dropdown} rounded-2xl shadow-2xl border overflow-hidden`}>

            <div className="bg-gradient-to-r from-cyan-500 via-violet-500 to-rose-500 p-5 text-white">

              <div className="flex items-center gap-3">

                <div className={`w-14 h-14 rounded-full ${avatarClass} flex items-center justify-center text-white font-bold text-lg ring-4 ring-white/30`}>

                  {initials}

                </div>

                <div>

                  <p className="font-bold text-lg">{user.name}</p>

                  <p className="text-sm opacity-90">{user.email}</p>

                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border capitalize ${roleColors[user.role] || roleColors.customer}`}>

                    {user.role}

                  </span>

                </div>

              </div>

            </div>

            <div className={`p-4 space-y-2 text-sm ${t.muted}`}>

              {user.phone && (

                <p className="flex items-center gap-2">

                  <span>📱</span> {user.phone}

                </p>

              )}

              {user.created_at && (

                <p className="flex items-center gap-2">

                  <span>📅</span> Member since {new Date(user.created_at).toLocaleDateString()}

                </p>

              )}

              <Link

                to="/profile"

                onClick={() => setOpen(false)}

                className={`block w-full text-center mt-3 py-2 rounded-lg bg-gradient-to-r ${t.accent} text-white font-semibold hover:opacity-90 transition-opacity`}

              >

                View Full Profile

              </Link>

            </div>

          </div>

        </>

      )}

    </div>

  );

}



export default UserProfileBadge;

