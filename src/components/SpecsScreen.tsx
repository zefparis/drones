import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Target, MapPin, Zap, Battery, Clock, Thermometer, Box, Scale, CheckCircle } from 'lucide-react';

function SpecCard({
  icon: Icon,
  title,
  value,
  unit,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  unit: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="card p-5 text-center"
    >
      <Icon className="w-5 h-5 text-primary mx-auto mb-3" />
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{title}</div>
      <div className="text-2xl font-bold text-white">
        {value}
        <span className="text-sm text-gray-400 ml-1">{unit}</span>
      </div>
    </motion.div>
  );
}

function TRLMilestone({
  level,
  title,
  status,
}: {
  level: number;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          status === 'completed'
            ? 'bg-success/20 text-success'
            : status === 'current'
            ? 'bg-primary/20 text-primary'
            : 'bg-dark-600 text-gray-500'
        }`}
      >
        {status === 'completed' ? <CheckCircle className="w-4 h-4" /> : level}
      </div>
      <div className={`text-sm ${status === 'upcoming' ? 'text-gray-500' : 'text-gray-300'}`}>
        {title}
      </div>
      {status === 'current' && (
        <span className="ml-auto px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">Current</span>
      )}
    </div>
  );
}

export function SpecsScreen() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-dark-800 py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            {t('specs.title')}
          </h2>
          <div className="accent-line mx-auto mb-6" />
          <p className="text-lg text-gray-400">{t('specs.subtitle')}</p>
        </motion.div>

        {/* Performance metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <SpecCard icon={Target} title="Heading Accuracy" value="±0.5" unit="°" delay={0.05} />
          <SpecCard icon={MapPin} title="Position Accuracy" value="±1.5" unit="m" delay={0.1} />
          <SpecCard icon={Zap} title="Update Rate" value="100" unit="Hz" delay={0.15} />
          <SpecCard icon={Battery} title="Power Draw" value="<5" unit="W" delay={0.2} />
          <SpecCard icon={Clock} title="Detection Time" value="2.3" unit="ms" delay={0.25} />
          <SpecCard icon={Thermometer} title="Temp Range" value="-40/+85" unit="°C" delay={0.3} />
          <SpecCard icon={Box} title="Form Factor" value="100x60" unit="mm" delay={0.35} />
          <SpecCard icon={Scale} title="Weight" value="<150" unit="g" delay={0.4} />
        </div>

        {/* Sensor comparison and TRL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sensor comparison table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6">Sensor Availability Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="text-left py-3 text-gray-400 font-medium">Sensor</th>
                    <th className="text-center py-3 text-gray-400 font-medium">Day</th>
                    <th className="text-center py-3 text-gray-400 font-medium">Night</th>
                    <th className="text-center py-3 text-gray-400 font-medium">Indoor</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-dark-700">
                    <td className="py-3">Sun Sensor</td>
                    <td className="text-center text-success">●</td>
                    <td className="text-center text-danger">○</td>
                    <td className="text-center text-danger">○</td>
                  </tr>
                  <tr className="border-b border-dark-700">
                    <td className="py-3">Star Tracker</td>
                    <td className="text-center text-warning">◐</td>
                    <td className="text-center text-success">●</td>
                    <td className="text-center text-danger">○</td>
                  </tr>
                  <tr className="border-b border-dark-700">
                    <td className="py-3">Magnetometer</td>
                    <td className="text-center text-success">●</td>
                    <td className="text-center text-success">●</td>
                    <td className="text-center text-warning">◐</td>
                  </tr>
                  <tr className="border-b border-dark-700">
                    <td className="py-3">Camera</td>
                    <td className="text-center text-success">●</td>
                    <td className="text-center text-warning">◐</td>
                    <td className="text-center text-success">●</td>
                  </tr>
                  <tr className="border-b border-dark-700">
                    <td className="py-3">IMU</td>
                    <td className="text-center text-success">●</td>
                    <td className="text-center text-success">●</td>
                    <td className="text-center text-success">●</td>
                  </tr>
                  <tr>
                    <td className="py-3">Barometer</td>
                    <td className="text-center text-success">●</td>
                    <td className="text-center text-success">●</td>
                    <td className="text-center text-success">●</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 mt-4 text-xs text-gray-500">
              <span><span className="text-success">●</span> Available</span>
              <span><span className="text-warning">◐</span> Limited</span>
              <span><span className="text-danger">○</span> Unavailable</span>
            </div>
          </motion.div>

          {/* TRL Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6">Technology Readiness Level</h3>
            <div className="space-y-3">
              <TRLMilestone level={1} title="Basic Principles Observed" status="completed" />
              <TRLMilestone level={2} title="Technology Concept Formulated" status="completed" />
              <TRLMilestone level={3} title="Proof of Concept" status="completed" />
              <TRLMilestone level={4} title="Lab Validation" status="current" />
              <TRLMilestone level={5} title="Relevant Environment Testing" status="upcoming" />
              <TRLMilestone level={6} title="Demonstration in Environment" status="upcoming" />
              <TRLMilestone level={7} title="System Prototype Demo" status="upcoming" />
            </div>
            <div className="mt-6 pt-4 border-t border-dark-600">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Target: TRL 6</span>
                <span className="text-primary font-semibold">Q4 2025</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
