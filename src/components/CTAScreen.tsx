import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Code, TestTube, FileText, BadgeCheck, Target, ArrowRight, Mail, MapPin } from 'lucide-react';

function FundUse({
  amount,
  label,
  icon: Icon,
  delay,
}: {
  amount: string;
  label: string;
  icon: React.ElementType;
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
      <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="text-xl font-bold text-white mb-1">{amount}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </motion.div>
  );
}

function MilestoneItem({
  quarter,
  title,
  delay,
}: {
  quarter: string;
  title: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="flex items-center gap-4"
    >
      <div className="w-14 h-7 bg-primary/10 border border-primary/30 rounded flex items-center justify-center text-xs font-medium text-primary">
        {quarter}
      </div>
      <div className="flex-1 h-px bg-dark-600" />
      <div className="text-sm text-gray-300">{title}</div>
    </motion.div>
  );
}

export function CTAScreen() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center gradient-bg py-20">
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="relative z-10 text-center max-w-4xl px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Main amount */}
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-2">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('cta.title')}
            </span>
          </h2>

          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-white">
            {t('cta.subtitle2')}
          </h3>

          <div className="accent-line mx-auto mb-6" />

          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-xl mx-auto">
            {t('cta.subtitle')}
          </p>

          {/* Use of funds */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <FundUse amount="€300K" label={t('cta.fund1')} icon={Code} delay={0.1} />
            <FundUse amount="€200K" label={t('cta.fund2')} icon={TestTube} delay={0.15} />
            <FundUse amount="€150K" label={t('cta.fund3')} icon={FileText} delay={0.2} />
            <FundUse amount="€150K" label={t('cta.fund4')} icon={BadgeCheck} delay={0.25} />
          </div>

          {/* Milestones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card p-6 mb-10"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Target className="w-5 h-5 text-primary" />
              <h4 className="text-lg font-semibold text-white">Milestones</h4>
            </div>
            <div className="space-y-3">
              <MilestoneItem quarter="Q1 25" title="TRL 5 Validation" delay={0.1} />
              <MilestoneItem quarter="Q2 25" title="Field Testing Campaign" delay={0.15} />
              <MilestoneItem quarter="Q3 25" title="International Patent Filing" delay={0.2} />
              <MilestoneItem quarter="Q4 25" title="TRL 6 Demo & First Contracts" delay={0.25} />
            </div>
          </motion.div>

          {/* CTA button */}
          <motion.a
            href="mailto:contact@ia-solution.com"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary inline-flex items-center gap-2 text-lg"
          >
            <Mail className="w-5 h-5" />
            {t('cta.button')}
            <ArrowRight className="w-5 h-5" />
          </motion.a>

          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-gray-500 text-sm space-y-2"
          >
            <p className="font-medium text-gray-300">Benjamin Barrere</p>
            <p>Founder & CTO</p>
            <p className="flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              IA-SOLUTION · Alès, France
            </p>
            <p>Patents FR2514274 | FR2514546 (Granted 2025)</p>
            <p>contact@ia-solution.com</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
