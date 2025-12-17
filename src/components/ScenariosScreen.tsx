import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { CheckCircle, AlertTriangle, AlertOctagon, Moon, Layers, Star, Shield } from 'lucide-react';

function CircularGauge({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (value > 95) return 'var(--success)';
    if (value > 70) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="relative w-44 h-44">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="70"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        <motion.circle
          cx="50%"
          cy="50%"
          r="70"
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-bold"
          style={{ color: getColor() }}
        >
          {value}%
        </motion.div>
        <div className="text-xs text-gray-500 mt-1">Integrity Score</div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-dark-600">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}

const scenarios = [
  { id: 'nominal', icon: CheckCircle, score: 100, color: 'success' },
  { id: 'drift100', icon: AlertTriangle, score: 92, color: 'warning' },
  { id: 'drift500', icon: AlertTriangle, score: 78, color: 'warning' },
  { id: 'spoofing', icon: AlertOctagon, score: 53, color: 'danger' },
  { id: 'night', icon: Moon, score: 98, color: 'primary' },
  { id: 'multisensor', icon: Layers, score: 99, color: 'success' },
  { id: 'consensus', icon: Star, score: 99.5, color: 'success' },
];

export function ScenariosScreen() {
  const { t } = useTranslation();
  const [selectedScenario, setSelectedScenario] = useState(0);

  const getStatus = (score: number) => {
    if (score > 95) return 'Nominal';
    if (score > 70) return 'Degraded';
    return 'Anomalous';
  };

  const getStatusColor = (score: number) => {
    if (score > 95) return 'text-success';
    if (score > 70) return 'text-warning';
    return 'text-danger';
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-dark-900 py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-white">{t('scenarios.title')}</span>{' '}
            <span className="text-primary">{t('scenarios.subtitle')}</span>
          </h2>
          <div className="accent-line mx-auto" />
        </motion.div>

        {/* Scenario selector */}
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3 mb-8">
          {scenarios.map((scenario, i) => {
            const Icon = scenario.icon;
            const isSelected = selectedScenario === i;
            return (
              <motion.button
                key={scenario.id}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedScenario(i)}
                className={`card p-3 md:p-4 text-center cursor-pointer transition-all ${
                  isSelected ? 'border-primary ring-1 ring-primary/30' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Icon className={`w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-${scenario.color}`} />
                <div className={`text-lg md:text-xl font-bold text-${scenario.color}`}>
                  {scenario.score}%
                </div>
                <div className="text-xs text-gray-500 mt-1 hidden md:block">
                  {t(`scenarios.${scenario.id}`)}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected scenario details */}
        <motion.div
          key={selectedScenario}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 md:p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  {t(`scenarios.${scenarios[selectedScenario].id}_title`)}
                </h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t(`scenarios.${scenarios[selectedScenario].id}_desc`)}
              </p>

              <div className="space-y-2">
                <MetricRow label="Integrity Score" value={`${scenarios[selectedScenario].score}%`} />
                <MetricRow
                  label="Hamming Distance"
                  value={
                    scenarios[selectedScenario].score === 100
                      ? '0 bits'
                      : `${Math.round((100 - scenarios[selectedScenario].score) * 5.12)} bits`
                  }
                />
                <div className="flex justify-between items-center py-2 border-b border-dark-600">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`text-sm font-medium ${getStatusColor(scenarios[selectedScenario].score)}`}>
                    {getStatus(scenarios[selectedScenario].score)}
                  </span>
                </div>
                <MetricRow label="Computation Time" value="2.3ms" />
              </div>
            </div>

            <div className="flex items-center justify-center">
              <CircularGauge value={scenarios[selectedScenario].score} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
