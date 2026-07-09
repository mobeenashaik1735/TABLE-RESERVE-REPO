import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

function AuthPageLayout({ children }) {
  const { t } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center ${t.bg} p-4 transition-colors duration-500 relative`}>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle compact={false} />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/30 to-violet-400/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-rose-400/30 to-amber-400/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

export default AuthPageLayout;
