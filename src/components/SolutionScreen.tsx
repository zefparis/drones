import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sun, Star, Compass, Camera, Activity, Gauge, Zap, Lock, Target, MapPin, Cpu } from 'lucide-react';

function TechSpec({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      className="card p-4 text-center"
    >
      <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
    </motion.div>
  );
}

const sensors = [
  { icon: Sun, label: 'Sun Sensor', angle: 0 },
  { icon: Star, label: 'Star Tracker', angle: 60 },
  { icon: Compass, label: 'Magnetometer', angle: 120 },
  { icon: Camera, label: 'Camera', angle: 180 },
  { icon: Activity, label: 'IMU', angle: 240 },
  { icon: Gauge, label: 'Barometer', angle: 300 },
];

export function SolutionScreen() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-dark-900 py-20">
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-white">{t('solution.title1')}</span>{' '}
            <span className="text-primary">{t('solution.title2')}</span>
          </h2>
          <div className="accent-line mx-auto mb-6" />
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t('solution.subtitle')}
          </p>
        </motion.div>

        {/* Sensor architecture visualization */}
        <div className="relative h-[400px] md:h-[450px] mb-12 flex items-center justify-center">
          {/* Central processor */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="absolute w-28 h-28 md:w-36 md:h-36 bg-dark-800 border border-primary/30 rounded-2xl flex flex-col items-center justify-center z-10 shadow-lg"
          >
            <Cpu className="w-8 h-8 md:w-10 md:h-10 text-primary mb-2" />
            <div className="text-xs md:text-sm font-semibold text-white">ESKF Fusion</div>
            <div className="text-xs text-gray-500">Consensus Engine</div>
          </motion.div>

          {/* Sensor nodes */}
          {sensors.map((sensor, i) => {
            const radius = typeof window !== 'undefined' && window.innerWidth < 768 ? 130 : 170;
            const x = Math.cos(((sensor.angle - 90) * Math.PI) / 180) * radius;
            const y = Math.sin(((sensor.angle - 90) * Math.PI) / 180) * radius;
            const Icon = sensor.icon;

            return (
              <motion.div
                key={sensor.label}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="absolute"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                {/* Connecting line */}
                <svg
                  className="absolute -z-10 pointer-events-none"
                  style={{
                    width: '300px',
                    height: '300px',
                    left: '-150px',
                    top: '-150px',
                  }}
                >
                  <line
                    x1="150"
                    y1="150"
                    x2={150 - x}
                    y2={150 - y}
                    stroke="rgba(0, 102, 255, 0.2)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                </svg>

                <div className="w-16 h-16 md:w-20 md:h-20 bg-dark-800 border border-dark-600 rounded-xl flex flex-col items-center justify-center hover:border-primary/50 transition-colors">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary mb-1" />
                  <div className="text-xs text-gray-400 text-center leading-tight">
                    {sensor.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tech specs row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <TechSpec icon={Zap} value="2.3ms" label="Latency" />
          <TechSpec icon={Lock} value="SHA3-512" label="Crypto" />
          <TechSpec icon={Target} value="±0.5°" label="Heading" />
          <TechSpec icon={MapPin} value="±1.5m" label="Position" />
        </div>
      </div>
    </section>
  );
}
