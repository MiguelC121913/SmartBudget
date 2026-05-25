import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [backendStatus, setBackendStatus] = useState(null);

  useEffect(() => {
    api
      .get('/')
      .then(() => setBackendStatus('connected'))
      .catch(() => setBackendStatus('disconnected'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <motion.div
        className="text-center max-w-2xl w-full"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="flex items-center justify-center gap-3 mb-4">
          <Wallet className="w-10 h-10 text-emerald-400" />
          <h1 className="text-5xl font-bold tracking-tight text-white">SmartBudget</h1>
        </motion.div>

        <motion.p variants={item} className="text-slate-400 text-lg mb-8">{t('home.subtitle')}</motion.p>

        <motion.div variants={item} className="flex justify-center mb-10">
          {backendStatus === 'connected' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-900/50 text-emerald-400 border border-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {t('home.backendConnected')}
            </span>
          )}
          {backendStatus === 'disconnected' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-900/50 text-red-400 border border-red-700">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              {t('home.backendDisconnected')}
            </span>
          )}
          {backendStatus === null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-slate-700/50 text-slate-400 border border-slate-600">
              {t('home.checking')}
            </span>
          )}
        </motion.div>

        <motion.button
          variants={item}
          type="button"
          onClick={() => navigate('/register')}
          className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-lg transition-all duration-150 active:scale-95 shadow-lg shadow-emerald-900/30 hover:shadow-xl hover:shadow-emerald-900/40"
        >
          {t('home.cta')}
        </motion.button>
      </motion.div>
    </div>
  );
}
