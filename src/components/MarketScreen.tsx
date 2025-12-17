import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, Plane, Ship, Car, Building2, TrendingUp } from 'lucide-react';

function SegmentCard({
  icon: Icon,
  title,
  value,
  percentage,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  percentage: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="card p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm text-gray-400">{title}</span>
        <span className="ml-auto text-lg font-bold text-white">{value}</span>
      </div>
      <div className="w-full h-1.5 bg-dark-600 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.2, duration: 0.8 }}
          className="h-full bg-primary rounded-full"
        />
      </div>
    </motion.div>
  );
}

function RevenueBar({
  year,
  value,
  maxValue,
  delay,
}: {
  year: string;
  value: number;
  maxValue: number;
  delay: number;
}) {
  const height = (value / maxValue) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="flex flex-col items-center gap-2"
    >
      <div className="text-sm font-medium text-primary">€{value}M</div>
      <div className="w-10 md:w-14 h-32 bg-dark-700 rounded-lg overflow-hidden flex items-end">
        <motion.div
          initial={{ height: 0 }}
          whileInView={{ height: `${height}%` }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.2, duration: 0.8 }}
          className="w-full bg-primary rounded-t-lg"
        />
      </div>
      <div className="text-xs text-gray-500">{year}</div>
    </motion.div>
  );
}

export function MarketScreen() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-dark-800 py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            {t('market.title')}
          </h2>
          <div className="accent-line mx-auto mb-6" />
          <p className="text-lg text-gray-400">{t('market.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* TAM/SAM/SOM visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6">Market Size</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">{t('market.tam')}</span>
                  <span className="text-2xl font-bold text-white">€4.2B</span>
                </div>
                <div className="w-full h-3 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="h-full bg-primary/30 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">{t('market.sam')}</span>
                  <span className="text-xl font-bold text-white">€850M</span>
                </div>
                <div className="w-full h-3 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '20%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-primary/60 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">{t('market.som')}</span>
                  <span className="text-lg font-bold text-primary">€42M</span>
                </div>
                <div className="w-full h-3 bg-dark-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '5%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Market segments */}
          <div className="space-y-3">
            <SegmentCard icon={Shield} title={t('market.segment1')} value="€1.8B" percentage={43} delay={0.1} />
            <SegmentCard icon={Plane} title={t('market.segment2')} value="€920M" percentage={22} delay={0.15} />
            <SegmentCard icon={Ship} title={t('market.segment3')} value="€680M" percentage={16} delay={0.2} />
            <SegmentCard icon={Car} title={t('market.segment4')} value="€520M" percentage={12} delay={0.25} />
            <SegmentCard icon={Building2} title={t('market.segment5')} value="€280M" percentage={7} delay={0.3} />
          </div>
        </div>

        {/* Revenue projections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-white">Revenue Projections</h3>
          </div>
          <div className="flex justify-center gap-6 md:gap-10">
            <RevenueBar year="2025" value={0.5} maxValue={15} delay={0.1} />
            <RevenueBar year="2026" value={2} maxValue={15} delay={0.15} />
            <RevenueBar year="2027" value={5} maxValue={15} delay={0.2} />
            <RevenueBar year="2028" value={9} maxValue={15} delay={0.25} />
            <RevenueBar year="2029" value={15} maxValue={15} delay={0.3} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
