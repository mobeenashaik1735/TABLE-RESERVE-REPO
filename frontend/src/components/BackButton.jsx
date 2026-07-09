import { useNavigate } from 'react-router-dom';

function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)} // Navigates exactly one step back in browser history
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-xl transition-colors shadow-sm mb-4"
    >
      ⬅️ Go Back
    </button>
  );
}

export default BackButton;