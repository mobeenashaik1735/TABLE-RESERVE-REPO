import { useTheme } from '../context/ThemeContext';

function ThemeToggle({ compact = false }) {
  const { isDark, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border shadow-sm ${
          isDark
            ? 'bg-slate-800/95 border-slate-700 text-slate-200 hover:bg-slate-700'
            : 'bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span>{isDark ? '☀️' : '🌙'}</span>
        <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border shadow-sm ${
        isDark
          ? 'bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700'
          : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
      }`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
      <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
}

export default ThemeToggle;
