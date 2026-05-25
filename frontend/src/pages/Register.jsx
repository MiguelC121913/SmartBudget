import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useTranslation();
  const { showError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await register(name, email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      showError(result.error);
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >

        <div className="flex items-center justify-center gap-2 mb-8">
          <Wallet className="w-7 h-7 text-emerald-400" />
          <span className="text-2xl font-bold text-white tracking-tight">SmartBudget</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 shadow-xl shadow-slate-950/50">
          <h2 className="text-xl font-semibold text-white mb-1">{t('auth.register.title')}</h2>
          <p className="text-slate-400 text-sm mb-6">{t('auth.register.subtitle')}</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                {t('auth.register.name')}
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.register.namePlaceholder')}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                {t('auth.register.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.register.emailPlaceholder')}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                {t('auth.register.password')}
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.register.passwordPlaceholder')}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-semibold text-sm transition-all duration-150 active:scale-[0.98] mt-2 hover:shadow-lg hover:shadow-emerald-900/30"
            >
              {loading ? t('auth.register.loading') : t('auth.register.submit')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
