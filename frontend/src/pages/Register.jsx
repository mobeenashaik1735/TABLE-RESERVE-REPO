import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';
import AuthPageLayout from '../components/AuthPageLayout';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useTheme();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/restaurants', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <AuthPageLayout>
      <div className="mb-8 flex flex-col items-center">
        <Logo size="lg" />
      </div>

      <form onSubmit={handleSubmit} className={`${t.card} p-8 rounded-2xl shadow-2xl`}>
        <h2 className={`text-2xl font-bold mb-2 ${t.text}`}>Create Account</h2>
        <p className={`${t.muted} text-sm mb-6`}>Join TableReserve and start booking tables</p>

        {error && (
          <div className={`${t.error} border px-4 py-3 rounded-xl mb-4 text-sm`}>
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${t.muted}`}>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              className={`w-full p-3 rounded-xl border ${t.input} focus:ring-2 focus:ring-violet-400 focus:outline-none`}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${t.muted}`}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className={`w-full p-3 rounded-xl border ${t.input} focus:ring-2 focus:ring-violet-400 focus:outline-none`}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${t.muted}`}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              className={`w-full p-3 rounded-xl border ${t.input} focus:ring-2 focus:ring-violet-400 focus:outline-none`}
              required
              minLength={6}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full mt-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r ${t.accent} hover:opacity-90 transition-all shadow-lg disabled:opacity-50`}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className={`mt-6 text-center text-sm ${t.muted}`}>
          Already have an account?{' '}
          <Link to="/login" className={`font-semibold ${t.link}`}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthPageLayout>
  );
}

export default Register;
