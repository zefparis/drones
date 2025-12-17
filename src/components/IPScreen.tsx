import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FileText, Shield, Lightbulb, CheckCircle, Clock, Lock } from 'lucide-react';

function PatentCard({
  number,
  title,
  description,
  delay,
}: {
  number: string;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="card p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded">
          Granted
        </span>
      </div>
      <div className="text-lg font-bold text-primary mb-2">{number}</div>
      <div className="text-sm font-semibold text-white mb-2">{title}</div>
      <div className="text-sm text-gray-400 leading-relaxed">{description}</div>
    </motion.div>
  );
}

function DefensibilityGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90">
        <circle cx="50%" cy="50%" r="60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <motion.circle
          cx="50%"
          cy="50%"
          r="60"
          fill="none"
          stroke="var(--success)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-success">{score}%</div>
        <div className="text-xs text-gray-500">Score</div>
      </div>
    </div>
  );
}

export function IPScreen() {
  const { t } = useTranslation();

  const claims = [
    'Multi-sensor fusion algorithm with ESKF',
    'Cryptographic integrity validation',
    'Byzantine fault-tolerant consensus',
    'Celestial navigation without GPS',
    'Real-time spoofing detection',
    'Passive sensor architecture',
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-dark-900 py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            {t('ip.title')}
          </h2>
          <div className="accent-line mx-auto mb-6" />
          <p className="text-lg text-gray-400">{t('ip.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Patent cards */}
          <PatentCard
            number={t('ip.patent1')}
            title={t('ip.patent1_title')}
            description={t('ip.patent1_desc')}
            delay={0.1}
          />
          <PatentCard
            number={t('ip.patent2')}
            title={t('ip.patent2_title')}
            description={t('ip.patent2_desc')}
            delay={0.15}
          />

          {/* Defensibility gauge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card p-6 flex flex-col items-center justify-center"
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-medium text-gray-400">{t('ip.defensibility')}</h3>
            </div>
            <DefensibilityGauge score={87} />
          </motion.div>
        </div>

        {/* Innovation claims and freedom to operate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">{t('ip.claims')}</h3>
            </div>
            <div className="space-y-3">
              {claims.map((claim, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  <span className="text-sm text-gray-300">{claim}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">{t('ip.freedom')}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-dark-600">
                <span className="text-sm text-gray-400">Prior Art Analysis</span>
                <span className="text-success text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Clear
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-dark-600">
                <span className="text-sm text-gray-400">Competitor Patents</span>
                <span className="text-success text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> No Conflict
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-dark-600">
                <span className="text-sm text-gray-400">International Filing</span>
                <span className="text-warning text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" /> In Progress
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-400">Trade Secrets</span>
                <span className="text-success text-sm font-medium flex items-center gap-1">
                  <Lock className="w-4 h-4" /> Protected
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
