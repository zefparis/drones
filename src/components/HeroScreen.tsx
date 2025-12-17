import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Satellite, Shield, Cpu, Clock } from 'lucide-react';

function MetricCard({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white mb-1">
        {value}
      </div>
      <div className="text-xs text-gray-400 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

export function HeroScreen() {
  const { t, i18n } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center gradient-bg overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Main content */}
      <div className="relative z-10 text-center max-w-5xl px-6 py-20">
        {/* Language toggle - top right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute top-8 right-8 flex gap-2"
        >
          <button
            onClick={() => i18n.changeLanguage('en')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              i18n.language === 'en'
                ? 'bg-primary text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => i18n.changeLanguage('fr')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              i18n.language === 'fr'
                ? 'bg-primary text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            FR
          </button>
        </motion.div>

        {/* Company badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-600 rounded-full text-sm text-gray-400">
            <Satellite className="w-4 h-4 text-primary" />
            IA-SOLUTION · Deep Tech Navigation
          </span>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight"
        >
          <span className="text-white">CELESTIAL</span>
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            INTEGRITY SYSTEM
          </span>
        </motion.h1>

        {/* Accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="accent-line mx-auto mb-8"
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          {t('hero.tagline')}
        </motion.p>

        {/* Key metrics row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          <MetricCard value="100%" label="Accuracy" icon={Shield} />
          <MetricCard value="2.3ms" label="Detection" icon={Clock} />
          <MetricCard value="6" label="Sensors" icon={Cpu} />
          <MetricCard value="24/7" label="Operation" icon={Satellite} />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <a href="#problem" className="btn-primary inline-block">
            Discover the Solution
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <span className="text-xs uppercase tracking-wider">{t('hero.scroll')}</span>
          <div className="w-5 h-8 border border-gray-600 rounded-full flex justify-center pt-1.5">
            <motion.div
              animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-1 h-2 bg-gray-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
