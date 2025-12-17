import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Radio, Target, TrendingUp, DollarSign, Clock } from 'lucide-react';

function StatCard({
  icon: Icon,
  value,
  label,
  subtitle,
  delay,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  subtitle: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="card p-6 text-center"
    >
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-danger/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-danger" />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-2">{value}</div>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </motion.div>
  );
}

function ThreatCard({
  icon: Icon,
  title,
  description,
  severity,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  severity: string;
}) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      className="card p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-danger" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                severity === 'CRITICAL'
                  ? 'bg-danger/20 text-danger'
                  : 'bg-warning/20 text-warning'
              }`}
            >
              {severity}
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function ProblemScreen() {
  const { t } = useTranslation();

  return (
    <section id="problem" className="relative min-h-screen flex items-center justify-center bg-dark-800 py-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-danger/10 border border-danger/20 rounded-full mb-6">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <span className="text-sm font-medium text-danger">{t('problem.alert')}</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
            {t('problem.title')}
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t('problem.subtitle')}
          </p>
        </motion.div>

        {/* Statistics grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            icon={TrendingUp}
            value="+340%"
            label={t('problem.stat1')}
            subtitle="Ukraine 2024"
            delay={0.1}
          />
          <StatCard
            icon={DollarSign}
            value="€2.3B"
            label={t('problem.stat2')}
            subtitle="Lost annually"
            delay={0.2}
          />
          <StatCard
            icon={Clock}
            value="18 min"
            label={t('problem.stat3')}
            subtitle="Average outage"
            delay={0.3}
          />
        </div>

        {/* Threat scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ThreatCard
            icon={Target}
            title={t('problem.attack1.title')}
            description={t('problem.attack1.desc')}
            severity="CRITICAL"
          />
          <ThreatCard
            icon={Radio}
            title={t('problem.attack2.title')}
            description={t('problem.attack2.desc')}
            severity="HIGH"
          />
        </div>
      </div>
    </section>
  );
}
