import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { RESTAURANT_THEMES } from '../utils/themes';

function BrowseRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const navigate = useNavigate();
  const { t } = useTheme();

  useEffect(() => {
    API.get('/restaurants')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setRestaurants(res.data);
        } else {
          setError('Unexpected response from server.');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to fetch restaurants.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const cuisines = useMemo(() => {
    if (!Array.isArray(restaurants)) return ['All'];
    return ['All', ...new Set(restaurants.map((r) => r.cuisine_type).filter(Boolean))];
  }, [restaurants]);

  const cities = useMemo(() => {
    if (!Array.isArray(restaurants)) return ['All'];
    return ['All', ...new Set(restaurants.map((r) => r.city).filter(Boolean))];
  }, [restaurants]);

  const filtered = useMemo(() => {
    if (!Array.isArray(restaurants)) return [];
    let list = [...restaurants].filter((r) => {
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase());
      const matchCuisine = cuisineFilter === 'All' || r.cuisine_type === cuisineFilter;
      const matchCity = cityFilter === 'All' || r.city === cityFilter;
      return matchSearch && matchCuisine && matchCity;
    });
    if (sortBy === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [restaurants, search, cuisineFilter, cityFilter, sortBy]);

  return (
    <div className={`min-h-screen ${t.bg} p-6 md:p-8 transition-colors duration-500`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className={`text-3xl font-extrabold ${t.text}`}>Discover Restaurants</h2>
          <p className={`${t.muted} mt-1`}>Find your perfect dining spot from {restaurants.length} venues</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 mb-8 flex justify-between items-center">
            <div>
              <p className="font-bold">Error Loading Restaurants</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button
              onClick={() => {
                setError('');
                setLoading(true);
                API.get('/restaurants')
                  .then((res) => {
                    if (Array.isArray(res.data)) {
                      setRestaurants(res.data);
                    } else {
                      setError('Unexpected response from server.');
                    }
                  })
                  .catch((err) => {
                    setError(err.response?.data?.message || err.message || 'Failed to fetch restaurants.');
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
            >
              🔄 Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`${t.card} rounded-2xl h-80 animate-pulse flex flex-col justify-between p-5`}>
                <div className="h-28 bg-slate-400/20 rounded-xl w-full mb-4"></div>
                <div className="h-6 bg-slate-400/20 rounded-xl w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-400/20 rounded-xl w-1/2 mb-4"></div>
                <div className="h-10 bg-slate-400/20 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className={`${t.card} rounded-2xl p-4 mb-8 flex flex-wrap gap-3 items-center`}>
              <input
                type="text"
                placeholder="🔍 Search restaurants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`flex-1 min-w-[200px] p-2.5 rounded-xl border ${t.input}`}
              />
              <select value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)} className={`p-2.5 rounded-xl border ${t.input}`}>
                {cuisines.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Cuisines' : c}</option>)}
              </select>
              <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={`p-2.5 rounded-xl border ${t.input}`}>
                {cities.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Cities' : c}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`p-2.5 rounded-xl border ${t.input}`}>
                <option value="rating">Top Rated</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((r) => {
            const gradient = RESTAURANT_THEMES[r.theme_color] || RESTAURANT_THEMES.ocean;
            return (
              <div
                key={r.id}
                className={`${t.card} rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group`}
              >
                <div className={`h-32 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                  <span className="text-6xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{r.emoji || '🍽️'}</span>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold text-amber-600 flex items-center gap-1">
                    ⭐ {parseFloat(r.rating || 4.5).toFixed(1)}
                  </div>
                  <div className="absolute top-3 left-3 bg-black/30 backdrop-blur px-2 py-1 rounded-full text-xs font-semibold text-white">
                    {r.price_range || '$$'}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-lg font-bold ${t.text}`}>{r.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${gradient} text-white font-medium shrink-0`}>
                      {r.cuisine_type || 'International'}
                    </span>
                  </div>
                  <p className={`text-sm ${t.muted} mt-1`}>📍 {r.city}</p>
                  <p className={`text-sm ${t.text} mt-2 line-clamp-2 opacity-80`}>{r.description}</p>
                  <p className={`text-xs ${t.muted} mt-3`}>
                    🕐 {r.opening_time?.slice(0, 5)} – {r.closing_time?.slice(0, 5)}
                  </p>
                  <button
                    onClick={() => navigate(`/book/${r.id}`)}
                    className={`w-full mt-4 py-2.5 rounded-xl text-white font-semibold bg-gradient-to-r ${gradient} hover:opacity-90 transition-opacity shadow-md`}
                  >
                    Book a Table →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className={`text-center py-16 ${t.muted}`}>
            <p className="text-4xl mb-3">🍽️</p>
            <p>No restaurants match your filters.</p>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

export default BrowseRestaurants;
